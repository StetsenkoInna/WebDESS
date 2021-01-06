import $ from 'jquery';
import {getTimeString} from '../helpers';

window.withAnimation = false;
window.duration = 1000;
window.animationDuration = 1000;
window.cuDuration = 1000;

var currentTime;
var nextEvents;
var nextTime;
var activeTransitions;
var allDelaysAreZero;
var animationMarkersCount;
var stepsCount;
var startTime;

function prepareStatsArea() {
    const $stats = $('#stats');
    $stats.html('');

    $stats.append(`
        <div class="h6 py-3">Places (qty of markers):</div>
        <table class="table">
        <thead>
            <tr>
                <th scope="col">Name</th>
                <th scope="col">Min</th>
                <th scope="col">Max</th>
                <th scope="col">Avg</th>
            </tr>
        </thead>
        <tbody id="stats-places-table"></tbody>
    </table>`);

    net.places.forEach(place => {
        $('#stats-places-table').append(`
            <tr>
                <th scope="row">${place.name}</th>
                <td id="min-place-${place.id}"></td>
                <td id="max-place-${place.id}"></td>
                <td id="avg-place-${place.id}"></td>
            </tr>`);
    });

    $stats.append(`
        <div class="h6 py-3">Transitions (qty of active channels):</div>
        <table class="table">
        <thead>
            <tr>
                <th scope="col">Name</th>
                <th scope="col">Min</th>
                <th scope="col">Max</th>
                <th scope="col">Avg</th>
            </tr>
        </thead>
        <tbody id="stats-transitions-table"></tbody>
    </table>`);

    net.transitions.forEach(transition => {
        $('#stats-transitions-table').append(`
            <tr>
                <th scope="row">${transition.name}</th>
                <td id="min-transition-${transition.id}"></td>
                <td id="max-transition-${transition.id}"></td>
                <td id="avg-transition-${transition.id}"></td>
            </tr>`);
    });
}

function updateStatsForTransitions(displayChanges, isLastUpdate, prevTime, nextTime) {
    for (var i = 0; i < net.transitions.length; i++) {
        var transition = net.transitions[i];
        if (!isLastUpdate) {
            var newValue = transition.outputTimesBuffer.length;
            if (transition.stats.avg == null) {
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

function animate(place, transition, fromPlace, callback) {
    var markerId = animationMarkersCount++;
    var shift = 25;
    var additionalVerticalShift = -2.5;
    var fromPosition = {
        top: place.top + shift,
        left: place.left + shift
    };
    var toPosition = {
        top: transition.top + shift,
        left: transition.left + shift
    };
    var horizontalDistance = Math.abs(toPosition.left - fromPosition.left);
    var verticalDistance = Math.abs(toPosition.top - fromPosition.top);
    var horizontalPlaceShift = Math.sqrt(Math.pow(shift, 2) / (1 + Math.pow(verticalDistance, 2) / Math.pow(horizontalDistance, 2)));
    var verticalPlaceShift;
    if (horizontalPlaceShift !== 0) {
        verticalPlaceShift = verticalDistance * horizontalPlaceShift / horizontalDistance;
    } else {
        verticalPlaceShift = shift;
    }
    if (toPosition.left < fromPosition.left) {
        horizontalPlaceShift = -horizontalPlaceShift;
    }
    if (toPosition.top < fromPosition.top) {
        verticalPlaceShift = -verticalPlaceShift;
    }
    fromPosition.left += horizontalPlaceShift;
    fromPosition.top += verticalPlaceShift;
    if (!fromPlace) {
        var tmp = fromPosition;
        fromPosition = toPosition;
        toPosition = tmp;
    }
    fromPosition.top += additionalVerticalShift;
    toPosition.top += additionalVerticalShift;
    $('.sandbox').append('<div class="marker animation-marker" id="animationMarker' + markerId + '" style="left: ' + fromPosition.left
        + 'px; top: ' + fromPosition.top + 'px"></div>');
    var $marker = $('#animationMarker' + markerId);
    $marker.animate({ 'left': toPosition.left + 'px', 'top': toPosition.top + 'px' }, animationDuration, function () {
        $marker.remove();
        callback();
    });
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
            var place = net.places.filter(function (place) {
                return place.id === arc.placeId;
            })[0];
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

function performSimpleTokensInput(withAnimation) {
    var tokensInputResult = [];
    var firedTransitions = [];
    while (activeTransitions.length > 0) {
        var transition = selectTransitionToFire(activeTransitions);
        var appropriateArcs = transition.arcs.filter(function (arc) {
            return arc.fromPlace && !arc.isInformationLink;
        });
        for (var i = 0; i < appropriateArcs.length; i++) {
            var arc = appropriateArcs[i];
            var place = net.places.filter(function (place) {
                return place.id === arc.placeId;
            })[0];
            place.markers -= arc.channels;
            if (withAnimation && firedTransitions.indexOf(transition) === -1) {
                tokensInputResult.push({ place: place, transition: transition });
            }
        }
        transition.outputTimesBuffer.push(currentTime + transition.getExecutionTime());
        firedTransitions.push(transition);
        findActiveTransitions();
    }
    return tokensInputResult;
}

function performTokensInput(deferred) {
    if (!deferred) {
        performSimpleTokensInput();
        return;
    }
    if (activeTransitions.length === 0) {
        deferred.resolve();
        return;
    }
    var animationArray = performSimpleTokensInput(true);
    var animationsCount = animationArray.length;
    var finishedAnimations = 0;
    var onAnimationFinished = function () {
        finishedAnimations++;
        if (finishedAnimations === animationsCount) {
            deferred.resolve();
        }
    };
    for (var i = 0; i < animationsCount; i++) {
        var place = animationArray[i].place;
        var transition = animationArray[i].transition;
        place.redraw();
        animate(place, transition, true, onAnimationFinished);
    }
}

function performSimpleTokensOutput() {
    for (var j = 0; j < nextEvents.length; j++) {
        var transition = nextEvents[j];
        var appropriateArcs = transition.arcs.filter(function (arc) {
            return !arc.fromPlace;
        });
        for (var i = 0; i < appropriateArcs.length; i++) {
            var arc = appropriateArcs[i];
            var place = net.places.filter(function (place) {
                return place.id === arc.placeId;
            })[0];
            var numOfMarkersToAdd = arc.channels * transition.outputTimesBuffer.filter(function (item) {
                return item === currentTime;
            }).length;
            place.markers += numOfMarkersToAdd;
        }
        var bufferIndex = transition.outputTimesBuffer.indexOf(currentTime);
        do {
            transition.outputTimesBuffer.splice(bufferIndex, 1);
            bufferIndex = transition.outputTimesBuffer.indexOf(currentTime);
        } while (bufferIndex > -1);
    }
}

function performTokensOutput(deferred) {
    if (!deferred) {
        performSimpleTokensOutput();
        return;
    }
    for (var j = 0; j < nextEvents.length; j++) {
        (function (eventIndex) {
            var transition = nextEvents[eventIndex];
            var appropriateArcs = transition.arcs.filter(function (arc) {
                return !arc.fromPlace;
            });
            for (var i = 0; i < appropriateArcs.length; i++) {
                (function (index) {
                    var arc = appropriateArcs[index];
                    var place = net.places.filter(function (place) {
                        return place.id === arc.placeId;
                    })[0];
                    var onAnimationFinished = function () {
                        var numOfMarkersToAdd = arc.channels * transition.outputTimesBuffer.filter(function (item) {
                            return item === currentTime;
                        }).length;
                        place.markers += numOfMarkersToAdd;
                        place.redraw();
                        if (index === (appropriateArcs.length - 1)) {
                            var bufferIndex = transition.outputTimesBuffer.indexOf(currentTime);
                            do {
                                transition.outputTimesBuffer.splice(bufferIndex, 1);
                                bufferIndex = transition.outputTimesBuffer.indexOf(currentTime);
                            } while (bufferIndex > -1);
                            if (eventIndex === (nextEvents.length - 1)) {
                                deferred.resolve();
                            }
                        }
                    };
                    animate(place, transition, false, onAnimationFinished);
                })(i);
            }
        })(j);
    }
}

function performFinalActions() {
    var endTime = (new Date()).getTime();
    if (!withAnimation) prepareStatsArea();

    updateStatsForPlaces(true, true, currentTime, nextTime);
    updateStatsForTransitions(true, true, currentTime, nextTime);

    net.places.forEach(e => {
        e.stats = undefined;
        e.redraw();
    });

    net.transitions.forEach(e => {
        e.stats = undefined;
        e.outputTimesBuffer = e.outputTimesBuffer.map(e => e -= currentTime);
    });

    $('#stats').parent().append(`<div class="h6 py-3">
        Time elapsed: <span class="font-weight-light">${getTimeString(endTime - startTime)}</span>
    </div>`);
    $('.btn-disabled').removeClass('btn-disabled');
}

function makeStepWithAnimation() {
    if (needToStop) {
        needToStop = false;
        performFinalActions();
        return;
    }
    stepsCount++;
    animationMarkersCount = 0;
    if (currentTime < duration && !(allDelaysAreZero && stepsCount >= duration)) {
        findActiveTransitions();
        updateStatsForPlaces(true, false, currentTime, nextTime);
        if (!allDelaysAreZero) {
            updateStatsForTransitions(true, false, currentTime, nextTime);
        }
        var inputPerformed = $.Deferred();
        inputPerformed.done(function () {
            findNextEvents();
            if (nextEvents.length > 0) {
                setTimeout(function () {
                    if (!allDelaysAreZero) {
                        updateStatsForPlaces(true, false, currentTime, nextTime);
                    }
                    updateStatsForTransitions(true, false, currentTime, nextTime);
                    currentTime = nextTime;
                    var outputPerformed = $.Deferred();
                    outputPerformed.done(function () {
                        makeStepWithAnimation();
                    });
                    performTokensOutput(outputPerformed);
                }, (nextTime - currentTime) * cuDuration);
            } else {
                performFinalActions();
            }
        });
        if (activeTransitions.length > 0) {
            performTokensInput(inputPerformed);
        } else {
            inputPerformed.resolve();
        }
    } else {
        performFinalActions();
    }
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

export function runSimulationForNet(currentNet) {
    window.net = currentNet;
    for (var k = 0; k < net.transitions.length; k++) {
        var transition = net.transitions[k];
        if (!transition.outputTimesBuffer) {
            transition.outputTimesBuffer = [];
        }
        transition.stats = {};
    }
    for (var s = 0; s < net.places.length; s++) {
        var place = net.places[s];
        place.stats = {};
    }
    allDelaysAreZero = net.allDelaysAreZero();
    currentTime = 0;
    stepsCount = 0;
    window.needToStop = false;

    $(withAnimation ? 'button:not(#stop-btn)' : 'button').addClass('btn-disabled');

    $('#stats').html('');

    if (withAnimation) {
        prepareStatsArea();
        startTime = (new Date()).getTime();
        makeStepWithAnimation();
    } else {
        $('#stats').html(`
            <div class="col text-center pt-5">
                <div class="spinner-border" role="status"></div>
                <div class="py-2">Loading...</div>
            </div>
        `);
        startTime = (new Date()).getTime();
        setTimeout(makeSteps, 0);
    }
}
