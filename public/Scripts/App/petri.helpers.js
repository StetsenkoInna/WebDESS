function selectTransitionToFire(transitions) {
    if (transitions.length === 1) {
        return transitions[0];
    }
    var highestPriority = transitions[0].priority;
    var highestPriorityTransitions = transitions.filter(function (tran) {
        return tran.priority === highestPriority;
    });
    if (highestPriorityTransitions.length === 1) {
        return highestPriorityTransitions[0];
    }
    var randomValue = Math.random();
    var probabilities = [];
    var probabilitySum = 0;
    for (var i = 0; i < highestPriorityTransitions.length; i++) {
        var transition = highestPriorityTransitions[i];
        probabilities.push(transition.probability);
        probabilitySum += transition.probability;
    }
    for (var i = 0; i < probabilities.length; i++) {
        probabilities[i] /= probabilitySum;
    }
    var selectedTransitionIndex = 0;
    var cumulativeProbability = 0;
    for (var i = 0; i < probabilities.length; i++) {
        cumulativeProbability += probabilities[i];
        if (randomValue < cumulativeProbability) {
            selectedTransitionIndex = i;
            break;
        }
    }
    return highestPriorityTransitions[selectedTransitionIndex];
}

function restorePlace(place, plainObject) {
    if (plainObject.markersParamName) {
        place.setMarkersParam(plainObject.markersParamName);
    }
    return place;
}

function restoreTransition(transition, plainObject) {
    plainObject.deviationParamName && transition.setDeviationParam(plainObject.deviationParamName);
    plainObject.delayParamName && transition.setDelayParam(plainObject.delayParamName);
    plainObject.channelsParamName && transition.setChannelsParam(plainObject.channelsParamName);
    plainObject.distributionParamName && transition.setDistributionParam(plainObject.distributionParamName);
    plainObject.priorityParamName && transition.setPriorityParam(plainObject.priorityParamName);
    plainObject.probabilityParamName && transition.setProbabilityParam(plainObject.probabilityParamName);
    return transition;
}

function restoreArc(arc, plainObject) {
    arc.isOneOfTwo = plainObject.isOneOfTwo;
    arc.isFirst = plainObject.isFirst;

    if (plainObject.channelsParamName) {
        arc.setChannelsParam(plainObject.channelsParamName);
    }

    if (plainObject.isInformationLinkParamName) {
        arc.setIsInformationLinkParam(plainObject.isInformationLinkParamName);
    }
    return arc;
}

function restorePetriNet(net) {
    $.each(net.places, function (p, place) {
        place.arcs = net.arcs.filter(function (arcElem) {
            return arcElem.placeId === place.id;
        }).slice();
        place.markersPerLine = 5;
        place.topLayerItem = true;
    });
    $.each(net.transitions, function (t, transition) {
        transition.arcs = net.arcs.filter(function (arcElem) {
            return arcElem.transitionId === transition.id;
        }).slice();
        transition.bottomNotesHeight = 20;
        transition.distributionOptions = ['none', 'exp', 'norm', 'unif'];
    });
    $.each(net.arcs, function (a, arc) {
        arc.beginElementUiId = arc.fromPlace
            ? 'place' + arc.placeId
            : 'transition' + arc.transitionId;
        arc.endElementUiId = arc.fromPlace
            ? 'transition' + arc.transitionId
            : 'place' + arc.placeId;
    });
    return net;
}

function parsePetriNet(jsonNet) {
    const simpleNetObject = JSON.parse(jsonNet, netParseCensor);
    const petriNet = new PetriNet(simpleNetObject.name);

    petriNet.id = simpleNetObject.id;
    $.extend(petriNet, simpleNetObject);

    const allPlaces = {};
    const allTransitions = {};

    for (let i = 0; i < petriNet.places.length; i++) {
        const place = petriNet.places[i];
        const petriPlace = new Place(place.id, place.name, place.markers, place.top, place.left);
        petriNet.places[i] = restorePlace(petriPlace, place);
        allPlaces[place.id] = petriNet.places[i];
    }

    for (let i = 0; i < petriNet.transitions.length; i++) {
        const tran = petriNet.transitions[i];
        const pTransition = new Transition(tran.id, tran.name, tran.delay, tran.deviation, tran.distribution, tran.priority, tran.probability, tran.channels,
            tran.top, tran.left);
        petriNet.transitions[i] = restoreTransition(pTransition, tran);
        allTransitions[tran.id] = petriNet.transitions[i];
    }

    for (let i = 0; i < petriNet.arcs.length; i++) {
        const arc = petriNet.arcs[i];
        const petriArc = new Arc(arc.id, allPlaces[arc.placeId], allTransitions[arc.transitionId], arc.fromPlace, arc.channels, arc.isInformationLink);
        petriNet.arcs[i] = restoreArc(petriArc, arc);
    }
    return petriNet;
}
