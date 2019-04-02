function Place(id, name, markers, top, left) {
    this.id = id;

    this.name = name;

    this.markers = markers;
    this.markersIsParam = false;
    this.markersParamName = null;

    this.top = top;
    this.left = left;

    this.markersPerLine = 5;

    this.topLayerItem = true;

    this.arcs = [];
}

Place.prototype = new Draggable();

Place.prototype.hasParameters = function () {
    return this.markersIsParam;
};

Place.prototype.getParameters = function () {
    if (this.markersIsParam) {
        return [this.markersParamName];
    }
    return [];
};

Place.prototype.setMarkersParam = function (paramName) {
    if (paramName) {
        this.markers = 0;
        this.markersIsParam = true;
        this.markersParamName = paramName;
    } else {
        this.markersIsParam = false;
        this.markersParamName = null;
    }
};

Place.prototype.openEditPopup = function () {
    var self = this;

    var $popup = $('#editItemPopup');
    $popup.attr('title', 'Edit a Place');

    var popupHtml = '<div class="popup-line"><span class="popup-label">Name:</span><input type="text" id="nameInput" value="' + self.name + '" /></div>';
    popupHtml += '<div class="popup-line"><span class="popup-label">Number of Markers:</span><input type="number" min="0" id="markersInput" value="'
        + self.markers + '" /></div>';
    popupHtml += '<div class="popup-line"><span class="popup-label">Param Name (Markers):</span><input type="text" id="markersParamNameInput" value="'
        + (self.markersParamName || '') + '" /></div>';
    $popup.html(popupHtml);

    var dialog = $popup.dialog({
        autoOpen: true,
        modal: true,
        resizable: false,
        height: 190,
        width: 292,
        buttons: {
            'Cancel': function () {
                dialog.dialog('close');
            },
            'Ok': function () {
                $(document).trigger('netEdited');
                var markersStr = $('#markersInput').val();
                if (!markersStr || Math.floor(markersStr) != markersStr || !$.isNumeric(markersStr) || parseInt(markersStr) < 0) {
                    alert('The number of markers must be a positive integer or zero.');
                    return;
                }
                var name = $('#nameInput').val();
                if (!name) {
                    alert('Place name cannot be empty.');
                    return;
                }
                var markers = parseInt(markersStr);
                var markersParamName = $('#markersParamNameInput').val();
                dialog.dialog("close");
                self.markers = markers;
                self.setMarkersParam(markersParamName);
                self.name = name;
                self.redraw();
            }
        },
        close: function () {
            dialog.dialog('destroy');
        }
    });
};

Place.prototype.drawMarkers = function ($elem) {
    var self = this;

    if (self.markers > self.markersPerLine * 3) {
        $('<div class="markers">' + self.markers + '</div>').appendTo($elem);
        return;
    }

    var linesOfMarkers = 0;

    for (var i = 0; i < self.markers; i++) {
        var $marker = $('<div>').addClass('marker');
        if (i % self.markersPerLine === 0) {
            linesOfMarkers++;
            var markersInThisLine = Math.min(self.markersPerLine, self.markers - i);
            var marginLeft = 23 - 4 * (markersInThisLine - 1);
            $marker.css({'margin-left': marginLeft + 'px'});
        }
        $marker.appendTo($elem);
    }

    var marginTop = 4 * (2 - linesOfMarkers);
    var markersInFirstLine = Math.min(self.markersPerLine, self.markers);
    $elem
        .find('.marker:nth-child(-n+' + (markersInFirstLine + 1) + ')')
        .css({'margin-top': marginTop + 'px'});
}

Place.prototype.redraw = function () {
    var self = this;

    var elemId = 'place' + self.id;

    var $elem = $('#' + elemId);

    $elem.find('div.marker').remove();
    $elem.find('div.markers').remove();

    $elem.find('.item-name').text(self.name);

    self.drawMarkers($elem);
};

Place.prototype.destroy = function () {
    var self = this;

    var elemId = 'place' + self.id;

    $('#' + elemId).remove();
}

Place.prototype.draw = function () {
    var self = this;

    var elemId = 'place' + self.id;
    if ($('#' + elemId).length) {
        return;
    }

    var $elem = $('<div>')
        .attr('id', elemId)
        .addClass('petri-place')
        .css({'top': self.top + 'px', 'left': self.left + 'px'});

    var $name = $('<div>')
        .addClass('item-name')
        .text(self.name)
        .appendTo($elem);

    $('.sandbox').append($elem);

    self.drawMarkers($elem);

    enableDragAndDrop(elemId, self);

    $('#' + elemId).on('dblclick', function () {
        self.openEditPopup();
    });
};
