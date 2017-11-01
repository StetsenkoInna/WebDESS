function getNewPetriNetId() {
	var maxNetId = 0;
	for (var key in localStorage) {
		if (key.substr(0, 3) === 'net') {
			var currNetId = parseInt(key.substr(3));
			if (currNetId > maxNetId) {
				maxNetId = currNetId;
			}
		}
	}
	return maxNetId + 1;
}

var newPlaceId = 1,
	newTransitionId = 1,
	newArcId = 1,
	newPetriNetId = getNewPetriNetId();
var distBtwnButtonsAndSandbox = 58;
var temporaryArrowExists = false;
var currentPetriNet = new PetriNet(null);
currentPetriNet.id = newPetriNetId;
var programmingDialog, animationSettingsDialog;
var needToStop;
var net;

function requestStop() {
	needToStop = true;
}

function cleanBuffers() {
	for (var k = 0; k < currentPetriNet.transitions.length; k++) {
		currentPetriNet.transitions[k].outputTimesBuffer = undefined;
	}
}

function reset() {
	newPetriNetId = getNewPetriNetId();
	newPlaceId = newTransitionId = newArcId = 1;
	temporaryArrowExists = false;
	currentPetriNet = new PetriNet(null);
	currentPetriNet.id = newPetriNetId;
	cleanBuffers();
	$('#netName').val('');
	$('.page-svg svg, .top-svg svg, .sandbox div').remove();
	$('.stats').html('');
}

function createMouseDownEvent(buttonLocation) {
	var mouseDownEvent = new $.Event('mousedown');
	mouseDownEvent.pageX = buttonLocation.left;
	mouseDownEvent.pageY = buttonLocation.top + distBtwnButtonsAndSandbox;
	return mouseDownEvent;
}

function newPlace() {
	cleanBuffers();
	var location = getCoords($('#addPlaceBtn')[0]);
	var newPlace = new Place(newPlaceId, 'P' + newPlaceId, 0, location.top + distBtwnButtonsAndSandbox, location.left);
	currentPetriNet.places.push(newPlace);
	newPlace.draw();
	$('#place' + newPlaceId).trigger(createMouseDownEvent(location));
	newPlaceId++;
}

function newTransition() {
	cleanBuffers();
	var location = getCoords($('#addTransitionBtn')[0]);
	var newTransition = new Transition(newTransitionId, 'T' + newTransitionId, 0, 0, null, 0, 1, 'Infinity', location.top + distBtwnButtonsAndSandbox, location.left);
	currentPetriNet.transitions.push(newTransition);
	newTransition.draw();
	$('#transition' + newTransitionId).trigger(createMouseDownEvent(location));
	newTransitionId++;
}

function drawTemporaryArrow(xPos, yPos) {
	var xShift = $('.nav-menu').outerWidth();
	var yShift = $('.controls-area').outerHeight();
	temporaryArrowExists = true;
	var arrowSvg = '<svg class="temp-arrow"><path class="arrow-path" d="" style="stroke:black; stroke-width: 1.25px; fill: none; '
		+ 'marker-end: url(#temporaryArrow);"/></svg>';
	$('.top-svg')
		.show()
		.append(arrowSvg);
	var arrowPath = $('.temp-arrow').find('.arrow-path')[0];
	arrowPath.setAttribute("d", "M" + (xPos - xShift) + "," + (yPos - yShift) + " L" + (xPos - xShift) + "," + (yPos - yShift));
}

function removeTemporaryArrow() {
	temporaryArrowExists = false;
	$('.temp-arrow').remove();
	$('.top-svg').hide();
}

function newArc() {
	allowDragAndDrop = false;
	$(document).one('mousedown', function(e) {
		var fromPlace = false;
		var beginElemId;
		var $elem = $(document.elementFromPoint(e.pageX, e.pageY));
		if ($elem.hasClass('petri-place') || $elem.hasClass('petri-transition')) {
			beginElemId = parseInt($elem.attr('id').match(/\d+/));
			if ($elem.hasClass('petri-place')) {
				fromPlace = true;
			}
			drawTemporaryArrow(e.pageX, e.pageY);
			$(document).one('mouseup', function(e) {
				removeTemporaryArrow();
				$elem = $(document.elementFromPoint(e.pageX, e.pageY));
				if (($elem.hasClass('petri-place') && !fromPlace)
					|| ($elem.hasClass('petri-transition') && fromPlace)) {
					var endElemId = parseInt($elem.attr('id').match(/\d+/));
					var placeId = fromPlace ? beginElemId : endElemId;
					var transitionId = fromPlace ? endElemId : beginElemId;
					var petriPlace = currentPetriNet.places.filter(function(item) { return item.id === placeId; })[0];
					var petriTransition = currentPetriNet.transitions.filter(function(item) { return item.id === transitionId; })[0];
					if (currentPetriNet.arcs.filter(function(item) {
						return item.placeId === placeId && item.transitionId === transitionId && item.fromPlace === fromPlace;
					}).length === 0) {
						cleanBuffers();
						var newArc = new Arc(newArcId, petriPlace, petriTransition, fromPlace, 1, false);
						var arcsBetweenSameElements = currentPetriNet.arcs.filter(function(item) {
							return item.placeId === placeId && item.transitionId === transitionId;
						});
						if (arcsBetweenSameElements.length > 0) {
							var anotherArc = arcsBetweenSameElements[0];
							anotherArc.isOneOfTwo = true;
							anotherArc.isFirst = true;
							newArc.isOneOfTwo = true;
							newArc.isFirst = false;
							anotherArc.redraw();
						}
						currentPetriNet.arcs.push(newArc);
						newArc.draw();
						newArcId++;
					}
				}
				allowDragAndDrop = true;
			});
		} else {
			allowDragAndDrop = true;
		}
	});
}

function redrawTemporaryArrowIfNecessary(e) {
	if (temporaryArrowExists) {
		var xShift = $('.nav-menu').outerWidth();
		var yShift = $('.controls-area').outerHeight();
		var arrowPath = $('.temp-arrow').find('.arrow-path')[0];
		var dAttrOldValue = arrowPath.getAttribute('d');
		var indexOfL = dAttrOldValue.indexOf('L');
		var dAttrNewValue = dAttrOldValue.substr(0, indexOfL + 1) + (e.pageX - xShift) + "," + (e.pageY - yShift);
		arrowPath.setAttribute('d', dAttrNewValue);
	}
}

function getNextElementId(elementsArray) {
	return Math.max.apply(null, elementsArray.map(function(element) { return element.id; })) + 1;
}

function openPetriNet() {
	var options = [];
	for (var key in localStorage) {
		if (key.substr(0, 3) === 'net') {
			options.push({
				netId: parseInt(key.substr(3)),
				netName: JSON.parse(localStorage.getItem(key), netParseCensor).name
			});
		}
	}
	if (options.length === 0) {
		alert('No saved Petri nets found.');
		return;
	}
	var $select = $('#openNetSelect');
	var newSelectHtml = '';
	$.each(options, function(o, option) {
		var displayText = option.netName + ' (id: ' + option.netId + ')';
		newSelectHtml += '<option value="' + option.netId + '">' + displayText + '</option>';
	});
	$select.html(newSelectHtml);
	var dialog = $('#openNetPopup').dialog({
		autoOpen: true,
		modal: true,
		resizable: false,
		height: 124,
		width: 292,
		buttons: {
			'Cancel': function() { dialog.dialog('close'); },
			'Ok': function() {
				cleanBuffers();
				var netId = parseInt($select.val());
				dialog.dialog( "close" );
				var jsonNet = localStorage.getItem('net' + netId);
				var openedNet = restorePetriNet(parsePetriNet(jsonNet));
				newPlaceId = getNextElementId(openedNet.places);
				newTransitionId = getNextElementId(openedNet.transitions);
				newArcId = getNextElementId(openedNet.arcs);
				temporaryArrowExists = false;
				currentPetriNet = openedNet;
				$('#netName').val(currentPetriNet.name);
				$('.page-svg svg, .top-svg svg, .sandbox div').remove();
				$('.stats').html('');
				currentPetriNet.draw();
			}
		},
		close: function() {
			dialog.dialog('destroy');
		}
	});
}

function deleteCurrentPetriNet() {
	var name = $('#netName').val();
	if (!name) {
		alert('Please specify a name first.');
		return;
	}
	var success = false;
	for (var key in localStorage) {
		if (key.substr(0, 3) === 'net' && JSON.parse(localStorage.getItem(key), netParseCensor).name === name) {
			localStorage.removeItem(key);
			success = true;
		}
	}
	if (success) {
		reset();
		alert('The net has been removed.');
	} else {
		alert('No net with this name found.');
	}
}

function saveCurrentPetriNet() {
	var netName = $('#netName').val();
	if (!netName) {
		alert('Please specify a name first.');
		return;
	}
	currentPetriNet.name = netName;
	var netValidationResult = currentPetriNet.validate();
	if (!netValidationResult.valid) {
		alert('Invalid Petri net: ' + netValidationResult.message);
		return;
	}
	cleanBuffers();
	var netCopy = $.extend(true, { }, currentPetriNet);
	netCopy.places = getDeepArrayCopy(currentPetriNet.places);
	$.each(netCopy.places, function(p, place) {
		place.arcs = undefined;
		place.markersPerLine = undefined;
		place.topLayerItem = undefined;
	});
	netCopy.transitions = getDeepArrayCopy(currentPetriNet.transitions);
	$.each(netCopy.transitions, function(t, transition) {
		transition.arcs = undefined;
		transition.bottomNotesHeight = undefined;
		transition.distributionOptions = undefined;
	});
	netCopy.arcs = getDeepArrayCopy(currentPetriNet.arcs);
	$.each(netCopy.arcs, function(a, arc) {
		arc.beginElementUiId = undefined;
		arc.endElementUiId = undefined;
	});
	var jsonNet = JSON.stringify(netCopy, function(key, value) { if (value === Infinity) { return 'Infinity'; } return value; });
	localStorage.setItem('net' + netCopy.id, jsonNet);
	alert('The net has been saved.');
}

function runNetModelSimulation() {
	var netValidationResult = currentPetriNet.validate();
	if (!netValidationResult.valid) {
		alert('Invalid Petri net: ' + netValidationResult.message);
		return;
	}
	if (currentPetriNet.hasParameters()) {
		alert('Petri Net has parameters. Please provide specific values for them first.');
		return;
	}
	var durationStr = $('#simulationDuration').val();
	if (!durationStr || Math.floor(durationStr) != durationStr || !$.isNumeric(durationStr) || parseInt(durationStr) < 1) {
		alert('Simulation duration must be a positive integer.');
		return;
	}
	var duration = parseInt(durationStr);
	var animDurStr = $('#animationDuration').val();
	if (!animDurStr || Math.floor(animDurStr) != animDurStr || !$.isNumeric(animDurStr) || parseInt(animDurStr) < 10) {
		alert('Animation duration must be a positive integer no less than 10.');
		return;
	}
	var animationDuration = parseInt(animDurStr);
	var cuDurStr = $('#cuDuration').val();
	if (!cuDurStr || Math.floor(cuDurStr) != cuDurStr || !$.isNumeric(cuDurStr) || parseInt(cuDurStr) < 10) {
		alert('C.u. duration must be a positive integer no less than 10.');
		return;
	}
	var cuDuration = parseInt(cuDurStr);
	var enableAnimation = $('#enableAnimationChbx').is(':checked');
	setTimeout(function() {
		runSimulationForNet(currentPetriNet, duration, animationDuration, cuDuration, enableAnimation);
	}, 0);
}

function deleteArc(id) {
	cleanBuffers();
	var theseArcs = currentPetriNet.arcs.filter(function(item) { return item.id === id; });
	if (theseArcs.length) {
		var arcToDelete = theseArcs[0];
		if (arcToDelete.isOneOfTwo) {
			var secondArcs = currentPetriNet.arcs.filter(function(item) {
				return item.placeId === arcToDelete.placeId && item.transitionId === arcToDelete.transitionId && item !== arcToDelete;
			});
			if (secondArcs.length) {
				var secondArc = secondArcs[0];
				secondArc.isOneOfTwo = false;
				secondArc.isFirst = null;
				secondArc.redraw();
			}
		}
		var places = currentPetriNet.places.filter(function(item) { return item.id === arcToDelete.placeId; });
		if (places) {
			var placeIndex = places[0].arcs.indexOf(arcToDelete);
			places[0].arcs.splice(placeIndex, 1);
		}
		var transitions = currentPetriNet.transitions.filter(function(item) { return item.id === arcToDelete.transitionId; });
		if (transitions) {
			var transitionIndex = transitions[0].arcs.indexOf(arcToDelete);
			transitions[0].arcs.splice(transitionIndex, 1);
		}
		arcToDelete.destroy();
		var index = currentPetriNet.arcs.indexOf(arcToDelete);
		currentPetriNet.arcs.splice(index, 1);
	}
}

function deleteTransition(id) {
	cleanBuffers();
	var theseTransitions = currentPetriNet.transitions.filter(function(item) { return item.id === id; });
	if (theseTransitions.length) {
		var transitionToDelete = theseTransitions[0];
		while (transitionToDelete.arcs.length) {
			var arcToDelete = transitionToDelete.arcs[0];
			deleteArc(arcToDelete.id);
		}
		transitionToDelete.destroy();
		var index = currentPetriNet.transitions.indexOf(transitionToDelete);
		currentPetriNet.transitions.splice(index, 1);
	}
}

function deletePlace(id) {
	cleanBuffers();
	var thesePlaces = currentPetriNet.places.filter(function(item) { return item.id === id; });
	if (thesePlaces.length) {
		var placeToDelete = thesePlaces[0];
		if (placeToDelete.arcs.length) {
			$.each(placeToDelete.arcs, function(a, arc) {
				deleteArc(arc.id);
			});
		}
		placeToDelete.destroy();
		var index = currentPetriNet.places.indexOf(placeToDelete);
		currentPetriNet.places.splice(index, 1);
	}
}

function convertToFunction() {
	var netValidationResult = currentPetriNet.validate();
	if (!netValidationResult.valid) {
		alert('Invalid Petri net: ' + netValidationResult.message);
		return;
	}
	var netName = currentPetriNet.name || 'New';
	var functionStr = 'function generate' + normalizeString(netName) + 'PetriNet() {\n\tvar net = new PetriNet(\'' + netName + '\');';
	for (var i = 0; i < currentPetriNet.places.length; i++) {
		var place = currentPetriNet.places[i];
		functionStr += '\n\tvar place' + place.id + ' = new Place(' + place.id + ', \'' + place.name + '\', ' + place.markers + ', ' + place.top + ', '
			+ place.left + ');';
		functionStr += '\n\tnet.places.push(place' + place.id + ');';
	}
	for (var i = 0; i < currentPetriNet.transitions.length; i++) {
		var transition = currentPetriNet.transitions[i];
		var distributionStr = transition.distribution
			? ('\'' + transition.distribution + '\'')
			: 'null';
		functionStr += '\n\tvar transition' + transition.id + ' = new Transition(' + transition.id + ', \'' + transition.name + '\', ' + transition.delay + ', '
			+ transition.deviation + ', ' + distributionStr + ', ' + transition.priority + ', ' + transition.probability + ', ' + transition.channels + ', '
			+ transition.top + ', ' + transition.left + ');';
		functionStr += '\n\tnet.transitions.push(transition' + transition.id + ');';
	}
	for (var i = 0; i < currentPetriNet.arcs.length; i++) {
		var arc = currentPetriNet.arcs[i];
		var fromPlaceStr = arc.fromPlace ? 'true' : 'false';
		var infLinkStr = arc.isInformationLink ? 'true' : 'false';
		functionStr += '\n\tvar arc' + arc.id + ' = new Arc(' + arc.id + ', place' + arc.placeId + ', transition' + arc.transitionId + ', ' + fromPlaceStr +
			', ' + arc.channels + ', ' + infLinkStr + ');';
		functionStr += '\n\tnet.arcs.push(arc' + arc.id + ');';
	}
	functionStr += '\n\treturn net;';
	functionStr += '\n}';
	$('#functionText').val(functionStr);
	$('#functionInvocation').val('');
}

function generateFromFunction() {
	var newFunction;
	var newNet;
	try {
		var functionText = $('#functionText').val();
		if (!functionText) {
			alert('Error: no function definition provided.');
			return;
		}
		var functionName = parseFunctionNameFromDefinition(functionText);
		var paramsString = parseParamsString(functionText);
		var paramsCount = (paramsString.match(/,/g) || []).length + 1;
		if (paramsCount === 1 && !paramsString) {	
			paramsCount = 0;
		}
		var functionBody = parseFunctionBody(functionText);
		var functionInvocation = $('#functionInvocation').val();
		if (!functionInvocation) {
			alert('Error: no function invocation provided.');
			return;
		}
		var args = parseArgumentsArray(functionInvocation);
		if (args.length !== paramsCount) {
			alert('Error: incorrect number of arguments supplied.');
			return;
		}
		var secondFunctionName = parseFunctionNameFromInvocation(functionInvocation);
		if (secondFunctionName !== functionName) {
			alert('Error: different function names in the definition and invocation.');
			return;
		}
		newFunction = new Function(paramsString, functionBody);
	} catch (e) {
		alert('Function parsing error.');
		return;
	}
	try {
		newNet = newFunction.apply(this, args);
	} catch (e) {
		alert('Function execution error.');
		return;
	}
	if (!newNet || !newNet.getClass || newNet.getClass() !== 'PetriNet') {
		alert('Error: invalid object returned from the function.');
		return;
	}
	cleanBuffers();
	newPetriNetId = getNewPetriNetId();
	newNet.id = newPetriNetId;
	newPlaceId = getNextElementId(newNet.places);
	newTransitionId = getNextElementId(newNet.transitions);
	newArcId = getNextElementId(newNet.arcs);
	temporaryArrowExists = false;
	currentPetriNet = newNet;
	$('#netName').val(currentPetriNet.name);
	$('.page-svg svg, .top-svg svg, .sandbox div').remove();
	$('.stats').html('');
	currentPetriNet.draw();
	programmingDialog.dialog('close');
}

function clearProgrammingPopup() {
	$('#functionText, #functionInvocation').val('');
}

function openProgrammingPopup() {
	clearProgrammingPopup();
	programmingDialog.dialog('open');
}

function openModelDesigner() {
	var currentLocation = location.href;
	var newLocation = currentLocation.replace('NetDesigner.html', 'ModelDesigner.html');
	location.href = newLocation;
}

function openAnimationSettings() {
	animationSettingsDialog.dialog('open');
}

$(document).ready(function() {
	programmingDialog = $('#programmingPopup').dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		height: 560,
		width: 560,
		buttons: {
			'Convert to Function': convertToFunction,
			'Generate from Function': generateFromFunction,
			'Clear': clearProgrammingPopup
		}
	});
	
	animationSettingsDialog = $('#animationSettingsPopup').dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		width: 296,
		height: 112
	});
	
	allowDragAndDrop = true;
	
	$(document).on('mousemove', redrawTemporaryArrowIfNecessary);
	
	$('#addPlaceBtn').on('click', newPlace);
	
	$('#addTransitionBtn').on('click', newTransition);
	
	$('#addArcBtn').on('click', newArc);
	
	$('#resetBtn').on('click', reset);
	
	$('#delBtn').on('click', deleteCurrentPetriNet);
	
	$('#saveNetBtn').on('click', saveCurrentPetriNet);
	
	$('#openNetBtn').on('click', openPetriNet);
	
	$('#programmingBtn').on('click', openProgrammingPopup);
	
	$('#runBtn').on('click', runNetModelSimulation);
	
	$('#stopBtn').on('click', requestStop);
	
	$('#animationSettingsBtn').on('click', openAnimationSettings);
	
	$('#modelDesignerMenuItem').on('click', openModelDesigner);
	
	var $focusedElement;
	$(document).on('netEdited', cleanBuffers);
	$(document).on('click', function(e) {
		$focusedElement = $(e.target);
	});
	$(document).on('keyup', function(e) {
		if (e.keyCode === 46 && $focusedElement && $('#' + $focusedElement.attr('id')).length) {
			if ($focusedElement.hasClass('petri-place')) {
				var placeId = parseInt($focusedElement.attr('id').substr(5));
				deletePlace(placeId);
			} else if ($focusedElement.hasClass('petri-transition')) {
				var transitionId = parseInt($focusedElement.attr('id').substr(10));
				deleteTransition(transitionId);
			} else if ($focusedElement.hasClass('arc-clickable-area') || $focusedElement.hasClass('arrow-path')) {
				$focusedElement = $focusedElement.parent();
				var arcId = parseInt($focusedElement.attr('id').substr(3));
				deleteArc(arcId);
			}
		}
	});
});