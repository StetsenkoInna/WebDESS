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

Transition.prototype.getExecutionTime = function() {
	if (!this.distribution) {
		return this.delay;
	}
	var executionTime = getDistributionRandomValue(this.distribution, this.delay, this.deviation);
	if (executionTime < 0) {
		return 0;
	}
	return executionTime;
};

Transition.prototype.delayAlwaysZero = function() {
	if (!this.distribution || this.distribution === 'exp') {
		return this.delay === 0;
	}
	return this.delay === 0 && this.deviation === 0;
};

Transition.prototype.hasParameters = function() {
	return this.delayIsParam || this.channelsIsParam || this.distributionIsParam || this.priorityIsParam || this.probabilityIsParam || this.deviationIsParam;
};

Transition.prototype.getParameters = function() {
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

Transition.prototype.setDeviationParam = function(paramName) {
    if (paramName) {
		this.deviation = 0;
		this.deviationIsParam = true;
		this.deviationParamName = paramName;
	} else {
		this.deviationIsParam = false;
		this.deviationParamName = null;
	}
};

Transition.prototype.setDelayParam = function(paramName) {
    if (paramName) {
		this.delay = 0;
		this.delayIsParam = true;
		this.delayParamName = paramName;
	} else {
		this.delayIsParam = false;
		this.delayParamName = null;
	}
};

Transition.prototype.setChannelsParam = function(paramName) {
    if (paramName) {
		this.channels = 1;
		this.channelsIsParam = true;
		this.channelsParamName = paramName;
	} else {
		this.channelsIsParam = false;
		this.channelsParamName = null;
	}
};

Transition.prototype.setDistributionParam = function(paramName) {
    if (paramName) {
		this.distribution = null;
		this.distributionIsParam = true;
		this.distributionParamName = paramName;
	} else {
		this.distributionIsParam = false;
		this.distributionParamName = null;
	}
};

Transition.prototype.setPriorityParam = function(paramName) {
    if (paramName) {
		this.priority = 0;
		this.priorityIsParam = true;
		this.priorityParamName = paramName;
	} else {
		this.priorityIsParam = false;
		this.priorityParamName = null;
	}
};

Transition.prototype.setProbabilityParam = function(paramName) {
    if (paramName) {
		this.probability = 1;
		this.probabilityIsParam = true;
		this.probabilityParamName = paramName;
	} else {
		this.probabilityIsParam = false;
		this.probabilityParamName = null;
	}
};

Transition.prototype.getDelayString = function() {
	var self = this;
	
	if (self.delayIsParam) {
		return self.delayParamName;
	} else {
		return self.delay.toFixed(2);
	}
};

Transition.prototype.getDistributionString = function() {
	var self = this;
	
	if (self.distributionIsParam) {
		return self.distributionParamName;
	} else {
		return self.distribution;
	}
};

Transition.prototype.openEditPopup = function() {
	var self = this;
	
	var $popup = $('#editItemPopup');
	$popup.attr('title', 'Edit a Transition');
	
	var popupHtml = '<div class="popup-line"><span class="popup-label">Name:</span><input type="text" id="nameInput" value="' + self.name + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Number of Channels:</span><input type="text" id="channelsInput" value="'
		+ self.channels + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Param Name (Channels):</span><input type="text" id="channelsParamNameInput" value="'
		+ (self.channelsParamName || '') + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Priority:</span><input type="number" min="0" id="priorityInput" value="'
		+ self.priority + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Param Name (Priority):</span><input type="text" id="priorityParamNameInput" value="'
		+ (self.priorityParamName || '') + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Probability:</span><input type="number" step="0.01" min="0" max="1" '
		+ 'id="probabilityInput" value="' + self.probability + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Param Name (Probability):</span><input type="text" id="probabilityParamNameInput" value="'
		+ (self.probabilityParamName || '') + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Delay:</span><input type="number" step="0.01" min="0" id="delayInput" value="'
		+ self.delay + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Param Name (Delay):</span><input type="text" id="delayParamNameInput" value="'
		+ (self.delayParamName || '') + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Delay St. Deviation:</span><input type="number" step="0.01" min="0" '
		+ 'id="deviationInput" value="' + self.deviation + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Param Name (Delay St. D.):</span><input type="text" id="deviationParamNameInput" value="'
		+ (self.deviationParamName || '') + '" /></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Distribution:</span><select id="distributionInput">';
	$.each(self.distributionOptions, function(o, option) {
		var optionValue = option === 'none' ? null : option;
		var selectedHtml = self.distribution === optionValue ? ' selected="selected"' : '';
		popupHtml += '<option value="' + optionValue + '"' + selectedHtml + '>' + option + '</option>';
	});
	popupHtml += '</select></div>';
	popupHtml += '<div class="popup-line"><span class="popup-label">Param Name (Distribution):</span><input type="text" id="distributionParamNameInput" value="'
		+ (self.distributionParamName || '') + '" /></div>';
	$popup.html(popupHtml);
	
	var dialog = $popup.dialog({
		autoOpen: true,
		modal: true,
		resizable: false,
		height: 532,
		width: 292,
		buttons: {
			'Cancel': function() { dialog.dialog('close'); },
			'Ok': function() {
				$(document).trigger('netEdited');
				var priorityStr = $('#priorityInput').val();
				if (!priorityStr || Math.floor(priorityStr) != priorityStr || !$.isNumeric(priorityStr) || parseInt(priorityStr) < 0) {
					alert('Priority must be a positive integer or zero.');
					return;
				}
				var priority = parseInt(priorityStr);
				var probabilityStr = $('#probabilityInput').val();
				if (!probabilityStr || !$.isNumeric(probabilityStr) || parseFloat(probabilityStr) < 0 || parseFloat(probabilityStr) > 1) {
					alert('Probability must be a decimal between 0 and 1.');
					return;
				}
				var probability = parseFloat(probabilityStr);
				var delayStr = $('#delayInput').val();
				if (!delayStr || !$.isNumeric(delayStr) || parseFloat(delayStr) < 0) {
					alert('Delay must be a positive decimal or zero.');
					return;
				}
				var delay = parseFloat(delayStr);
				var channelsStr = $('#channelsInput').val();
				var channels;
				if (channelsStr.toLowerCase() === 'infinity') {
					channels = Infinity;
				} else {
					if (!channelsStr || Math.floor(channelsStr) != channelsStr || !$.isNumeric(channelsStr) || parseInt(channelsStr) < 1) {
						alert('The number of channels must be a positive integer or infinity.');
						return;
					}
					channels = parseInt(channelsStr);
				}
				var deviationStr = $('#deviationInput').val();
				if (!deviationStr || !$.isNumeric(deviationStr) || parseFloat(deviationStr) < 0) {
					alert('Standard deviation (for the delay) must be a positive decimal or zero.');
					return;
				}
				var deviation = parseFloat(deviationStr);
				var distribution = $('#distributionInput').val();
				if (distribution === 'null') {
					distribution = null;
				}
				var name = $('#nameInput').val();
				if (!name) {
					alert('Transition name cannot be empty.');
					return;
				}
				var priorityParamName = $('#priorityParamNameInput').val();
				var probabilityParamName = $('#probabilityParamNameInput').val();
				var delayParamName = $('#delayParamNameInput').val();
				var channelsParamName = $('#channelsParamNameInput').val();
				var distributionParamName = $('#distributionParamNameInput').val();
				var deviationParamName = $('#deviationParamNameInput').val();
				dialog.dialog( "close" );
				self.deviation = deviation;
				self.priority = priority;
				self.probability = probability;
				self.delay = delay;
				self.channels = channels;
				self.distribution = distribution;
				self.setPriorityParam(priorityParamName);
				self.setProbabilityParam(probabilityParamName);
				self.setDelayParam(delayParamName);
				self.setChannelsParam(channelsParamName);
				self.setDistributionParam(distributionParamName);
				self.setDeviationParam(deviationParamName);
				self.name = name;
				self.redraw();
			}
		},
		close: function() {
			dialog.dialog('destroy');
		}
	});
};

Transition.prototype.redraw = function() {
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

Transition.prototype.destroy = function() {
	var self = this;
	
	var elemId = 'transition' + self.id;
	
	$('#' + elemId).remove();
}

Transition.prototype.draw = function() {
	var self = this;
	
	var elemId = 'transition' + self.id;
	if ($('#' + elemId).length) {
		return;
	}
	
	var $elem = $('<div>')
		.attr('id', elemId)
		.addClass('petri-transition')
		.css({ 'top': self.top + 'px', 'left': self.left + 'px' });
		
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
	
	$('#' + elemId).on('dblclick', function() {
		self.openEditPopup();
	});
};