function getNewPetriObjectModelId() {
    var maxModelId = 0;
    for (var key in localStorage) {
        if (key.substr(0, 5) === 'model') {
            var currModelId = parseInt(key.substr(5));
            if (currModelId > maxModelId) {
                maxModelId = currModelId;
            }
        }
    }
    return maxModelId + 1;
}

var newObjectId = 1,
    newArcId = 1,
    newPetriObjectModelId = getNewPetriObjectModelId();
var distBtwnButtonsAndSandbox = 58;
var temporaryArrowExists = false;
var temporaryArrowFixed = false;
var currentModel = new PetriObjectModel(null);
currentModel.id = newPetriObjectModelId;
var programmingDialog;
var net;

function reset() {
    newPetriObjectModelId = getNewPetriObjectModelId();
    newObjectId = newArcId = 1;
    temporaryArrowExists = false;
    temporaryArrowFixed = false;
    currentModel = new PetriObjectModel(null);
    currentModel.id = newPetriObjectModelId;
    net = null;
    $('#modelName').val('');
    $('.page-svg svg, .top-svg svg, .sandbox div').remove();
    $('.stats').html('');
}

function createMouseDownEvent(buttonLocation) {
    var mouseDownEvent = new $.Event('mousedown');
    mouseDownEvent.pageX = buttonLocation.left;
    mouseDownEvent.pageY = buttonLocation.top + distBtwnButtonsAndSandbox;
    return mouseDownEvent;
}

function getNetOptions() {
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
    return netOptions;
}

function newObject() {
    var netOptions = getNetOptions();
    if (netOptions.length === 0) {
        alert('No saved Petri nets found. Please create them first.');
        return;
    }
    net = null;
    var location = getCoords($('#addObjectBtn')[0]);
    var existingNet = restorePetriNet(parsePetriNet(netOptions[0].net));
    var newObject = new PetriObject(newObjectId, 'O' + newObjectId, 'new class', existingNet, location.top + distBtwnButtonsAndSandbox, location.left);
    currentModel.objects.push(newObject);
    newObject.draw();
    $('#object' + newObjectId).trigger(createMouseDownEvent(location));
    newObjectId++;
}

function drawTemporaryArrow(xPos, yPos) {
    var xShift = $('.nav-menu').outerWidth();
    var yShift = $('.controls-area').outerHeight();
    temporaryArrowExists = true;
    temporaryArrowFixed = false;
    var arrowSvg = '<svg class="temp-arrow"><path class="arrow-path" d="" style="stroke:black; stroke-width: 1.25px; fill: none;"/></svg>';
    $('.page-svg').append(arrowSvg);
    var arrowPath = $('.temp-arrow').find('.arrow-path')[0];
    arrowPath.setAttribute("d", "M" + (xPos - xShift) + "," + (yPos - yShift) + " L" + (xPos - xShift) + "," + (yPos - yShift));
}

function removeTemporaryArrow() {
    temporaryArrowExists = false;
    temporaryArrowFixed = false;
    $('.temp-arrow').remove();
}

function openArcDialog(firstObject, secondObject) {
    $('#firstNetName').text(firstObject.net.name);
    $('#secondNetName').text(secondObject.net.name);
    $('#placeFirstNet, #placeSecondNet').html('');
    for (var i = 0; i < firstObject.net.places.length; i++) {
        var place = firstObject.net.places[i];
        $('#placeFirstNet').append('<option value="' + place.id + '">' + place.name + '</option>');
    }
    for (var i = 0; i < secondObject.net.places.length; i++) {
        var place = secondObject.net.places[i];
        $('#placeSecondNet').append('<option value="' + place.id + '">' + place.name + '</option>');
    }

    var dialog = $('#defineArcPopup').dialog({
        autoOpen: true,
        modal: true,
        resizable: false,
        width: 292,
        buttons: {
            'Cancel': function () {
                removeTemporaryArrow();
                dialog.dialog('close');
            },
            'Ok': function () {
                removeTemporaryArrow();
                var firstObjectPlaceId = parseInt($('#placeFirstNet').val());
                var secondObjectPlaceId = parseInt($('#placeSecondNet').val());
                dialog.dialog("close");
                net = null;
                var newArc = new PetriObjectArc(newArcId, firstObject, secondObject, firstObjectPlaceId, secondObjectPlaceId);
                currentModel.arcs.push(newArc);
                newArc.draw();
                newArcId++;
            }
        },
        close: function () {
            dialog.dialog('destroy');
        }
    });
}

function newArc() {
    allowDragAndDrop = false;
    $(document).one('mousedown', function (e) {
        var beginElemId;
        var $elem = $(document.elementFromPoint(e.pageX, e.pageY));
        if ($elem.hasClass('petri-object')) {
            beginElemId = parseInt($elem.attr('id').match(/\d+/));
            drawTemporaryArrow(e.pageX, e.pageY);
            $(document).one('mouseup', function (e) {
                $elem = $(document.elementFromPoint(e.pageX, e.pageY));
                if ($elem.hasClass('petri-object')) {
                    var endElemId = parseInt($elem.attr('id').match(/\d+/));
                    var firstObjectId = beginElemId;
                    var secondObjectId = endElemId;
                    if (beginElemId === endElemId) {
                        removeTemporaryArrow();
                        allowDragAndDrop = true;
                        return;
                    }
                    var firstObject = currentModel.objects.filter(function (item) {
                        return item.id === firstObjectId;
                    })[0];
                    var secondObject = currentModel.objects.filter(function (item) {
                        return item.id === secondObjectId;
                    })[0];
                    if (currentModel.arcs.filter(function (item) {
                        return (item.firstObjectId === firstObjectId && item.secondObjectId === secondObjectId)
                            || (item.firstObjectId === secondObjectId && item.secondObjectId === firstObjectId);
                    }).length === 0) {
                        temporaryArrowFixed = true;
                        openArcDialog(firstObject, secondObject);
                    } else {
                        removeTemporaryArrow();
                    }
                } else {
                    removeTemporaryArrow();
                }
                allowDragAndDrop = true;
            });
        } else {
            allowDragAndDrop = true;
        }
    });
}

function redrawTemporaryArrowIfNecessary(e) {
    if (temporaryArrowExists && !temporaryArrowFixed) {
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
    return Math.max.apply(null, elementsArray.map(function (element) {
        return element.id;
    })) + 1;
}

function restoreModel(jsonModel) {
    var restoringOk = true;
    var netOptions = getNetOptions();
    var simpleModelObject = JSON.parse(jsonModel);
    var model = new PetriObjectModel(simpleModelObject.name);
    model.id = simpleModelObject.id;
    $.extend(model, simpleModelObject);
    var allObjs = {};
    for (var i = 0; i < model.objects.length; i++) {
        var object = model.objects[i];
        var petriNets = netOptions.filter(function (item) {
            return item.netId === object.netId;
        });
        if (!petriNets.length) {
            restoringOk = false;
            break;
        }
        var objectNet = restorePetriNet(parsePetriNet(petriNets[0].net));
        var petriObject = new PetriObject(object.id, object.name, object.className, objectNet, object.top, object.left);
        petriObject.netId = object.netId;
        $.extend(petriObject, object);
        model.objects[i] = $.extend(object, petriObject);
        allObjs[object.id] = object;
    }
    if (!restoringOk) {
        return false;
    }
    for (var i = 0; i < model.arcs.length; i++) {
        var arc = model.arcs[i];
        var petriObjectArc = new PetriObjectArc(arc.id, allObjs[arc.firstObjectId], allObjs[arc.secondObjectId], arc.firstObjectPlaceId, arc.secondObjectPlaceId);
        $.extend(petriObjectArc, arc);
        model.arcs[i] = $.extend(arc, petriObjectArc);
    }
    $.each(model.objects, function (p, object) {
        object.arcs = model.arcs.filter(function (arcElem) {
            return arcElem.firstObjectId === object.id || arcElem.secondObjectId === object.id;
        }).slice();
    });
    return model;
}

function openModel() {
    var options = [];
    for (var key in localStorage) {
        if (key.substr(0, 5) === 'model') {
            options.push({
                modelId: parseInt(key.substr(5)),
                modelName: JSON.parse(localStorage.getItem(key)).name
            });
        }
    }
    if (options.length === 0) {
        alert('No saved Petri object models found.');
        return;
    }
    var $select = $('#openModelSelect');
    var newSelectHtml = '';
    $.each(options, function (o, option) {
        newSelectHtml += '<option value="' + option.modelId + '">' + option.modelName + '</option>';
    });
    $select.html(newSelectHtml);
    var dialog = $('#openModelPopup').dialog({
        autoOpen: true,
        modal: true,
        resizable: false,
        height: 124,
        width: 292,
        buttons: {
            'Cancel': function () {
                dialog.dialog('close');
            },
            'Ok': function () {
                var modelId = parseInt($select.val());
                dialog.dialog("close");
                var jsonModel = localStorage.getItem('model' + modelId);
                var openedModel = restoreModel(jsonModel);
                if (!openedModel) {
                    alert('Model restoring error. This can be caused by deleting a Petri net used in the model.');
                    return;
                }
                newObjectId = getNextElementId(openedModel.objects);
                newArcId = getNextElementId(openedModel.arcs);
                temporaryArrowExists = false;
                temporaryArrowFixed = false;
                currentModel = openedModel;
                net = null;
                $('#modelName').val(currentModel.name);
                $('.page-svg svg, .top-svg svg, .sandbox div').remove();
                $('.stats').html('');
                currentModel.draw();
            }
        },
        close: function () {
            dialog.dialog('destroy');
        }
    });
}

function deleteCurrentModel() {
    var name = $('#modelName').val();
    if (!name) {
        alert('Please specify a name first.');
        return;
    }
    var success = false;
    for (var key in localStorage) {
        if (key.substr(0, 5) === 'model' && JSON.parse(localStorage.getItem(key)).name === name) {
            localStorage.removeItem(key);
            success = true;
        }
    }
    if (success) {
        reset();
        alert('The model has been removed.');
    } else {
        alert('No model with this name found.');
    }
}

function saveCurrentModel() {
    var modelName = $('#modelName').val();
    if (!modelName) {
        alert('Please specify a name first.');
        return;
    }
    currentModel.name = modelName;
    var modelValidationResult = currentModel.validate();
    if (!modelValidationResult.valid) {
        alert('Invalid Petri objects model: ' + modelValidationResult.message);
        return;
    }
    net = null;
    var modelCopy = $.extend(true, {}, currentModel);
    modelCopy.objects = getDeepArrayCopy(currentModel.objects);
    $.each(modelCopy.objects, function (o, object) {
        object.arcs = undefined;
        object.net = undefined;
    });
    modelCopy.arcs = getDeepArrayCopy(currentModel.arcs);
    var jsonModel = JSON.stringify(modelCopy);
    localStorage.setItem('model' + modelCopy.id, jsonModel);
    alert('The model has been saved.');
}

function runModelSimulation() {
    var validationResult = currentModel.validate();
    if (!validationResult.valid) {
        alert('Invalid Petri objects model: ' + validationResult.message);
        return;
    }
    if (currentModel.hasParameters()) {
        alert('Petri objects model has parameters. Please provide specific values for them first.');
        return;
    }
    var durationStr = $('#simulationDuration').val();
    if (!durationStr || Math.floor(durationStr) != durationStr || !$.isNumeric(durationStr) || parseInt(durationStr) < 1) {
        alert('Simulation duration must be a positive integer.');
        return;
    }
    var duration = parseInt(durationStr);
    setTimeout(function () {
        runSimulationForModel(currentModel, duration);
    }, 0);
}

function deleteArc(id) {
    net = null;
    var theseArcs = currentModel.arcs.filter(function (item) {
        return item.id === id;
    });
    if (theseArcs.length) {
        var arcToDelete = theseArcs[0];
        var objects = currentModel.objects.filter(function (item) {
            return item.id === arcToDelete.firstObjectId || item.id === arcToDelete.secondObjectId;
        });
        if (objects) {
            for (var j = 0; j < objects.length; j++) {
                var objectArcIndex = objects[j].arcs.indexOf(arcToDelete);
                objects[j].arcs.splice(objectArcIndex, 1);
            }
        }
        arcToDelete.destroy();
        var index = currentModel.arcs.indexOf(arcToDelete);
        currentModel.arcs.splice(index, 1);
    }
}

function deleteObject(id) {
    net = null;
    var theseObjects = currentModel.objects.filter(function (item) {
        return item.id === id;
    });
    if (theseObjects.length) {
        var objectToDelete = theseObjects[0];
        if (objectToDelete.arcs.length) {
            $.each(objectToDelete.arcs, function (a, arc) {
                deleteArc(arc.id);
            });
        }
        objectToDelete.destroy();
        var index = currentModel.objects.indexOf(objectToDelete);
        currentModel.objects.splice(index, 1);
    }
}

function getNetById(netId) {
    var netOptions = getNetOptions();
    return restorePetriNet(parsePetriNet(netOptions.filter(function (item) {
        return item.netId === netId;
    })[0].net));
}

function convertToFunction() {
    var validationResult = currentModel.validate();
    if (!validationResult.valid) {
        alert('Invalid Petri objects model: ' + validationResult.message);
        return;
    }
    var modelName = currentModel.name || 'New';
    var functionStr = 'function generate' + normalizeString(modelName) + 'PetriObjectModel() {\n\tvar model = new PetriObjectModel(\'' + modelName + '\');';
    for (var i = 0; i < currentModel.objects.length; i++) {
        var object = currentModel.objects[i];
        var netId = object.netId;
        functionStr += '\n\tvar net' + object.id + ' = getNetById(' + netId + ');';
        functionStr += '\n\tvar object' + object.id + ' = new PetriObject(' + object.id + ', \'' + object.name + '\', \'' + object.className + '\', net'
            + object.id + ', ' + object.top + ', ' + object.left + ');';
        functionStr += '\n\tmodel.objects.push(object' + object.id + ');';
    }
    for (var i = 0; i < currentModel.arcs.length; i++) {
        var arc = currentModel.arcs[i];
        functionStr += '\n\tvar arc' + arc.id + ' = new PetriObjectArc(' + arc.id + ', object' + arc.firstObjectId + ', object' + arc.secondObjectId + ', '
            + arc.firstObjectPlaceId + ', ' + arc.secondObjectPlaceId + ');';
        functionStr += '\n\tmodel.arcs.push(arc' + arc.id + ');';
    }
    functionStr += '\n\treturn model;';
    functionStr += '\n}';
    $('#functionText').val(functionStr);
    $('#functionInvocation').val('');
}

function generateFromFunction() {
    var newFunction;
    var newModel;
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
        newModel = newFunction.apply(this, args);
    } catch (e) {
        alert('Function execution error.');
        return;
    }
    if (!newModel || !newModel.getClass || newModel.getClass() !== 'PetriObjectModel') {
        alert('Error: invalid object returned from the function.');
        return;
    }
    net = null;
    newPetriObjectModelId = getNewPetriObjectModelId();
    newModel.id = newPetriObjectModelId;
    newObjectId = getNextElementId(newModel.objects);
    newArcId = getNextElementId(newModel.arcs);
    temporaryArrowExists = false;
    temporaryArrowFixed = false;
    currentModel = newModel;
    $('#modelName').val(currentModel.name);
    $('.page-svg svg, .top-svg svg, .sandbox div').remove();
    $('.stats').html('');
    currentModel.draw();
    programmingDialog.dialog('close');
}

function clearProgrammingPopup() {
    $('#functionText, #functionInvocation').val('');
}

function openProgrammingPopup() {
    clearProgrammingPopup();
    programmingDialog.dialog('open');
}

function openNetDesigner() {
    var currentLocation = location.href;
    var newLocation = currentLocation.replace('ModelDesigner.html', 'NetDesigner.html');
    location.href = newLocation;
}

function addMoreSimilarObjects(objectId, number) {
    net = null;
    var initialObject = currentModel.objects.filter(function (item) {
        return item.id === objectId;
    })[0];
    var top = $('.controls-area').outerHeight();
    var left = $('.nav-menu').outerWidth();
    for (var i = 0; i < number; i++) {
        var newObject = new PetriObject(newObjectId, 'O' + newObjectId, initialObject.className, initialObject.net, top, left);
        currentModel.objects.push(newObject);
        newObject.draw();
        newObjectId++;
        left += 25;
    }
}

function editArcsForObject(objectId) {
    var $popup = $('#editArcsPopup');
    var object = currentModel.objects.filter(function (item) {
        return item.id === objectId;
    })[0];
    var arcs = object.arcs;
    for (var j = 0; j < arcs.length; j++) {
        var arc = arcs[j];
        var newHtml = '';
        if (arc.firstObjectId === objectId) {
            var secondObject = currentModel.objects.filter(function (item) {
                return item.id === arc.secondObjectId;
            })[0];
            newHtml += '<div class="popup-line"><span class="popup-label">Place (net: ' + object.net.name + '):</span><select data-number="first" '
                + 'data-arc-id="' + arc.id + '" class="place-for-net">';
            for (var i = 0; i < object.net.places.length; i++) {
                var place = object.net.places[i];
                newHtml += '<option value="' + place.id + '">' + place.name + '</option>';
            }
            var selectedValueForSecondLine = '';
            for (var i = 0; i < secondObject.net.places.length; i++) {
                var place = secondObject.net.places[i];
                if (place.id === arc.secondObjectPlaceId) {
                    selectedValueForSecondLine = place.name;
                    break;
                }
            }
            newHtml += '</select></div><div class="popup-line last-in-group"><span class="popup-label">Place (net: ' + secondObject.net.name + '):</span>'
                + '<span class="ready-value">' + selectedValueForSecondLine + '</span></div>';
        } else {
            var firstObject = currentModel.objects.filter(function (item) {
                return item.id === arc.firstObjectId;
            })[0];
            var selectedValueForFirstLine = '';
            for (var i = 0; i < firstObject.net.places.length; i++) {
                var place = firstObject.net.places[i];
                if (place.id === arc.firstObjectPlaceId) {
                    selectedValueForFirstLine = place.name;
                    break;
                }
            }
            newHtml += '<div class="popup-line"><span class="popup-label">Place (net: ' + firstObject.net.name + '):</span><span class="ready-value">'
                + selectedValueForFirstLine + '</span></div>';
            newHtml += '<div class="popup-line last-in-group"><span class="popup-label">Place (net: ' + object.net.name
                + '):</span><select data-number="second" data-arc-id="' + arc.id + '" class="place-for-net">';
            for (var i = 0; i < object.net.places.length; i++) {
                var place = object.net.places[i];
                newHtml += '<option value="' + place.id + '">' + place.name + '</option>';
            }
            newHtml += '</select></div>';
        }
        $popup.append(newHtml);
    }

    var editArcsDialog = $popup.dialog({
        autoOpen: true,
        modal: true,
        resizable: false,
        width: 292,
        open: function () {
            $(".ui-dialog-titlebar-close").hide();
        },
        close: function () {
            editArcsDialog.dialog('destroy');
        },
        buttons: {
            'Ok': function () {
                $('.place-for-net').each(function () {
                    var arcId = parseInt($(this).data('arc-id'));
                    var placeId = parseInt($(this).val());
                    var number = $(this).data('number');
                    var arc = currentModel.arcs.filter(function (item) {
                        return item.id === arcId;
                    })[0];
                    arc[number + 'ObjectPlaceId'] = placeId;
                });
                editArcsDialog.dialog('close');
            }
        }
    });
}

$(document).ready(function () {
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

    allowDragAndDrop = true;

    $(document).on('mousemove', redrawTemporaryArrowIfNecessary);

    $('#addObjectBtn').on('click', newObject);

    $('#addArcBtn').on('click', newArc);

    $('#resetBtn').on('click', reset);

    $('#delBtn').on('click', deleteCurrentModel);

    $('#saveModelBtn').on('click', saveCurrentModel);

    $('#openModelBtn').on('click', openModel);

    $('#programmingBtn').on('click', openProgrammingPopup);

    $('#runBtn').on('click', runModelSimulation);

    $('#netDesignerMenuItem').on('click', openNetDesigner);

    var $focusedElement;
    $(document).on('modelEdited', function () {
        net = null;
    });
    $(document).on('click', function (e) {
        $focusedElement = $(e.target);
    });
    $(document).on('keyup', function (e) {
        if (e.keyCode === 46 && $focusedElement && $('#' + $focusedElement.attr('id')).length) {
            if ($focusedElement.hasClass('petri-object')) {
                var objectId = parseInt($focusedElement.attr('id').substr(6));
                deleteObject(objectId);
            } else if ($focusedElement.hasClass('arc-clickable-area') || $focusedElement.hasClass('arrow-path')) {
                $focusedElement = $focusedElement.parent();
                var arcId = parseInt($focusedElement.attr('id').substr(10));
                deleteArc(arcId);
            }
        }
    });
    $(document).on('click', '.edit-object-arcs', function () {
        var objectId = $(this).data('id');
        $(this).remove();
        editArcsForObject(objectId);
    });
    $(document).on('contextmenu', function (e) {
        var $target = $(e.target);
        if ($target.hasClass('petri-object')) {
            e.preventDefault();
            var objectId = parseInt($target.attr('id').substr(6));
            var addMoreObjectsDialog = $('#addMoreObjectsPopup').dialog({
                autoOpen: true,
                modal: true,
                resizable: false,
                height: 124,
                width: 292,
                open: function () {
                    $('#numOfNewObjects').val('');
                },
                buttons: {
                    'Cancel': function () {
                        addMoreObjectsDialog.dialog('close');
                    },
                    'Ok': function () {
                        var numStr = $('#numOfNewObjects').val();
                        if (!numStr || Math.floor(numStr) != numStr || !$.isNumeric(numStr) || parseInt(numStr) < 1) {
                            alert('Number of Objects must be a positive integer.');
                            return;
                        }
                        var number = parseInt(numStr);
                        addMoreObjectsDialog.dialog('close');
                        addMoreSimilarObjects(objectId, number);
                    }
                },
                close: function () {
                    addMoreObjectsDialog.dialog('destroy');
                }
            });
        }
    });
});
