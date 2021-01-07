import $ from 'jquery';
import {
    Draggable,
    enableDragAndDrop,
    getDeepArrayCopy,
} from '../../helpers';

export class PetriObject extends Draggable {
    constructor(...args) {
        super(...args);

        const [id, name, className, net, top, left] = args;
        this.id = id;
        this.name = name;
        this.className = className;
        this.net = net;
        this.netId = net.id;
        this.top = top;
        this.left = left;
        this.paramValues = [];
        this.arcs = [];
    }

    getParamValue (paramName) {
        var valueStr = '';
        for (var i = 0; i < this.paramValues.length; i++) {
            var param = this.paramValues[i];
            if (param.name === paramName) {
                valueStr = param.value;
                break;
            }
        }
        return valueStr;
    }
    
    hasParameters () {
        var self = this;
    
        if (!self.net.hasParameters()) {
            return false;
        }
    
        var hasParams = false;
        var allParams = self.net.getParameters();
        for (var i = 0; i < allParams.length; i++) {
            var paramName = allParams[i];
            var paramValue = self.getParamValue(paramName);
            if (paramValue === null || typeof paramValue === 'undefined' || paramValue === '') {
                hasParams = true;
                break;
            }
        }
    
        return hasParams;
    }
    
    getFinalNet () {
        var self = this;
    
        var finalNet = $.extend(true, {}, self.net);
        finalNet.places = getDeepArrayCopy(self.net.places);
        finalNet.transitions = getDeepArrayCopy(self.net.transitions);
        finalNet.arcs = getDeepArrayCopy(self.net.arcs);
    
        if (self.net.hasParameters()) {
            $.each(finalNet.places, function (p, place) {
                if (place.markersIsParam) {
                    var markersParamName = place.markersParamName;
                    place.setMarkersParam(null);
                    place.markers = parseInt(self.getParamValue(markersParamName)) || 0;
                    if (place.markers < 0) {
                        place.markers = 0;
                    }
                }
            });
            $.each(finalNet.transitions, function (t, tran) {
                if (tran.delayIsParam) {
                    var delayParamName = tran.delayParamName;
                    tran.setDelayParam(null);
                    tran.delay = parseFloat(self.getParamValue(delayParamName)) || 0;
                    if (tran.delay < 0) {
                        tran.delay = 0;
                    }
                }
                if (tran.channelsIsParam) {
                    var channelsParamName = tran.channelsParamName;
                    tran.setChannelsParam(null);
                    tran.channels = parseInt(self.getParamValue(channelsParamName)) || 1;
                    if (tran.channels < 1) {
                        tran.channels = 1;
                    }
                }
                if (tran.distributionIsParam) {
                    var distributionParamName = tran.distributionParamName;
                    tran.setDistributionParam(null);
                    var distrStr = self.getParamValue(distributionParamName);
                    tran.distribution = (!distrStr || distrStr === 'none' || distrStr === 'null' || tran.distributionOptions.indexOf(distrStr) === -1)
                        ? null
                        : distrStr;
                }
                if (tran.priorityIsParam) {
                    var priorityParamName = tran.priorityParamName;
                    tran.setPriorityParam(null);
                    tran.priority = parseInt(self.getParamValue(priorityParamName)) || 0;
                    if (tran.priority < 0) {
                        tran.priority = 0;
                    }
                }
                if (tran.probabilityIsParam) {
                    var probabilityParamName = tran.probabilityParamName;
                    tran.setProbabilityParam(null);
                    tran.probability = parseFloat(self.getParamValue(probabilityParamName)) || 1;
                    if (tran.probability < 0) {
                        tran.probability = 0;
                    } else if (tran.probability > 1) {
                        tran.probability = 1;
                    }
                }
                if (tran.deviationIsParam) {
                    var deviationParamName = tran.deviationParamName;
                    tran.setDeviationParam(null);
                    tran.deviation = parseFloat(self.getParamValue(deviationParamName)) || 0;
                    if (tran.deviation < 0) {
                        tran.deviation = 0;
                    }
                }
            });
            $.each(finalNet.arcs, function (a, arc) {
                if (arc.channelsIsParam) {
                    var channelsParamName = arc.channelsParamName;
                    arc.setChannelsParam(null);
                    arc.channels = parseInt(self.getParamValue(channelsParamName)) || 1;
                    if (arc.channels < 1) {
                        arc.channels = 1;
                    }
                }
                if (arc.isInformationLinkIsParam) {
                    var isInformationLinkParamName = arc.isInformationLinkParamName;
                    arc.setIsInformationLinkParam(null);
                    arc.isInformationLink = (self.getParamValue(isInformationLinkParamName) === 'true');
                }
            });
        }
    
        return finalNet;
    }
    
    redraw () {
        var self = this;
    
        var elemId = 'object' + self.id;
    
        var $elem = $('#' + elemId);
    
        var objectNote = $elem.find('.item-notes')[0];
        objectNote.textContent = 'class: ' + self.className;
    
        $elem.find('.item-name').text(self.name);
    }
    
    destroy () {
        var self = this;
    
        var elemId = 'object' + self.id;
    
        $('#' + elemId).remove();
    }
    
    draw () {
        const self = this;
    
        const elemId = 'object' + self.id;
        if ($('#' + elemId).length) {
            return;
        }
    
        const $elem = $('<div>')
            .attr('id', elemId)
            .addClass('petri-object')
            .css({'top': self.top + 'px', 'left': self.left + 'px'});
    
        $('<div>').addClass('item-name').text(self.name).appendTo($elem);
    
        const notesText = 'class: ' + self.className;
        $('<div>').addClass('item-notes').text(notesText).appendTo($elem);
        $('.sandbox').append($elem);
    
        enableDragAndDrop(elemId, self);
    
        $('#' + elemId).on('dblclick', () => openPetriObjectEdit(self));
    }
}
