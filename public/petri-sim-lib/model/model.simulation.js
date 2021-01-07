import {normalizeString, getTimeString} from '../helpers';

let duration = 1000;

var currentTime;
var nextEvents;
var nextTime;
var activeTransitions;
var allDelaysAreZero;
var stepsCount;
var startTime;

function prepareStatsArea() {
    const $stats = $('#stats');
    $stats.html('');

    currentModel.objects.forEach(object => {
        $stats.append(`
            <div class="h5 py-3">Object ${object.name}</div>
            <div class="h6 py-1">Places (qty of markers):</div>
            <table class="table">
            <thead>
                <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Min</th>
                    <th scope="col">Max</th>
                    <th scope="col">Avg</th>
                </tr>
            </thead>
            <tbody id="stats-places-table-${object.name}"></tbody>
        </table>`);

        net.places.filter(e => e.objectName === object.name).forEach(place => {
            $(`#stats-places-table-${object.name}`).append(`
                <tr>
                    <th scope="row">${place.name}</th>
                    <td id="min-place-${place.id}"></td>
                    <td id="max-place-${place.id}"></td>
                    <td id="avg-place-${place.id}"></td>
                </tr>`);
        });

        $stats.append(`
            <div class="h6 py-1">Transitions (qty of active channels):</div>
            <table class="table">
            <thead>
                <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Min</th>
                    <th scope="col">Max</th>
                    <th scope="col">Avg</th>
                </tr>
            </thead>
            <tbody id="stats-transitions-table-${object.name}"></tbody>
        </table>`);

        net.transitions.filter(e => e.objectName === object.name).forEach(transition => {
            $(`#stats-transitions-table-${object.name}`).append(`
                <tr>
                    <th scope="row">${transition.name}</th>
                    <td id="min-transition-${transition.id}"></td>
                    <td id="max-transition-${transition.id}"></td>
                    <td id="avg-transition-${transition.id}"></td>
                </tr>`);
        });
    });
}

function updateStatsForTransitions(displayChanges, isLastUpdate, prevTime, nextTime) {
    for (var i = 0; i < net.transitions.length; i++) {
        var transition = net.transitions[i];
        if (!isLastUpdate) {
            var newValue = transition.outputTimesBuffer.length;
            if (typeof transition.stats.avg === 'undefined') {
                transition.stats.min = transition.stats.max = transition.stats.avg = newValue;
            } else {
                if (newValue < transition.stats.min) {
                    transition.stats.min = newValue;
                } else if (newValue > transition.stats.max) {
                    transition.stats.max = newValue;
                }
                if (allDelaysAreZero) {
                    transition.stats.avg = ((stepsCount - 1) * transition.stats.avg + newValue) / stepsCount;
                } else if (nextTime !== 0) {
                    transition.stats.avg = (prevTime * transition.stats.avg + (nextTime - prevTime) * newValue) / nextTime;
                }
            }
        }
        if (displayChanges) {
            $(`#min-transition-${transition.id}`).text(transition.stats.min);
            $(`#max-transition-${transition.id}`).text(transition.stats.max);
            $(`#avg-transition-${transition.id}`).text(transition.stats.avg.toFixed(2));
        }
    }
}

function updateStatsForPlaces(displayChanges, isLastUpdate, prevTime, nextTime) {
    for (var j = 0; j < net.places.length; j++) {
        var place = net.places[j];
        if (!isLastUpdate) {
            var newValue = place.markers;
            if (typeof place.stats.avg === 'undefined') {
                place.stats.min = place.stats.max = place.stats.avg = newValue;
            } else {
                if (newValue < place.stats.min) {
                    place.stats.min = newValue;
                } else if (newValue > place.stats.max) {
                    place.stats.max = newValue;
                }
                if (allDelaysAreZero) {
                    place.stats.avg = ((stepsCount - 1) * place.stats.avg + newValue) / stepsCount;
                } else if (nextTime !== 0) {
                    place.stats.avg = (prevTime * place.stats.avg + (nextTime - prevTime) * newValue) / nextTime;
                }
            }
        }
        if (displayChanges) {
            $(`#min-place-${place.id}`).text(place.stats.min);
            $(`#max-place-${place.id}`).text(place.stats.max);
            $(`#avg-place-${place.id}`).text(place.stats.avg.toFixed(2));
        }
    }
}

function getTransitionMinTime(transition) {
    var minTime = duration + 2000;
    for (var i = 0; i < transition.outputTimesBuffer.length; i++) {
        var time = transition.outputTimesBuffer[i];
        if (time < minTime) {
            minTime = time;
        }
    }
    return minTime;
}

function findNextEvents() {
    nextEvents = [];
    nextTime = duration + 1000;
    for (var i = 0; i < net.transitions.length; i++) {
        var transition = net.transitions[i];
        var tranMinTime = getTransitionMinTime(transition);
        if (tranMinTime < nextTime) {
            nextTime = tranMinTime;
            nextEvents = [transition];
        } else if (tranMinTime === nextTime) {
            nextEvents.push(transition);
        }
    }
}

function sortByPriority(a, b) {
    return b.priority - a.priority;
}

function transitionIsActive(transition) {
    var active = true;
    for (var i = 0; i < transition.arcs.length; i++) {
        var arc = transition.arcs[i];
        if (transition.channels === transition.outputTimesBuffer.length) {
            active = false;
            break;
        }
        if (arc.fromPlace) {
            var place = net.places.filter(function(place) { return place.id === arc.placeId; })[0];
            if (place.markers < arc.channels) {
                active = false;
                break;
            }
        }
    }
    return active;
}

function findActiveTransitions() {
    activeTransitions = [];
    for (var i = 0; i < net.transitions.length; i++) {
        var transition = net.transitions[i];
        if (transitionIsActive(transition)) {
            activeTransitions.push(transition);
        }
    }
    activeTransitions.sort(sortByPriority);
}

function performTokensInput() {
    while (activeTransitions.length > 0) {
        var transition = selectTransitionToFire(activeTransitions);
        var appropriateArcs = transition.arcs.filter(function(arc) { return arc.fromPlace && !arc.isInformationLink; });
        for (var i = 0; i < appropriateArcs.length; i++) {
            var arc = appropriateArcs[i];
            var place = net.places.filter(function(place) { return place.id === arc.placeId; })[0];
            place.markers -= arc.channels;
        }
        transition.outputTimesBuffer.push(currentTime + transition.getExecutionTime());
        findActiveTransitions();
    }
}

function performTokensOutput() {
    for (var j = 0; j < nextEvents.length; j++) {
        var transition = nextEvents[j];
        var appropriateArcs = transition.arcs.filter(function(arc) { return !arc.fromPlace; });
        for (var i = 0; i < appropriateArcs.length; i++) {
            var arc = appropriateArcs[i];
            var place = net.places.filter(function(place) { return place.id === arc.placeId; })[0];
            var numOfMarkersToAdd = arc.channels * transition.outputTimesBuffer.filter(function(item) { return item === currentTime; }).length;
            place.markers += numOfMarkersToAdd;
        }
        var bufferIndex = transition.outputTimesBuffer.indexOf(currentTime);
        do {
            transition.outputTimesBuffer.splice(bufferIndex, 1);
            bufferIndex = transition.outputTimesBuffer.indexOf(currentTime);
        } while (bufferIndex > -1);
    }
}

function performFinalActions() {
    var endTime = (new Date()).getTime();
    prepareStatsArea();
    updateStatsForPlaces(true, true, currentTime, nextTime);
    updateStatsForTransitions(true, true, currentTime, nextTime);

    for (var k = 0; k < net.places.length; k++) {
        net.places[k].stats = undefined;
    }
    for (var k = 0; k < net.transitions.length; k++) {
        net.transitions[k].stats = undefined;
        var buffer = net.transitions[k].outputTimesBuffer;
        for (var g = 0; g < buffer.length; g++) {
            buffer[g] -= currentTime;
        }
    }
    $('#stats').parent().append(`<div class="h6 py-3">
        Time elapsed: <span class="font-weight-light">${getTimeString(endTime - startTime)}</span>
    </div>`);
    $('.disabled-button').removeClass('disabled-button');
}

function makeSteps() {
    while (true) {
        if (currentTime >= duration || (allDelaysAreZero && stepsCount >= duration)) {
            break;
        }
        stepsCount++;
        findActiveTransitions();
        updateStatsForPlaces(false, false, currentTime, nextTime);
        if (!allDelaysAreZero) {
            updateStatsForTransitions(false, false, currentTime, nextTime);
        }
        if (activeTransitions.length > 0) {
            performTokensInput();
        }
        findNextEvents();
        if (nextEvents.length > 0) {
            if (!allDelaysAreZero) {
                updateStatsForPlaces(false, false, currentTime, nextTime);
            }
            updateStatsForTransitions(false, false, currentTime, nextTime);
            currentTime = nextTime;
            performTokensOutput();
        } else {
            break;
        }
    }
    performFinalActions();
}

export function runSimulationForModel(currentPetriObjectModel) {
    currentTime = 0;
    stepsCount = 0;
    if (!currentPetriObjectModel.equalPlacesHaveEqualNumberOfMarkers()) {
        alert('Invalid Petri objects model: places in different Petri objects connected through arcs must contain the same number of markers.');
        return;
    }
    if (!net) {
        net = currentPetriObjectModel.generateJointNet();
        allDelaysAreZero = net.allDelaysAreZero();
        // TODO: for debuging
        console.log(convert(net));
    } else {
        for (var k = 0; k < net.places.length; k++) {
            net.places[k].stats = { };
        }
        for (var k = 0; k < net.transitions.length; k++) {
            net.transitions[k].stats = { };
        }
    }
    $('button').addClass('disabled-button');
    $('#stats').html(`
        <div class="col text-center pt-5">
            <div class="spinner-border" role="status"></div>
            <div class="py-2">Loading...</div>
        </div>
    `);
    startTime = (new Date()).getTime();
    setTimeout(makeSteps, 0);
}

// TODO: for debuging
function convert(net) {
    const { valid, message } = net.validate();
    if (!valid) return alert(`Invalid Petri net: ${message}`);

    const name = net.name || 'New';
    let func = `function generate${normalizeString(name)}PetriNet() {
    const net = new PetriNet('${name}');
    `;

    for (const place of net.places) func += `
    const place${place.id} = new Place(${place.id}, '${place.name}', ${place.markers}, ${place.top}, ${place.left});
    net.places.push(place${place.id});
    `;

    for (const transition of net.transitions) {
        const distribution = transition.distribution ? `'${transition.distribution}'` : 'null';
        func += `
    const transition${transition.id} = new Transition(${transition.id}, '${transition.name}', ${transition.delay}, ${transition.deviation}, ${distribution}, ${transition.priority}, ${transition.probability}, ${transition.channels}, ${transition.top}, ${transition.left});
    net.transitions.push(transition${transition.id});
    `;
    }

    for (const arc of net.arcs) {
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

    console.log(`generate${normalizeString(name)}PetriObjectModel()`);
    return func;
}
