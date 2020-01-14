function Transition(id, name, delay, deviation, distribution, priority, probability, channels, top, left) {
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

Transition.prototype = new Draggable();

Transition.prototype.getExecutionTime = function () {
    if (!this.distribution) {
        return this.delay;
    }
    var executionTime = getDistributionRandomValue(this.distribution, this.delay, this.deviation);
    if (executionTime < 0) {
        return 0;
    }
    return executionTime;
};

Transition.prototype.delayAlwaysZero = function () {
    if (!this.distribution || this.distribution === 'exp') {
        return this.delay === 0;
    }
    return this.delay === 0 && this.deviation === 0;
};

Transition.prototype.hasParameters = function () {
    return this.delayIsParam || this.channelsIsParam || this.distributionIsParam || this.priorityIsParam || this.probabilityIsParam || this.deviationIsParam;
};

Transition.prototype.getParameters = function () {
    var params = [];
    if (this.delayIsParam) {
        params.push(this.delayParamName);
    }
    if (this.channelsIsParam) {
        params.push(this.channelsParamName);
    }
    if (this.distributionIsParam) {
        params.push(this.distributionParamName);
    }
    if (this.priorityIsParam) {
        params.push(this.priorityParamName);
    }
    if (this.probabilityIsParam) {
        params.push(this.probabilityParamName);
    }
    if (this.deviationIsParam) {
        params.push(this.deviationParamName);
    }
    return params;
};

Transition.prototype.setDeviationParam = function (paramName) {
    if (paramName) {
        this.deviation = 0;
        this.deviationIsParam = true;
        this.deviationParamName = paramName;
    } else {
        this.deviationIsParam = false;
        this.deviationParamName = null;
    }
};

Transition.prototype.setDelayParam = function (paramName) {
    if (paramName) {
        this.delay = 0;
        this.delayIsParam = true;
        this.delayParamName = paramName;
    } else {
        this.delayIsParam = false;
        this.delayParamName = null;
    }
};

Transition.prototype.setChannelsParam = function (paramName) {
    if (paramName) {
        this.channels = 1;
        this.channelsIsParam = true;
        this.channelsParamName = paramName;
    } else {
        this.channelsIsParam = false;
        this.channelsParamName = null;
    }
};

Transition.prototype.setDistributionParam = function (paramName) {
    if (paramName) {
        this.distribution = null;
        this.distributionIsParam = true;
        this.distributionParamName = paramName;
    } else {
        this.distributionIsParam = false;
        this.distributionParamName = null;
    }
};

Transition.prototype.setPriorityParam = function (paramName) {
    if (paramName) {
        this.priority = 0;
        this.priorityIsParam = true;
        this.priorityParamName = paramName;
    } else {
        this.priorityIsParam = false;
        this.priorityParamName = null;
    }
};

Transition.prototype.setProbabilityParam = function (paramName) {
    if (paramName) {
        this.probability = 1;
        this.probabilityIsParam = true;
        this.probabilityParamName = paramName;
    } else {
        this.probabilityIsParam = false;
        this.probabilityParamName = null;
    }
};

Transition.prototype.getDelayString = function () {
    var self = this;

    if (self.delayIsParam) {
        return self.delayParamName;
    } else {
        return self.delay.toFixed(2);
    }
};

Transition.prototype.getDistributionString = function () {
    var self = this;

    if (self.distributionIsParam) {
        return self.distributionParamName;
    } else {
        return self.distribution;
    }
};

Transition.prototype.redraw = function () {
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
};

Transition.prototype.destroy = function () {
    var self = this;

    var elemId = 'transition' + self.id;

    $('#' + elemId).remove();
}

Transition.prototype.draw = function () {
    var self = this;

    var elemId = 'transition' + self.id;
    if ($('#' + elemId).length) {
        return;
    }

    var $elem = $('<div>')
        .attr('id', elemId)
        .addClass('petri-transition')
        .css({'top': self.top + 'px', 'left': self.left + 'px'});

    var $name = $('<div>')
        .addClass('item-name')
        .text(self.name)
        .appendTo($elem);

    var notesText = 't = ' + self.getDelayString();
    var distributionStr = self.getDistributionString();
    if (distributionStr) {
        notesText += ' (' + distributionStr + ')';
    }
    var $notes = $('<div>')
        .addClass('item-notes')
        .text(notesText)
        .appendTo($elem);

    $('.sandbox').append($elem);

    enableDragAndDrop(elemId, self);

    $('#' + elemId).on('dblclick', function () {
        $('#transition-edit').modal('show');
        openTransitionEdit(self);
    });
};
