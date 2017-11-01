function PetriObjectArc(id, firstObject, secondObject, firstObjectPlaceId, secondObjectPlaceId) {
	this.id = id;
	
	this.firstObjectId = firstObject.id;
	
	this.secondObjectId = secondObject.id;
	
	this.firstObjectPlaceId = firstObjectPlaceId;
	
	this.secondObjectPlaceId = secondObjectPlaceId;
	
	firstObject.arcs.push(this);
	secondObject.arcs.push(this);
}

PetriObjectArc.prototype.setArrowPosition = function() {
	var self = this;
	
	var elemId = 'object-arc' + self.id;
	
	var fromLocation = document.getElementById('object' + self.firstObjectId).getBoundingClientRect();
	var toLocation = document.getElementById('object' + self.secondObjectId).getBoundingClientRect();
	var fromLocationX = fromLocation.x;
	var fromLocationY = fromLocation.y;
	var toLocationX = toLocation.x;
	var toLocationY = toLocation.y;
	
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
};

PetriObjectArc.prototype.redraw = function() {
	var self = this;
	
	self.setArrowPosition();
};

PetriObjectArc.prototype.destroy = function() {
	var self = this;
	
	var elemId = 'object-arc' + self.id;
	
	$('#' + elemId).remove();
}

PetriObjectArc.prototype.draw = function() {
	var self = this;
	
	var elemId = 'object-arc' + self.id;
	if ($('#' + elemId).length) {
		return;
	}
	
	var arrowSvg = '<svg class="petri-object-arc" id="' + elemId + '"><path class="arc-clickable-area" d="" style="stroke: transparent; stroke-width: 18px;'
		+ ' fill: none;" id="' + elemId + 'ClickableArea"/><path class="arrow-path" style="stroke:black; stroke-width: 1.25px; fill: none;" id="'
		+ elemId + 'ArrowPath"/></svg>';
	
	$('.page-svg').append(arrowSvg);
	
	self.setArrowPosition();
};