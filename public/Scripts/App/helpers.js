var allowDragAndDrop = true;

function getDeepArrayCopy(initialArray) {
    var newArray = [];
    for (var i = 0; i < initialArray.length; i++) {
        newArray.push($.extend(true, { }, initialArray[i]));
    }
    return newArray;
}

function netParseCensor(key, value) {
    return value === 'Infinity' ? Infinity : value;
}

function escapeQuotes(str) {
    return str.replace(/'/g, '\"').replace(/"/g, '\"');
}

function normalizeString(str) {
    return str.replace(/[^A-Za-z0-9_]/g, '');
}

function moveItemToAnotherArray(item, fromArray, toArray) {
    var index = fromArray.indexOf(item);
    if (index > -1) {
        fromArray.splice(index, 1);
        toArray.push(item);
    }
}

function getTimeString(duration) {
    if (!duration) {
        return 'none';
    }
    var minutes = parseInt(duration / (1000 * 60));
    var rest = duration - (minutes * 1000 * 60);
    var seconds = parseInt(rest / 1000);
    var milliseconds = rest - (seconds * 1000);
    var timeString = '';
    if (minutes) {
        timeString += ', ' + minutes + ' min';
    }
    if (seconds) {
        timeString += ', ' + seconds + ' s';
    }
    if (milliseconds) {
        timeString += ', ' + milliseconds + ' ms';
    }
    return timeString.substr(2);
}

function gaussianRand() {
    var rand = 0;
    for (var i = 0; i < 6; i++) {
        rand += Math.random();
    }
    return rand / 6;
}

function getDistributionRandomValue(distribution, delay, deviation) {
    if (distribution === 'exp') {
        var a = 0;
        while (a === 0) {
            a = Math.random();
        }
        return -delay * Math.log(a);
    } else if (distribution === 'unif') {
        var timeMin = delay - deviation;
        var timeMax = delay + deviation;
        var a = 0;
        while (a === 0) {
            a = Math.random();
        }
        return timeMin + a * (timeMax - timeMin);
    } else if (distribution === 'norm') {
        return delay + deviation * gaussianRand();
    }
    return delay;
}

function getCoords(elem) {
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var top  = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return { top: Math.round(top), left: Math.round(left) };
}

function getPositionWithinSandbox(top, left, object) {
    const minX = 0;
    const maxX = $(window).width() - $('#stats-container').outerWidth() - 50;
    const minY = $('#navbar').outerHeight() + 16;
    const maxY = $(window).height() - 50 - (object.bottomNotesHeight || 0);

    return {
        posTop: Math.min(Math.max(minY, top), maxY),
        posLeft: Math.min(Math.max(minX, left), maxX),
    };
}

function enableDragAndDrop(elemId, object) {
    $('#' + elemId).each(function() {
        var self = this;

        self.onmousedown = function(e) {
            if (!allowDragAndDrop) {
                return;
            }

            var coords = getCoords(self);
            var shiftX = e.pageX - coords.left;
            var shiftY = e.pageY - coords.top;

            var moveAt = function(target, e) {
                var posTop = e.pageY - shiftY;
                var posLeft = e.pageX - shiftX;
                var correctPosition = getPositionWithinSandbox(posTop, posLeft, object);
                posTop = correctPosition.posTop;
                posLeft = correctPosition.posLeft;
                target.style.top = posTop + 'px';
                target.style.left = posLeft + 'px';
                if (object && object.move) {
                    object.move(posTop, posLeft);
                    if (object.arcs && object.arcs.length) {
                        var arcsCount = object.arcs.length;
                        for (var a = 0; a < arcsCount; a++) {
                            object.arcs[a].setArrowPosition();
                        }
                    }
                }
            };

            moveAt(self, e);
            self.style.zIndex = 100;
            if (object && object.topLayerItem) {
                self.style.zIndex = 110;
            }

            document.onmousemove = function(e) {
                moveAt(self, e);
            };

            self.onmouseup = function() {
                document.onmousemove = null;
                self.onmouseup = null;
            };
        }

        self.ondragstart = function() {
            return false;
        };
    });
}
