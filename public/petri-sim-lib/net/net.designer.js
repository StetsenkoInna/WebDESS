import $ from 'jquery';
import {PetriNet, Transition, Place, Arc} from './objects';
import {getCoords, getDeepArrayCopy, normalizeString} from '../helpers';

const randomId = () => Math.round(Math.random() * 1e8);

var newPlaceId = 1,
    newTransitionId = 1,
    newArcId = 1,
    newPetriNetId = randomId();
var distBtwnButtonsAndSandbox = 58;
var temporaryArrowExists = false;
var currentPetriNet = new PetriNet(null);
currentPetriNet.id = newPetriNetId;
var needToStop;
var net;

export function requestStop() {
    needToStop = true;
}

export function cleanBuffers() {
    for (var k = 0; k < currentPetriNet.transitions.length; k++) {
        currentPetriNet.transitions[k].outputTimesBuffer = undefined;
    }
}

export function reset() {
    newPetriNetId = randomId();
    newPlaceId = newTransitionId = newArcId = 1;
    temporaryArrowExists = false;
    currentPetriNet = new PetriNet(null);
    currentPetriNet.id = newPetriNetId;
    cleanBuffers();
    $('.page-svg svg, .top-svg svg, .sandbox div').remove();
    $('#stats').html('');
}

function createMouseDownEvent(buttonLocation) {
    var mouseDownEvent = new $.Event('mousedown');
    mouseDownEvent.pageX = buttonLocation.left;
    mouseDownEvent.pageY = buttonLocation.top + distBtwnButtonsAndSandbox;
    return mouseDownEvent;
}

export function newPlace() {
    cleanBuffers();
    var location = getCoords($('#add-place-btn')[0]);
    var newPlace = new Place(newPlaceId, 'P' + newPlaceId, 0, location.top + distBtwnButtonsAndSandbox, location.left);
    currentPetriNet.places.push(newPlace);
    newPlace.draw();
    $('#place' + newPlaceId).trigger(createMouseDownEvent(location));
    newPlaceId++;
}

export function newTransition() {
    cleanBuffers();
    var location = getCoords($('#add-transition-btn')[0]);
    var newTransition = new Transition(newTransitionId, 'T' + newTransitionId, 0, 0, null, 0, 1, 'Infinity', location.top + distBtwnButtonsAndSandbox, location.left);
    currentPetriNet.transitions.push(newTransition);
    newTransition.draw();
    $('#transition' + newTransitionId).trigger(createMouseDownEvent(location));
    newTransitionId++;
}

function drawTemporaryArrow(x, y) {
    temporaryArrowExists = true;
    const arrow = `
        <svg class="temp-arrow">
            <path class="arrow-path" d="" style="stroke:black; stroke-width: 1.25px; fill: none; marker-end: url(#temporaryArrow);"/>
        </svg>`;
    $('.top-svg').show().append(arrow);
    $('.temp-arrow').find('.arrow-path')[0].setAttribute('d', `M${x},${y} L${x},${y}`);
}

function removeTemporaryArrow() {
    temporaryArrowExists = false;
    $('.temp-arrow').remove();
    $('.top-svg').hide();
}

export function newArc() {
    allowDragAndDrop = false;
    $(document).one('mousedown', function (e) {
        var fromPlace = false;
        var beginElemId;
        var $elem = $(document.elementFromPoint(e.pageX, e.pageY));
        if ($elem.hasClass('petri-place') || $elem.hasClass('petri-transition')) {
            beginElemId = parseInt($elem.attr('id').match(/\d+/));
            if ($elem.hasClass('petri-place')) {
                fromPlace = true;
            }
            drawTemporaryArrow(e.pageX, e.pageY);
            $(document).one('mouseup', function (e) {
                removeTemporaryArrow();
                $elem = $(document.elementFromPoint(e.pageX, e.pageY));
                if (($elem.hasClass('petri-place') && !fromPlace)
                    || ($elem.hasClass('petri-transition') && fromPlace)) {
                    var endElemId = parseInt($elem.attr('id').match(/\d+/));
                    var placeId = fromPlace ? beginElemId : endElemId;
                    var transitionId = fromPlace ? endElemId : beginElemId;
                    var petriPlace = currentPetriNet.places.filter(function (item) {
                        return item.id === placeId;
                    })[0];
                    var petriTransition = currentPetriNet.transitions.filter(function (item) {
                        return item.id === transitionId;
                    })[0];
                    if (currentPetriNet.arcs.filter(function (item) {
                        return item.placeId === placeId && item.transitionId === transitionId && item.fromPlace === fromPlace;
                    }).length === 0) {
                        cleanBuffers();
                        var newArc = new Arc(newArcId, petriPlace, petriTransition, fromPlace, 1, false);
                        var arcsBetweenSameElements = currentPetriNet.arcs.filter(function (item) {
                            return item.placeId === placeId && item.transitionId === transitionId;
                        });
                        if (arcsBetweenSameElements.length > 0) {
                            var anotherArc = arcsBetweenSameElements[0];
                            anotherArc.isOneOfTwo = true;
                            anotherArc.isFirst = true;
                            newArc.isOneOfTwo = true;
                            newArc.isFirst = false;
                            anotherArc.redraw();
                        }
                        currentPetriNet.arcs.push(newArc);
                        newArc.draw();
                        newArcId++;
                    }
                }
                allowDragAndDrop = true;
            });
        } else {
            allowDragAndDrop = true;
        }
    });
}

function redrawTemporaryArrowIfNecessary(e) {
    if (temporaryArrowExists) {
        const arrow = $('.temp-arrow').find('.arrow-path')[0];
        const oldD = arrow.getAttribute('d');
        const newD = `${oldD.slice(0, oldD.indexOf('L'))}L${e.pageX},${e.pageY}`;
        arrow.setAttribute('d', newD);
    }
}

function getNextElementId(elementsArray) {
    return Math.max.apply(null, elementsArray.map(function (element) {
        return element.id;
    })) + 1;
}

export function buildPetri(json) {
    const openedNet = restorePetriNet(parsePetriNet(json));

    newPlaceId = getNextElementId(openedNet.places);
    newTransitionId = getNextElementId(openedNet.transitions);
    newArcId = getNextElementId(openedNet.arcs);
    temporaryArrowExists = false;
    currentPetriNet = openedNet;

    $('.page-svg svg, .top-svg svg, .sandbox div').remove();
    $('#stats').html('');

    currentPetriNet.draw();
}

export function getCurrentModel() {
    const model = $.extend(true, {}, currentPetriNet);

    model.places = getDeepArrayCopy(currentPetriNet.places);
    model.places.forEach(place => {
        place.arcs = undefined;
        place.markersPerLine = undefined;
        place.topLayerItem = undefined;
    });

    model.transitions = getDeepArrayCopy(currentPetriNet.transitions);
    model.transitions.forEach(transition => {
        transition.arcs = undefined;
        transition.bottomNotesHeight = undefined;
        transition.distributionOptions = undefined;
    });

    model.arcs = getDeepArrayCopy(currentPetriNet.arcs);
    model.arcs.forEach(arc => {
        arc.beginElementUiId = undefined;
        arc.endElementUiId = undefined;
    });

    const json = JSON.stringify(model, (_k, v) => (v === Infinity) ? 'Infinity' : v);

    return { model, json };
}

export function saveCurrentPetriNet(title) {
    currentPetriNet.name = title;
    const { valid, message } = currentPetriNet.validate();
    if (!valid) return alert(`Invalid Petri net: ${message}`);

    cleanBuffers();
    const { model } = getCurrentModel();

    filesManager.createFile(title, true, 'Net', model);
}

export function runNetModelSimulation() {
    const { valid,message } = currentPetriNet.validate();
    if (!valid) return alert(`Invalid Petri net: ${message}`);

    if (currentPetriNet.hasParameters())
        return alert('Petri Net has parameters. Please provide specific values for them first.');

    runSimulationForNet(currentPetriNet);
}

function deleteArc(id) {
    cleanBuffers();
    var theseArcs = currentPetriNet.arcs.filter(function (item) {
        return item.id === id;
    });
    if (theseArcs.length) {
        var arcToDelete = theseArcs[0];
        if (arcToDelete.isOneOfTwo) {
            var secondArcs = currentPetriNet.arcs.filter(function (item) {
                return item.placeId === arcToDelete.placeId && item.transitionId === arcToDelete.transitionId && item !== arcToDelete;
            });
            if (secondArcs.length) {
                var secondArc = secondArcs[0];
                secondArc.isOneOfTwo = false;
                secondArc.isFirst = null;
                secondArc.redraw();
            }
        }
        var places = currentPetriNet.places.filter(function (item) {
            return item.id === arcToDelete.placeId;
        });
        if (places) {
            var placeIndex = places[0].arcs.indexOf(arcToDelete);
            places[0].arcs.splice(placeIndex, 1);
        }
        var transitions = currentPetriNet.transitions.filter(function (item) {
            return item.id === arcToDelete.transitionId;
        });
        if (transitions) {
            var transitionIndex = transitions[0].arcs.indexOf(arcToDelete);
            transitions[0].arcs.splice(transitionIndex, 1);
        }
        arcToDelete.destroy();
        var index = currentPetriNet.arcs.indexOf(arcToDelete);
        currentPetriNet.arcs.splice(index, 1);
    }
}

function deleteTransition(id) {
    cleanBuffers();
    var theseTransitions = currentPetriNet.transitions.filter(function (item) {
        return item.id === id;
    });
    if (theseTransitions.length) {
        var transitionToDelete = theseTransitions[0];
        while (transitionToDelete.arcs.length) {
            var arcToDelete = transitionToDelete.arcs[0];
            deleteArc(arcToDelete.id);
        }
        transitionToDelete.destroy();
        var index = currentPetriNet.transitions.indexOf(transitionToDelete);
        currentPetriNet.transitions.splice(index, 1);
    }
}

function deletePlace(id) {
    cleanBuffers();
    var thesePlaces = currentPetriNet.places.filter(function (item) {
        return item.id === id;
    });
    if (thesePlaces.length) {
        var placeToDelete = thesePlaces[0];
        if (placeToDelete.arcs.length) {
            $.each(placeToDelete.arcs, function (a, arc) {
                deleteArc(arc.id);
            });
        }
        placeToDelete.destroy();
        var index = currentPetriNet.places.indexOf(placeToDelete);
        currentPetriNet.places.splice(index, 1);
    }
}

export function convertToFunction() {
    const { valid, message } = currentPetriNet.validate();
    if (!valid) return alert(`Invalid Petri net: ${message}`);

    const name = currentPetriNet.name || 'New';
    let func = `function generate${normalizeString(name)}PetriNet() {
    const net = new PetriNet('${name}');
    `;

    for (const place of currentPetriNet.places) func += `
    const place${place.id} = new Place(${place.id}, '${place.name}', ${place.markers}, ${place.top}, ${place.left});
    net.places.push(place${place.id});
    `;

    for (const transition of currentPetriNet.transitions) {
        const distribution = transition.distribution ? `'${transition.distribution}'` : 'null';
        func += `
    const transition${transition.id} = new Transition(${transition.id}, '${transition.name}', ${transition.delay}, ${transition.deviation}, ${distribution}, ${transition.priority}, ${transition.probability}, ${transition.channels}, ${transition.top}, ${transition.left});
    net.transitions.push(transition${transition.id});
    `;
    }

    for (const arc of currentPetriNet.arcs) {
        const fromPlace = arc.fromPlace ? 'true' : 'false';
        const infLink = arc.isInformationLink ? 'true' : 'false';
        func += `
    const arc${arc.id} = new Arc(${arc.id}, place${arc.placeId}, transition${arc.transitionId}, ${fromPlace}, ${arc.channels}, ${infLink});
    net.arcs.push(arc${arc.id});
    `;
    }

    func += `
    return net;
}`;

    $('#function-text').val(func);
    $('#function-invocation').val(`generate${normalizeString(name)}PetriNet()`);
}

export function generateFromFunction() {
    let func;
    let net;
    let args;

    try {
        const text = $('#function-text').val();
        if (!text) return alert('Error: no function definition provided.');

        const name = parseFunctionNameFromDefinition(text);
        const params = parseParamsString(text);
        let paramsCount = (params.match(/,/g) || []).length + 1;
        if (paramsCount === 1 && !params) paramsCount = 0;
        const body = parseFunctionBody(text);

        const invocation = $('#function-invocation').val();
        if (!invocation) return alert('Error: no function invocation provided.');

        args = parseArgumentsArray(invocation);
        if (args.length !== paramsCount) return alert('Error: incorrect number of arguments supplied.');

        let secondName = parseFunctionNameFromInvocation(invocation);
        if (secondName !== name) return alert('Error: different function names in the definition and invocation.');

        func = new Function(params, body);
    } catch (e) { return alert('Function parsing error.'); }

    try {
        net = func.apply(this, args);
    } catch (e) {
        console.error(e);
        return alert('Function execution error.');
    }

    if (!net || !net.getClass || net.getClass() !== 'PetriNet')
        return alert('Error: invalid object returned from the function.');

    cleanBuffers();
    net.id = randomId();
    newPlaceId = getNextElementId(net.places);
    newTransitionId = getNextElementId(net.transitions);
    newArcId = getNextElementId(net.arcs);
    temporaryArrowExists = false;
    currentPetriNet = net;

    $('.page-svg svg, .top-svg svg, .sandbox div').remove();
    $('#stats').html('');

    currentPetriNet.draw();
}

export function clearProgrammingPopup() {
    $('#function-text, #function-invocation').val('');
}

$(document).ready(function () {
    allowDragAndDrop = true;

    $(document).on('mousemove', redrawTemporaryArrowIfNecessary);

    var $focusedElement;
    $(document).on('netEdited', cleanBuffers);
    $(document).on('click', function (e) {
        $focusedElement = $(e.target);
    });
    $(document).on('keyup', function (e) {
        if (e.keyCode === 46 && $focusedElement && $('#' + $focusedElement.attr('id')).length) {
            if ($focusedElement.hasClass('petri-place')) {
                var placeId = parseInt($focusedElement.attr('id').substr(5));
                deletePlace(placeId);
            } else if ($focusedElement.hasClass('petri-transition')) {
                var transitionId = parseInt($focusedElement.attr('id').substr(10));
                deleteTransition(transitionId);
            } else if ($focusedElement.hasClass('arc-clickable-area') || $focusedElement.hasClass('arrow-path')) {
                $focusedElement = $focusedElement.parent();
                var arcId = parseInt($focusedElement.attr('id').substr(3));
                deleteArc(arcId);
            }
        }
    });
});
