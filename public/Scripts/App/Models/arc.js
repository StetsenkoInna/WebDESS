function Arc(id, place, transition, fromPlace, channels, isInformationLink) {
    this.id = id;

    this.placeId = place.id;

    this.transitionId = transition.id;

    this.fromPlace = fromPlace;

    this.channels = channels;
    this.channelsIsParam = false;
    this.channelsParamName = null;

    this.isInformationLink = isInformationLink;
    this.isInformationLinkIsParam = false;
    this.isInformationLinkParamName = null;

    this.beginElementUiId = this.fromPlace
        ? 'place' + this.placeId
        : 'transition' + this.transitionId;
    this.endElementUiId = this.fromPlace
        ? 'transition' + this.transitionId
        : 'place' + this.placeId;

    place.arcs.push(this);
    transition.arcs.push(this);
}

Arc.prototype.hasParameters = function () {
    return this.channelsIsParam || this.isInformationLinkIsParam;
};

Arc.prototype.getParameters = function () {
    var params = [];
    if (this.channelsIsParam) {
        params.push(this.channelsParamName);
    }
    if (this.isInformationLinkIsParam) {
        params.push(this.isInformationLinkParamName);
    }
    return params;
};

Arc.prototype.setChannelsParam = function (paramName) {
    if (paramName) {
        this.channels = 1;
        this.channelsIsParam = true;
        this.channelsParamName = paramName;
    } else {
        this.channelsIsParam = false;
        this.channelsParamName = null;
    }
};

Arc.prototype.setIsInformationLinkParam = function (paramName) {
    if (paramName) {
        this.isInformationLink = false;
        this.isInformationLinkIsParam = true;
        this.isInformationLinkParamName = paramName;
    } else {
        this.isInformationLinkIsParam = false;
        this.isInformationLinkParamName = null;
    }
};

Arc.prototype.setArrowPosition = function () {
    var self = this;

    var elemId = 'arc' + self.id;

    var fromLocation = document.getElementById(self.beginElementUiId).getBoundingClientRect();
    var toLocation = document.getElementById(self.endElementUiId).getBoundingClientRect();
    var fromLocationX = fromLocation.x;
    var fromLocationY = fromLocation.y;
    var toLocationX = toLocation.x;
    var toLocationY = toLocation.y;

    if (self.isOneOfTwo) {
        var yOffsetForTransition = self.isFirst ? 10 : -10;
        if (self.fromPlace) {
            toLocationY += yOffsetForTransition;
        } else {
            fromLocationY += yOffsetForTransition;
        }
    }

    var shift = 25;

    var $container = $('.page-svg');
    var topOffset = parseInt($container.css('top'));
    var leftOffset = parseInt($container.css('left'));

    var dAttrValue = "M" + (fromLocationX + shift - leftOffset) + "," + (fromLocationY + shift - topOffset) + " L"
        + (toLocationX + shift - leftOffset) + "," + (toLocationY + shift - topOffset);
    var arrowPath = $('#' + elemId).find('.arrow-path')[0];
    arrowPath.setAttribute("d", dAttrValue);
    var clickableArrowPath = $('#' + elemId).find('.arc-clickable-area')[0];
    clickableArrowPath.setAttribute("d", dAttrValue);

    var horizontalDistance = Math.abs(toLocationX - fromLocationX);
    var verticalDistance = Math.abs(toLocationY - fromLocationY);
    var horizontalPlaceShift = Math.sqrt(Math.pow(shift, 2) / (1 + Math.pow(verticalDistance, 2) / Math.pow(horizontalDistance, 2)));
    var verticalPlaceShift;
    if (horizontalDistance !== 0) {
        verticalPlaceShift = verticalDistance * horizontalPlaceShift / horizontalDistance;
    } else {
        verticalPlaceShift = shift;
    }
    if ((toLocationX < fromLocationX && self.fromPlace) || (toLocationX > fromLocationX && !self.fromPlace)) {
        horizontalPlaceShift = -horizontalPlaceShift;
    }
    if ((toLocationY < fromLocationY && self.fromPlace) || (toLocationY > fromLocationY && !self.fromPlace)) {
        verticalPlaceShift = -verticalPlaceShift;
    }
    if (self.fromPlace) {
        fromLocationX += horizontalPlaceShift;
        fromLocationY += verticalPlaceShift;
    } else {
        toLocationX += horizontalPlaceShift;
        toLocationY += verticalPlaceShift;
    }

    var arcMiddleX = (fromLocationX + toLocationX) / 2 + shift - leftOffset;
    var arcMiddleY = (fromLocationY + toLocationY) / 2 + shift - topOffset;

    var $arcText = $('#' + elemId).find('.arc-note');
    if ($arcText.length) {
        var arcText = $arcText[0];
        arcText.setAttribute('x', arcMiddleX - 3);
        arcText.setAttribute('y', arcMiddleY - 8);
    }
};

Arc.prototype.redraw = function () {
    var self = this;

    var elemId = 'arc' + self.id;

    var arrowPath = $('#' + elemId).find('.arrow-path')[0];

    if (self.isInformationLink) {
        arrowPath.setAttribute('stroke-dasharray', '10,10');
    } else {
        arrowPath.removeAttribute('stroke-dasharray');
    }

    var arcNote = $('#' + elemId).find('.arc-note')[0];
    arcNote.textContent = self.channels > 1 ? self.channels : '';

    self.setArrowPosition();
};

Arc.prototype.destroy = function () {
    var self = this;

    var elemId = 'arc' + self.id;

    $('#' + elemId).remove();
}

Arc.prototype.draw = function () {
    var self = this;

    var elemId = 'arc' + self.id;
    if ($('#' + elemId).length) {
        return;
    }

    var arrowType = self.fromPlace ? 'fromPlace' : 'toPlace';
    var dashOrSolid = self.isInformationLink
        ? 'stroke-dasharray="10,10" '
        : '';
    var arcNotes = '<text class="arc-note" fill="black">';
    if (self.channels > 1) {
        arcNotes += self.channels;
    }
    arcNotes += '</text>';
    var arrowSvg = '<svg class="petri-arc" id="' + elemId + '">' + arcNotes + '<path class="arc-clickable-area" d="" style="stroke:transparent; '
        + 'stroke-width: 18px; fill: none;" id="' + elemId + 'ClickableArea"/><path class="arrow-path" d="" ' + dashOrSolid + 'style="stroke:black; '
        + 'stroke-width: 1.25px; fill: none; marker-end: url(#' + arrowType + 'Arrow);" id="' + elemId + 'ArrowPath"/></svg>';

    $('.page-svg').append(arrowSvg);

    self.setArrowPosition();

    $('#' + elemId).find('.arc-clickable-area, .arrow-path').on('dblclick', function () {
        $('#arc-edit').modal('show');
        openArcEdit(self);
    });
};
