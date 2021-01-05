import Draggable from './draggable';

export class Place extends Draggable {
    constructor(...args) {
        super(...args);
        const [id, name, markers, top, left] = args;

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

    hasParameters () {
        return this.markersIsParam;
    }

    getParameters () {
        return this.markersIsParam ? [this.markersParamName] : [];
    }

    setMarkersParam (paramName) {
        if (paramName) {
            this.markers = 0;
            this.markersIsParam = true;
            this.markersParamName = paramName;
        } else {
            this.markersIsParam = false;
            this.markersParamName = null;
        }
    }

    drawMarkers ($elem) {
        $(`<div class="markers">${this.markers > 0 ? this.markers : ''}</div>`).appendTo($elem);
    }

    redraw () {
        const self = this;
        const elemId = 'place' + self.id;
        const $elem = $('#' + elemId);

        $elem.find('div.marker').remove();
        $elem.find('div.markers').remove();

        $elem.find('.item-name').text(self.name);

        self.drawMarkers($elem);
    }

    destroy () {
        const self = this;
        const elemId = 'place' + self.id;

        $('#' + elemId).remove();
    }

    draw () {
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
    }
}

window.Place = Place;
