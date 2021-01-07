import $ from 'jquery';

export class Arc {
    constructor(id, place, transition, fromPlace, channels, isInformationLink) {
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

    hasParameters () {
        return this.channelsIsParam || this.isInformationLinkIsParam;
    }

    getParameters () {
        const params = [];
        this.channelsIsParam && params.push(this.channelsParamName);
        this.isInformationLinkIsParam && params.push(this.isInformationLinkParamName);

        return params;
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

    setIsInformationLinkParam (paramName) {
        if (paramName) {
            this.isInformationLink = false;
            this.isInformationLinkIsParam = true;
            this.isInformationLinkParamName = paramName;
        } else {
            this.isInformationLinkIsParam = false;
            this.isInformationLinkParamName = null;
        }
    }

    setArrowPosition () {
        const self = this;

        const elemId = 'arc' + self.id;

        const fromLocation = document.getElementById(self.beginElementUiId).getBoundingClientRect();
        const toLocation = document.getElementById(self.endElementUiId).getBoundingClientRect();

        let fromLocationX = fromLocation.x;
        let fromLocationY = fromLocation.y;
        let toLocationX = toLocation.x;
        let toLocationY = toLocation.y;

        if (self.isOneOfTwo) {
            const yOffsetForTransition = self.isFirst ? 10 : -10;
            if (self.fromPlace) {
                toLocationY += yOffsetForTransition;
            } else {
                fromLocationY += yOffsetForTransition;
            }
        }

        const shift = 25;

        const $container = $('.page-svg');
        const topOffset = parseInt($container.css('top'));
        const leftOffset = parseInt($container.css('left'));

        const dAttrValue = "M" + (fromLocationX + shift - leftOffset) + "," + (fromLocationY + shift - topOffset) + " L"
            + (toLocationX + shift - leftOffset) + "," + (toLocationY + shift - topOffset);
        const arrowPath = $('#' + elemId).find('.arrow-path')[0];
        arrowPath.setAttribute("d", dAttrValue);

        const clickableArrowPath = $('#' + elemId).find('.arc-clickable-area')[0];
        clickableArrowPath.setAttribute("d", dAttrValue);

        const horizontalDistance = Math.abs(toLocationX - fromLocationX);
        const verticalDistance = Math.abs(toLocationY - fromLocationY);
        let horizontalPlaceShift = Math.sqrt(Math.pow(shift, 2) / (1 + Math.pow(verticalDistance, 2) / Math.pow(horizontalDistance, 2)));
        let verticalPlaceShift;

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

        const arcMiddleX = (fromLocationX + toLocationX) / 2 + shift - leftOffset;
        const arcMiddleY = (fromLocationY + toLocationY) / 2 + shift - topOffset;

        const $arcText = $('#' + elemId).find('.arc-note');
        if ($arcText.length) {
            const arcText = $arcText[0];
            arcText.setAttribute('x', arcMiddleX - 3);
            arcText.setAttribute('y', arcMiddleY - 8);
        }
    }

    redraw () {
        const self = this;

        const elemId = 'arc' + self.id;
        const arrowPath = $('#' + elemId).find('.arrow-path')[0];

        if (self.isInformationLink) {
            arrowPath.setAttribute('stroke-dasharray', '10,10');
        } else {
            arrowPath.removeAttribute('stroke-dasharray');
        }

        const arcNote = $('#' + elemId).find('.arc-note')[0];
        arcNote.textContent = self.channels > 1 ? self.channels : '';
        self.setArrowPosition();
    }

    destroy () {
        const self = this;
        const elemId = 'arc' + self.id;

        $('#' + elemId).remove();
    }

    draw () {
        const self = this;

        const elemId = 'arc' + self.id;
        if ($('#' + elemId).length) {
            return;
        }

        const arrowType = self.fromPlace ? 'fromPlace' : 'toPlace';
        const dashOrSolid = self.isInformationLink
            ? 'stroke-dasharray="10,10" '
            : '';

        let arcNotes = '<text class="arc-note" fill="black">';
        if (self.channels > 1) {
            arcNotes += self.channels;
        }
        arcNotes += '</text>';

        const arrowSvg = `
            <svg class="petri-arc" id="${elemId}">
                ${arcNotes}
                <path class="arc-clickable-area" d="" style="stroke:transparent; stroke-width: 18px; fill: none;" id="${elemId}ClickableArea"/>
                <path class="arrow-path" d="" ${dashOrSolid} style="stroke:black; stroke-width: 1.25px; fill: none; marker-end: url(#${arrowType}Arrow);" id="${elemId}ArrowPath"/>
            </svg>
        `;

        $('.page-svg').append(arrowSvg);
        self.setArrowPosition();

        $('#' + elemId).find('.arc-clickable-area, .arrow-path').on('dblclick', () => openArcEdit(self));
    }
}

window.Arc = Arc;
