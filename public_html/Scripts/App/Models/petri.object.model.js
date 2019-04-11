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
    var self = this;

    var markersOk = true;

    for (var i = 0; i < self.arcs.length; i++) {
        var arc = self.arcs[i];
        var firstObject = self.objects.filter(function (item) {
            return item.id === arc.firstObjectId;
        })[0];
        var secondObject = self.objects.filter(function (item) {
            return item.id === arc.secondObjectId;
        })[0];
        var firstPlace = firstObject.net.places.filter(function (place) {
            return place.id === arc.firstObjectPlaceId;
        })[0];
        var secondPlace = secondObject.net.places.filter(function (place) {
            return place.id === arc.secondObjectPlaceId;
        })[0]
        if (firstPlace.markers !== secondPlace.markers) {
            markersOk = false;
            break;
        }
    }

    return markersOk;
};

PetriObjectModel.prototype.getEqualPlaceGroups = function () {
    var self = this;

    var groups = [];

    var groupContainsItem = function (group, item) {
        return group.filter(function (grItem) {
            return grItem.objectId === item.objectId && grItem.placeId === item.placeId;
        }).length > 0;
    };

    for (var i = 0; i < self.arcs.length; i++) {
        var arc = self.arcs[i];
        var newPlaces = [{objectId: arc.firstObjectId, placeId: arc.firstObjectPlaceId}, {
            objectId: arc.secondObjectId,
            placeId: arc.secondObjectPlaceId
        }];
        var addedToExistingGroup = false;
        for (var j = 0; j < groups.length; j++) {
            var group = groups[j];
            if (groupContainsItem(group, newPlaces[0]) || groupContainsItem(group, newPlaces[1])) {
                if (!groupContainsItem(group, newPlaces[0])) {
                    group.push(newPlaces[0]);
                } else if (!groupContainsItem(group, newPlaces[1])) {
                    group.push(newPlaces[1]);
                }
                addedToExistingGroup = true;
                break;
            }
        }
        if (!addedToExistingGroup) {
            groups.push(newPlaces);
        }
    }

    return groups;
};

PetriObjectModel.prototype.generateJointNet = function () {
    var self = this;

    var placeCounter = 0;
    var transitionCounter = 0;
    var arcCounter = 0;

    var net = new PetriNet(self.name);

    var equalPlaceGroups = self.getEqualPlaceGroups();

    var groupContainsItem = function (group, item) {
        return group.filter(function (grItem) {
            return grItem.objectId === item.objectId && grItem.placeId === item.placeId;
        }).length > 0;
    };

    var placeWasAlreadyAdded = function (place, object) {
        var item = {objectId: object.id, placeId: place.id};
        var alreadyAdded = false;
        for (var k = 0; k < equalPlaceGroups.length; k++) {
            var group = equalPlaceGroups[k];
            if (groupContainsItem(group, item)) {
                for (var l = 0; l < group.length; l++) {
                    var groupItem = group[l];
                    if (net.places.filter(function (pl) {
                        return pl.oldId === groupItem.placeId && pl.objectId === groupItem.objectId;
                    }).length > 0) {
                        alreadyAdded = true;
                        break;
                    }
                }
                break;
            }
        }
        return alreadyAdded;
    };

    var findAlreadyAddedPlace = function (placeId, objectId) {
        var item = {objectId: objectId, placeId: placeId};
        var placeResult;
        for (var k = 0; k < equalPlaceGroups.length; k++) {
            var group = equalPlaceGroups[k];
            if (groupContainsItem(group, item)) {
                for (var l = 0; l < group.length; l++) {
                    var groupItem = group[l];
                    var placeResults = net.places.filter(function (pl) {
                        return pl.oldId === groupItem.placeId && pl.objectId === groupItem.objectId;
                    });
                    if (placeResults.length > 0) {
                        placeResult = placeResults[0];
                        break;
                    }
                }
                break;
            }
        }
        return placeResult;
    };

    for (var i = 0; i < self.objects.length; i++) {
        var object = self.objects[i];
        var objNet = object.getFinalNet();
        for (var j = 0; j < objNet.places.length; j++) {
            var oldPlace = objNet.places[j];
            if (placeWasAlreadyAdded(oldPlace, object)) {
                continue;
            }
            placeCounter++;
            var newPlace = new Place(placeCounter, oldPlace.name, oldPlace.markers, 0, 0);
            newPlace.objectId = object.id;
            newPlace.objectName = object.name;
            newPlace.oldId = oldPlace.id;
            net.places.push(newPlace);
        }
        for (var j = 0; j < objNet.transitions.length; j++) {
            var oldTran = objNet.transitions[j];
            transitionCounter++;
            var newTransition = new Transition(transitionCounter, oldTran.name, oldTran.delay, oldTran.deviation, oldTran.distribution, oldTran.priority,
                oldTran.probability, oldTran.channels, 0, 0);
            newTransition.objectId = object.id;
            newTransition.objectName = object.name;
            newTransition.oldId = oldTran.id;
            net.transitions.push(newTransition);
        }
        for (var j = 0; j < objNet.arcs.length; j++) {
            var oldArc = objNet.arcs[j];
            arcCounter++;
            var arcPlace;
            var arcPlaces = net.places.filter(function (item) {
                return item.objectId === object.id && item.oldId === oldArc.placeId;
            });
            if (arcPlaces.length === 0) {
                arcPlace = findAlreadyAddedPlace(oldArc.placeId, object.id);
            } else {
                arcPlace = arcPlaces[0];
            }
            var arcTransition = net.transitions.filter(function (item) {
                return item.objectId === object.id && item.oldId === oldArc.transitionId;
            })[0];
            var newArc = new Arc(arcCounter, arcPlace, arcTransition, oldArc.fromPlace, oldArc.channels, oldArc.isInformationLink);
            newArc.objectId = object.id;
            newArc.oldId = oldArc.id;
            net.arcs.push(newArc);
        }
    }

    for (var k = 0; k < net.transitions.length; k++) {
        var transition = net.transitions[k];
        transition.outputTimesBuffer = [];
        transition.stats = {};
    }

    for (var s = 0; s < net.places.length; s++) {
        var place = net.places[s];
        place.stats = {};
    }

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
    var self = this;

    $.each(self.objects, function (i, object) {
        object.draw();
    });

    $.each(self.arcs, function (i, arc) {
        arc.draw();
    });
};
