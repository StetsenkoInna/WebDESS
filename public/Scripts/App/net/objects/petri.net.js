import $ from 'jquery';
import {moveItemToAnotherArray} from '../../helpers';

export class PetriNet {
    constructor(name) {
        this.id = null;
        this.name = name;
        this.places = [];
        this.transitions = [];
        this.arcs = [];
    }

    getClass() {
        return 'PetriNet';
    }

    getParameters() {
        var self = this;

        var params = [];
    
        $.each(self.places, function (p, place) {
            params = params.concat(place.getParameters());
        });
    
        $.each(self.transitions, function (t, transition) {
            params = params.concat(transition.getParameters());
        });
    
        $.each(self.arcs, function (a, arc) {
            params = params.concat(arc.getParameters());
        });
    
        return params;
    }

    hasParameters() {
        var self = this;

        var hasParams = false;

        $.each(self.places, function (p, place) {
            if (place.hasParameters()) {
                hasParams = true;
            }
        });

        $.each(self.transitions, function (t, transition) {
            if (transition.hasParameters()) {
                hasParams = true;
            }
        });

        $.each(self.arcs, function (a, arc) {
            if (arc.hasParameters()) {
                hasParams = true;
            }
        });

        return hasParams;
    }

    allDelaysAreZero() {
        var self = this;

        var allZero = true;
    
        for (var i = 0; i < self.transitions.length; i++) {
            if (!self.transitions[i].delayAlwaysZero()) {
                allZero = false;
            }
        }
    
        return allZero;
    }

    isConnectedGraph() {
        var self = this;
    
        var otherPlaces = self.places.slice();
        var otherTransitions = self.transitions.slice();
        var reachedPlaces = [];
        var reachedTransitions = [];
        var finalizedPlaces = [];
        var finalizedTransitions = [];
    
        moveItemToAnotherArray(otherPlaces[0], otherPlaces, reachedPlaces);
    
        while (reachedPlaces.length > 0 || reachedTransitions.length > 0) {
            if (reachedPlaces.length > 0) {
                var currentPlace = reachedPlaces[0];
                moveItemToAnotherArray(currentPlace, reachedPlaces, finalizedPlaces);
                var neighbourTransitions = otherTransitions.filter(function (transition) {
                    return transition.arcs.filter(function (arc) {
                        return arc.placeId === currentPlace.id;
                    }).length > 0;
                });
                for (var i = 0; i < neighbourTransitions.length; i++) {
                    var neighbourTransition = neighbourTransitions[i];
                    moveItemToAnotherArray(neighbourTransition, otherTransitions, reachedTransitions);
                }
            } else {
                var currentTransition = reachedTransitions[0];
                moveItemToAnotherArray(currentTransition, reachedTransitions, finalizedTransitions);
                var neighbourPlaces = otherPlaces.filter(function (place) {
                    return place.arcs.filter(function (arc) {
                        return arc.transitionId === currentTransition.id;
                    }).length > 0;
                });
                for (var i = 0; i < neighbourPlaces.length; i++) {
                    var neighbourPlace = neighbourPlaces[i];
                    moveItemToAnotherArray(neighbourPlace, otherPlaces, reachedPlaces);
                }
            }
        }
    
        return (otherPlaces.length === 0 && otherTransitions.length === 0);
    }

    validate () {
        var self = this;
    
        if (!self.places.length || !self.transitions.length) {
            return {
                valid: false,
                message: 'should contain at least 1 place and 1 transition.'
            };
        }
    
        var placesCount = self.places.length;
        for (var i = 0; i < placesCount; i++) {
            var place = self.places[i];
            var arcsNumber = place.arcs.filter(function (item) {
                return !item.isInformationLink;
            }).length;
            if (!arcsNumber) {
                return {
                    valid: false,
                    message: 'each place should be connected to at least 1 transition (excluding information links).'
                };
            }
        }
    
        var transitionsCount = self.transitions.length;
        for (var i = 0; i < transitionsCount; i++) {
            var transition = self.transitions[i];
            var inputArcsNumber = transition.arcs.filter(function (item) {
                return item.fromPlace && !item.isInformationLink;
            }).length;
            var outputArcsNumber = transition.arcs.filter(function (item) {
                return !item.fromPlace;
            }).length;
            if (!inputArcsNumber || !outputArcsNumber) {
                return {
                    valid: false,
                    message: 'each transition should have both input and output arcs (excluding information links).'
                };
            }
        }
    
        if (!self.isConnectedGraph()) {
            return {
                valid: false,
                message: 'should be a connected graph (there should be a path between every pair of places/transitions).'
            };
        }
    
        return {
            valid: true
        };
    }

    draw () {
        var self = this;
    
        $.each(self.places, function (i, place) {
            place.draw();
        });
    
        $.each(self.transitions, function (i, transition) {
            transition.draw();
        });
    
        $.each(self.arcs, function (i, arc) {
            arc.draw();
        });
    }
}

window.PetriNet = PetriNet;
