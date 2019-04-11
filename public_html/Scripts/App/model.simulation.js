var duration;
var currentTime;
var nextEvents;
var nextTime;
var activeTransitions;
var allDelaysAreZero;
var stepsCount;
var startTime;

function prepareStatsArea() {
    var $stats = $('.stats');
    $stats.html('');
    $stats.append('<div class="stats-title">Places (qty of markers):</div>');
    for (var l = 0; l < net.places.length; l++) {
        var place = net.places[l];
        var placeFullName = place.objectName + ' -> ' + place.name;
        $stats.append('<div class="stats-line"><span class="stats-line-title">' + placeFullName + '</span><span class="stats-label">min =</span>'
                + '<span class="stats-value" id="minForPlace' + place.id + '"></span><span class="stats-delimiter">,</span><span class="stats-label">'
                + 'max =</span><span class="stats-value"' + ' id="maxForPlace' + place.id + '"></span><span class="stats-delimiter">,</span><span'
                + ' class="stats-label">avg =</span><span' + ' class="stats-value decimal-value" id="avgForPlace' + place.id + '"></span></div>');
    }
    $stats.append('<div class="stats-title">Transitions (qty of active channels):</div>');
    for (var k = 0; k < net.transitions.length; k++) {
        var transition = net.transitions[k];
        var transitionFullName = transition.objectName + ' -> ' + transition.name;
        $stats.append('<div class="stats-line"><span class="stats-line-title">' + transitionFullName + '</span><span class="stats-label">min =</span>'
                + '<span class="stats-value" id="minForTransition' + transition.id + '"></span><span class="stats-delimiter">,</span><span class="stats-label">'
                + 'max =</span><span class="stats-value"' + ' id="maxForTransition' + transition.id + '"></span><span class="stats-delimiter">,</span><span'
                + ' class="stats-label">avg =</span><span class="stats-value decimal-value" ' + 'id="avgForTransition' + transition.id + '"></span></div>');
    }
    $('span.stats-line-title').each(function() {
        $(this).attr('title', $(this).text());
    });
    $(document).tooltip();
}

function finalizeStats() {
    $('span.stats-value').each(function() {
        $(this).attr('title', $(this).text());
    });
    $(document).tooltip();
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
            $('#minForTransition' + transition.id).text(transition.stats.min);
            $('#maxForTransition' + transition.id).text(transition.stats.max);
            $('#avgForTransition' + transition.id).text(transition.stats.avg.toFixed(2));
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
            $('#minForPlace' + place.id).text(place.stats.min);
            $('#maxForPlace' + place.id).text(place.stats.max);
            $('#avgForPlace' + place.id).text(place.stats.avg.toFixed(2));
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
    finalizeStats();
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
    $('.stats').append('<div class="stats-title">Time elapsed: ' + getTimeString(endTime - startTime) + '</div>');
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

function runSimulationForModel(currentPetriObjectModel, simulationDuration) {
    duration = simulationDuration;
    currentTime = 0;
    stepsCount = 0;
    if (!currentPetriObjectModel.equalPlacesHaveEqualNumberOfMarkers()) {
        alert('Invalid Petri objects model: places in different Petri objects connected through arcs must contain the same number of markers.');
        return;
    }
    if (!net) {
        net = currentPetriObjectModel.generateJointNet();
        allDelaysAreZero = net.allDelaysAreZero();
    } else {
        for (var k = 0; k < net.places.length; k++) {
            net.places[k].stats = { };
        }
        for (var k = 0; k < net.transitions.length; k++) {
            net.transitions[k].stats = { };
        }
    }
    $('button').addClass('disabled-button');
    $('.stats').html('<div class="stats-title no-underline">Simulation in progress. Please wait...</div>');
    startTime = (new Date()).getTime();
    setTimeout(makeSteps, 0);
}
