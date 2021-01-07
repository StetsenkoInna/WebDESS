import $ from 'jquery';

export class Draggable {
    move(top, left) {
        this.top = top;
        this.left = left;
    }
}

export function getDeepArrayCopy(initialArray) {
    const newArray = [];
    for (let i = 0; i < initialArray.length; i++) {
        newArray.push($.extend(true, {}, initialArray[i]));
    }
    return newArray;
}

export function netParseCensor(key, value) {
    return value === 'Infinity' ? Infinity : value;
}
window.netParseCensor = netParseCensor;

export function escapeQuotes(str) {
    return str.replace(/'/g, '\"').replace(/"/g, '\"');
}

export function normalizeString(str) {
    return str.replace(/[^A-Za-z0-9_]/g, '');
}

export function moveItemToAnotherArray(item, fromArray, toArray) {
    const index = fromArray.indexOf(item);
    if (index > -1) {
        fromArray.splice(index, 1);
        toArray.push(item);
    }
}

export function getTimeString(duration) {
    if (!duration) {
        return 'none';
    }

    const minutes = parseInt(duration / (1000 * 60));
    const rest = duration - (minutes * 1000 * 60);
    const seconds = parseInt(rest / 1000);
    const milliseconds = rest - (seconds * 1000);

    let timeString = '';
    if (minutes) {
        timeString += `, ${minutes} min`;
    }
    if (seconds) {
        timeString += `, ${seconds} s`;
    }
    if (milliseconds) {
        timeString += `, ${milliseconds} ms`;
    }
    return timeString.substr(2);
}

function gaussianRand() {
    let rand = 0;
    for (let i = 0; i < 6; i++) {
        rand += Math.random();
    }
    return rand / 6;
}

export function getDistributionRandomValue(distribution, delay, deviation) {
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

export function getCoords(elem) {
    const box = elem.getBoundingClientRect();

    const body = document.body;
    const docEl = document.documentElement;

    const scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    const scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    const clientTop = docEl.clientTop || body.clientTop || 0;
    const clientLeft = docEl.clientLeft || body.clientLeft || 0;

    const top  = box.top + scrollTop - clientTop;
    const left = box.left + scrollLeft - clientLeft;

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

window.allowDragAndDrop = true;
export function enableDragAndDrop(elemId, object) {
    $('#' + elemId).each(function() {
        const self = this;

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
