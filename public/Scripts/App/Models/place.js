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

Place.prototype.drawMarkers = function ($elem) {
    $(`<div class="markers">${this.markers > 0 ? this.markers : ''}</div>`).appendTo($elem);
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
        $('#place-edit').modal('show');
        openPlaceEdit(self);
    });
};
