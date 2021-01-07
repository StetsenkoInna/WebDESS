import $ from 'jquery';
import {
    Draggable,
    enableDragAndDrop,
    getDistributionRandomValue
} from '../../helpers';

export class Transition extends Draggable {
    constructor(...args) {
        super(...args);

        const [id, name, delay, deviation, distribution, priority, probability, channels, top, left] = args;

        this.id = id;

        this.name = name;
    
        this.deviation = deviation;
        this.deviationIsParam = false;
        this.deviationParamName = null;
    
        this.delay = delay;
        this.delayIsParam = false;
        this.delayParamName = null;
    
        this.distribution = distribution;
        this.distributionIsParam = false;
        this.distributionParamName = null;
    
        this.priority = priority;
        this.priorityIsParam = false;
        this.priorityParamName = null;
    
        this.probability = probability;
        this.probabilityIsParam = false;
        this.probabilityParamName = null;
    
        this.channels = channels;
        this.channelsIsParam = false;
        this.channelsParamName = null;
    
        this.bottomNotesHeight = 20;
    
        this.distributionOptions = ['none', 'exp', 'norm', 'unif'];
    
        this.top = top;
        this.left = left;
    
        this.arcs = [];
    }

    getExecutionTime () {
        if (!this.distribution) {
            return this.delay;
        }

        const executionTime = getDistributionRandomValue(this.distribution, this.delay, this.deviation);
        if (executionTime < 0) {
            return 0;
        }

        return executionTime;
    }

    delayAlwaysZero () {
        if (!this.distribution || this.distribution === 'exp') {
            return this.delay === 0;
        }

        return this.delay === 0 && this.deviation === 0;
    }

    hasParameters () {
        return (
            this.delayIsParam ||
            this.channelsIsParam ||
            this.distributionIsParam ||
            this.priorityIsParam ||
            this.probabilityIsParam ||
            this.deviationIsParam
        );
    }

    getParameters () {
        const params = [];
        this.delayIsParam && params.push(this.delayParamName);
        this.channelsIsParam && params.push(this.channelsParamName);
        this.distributionIsParam && params.push(this.distributionParamName);
        this.priorityIsParam && params.push(this.priorityParamName);
        this.probabilityIsParam && params.push(this.probabilityParamName);
        this.deviationIsParam && params.push(this.deviationParamName);
        return params;
    }

    setDeviationParam (paramName) {
        if (paramName) {
            this.deviation = 0;
            this.deviationIsParam = true;
            this.deviationParamName = paramName;
        } else {
            this.deviationIsParam = false;
            this.deviationParamName = null;
        }
    }

    setDelayParam (paramName) {
        if (paramName) {
            this.delay = 0;
            this.delayIsParam = true;
            this.delayParamName = paramName;
        } else {
            this.delayIsParam = false;
            this.delayParamName = null;
        }
    }

    setChannelsParam (paramName) {
        if (paramName) {
            this.channels = 1;
            this.channelsIsParam = true;
            this.channelsParamName = paramName;
        } else {
            this.channelsIsParam = false;
            this.channelsParamName = null;
        }
    }

    setDistributionParam (paramName) {
        if (paramName) {
            this.distribution = null;
            this.distributionIsParam = true;
            this.distributionParamName = paramName;
        } else {
            this.distributionIsParam = false;
            this.distributionParamName = null;
        }
    }

    setPriorityParam (paramName) {
        if (paramName) {
            this.priority = 0;
            this.priorityIsParam = true;
            this.priorityParamName = paramName;
        } else {
            this.priorityIsParam = false;
            this.priorityParamName = null;
        }
    }

    setProbabilityParam (paramName) {
        if (paramName) {
            this.probability = 1;
            this.probabilityIsParam = true;
            this.probabilityParamName = paramName;
        } else {
            this.probabilityIsParam = false;
            this.probabilityParamName = null;
        }
    }

    getDelayString () {
        const self = this;

        if (self.delayIsParam) {
            return self.delayParamName;
        } else {
            return self.delay.toFixed(2);
        }
    }

    getDistributionString () {
        const self = this;

        if (self.distributionIsParam) {
            return self.distributionParamName;
        } else {
            return self.distribution;
        }
    }

    redraw () {
        var self = this;

        var elemId = 'transition' + self.id;

        var notesText = 't = ' + self.getDelayString();
        var distributionStr = self.getDistributionString();
        if (distributionStr) {
            notesText += ' (' + distributionStr + ')';
        }

        var $elem = $('#' + elemId);

        var transitionNote = $elem.find('.item-notes')[0];
        transitionNote.textContent = notesText;

        $elem.find('.item-name').text(self.name);
    }

    destroy () {
        const self = this;
        const elemId = `transition${self.id}`;
        $('#' + elemId).remove();
    }

    draw () {
        const self = this;

        const elemId = 'transition' + self.id;
        if ($('#' + elemId).length) {
            return;
        }

        const $elem = $('<div>')
            .attr('id', elemId)
            .addClass('petri-transition')
            .css({'top': self.top + 'px', 'left': self.left + 'px'});

        $('<div>').addClass('item-name').text(self.name).appendTo($elem);

        let notesText = 't = ' + self.getDelayString();
        const distributionStr = self.getDistributionString();
        if (distributionStr) {
            notesText += ' (' + distributionStr + ')';
        }

        $('<div>').addClass('item-notes').text(notesText).appendTo($elem);
        $('.sandbox').append($elem);

        enableDragAndDrop(elemId, self);

        $('#' + elemId).on('dblclick', () => openTransitionEdit(self));
    }
}

window.Transition = Transition;
