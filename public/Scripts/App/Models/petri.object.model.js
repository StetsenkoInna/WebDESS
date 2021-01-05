// import {moveItemToAnotherArray} from '../helpers';

function PetriObjectModel(name) {
    this.id = null;

    this.name = name;

    this.objects = [];

    this.arcs = [];
}

PetriObjectModel.prototype.getClass = function () {
    return 'PetriObjectModel';
};

PetriObjectModel.prototype.hasParameters = function () {
    var hasParams = false;

    for (var i = 0; i < this.objects.length; i++) {
        if (this.objects[i].hasParameters()) {
            hasParams = true;
            break;
        }
    }

    return hasParams;
};

PetriObjectModel.prototype.equalPlacesHaveEqualNumberOfMarkers = function () {
    const self = this;

    self.arcs.forEach(arc => {
        const firstObject = self.objects.find(e => e.id === arc.firstObjectId);
        const secondObject = self.objects.find(e => e.id === arc.secondObjectId);

        arc.connections.forEach(({ from, to }) => {
            const firstPlace = firstObject.net.places.find(e => e.id === from);
            const secondPlace = secondObject.net.places.find(e => e.id === to);

            if (firstPlace.markers !== secondPlace.markers) return false;
        });
    });

    return true;
};

const buildModel = (self, modelIndex, parentModelIndex, connections = [], copyIndex = 0) => {
    const result = new PetriNet(self.name);

    const getId = id => (id * 1000 + modelIndex) * 1000 + copyIndex;
    const getParentId = id => (id * 1000 + parentModelIndex) * 1000 + copyIndex;

    const net = self.objects[modelIndex].getFinalNet();

    for (const { name, markers, id } of net.places) {
        const newPlace = new Place(getId(id), name, markers, 0, 0);
        newPlace.objectName = self.objects[modelIndex].name;
        result.places.push(newPlace);
    }

    for (const { id, name, delay, deviation, distribution, priority, probability, channels } of net.transitions) {
        const newTransition = new Transition(getId(id), name, delay, deviation, distribution, priority, probability, channels, 0, 0);
        newTransition.objectName = self.objects[modelIndex].name;
        result.transitions.push(newTransition);
    }

    for (const { id, placeId, transitionId, fromPlace, channels, isInformationLink } of net.arcs) {
        const place = result.places.find(e => e.id === getId(placeId));
        const transition = result.transitions.find(e => e.id === getId(transitionId));

        const newArc = new Arc(getId(id), place, transition, fromPlace, channels, isInformationLink);
        result.arcs.push(newArc);
    }

    const arcs = self.arcs.filter(e => e.firstObjectId === modelIndex + 1);

    for (const { secondObjectId, connections, copies } of arcs) {
        for (let i = 0; i < copies; i++) {
            const { places, transitions, arcs } = buildModel(self, secondObjectId - 1, modelIndex, connections, i);

            result.places = result.places.concat(places);
            result.transitions = result.transitions.concat(transitions);
            result.arcs = result.arcs.concat(arcs);
        }
    }

    for (const { from, to } of connections) {
        result.arcs.filter(e => e.placeId === getId(to)).forEach(e => {
            e.placeId = getParentId(from);
        });
        result.places = result.places.filter(e => e.id !== getId(to));
    }

    return result;
};

PetriObjectModel.prototype.generateJointNet = function () {
    const self = this;
    const net = buildModel(self, 0);

    net.transitions.forEach(e => {
        e.outputTimesBuffer = [];
        e.stats = {};
    });

    net.places.forEach(e => {
        e.stats = {};
    });

    return net;
};

PetriObjectModel.prototype.isConnectedGraph = function () {
    var self = this;

    var otherObjects = self.objects.slice();
    var reachedObjects = [];
    var finalizedObjects = [];

    moveItemToAnotherArray(otherObjects[0], otherObjects, reachedObjects);

    while (reachedObjects.length > 0) {
        var currentObject = reachedObjects[0];
        moveItemToAnotherArray(currentObject, reachedObjects, finalizedObjects);
        var neighbourObjects = otherObjects.filter(function (object) {
            return object.arcs.filter(function (arc) {
                return arc.firstObjectId === currentObject.id || arc.secondObjectId === currentObject.id;
            }).length > 0;
        });
        for (var i = 0; i < neighbourObjects.length; i++) {
            var neighbourObject = neighbourObjects[i];
            moveItemToAnotherArray(neighbourObject, otherObjects, reachedObjects);
        }
    }

    return otherObjects.length === 0;
};

PetriObjectModel.prototype.validate = function () {
    var self = this;

    if (!self.objects.length) {
        return {
            valid: false,
            message: 'should contain at least 1 object.'
        };
    }

    if (!self.isConnectedGraph()) {
        return {
            valid: false,
            message: 'should be a connected graph (there should be a path between every pair of objects).'
        };
    }

    return {
        valid: true
    };
};

PetriObjectModel.prototype.draw = function () {
    this.objects.forEach(e => e.draw());
    this.arcs.forEach(e => e.draw());
};
