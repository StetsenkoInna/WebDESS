function PetriObject(id, name, className, net, top, left) {
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

PetriObject.prototype = new Draggable();

PetriObject.prototype.getParamValue = function (paramName) {
    var valueStr = '';
    for (var i = 0; i < this.paramValues.length; i++) {
        var param = this.paramValues[i];
        if (param.name === paramName) {
            valueStr = param.value;
            break;
        }
    }
    return valueStr;
};

PetriObject.prototype.hasParameters = function () {
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
};

PetriObject.prototype.getFinalNet = function () {
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
};

PetriObject.prototype.openEditPopup = function () {
    var self = this;

    var netOptions = [];
    for (var key in localStorage) {
        if (key.substr(0, 3) === 'net') {
            var jsonNet = localStorage.getItem(key);
            netOptions.push({
                netId: parseInt(key.substr(3)),
                netName: JSON.parse(jsonNet, netParseCensor).name,
                net: jsonNet
            });
        }
    }
    if (netOptions.length === 0) {
        alert('No saved Petri nets found.');
        return;
    }

    var $popup = $('#editItemPopup');
    $popup.attr('title', 'Edit a Petri Object');

    var popupHtml = '<div class="popup-line"><span class="popup-label">Name:</span><input type="text" id="nameInput" value="' + self.name + '" /></div>';
    popupHtml += '<div class="popup-line"><span class="popup-label">Class Name:</span><input type="text" id="classNameInput" value="' + self.className
        + '" /></div>';
    popupHtml += '<div class="popup-line"><span class="popup-label">Net:</span><select id="netInput">';
    $.each(netOptions, function (o, option) {
        var selectedHtml = self.netId === option.netId ? ' selected="selected"' : '';
        var displayText = option.netName + ' (id: ' + option.netId + ')';
        popupHtml += '<option value="' + option.netId + '"' + selectedHtml + '>' + displayText + '</option>';
    });
    popupHtml += '</select></div>';
    if (self.net.hasParameters()) {
        popupHtml += '<div class="popup-line" id="paramsSection"><span class="popup-label">Net Parameters:</span></div>';
    }
    $.each(self.net.getParameters(), function (p, param) {
        popupHtml += '<div class="popup-line param-section-line"><span class="popup-label">' + param + '</span><input type="text" class="param-value-input"'
            + ' data-name="' + param + '" value="' + self.getParamValue(param) + '" /></div>';
    });
    $popup.html(popupHtml);

    var dialog = $popup.dialog({
        autoOpen: true,
        modal: true,
        resizable: false,
        width: 292,
        open: function () {
            $('#netInput').on('change', function () {
                $('#paramsSection, .param-section-line').remove();
                var netId = parseInt($('#netInput').val());
                var newNet = restorePetriNet(parsePetriNet(netOptions.filter(function (item) {
                    return item.netId === netId;
                })[0].net));
                var additionalPopupHtml = '';
                if (newNet.hasParameters()) {
                    additionalPopupHtml += '<div class="popup-line" id="paramsSection"><span class="popup-label">Net Parameters:</span></div>';
                }
                $.each(newNet.getParameters(), function (p, param) {
                    additionalPopupHtml += '<div class="popup-line param-section-line"><span class="popup-label">' + param
                        + '</span><input type="text" class="param-value-input" data-name="' + param + '" value="" /></div>';
                });
                $popup.append(additionalPopupHtml);
            });
        },
        buttons: {
            'Cancel': function () {
                dialog.dialog('close');
            },
            'Ok': function () {
                $(document).trigger('modelEdited');
                var netId = parseInt($('#netInput').val());
                var name = $('#nameInput').val();
                if (!name) {
                    alert('Object name cannot be empty.');
                    return;
                }
                var className = $('#classNameInput').val();
                if (!className) {
                    alert('Class name cannot be empty.');
                    return;
                }
                var paramValues = [];
                $('.param-value-input').each(function () {
                    paramValues.push({
                        name: $(this).data('name'),
                        value: $(this).val()
                    });
                });
                dialog.dialog("close");
                var needToEditArcs = (self.netId !== netId && self.arcs.length > 0);
                self.netId = netId;
                self.net = restorePetriNet(parsePetriNet(netOptions.filter(function (item) {
                    return item.netId === netId;
                })[0].net));
                self.paramValues = paramValues;
                self.name = name;
                self.className = className;
                self.redraw();
                if (needToEditArcs) {
                    $('.nav-menu').append('<div class="hidden edit-object-arcs" data-id="' + self.id + '"></div>');
                    $('.edit-object-arcs').trigger('click');
                }
            }
        },
        close: function () {
            dialog.dialog('destroy');
        }
    });
};

PetriObject.prototype.redraw = function () {
    var self = this;

    var elemId = 'object' + self.id;

    var $elem = $('#' + elemId);

    var objectNote = $elem.find('.item-notes')[0];
    objectNote.textContent = 'class: ' + self.className;

    $elem.find('.item-name').text(self.name);
};

PetriObject.prototype.destroy = function () {
    var self = this;

    var elemId = 'object' + self.id;

    $('#' + elemId).remove();
}

PetriObject.prototype.draw = function () {
    var self = this;

    var elemId = 'object' + self.id;
    if ($('#' + elemId).length) {
        return;
    }

    var $elem = $('<div>')
        .attr('id', elemId)
        .addClass('petri-object')
        .css({'top': self.top + 'px', 'left': self.left + 'px'});

    var $name = $('<div>')
        .addClass('item-name')
        .text(self.name)
        .appendTo($elem);

    var notesText = 'class: ' + self.className;
    var $notes = $('<div>')
        .addClass('item-notes')
        .text(notesText)
        .appendTo($elem);

    $('.sandbox').append($elem);

    enableDragAndDrop(elemId, self);

    $('#' + elemId).on('dblclick', function () {
        self.openEditPopup();
    });
};
