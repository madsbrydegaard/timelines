var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// node_modules/hammerjs/hammer.js
var require_hammer = __commonJS({
  "node_modules/hammerjs/hammer.js"(exports, module) {
    (function(window2, document2, exportName, undefined2) {
      "use strict";
      var VENDOR_PREFIXES = ["", "webkit", "Moz", "MS", "ms", "o"];
      var TEST_ELEMENT = document2.createElement("div");
      var TYPE_FUNCTION = "function";
      var round = Math.round;
      var abs = Math.abs;
      var now = Date.now;
      function setTimeoutContext(fn, timeout, context) {
        return setTimeout(bindFn(fn, context), timeout);
      }
      function invokeArrayArg(arg, fn, context) {
        if (Array.isArray(arg)) {
          each(arg, context[fn], context);
          return true;
        }
        return false;
      }
      function each(obj, iterator, context) {
        var i;
        if (!obj) {
          return;
        }
        if (obj.forEach) {
          obj.forEach(iterator, context);
        } else if (obj.length !== undefined2) {
          i = 0;
          while (i < obj.length) {
            iterator.call(context, obj[i], i, obj);
            i++;
          }
        } else {
          for (i in obj) {
            obj.hasOwnProperty(i) && iterator.call(context, obj[i], i, obj);
          }
        }
      }
      function deprecate(method, name, message) {
        var deprecationMessage = "DEPRECATED METHOD: " + name + "\n" + message + " AT \n";
        return function() {
          var e = new Error("get-stack-trace");
          var stack = e && e.stack ? e.stack.replace(/^[^\(]+?[\n$]/gm, "").replace(/^\s+at\s+/gm, "").replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@") : "Unknown Stack Trace";
          var log = window2.console && (window2.console.warn || window2.console.log);
          if (log) {
            log.call(window2.console, deprecationMessage, stack);
          }
          return method.apply(this, arguments);
        };
      }
      var assign;
      if (typeof Object.assign !== "function") {
        assign = function assign2(target) {
          if (target === undefined2 || target === null) {
            throw new TypeError("Cannot convert undefined or null to object");
          }
          var output = Object(target);
          for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source !== undefined2 && source !== null) {
              for (var nextKey in source) {
                if (source.hasOwnProperty(nextKey)) {
                  output[nextKey] = source[nextKey];
                }
              }
            }
          }
          return output;
        };
      } else {
        assign = Object.assign;
      }
      var extend = deprecate(function extend2(dest, src, merge2) {
        var keys = Object.keys(src);
        var i = 0;
        while (i < keys.length) {
          if (!merge2 || merge2 && dest[keys[i]] === undefined2) {
            dest[keys[i]] = src[keys[i]];
          }
          i++;
        }
        return dest;
      }, "extend", "Use `assign`.");
      var merge = deprecate(function merge2(dest, src) {
        return extend(dest, src, true);
      }, "merge", "Use `assign`.");
      function inherit(child, base, properties) {
        var baseP = base.prototype, childP;
        childP = child.prototype = Object.create(baseP);
        childP.constructor = child;
        childP._super = baseP;
        if (properties) {
          assign(childP, properties);
        }
      }
      function bindFn(fn, context) {
        return function boundFn() {
          return fn.apply(context, arguments);
        };
      }
      function boolOrFn(val, args) {
        if (typeof val == TYPE_FUNCTION) {
          return val.apply(args ? args[0] || undefined2 : undefined2, args);
        }
        return val;
      }
      function ifUndefined(val1, val2) {
        return val1 === undefined2 ? val2 : val1;
      }
      function addEventListeners(target, types, handler) {
        each(splitStr(types), function(type) {
          target.addEventListener(type, handler, false);
        });
      }
      function removeEventListeners(target, types, handler) {
        each(splitStr(types), function(type) {
          target.removeEventListener(type, handler, false);
        });
      }
      function hasParent(node, parent) {
        while (node) {
          if (node == parent) {
            return true;
          }
          node = node.parentNode;
        }
        return false;
      }
      function inStr(str, find) {
        return str.indexOf(find) > -1;
      }
      function splitStr(str) {
        return str.trim().split(/\s+/g);
      }
      function inArray(src, find, findByKey) {
        if (src.indexOf && !findByKey) {
          return src.indexOf(find);
        } else {
          var i = 0;
          while (i < src.length) {
            if (findByKey && src[i][findByKey] == find || !findByKey && src[i] === find) {
              return i;
            }
            i++;
          }
          return -1;
        }
      }
      function toArray(obj) {
        return Array.prototype.slice.call(obj, 0);
      }
      function uniqueArray(src, key, sort) {
        var results = [];
        var values = [];
        var i = 0;
        while (i < src.length) {
          var val = key ? src[i][key] : src[i];
          if (inArray(values, val) < 0) {
            results.push(src[i]);
          }
          values[i] = val;
          i++;
        }
        if (sort) {
          if (!key) {
            results = results.sort();
          } else {
            results = results.sort(function sortUniqueArray(a, b) {
              return a[key] > b[key];
            });
          }
        }
        return results;
      }
      function prefixed(obj, property) {
        var prefix, prop;
        var camelProp = property[0].toUpperCase() + property.slice(1);
        var i = 0;
        while (i < VENDOR_PREFIXES.length) {
          prefix = VENDOR_PREFIXES[i];
          prop = prefix ? prefix + camelProp : property;
          if (prop in obj) {
            return prop;
          }
          i++;
        }
        return undefined2;
      }
      var _uniqueId = 1;
      function uniqueId() {
        return _uniqueId++;
      }
      function getWindowForElement(element) {
        var doc = element.ownerDocument || element;
        return doc.defaultView || doc.parentWindow || window2;
      }
      var MOBILE_REGEX = /mobile|tablet|ip(ad|hone|od)|android/i;
      var SUPPORT_TOUCH = "ontouchstart" in window2;
      var SUPPORT_POINTER_EVENTS = prefixed(window2, "PointerEvent") !== undefined2;
      var SUPPORT_ONLY_TOUCH = SUPPORT_TOUCH && MOBILE_REGEX.test(navigator.userAgent);
      var INPUT_TYPE_TOUCH = "touch";
      var INPUT_TYPE_PEN = "pen";
      var INPUT_TYPE_MOUSE = "mouse";
      var INPUT_TYPE_KINECT = "kinect";
      var COMPUTE_INTERVAL = 25;
      var INPUT_START = 1;
      var INPUT_MOVE = 2;
      var INPUT_END = 4;
      var INPUT_CANCEL = 8;
      var DIRECTION_NONE = 1;
      var DIRECTION_LEFT = 2;
      var DIRECTION_RIGHT = 4;
      var DIRECTION_UP = 8;
      var DIRECTION_DOWN = 16;
      var DIRECTION_HORIZONTAL = DIRECTION_LEFT | DIRECTION_RIGHT;
      var DIRECTION_VERTICAL = DIRECTION_UP | DIRECTION_DOWN;
      var DIRECTION_ALL = DIRECTION_HORIZONTAL | DIRECTION_VERTICAL;
      var PROPS_XY = ["x", "y"];
      var PROPS_CLIENT_XY = ["clientX", "clientY"];
      function Input(manager, callback) {
        var self2 = this;
        this.manager = manager;
        this.callback = callback;
        this.element = manager.element;
        this.target = manager.options.inputTarget;
        this.domHandler = function(ev) {
          if (boolOrFn(manager.options.enable, [manager])) {
            self2.handler(ev);
          }
        };
        this.init();
      }
      Input.prototype = {
        handler: function() {
        },
        init: function() {
          this.evEl && addEventListeners(this.element, this.evEl, this.domHandler);
          this.evTarget && addEventListeners(this.target, this.evTarget, this.domHandler);
          this.evWin && addEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
        },
        destroy: function() {
          this.evEl && removeEventListeners(this.element, this.evEl, this.domHandler);
          this.evTarget && removeEventListeners(this.target, this.evTarget, this.domHandler);
          this.evWin && removeEventListeners(getWindowForElement(this.element), this.evWin, this.domHandler);
        }
      };
      function createInputInstance(manager) {
        var Type;
        var inputClass = manager.options.inputClass;
        if (inputClass) {
          Type = inputClass;
        } else if (SUPPORT_POINTER_EVENTS) {
          Type = PointerEventInput;
        } else if (SUPPORT_ONLY_TOUCH) {
          Type = TouchInput;
        } else if (!SUPPORT_TOUCH) {
          Type = MouseInput;
        } else {
          Type = TouchMouseInput;
        }
        return new Type(manager, inputHandler);
      }
      function inputHandler(manager, eventType, input) {
        var pointersLen = input.pointers.length;
        var changedPointersLen = input.changedPointers.length;
        var isFirst = eventType & INPUT_START && pointersLen - changedPointersLen === 0;
        var isFinal = eventType & (INPUT_END | INPUT_CANCEL) && pointersLen - changedPointersLen === 0;
        input.isFirst = !!isFirst;
        input.isFinal = !!isFinal;
        if (isFirst) {
          manager.session = {};
        }
        input.eventType = eventType;
        computeInputData(manager, input);
        manager.emit("hammer.input", input);
        manager.recognize(input);
        manager.session.prevInput = input;
      }
      function computeInputData(manager, input) {
        var session = manager.session;
        var pointers = input.pointers;
        var pointersLength = pointers.length;
        if (!session.firstInput) {
          session.firstInput = simpleCloneInputData(input);
        }
        if (pointersLength > 1 && !session.firstMultiple) {
          session.firstMultiple = simpleCloneInputData(input);
        } else if (pointersLength === 1) {
          session.firstMultiple = false;
        }
        var firstInput = session.firstInput;
        var firstMultiple = session.firstMultiple;
        var offsetCenter = firstMultiple ? firstMultiple.center : firstInput.center;
        var center = input.center = getCenter(pointers);
        input.timeStamp = now();
        input.deltaTime = input.timeStamp - firstInput.timeStamp;
        input.angle = getAngle(offsetCenter, center);
        input.distance = getDistance(offsetCenter, center);
        computeDeltaXY(session, input);
        input.offsetDirection = getDirection(input.deltaX, input.deltaY);
        var overallVelocity = getVelocity(input.deltaTime, input.deltaX, input.deltaY);
        input.overallVelocityX = overallVelocity.x;
        input.overallVelocityY = overallVelocity.y;
        input.overallVelocity = abs(overallVelocity.x) > abs(overallVelocity.y) ? overallVelocity.x : overallVelocity.y;
        input.scale = firstMultiple ? getScale(firstMultiple.pointers, pointers) : 1;
        input.rotation = firstMultiple ? getRotation(firstMultiple.pointers, pointers) : 0;
        input.maxPointers = !session.prevInput ? input.pointers.length : input.pointers.length > session.prevInput.maxPointers ? input.pointers.length : session.prevInput.maxPointers;
        computeIntervalInputData(session, input);
        var target = manager.element;
        if (hasParent(input.srcEvent.target, target)) {
          target = input.srcEvent.target;
        }
        input.target = target;
      }
      function computeDeltaXY(session, input) {
        var center = input.center;
        var offset = session.offsetDelta || {};
        var prevDelta = session.prevDelta || {};
        var prevInput = session.prevInput || {};
        if (input.eventType === INPUT_START || prevInput.eventType === INPUT_END) {
          prevDelta = session.prevDelta = {
            x: prevInput.deltaX || 0,
            y: prevInput.deltaY || 0
          };
          offset = session.offsetDelta = {
            x: center.x,
            y: center.y
          };
        }
        input.deltaX = prevDelta.x + (center.x - offset.x);
        input.deltaY = prevDelta.y + (center.y - offset.y);
      }
      function computeIntervalInputData(session, input) {
        var last = session.lastInterval || input, deltaTime = input.timeStamp - last.timeStamp, velocity, velocityX, velocityY, direction;
        if (input.eventType != INPUT_CANCEL && (deltaTime > COMPUTE_INTERVAL || last.velocity === undefined2)) {
          var deltaX = input.deltaX - last.deltaX;
          var deltaY = input.deltaY - last.deltaY;
          var v = getVelocity(deltaTime, deltaX, deltaY);
          velocityX = v.x;
          velocityY = v.y;
          velocity = abs(v.x) > abs(v.y) ? v.x : v.y;
          direction = getDirection(deltaX, deltaY);
          session.lastInterval = input;
        } else {
          velocity = last.velocity;
          velocityX = last.velocityX;
          velocityY = last.velocityY;
          direction = last.direction;
        }
        input.velocity = velocity;
        input.velocityX = velocityX;
        input.velocityY = velocityY;
        input.direction = direction;
      }
      function simpleCloneInputData(input) {
        var pointers = [];
        var i = 0;
        while (i < input.pointers.length) {
          pointers[i] = {
            clientX: round(input.pointers[i].clientX),
            clientY: round(input.pointers[i].clientY)
          };
          i++;
        }
        return {
          timeStamp: now(),
          pointers,
          center: getCenter(pointers),
          deltaX: input.deltaX,
          deltaY: input.deltaY
        };
      }
      function getCenter(pointers) {
        var pointersLength = pointers.length;
        if (pointersLength === 1) {
          return {
            x: round(pointers[0].clientX),
            y: round(pointers[0].clientY)
          };
        }
        var x = 0, y = 0, i = 0;
        while (i < pointersLength) {
          x += pointers[i].clientX;
          y += pointers[i].clientY;
          i++;
        }
        return {
          x: round(x / pointersLength),
          y: round(y / pointersLength)
        };
      }
      function getVelocity(deltaTime, x, y) {
        return {
          x: x / deltaTime || 0,
          y: y / deltaTime || 0
        };
      }
      function getDirection(x, y) {
        if (x === y) {
          return DIRECTION_NONE;
        }
        if (abs(x) >= abs(y)) {
          return x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
        }
        return y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
      }
      function getDistance(p1, p2, props) {
        if (!props) {
          props = PROPS_XY;
        }
        var x = p2[props[0]] - p1[props[0]], y = p2[props[1]] - p1[props[1]];
        return Math.sqrt(x * x + y * y);
      }
      function getAngle(p1, p2, props) {
        if (!props) {
          props = PROPS_XY;
        }
        var x = p2[props[0]] - p1[props[0]], y = p2[props[1]] - p1[props[1]];
        return Math.atan2(y, x) * 180 / Math.PI;
      }
      function getRotation(start, end) {
        return getAngle(end[1], end[0], PROPS_CLIENT_XY) + getAngle(start[1], start[0], PROPS_CLIENT_XY);
      }
      function getScale(start, end) {
        return getDistance(end[0], end[1], PROPS_CLIENT_XY) / getDistance(start[0], start[1], PROPS_CLIENT_XY);
      }
      var MOUSE_INPUT_MAP = {
        mousedown: INPUT_START,
        mousemove: INPUT_MOVE,
        mouseup: INPUT_END
      };
      var MOUSE_ELEMENT_EVENTS = "mousedown";
      var MOUSE_WINDOW_EVENTS = "mousemove mouseup";
      function MouseInput() {
        this.evEl = MOUSE_ELEMENT_EVENTS;
        this.evWin = MOUSE_WINDOW_EVENTS;
        this.pressed = false;
        Input.apply(this, arguments);
      }
      inherit(MouseInput, Input, {
        handler: function MEhandler(ev) {
          var eventType = MOUSE_INPUT_MAP[ev.type];
          if (eventType & INPUT_START && ev.button === 0) {
            this.pressed = true;
          }
          if (eventType & INPUT_MOVE && ev.which !== 1) {
            eventType = INPUT_END;
          }
          if (!this.pressed) {
            return;
          }
          if (eventType & INPUT_END) {
            this.pressed = false;
          }
          this.callback(this.manager, eventType, {
            pointers: [ev],
            changedPointers: [ev],
            pointerType: INPUT_TYPE_MOUSE,
            srcEvent: ev
          });
        }
      });
      var POINTER_INPUT_MAP = {
        pointerdown: INPUT_START,
        pointermove: INPUT_MOVE,
        pointerup: INPUT_END,
        pointercancel: INPUT_CANCEL,
        pointerout: INPUT_CANCEL
      };
      var IE10_POINTER_TYPE_ENUM = {
        2: INPUT_TYPE_TOUCH,
        3: INPUT_TYPE_PEN,
        4: INPUT_TYPE_MOUSE,
        5: INPUT_TYPE_KINECT
      };
      var POINTER_ELEMENT_EVENTS = "pointerdown";
      var POINTER_WINDOW_EVENTS = "pointermove pointerup pointercancel";
      if (window2.MSPointerEvent && !window2.PointerEvent) {
        POINTER_ELEMENT_EVENTS = "MSPointerDown";
        POINTER_WINDOW_EVENTS = "MSPointerMove MSPointerUp MSPointerCancel";
      }
      function PointerEventInput() {
        this.evEl = POINTER_ELEMENT_EVENTS;
        this.evWin = POINTER_WINDOW_EVENTS;
        Input.apply(this, arguments);
        this.store = this.manager.session.pointerEvents = [];
      }
      inherit(PointerEventInput, Input, {
        handler: function PEhandler(ev) {
          var store = this.store;
          var removePointer = false;
          var eventTypeNormalized = ev.type.toLowerCase().replace("ms", "");
          var eventType = POINTER_INPUT_MAP[eventTypeNormalized];
          var pointerType = IE10_POINTER_TYPE_ENUM[ev.pointerType] || ev.pointerType;
          var isTouch = pointerType == INPUT_TYPE_TOUCH;
          var storeIndex = inArray(store, ev.pointerId, "pointerId");
          if (eventType & INPUT_START && (ev.button === 0 || isTouch)) {
            if (storeIndex < 0) {
              store.push(ev);
              storeIndex = store.length - 1;
            }
          } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
            removePointer = true;
          }
          if (storeIndex < 0) {
            return;
          }
          store[storeIndex] = ev;
          this.callback(this.manager, eventType, {
            pointers: store,
            changedPointers: [ev],
            pointerType,
            srcEvent: ev
          });
          if (removePointer) {
            store.splice(storeIndex, 1);
          }
        }
      });
      var SINGLE_TOUCH_INPUT_MAP = {
        touchstart: INPUT_START,
        touchmove: INPUT_MOVE,
        touchend: INPUT_END,
        touchcancel: INPUT_CANCEL
      };
      var SINGLE_TOUCH_TARGET_EVENTS = "touchstart";
      var SINGLE_TOUCH_WINDOW_EVENTS = "touchstart touchmove touchend touchcancel";
      function SingleTouchInput() {
        this.evTarget = SINGLE_TOUCH_TARGET_EVENTS;
        this.evWin = SINGLE_TOUCH_WINDOW_EVENTS;
        this.started = false;
        Input.apply(this, arguments);
      }
      inherit(SingleTouchInput, Input, {
        handler: function TEhandler(ev) {
          var type = SINGLE_TOUCH_INPUT_MAP[ev.type];
          if (type === INPUT_START) {
            this.started = true;
          }
          if (!this.started) {
            return;
          }
          var touches = normalizeSingleTouches.call(this, ev, type);
          if (type & (INPUT_END | INPUT_CANCEL) && touches[0].length - touches[1].length === 0) {
            this.started = false;
          }
          this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
          });
        }
      });
      function normalizeSingleTouches(ev, type) {
        var all = toArray(ev.touches);
        var changed = toArray(ev.changedTouches);
        if (type & (INPUT_END | INPUT_CANCEL)) {
          all = uniqueArray(all.concat(changed), "identifier", true);
        }
        return [all, changed];
      }
      var TOUCH_INPUT_MAP = {
        touchstart: INPUT_START,
        touchmove: INPUT_MOVE,
        touchend: INPUT_END,
        touchcancel: INPUT_CANCEL
      };
      var TOUCH_TARGET_EVENTS = "touchstart touchmove touchend touchcancel";
      function TouchInput() {
        this.evTarget = TOUCH_TARGET_EVENTS;
        this.targetIds = {};
        Input.apply(this, arguments);
      }
      inherit(TouchInput, Input, {
        handler: function MTEhandler(ev) {
          var type = TOUCH_INPUT_MAP[ev.type];
          var touches = getTouches.call(this, ev, type);
          if (!touches) {
            return;
          }
          this.callback(this.manager, type, {
            pointers: touches[0],
            changedPointers: touches[1],
            pointerType: INPUT_TYPE_TOUCH,
            srcEvent: ev
          });
        }
      });
      function getTouches(ev, type) {
        var allTouches = toArray(ev.touches);
        var targetIds = this.targetIds;
        if (type & (INPUT_START | INPUT_MOVE) && allTouches.length === 1) {
          targetIds[allTouches[0].identifier] = true;
          return [allTouches, allTouches];
        }
        var i, targetTouches, changedTouches = toArray(ev.changedTouches), changedTargetTouches = [], target = this.target;
        targetTouches = allTouches.filter(function(touch) {
          return hasParent(touch.target, target);
        });
        if (type === INPUT_START) {
          i = 0;
          while (i < targetTouches.length) {
            targetIds[targetTouches[i].identifier] = true;
            i++;
          }
        }
        i = 0;
        while (i < changedTouches.length) {
          if (targetIds[changedTouches[i].identifier]) {
            changedTargetTouches.push(changedTouches[i]);
          }
          if (type & (INPUT_END | INPUT_CANCEL)) {
            delete targetIds[changedTouches[i].identifier];
          }
          i++;
        }
        if (!changedTargetTouches.length) {
          return;
        }
        return [
          uniqueArray(targetTouches.concat(changedTargetTouches), "identifier", true),
          changedTargetTouches
        ];
      }
      var DEDUP_TIMEOUT = 2500;
      var DEDUP_DISTANCE = 25;
      function TouchMouseInput() {
        Input.apply(this, arguments);
        var handler = bindFn(this.handler, this);
        this.touch = new TouchInput(this.manager, handler);
        this.mouse = new MouseInput(this.manager, handler);
        this.primaryTouch = null;
        this.lastTouches = [];
      }
      inherit(TouchMouseInput, Input, {
        handler: function TMEhandler(manager, inputEvent, inputData) {
          var isTouch = inputData.pointerType == INPUT_TYPE_TOUCH, isMouse = inputData.pointerType == INPUT_TYPE_MOUSE;
          if (isMouse && inputData.sourceCapabilities && inputData.sourceCapabilities.firesTouchEvents) {
            return;
          }
          if (isTouch) {
            recordTouches.call(this, inputEvent, inputData);
          } else if (isMouse && isSyntheticEvent.call(this, inputData)) {
            return;
          }
          this.callback(manager, inputEvent, inputData);
        },
        destroy: function destroy() {
          this.touch.destroy();
          this.mouse.destroy();
        }
      });
      function recordTouches(eventType, eventData) {
        if (eventType & INPUT_START) {
          this.primaryTouch = eventData.changedPointers[0].identifier;
          setLastTouch.call(this, eventData);
        } else if (eventType & (INPUT_END | INPUT_CANCEL)) {
          setLastTouch.call(this, eventData);
        }
      }
      function setLastTouch(eventData) {
        var touch = eventData.changedPointers[0];
        if (touch.identifier === this.primaryTouch) {
          var lastTouch = { x: touch.clientX, y: touch.clientY };
          this.lastTouches.push(lastTouch);
          var lts = this.lastTouches;
          var removeLastTouch = function() {
            var i = lts.indexOf(lastTouch);
            if (i > -1) {
              lts.splice(i, 1);
            }
          };
          setTimeout(removeLastTouch, DEDUP_TIMEOUT);
        }
      }
      function isSyntheticEvent(eventData) {
        var x = eventData.srcEvent.clientX, y = eventData.srcEvent.clientY;
        for (var i = 0; i < this.lastTouches.length; i++) {
          var t = this.lastTouches[i];
          var dx = Math.abs(x - t.x), dy = Math.abs(y - t.y);
          if (dx <= DEDUP_DISTANCE && dy <= DEDUP_DISTANCE) {
            return true;
          }
        }
        return false;
      }
      var PREFIXED_TOUCH_ACTION = prefixed(TEST_ELEMENT.style, "touchAction");
      var NATIVE_TOUCH_ACTION = PREFIXED_TOUCH_ACTION !== undefined2;
      var TOUCH_ACTION_COMPUTE = "compute";
      var TOUCH_ACTION_AUTO = "auto";
      var TOUCH_ACTION_MANIPULATION = "manipulation";
      var TOUCH_ACTION_NONE = "none";
      var TOUCH_ACTION_PAN_X = "pan-x";
      var TOUCH_ACTION_PAN_Y = "pan-y";
      var TOUCH_ACTION_MAP = getTouchActionProps();
      function TouchAction(manager, value) {
        this.manager = manager;
        this.set(value);
      }
      TouchAction.prototype = {
        set: function(value) {
          if (value == TOUCH_ACTION_COMPUTE) {
            value = this.compute();
          }
          if (NATIVE_TOUCH_ACTION && this.manager.element.style && TOUCH_ACTION_MAP[value]) {
            this.manager.element.style[PREFIXED_TOUCH_ACTION] = value;
          }
          this.actions = value.toLowerCase().trim();
        },
        update: function() {
          this.set(this.manager.options.touchAction);
        },
        compute: function() {
          var actions = [];
          each(this.manager.recognizers, function(recognizer) {
            if (boolOrFn(recognizer.options.enable, [recognizer])) {
              actions = actions.concat(recognizer.getTouchAction());
            }
          });
          return cleanTouchActions(actions.join(" "));
        },
        preventDefaults: function(input) {
          var srcEvent = input.srcEvent;
          var direction = input.offsetDirection;
          if (this.manager.session.prevented) {
            srcEvent.preventDefault();
            return;
          }
          var actions = this.actions;
          var hasNone = inStr(actions, TOUCH_ACTION_NONE) && !TOUCH_ACTION_MAP[TOUCH_ACTION_NONE];
          var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_Y];
          var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X) && !TOUCH_ACTION_MAP[TOUCH_ACTION_PAN_X];
          if (hasNone) {
            var isTapPointer = input.pointers.length === 1;
            var isTapMovement = input.distance < 2;
            var isTapTouchTime = input.deltaTime < 250;
            if (isTapPointer && isTapMovement && isTapTouchTime) {
              return;
            }
          }
          if (hasPanX && hasPanY) {
            return;
          }
          if (hasNone || hasPanY && direction & DIRECTION_HORIZONTAL || hasPanX && direction & DIRECTION_VERTICAL) {
            return this.preventSrc(srcEvent);
          }
        },
        preventSrc: function(srcEvent) {
          this.manager.session.prevented = true;
          srcEvent.preventDefault();
        }
      };
      function cleanTouchActions(actions) {
        if (inStr(actions, TOUCH_ACTION_NONE)) {
          return TOUCH_ACTION_NONE;
        }
        var hasPanX = inStr(actions, TOUCH_ACTION_PAN_X);
        var hasPanY = inStr(actions, TOUCH_ACTION_PAN_Y);
        if (hasPanX && hasPanY) {
          return TOUCH_ACTION_NONE;
        }
        if (hasPanX || hasPanY) {
          return hasPanX ? TOUCH_ACTION_PAN_X : TOUCH_ACTION_PAN_Y;
        }
        if (inStr(actions, TOUCH_ACTION_MANIPULATION)) {
          return TOUCH_ACTION_MANIPULATION;
        }
        return TOUCH_ACTION_AUTO;
      }
      function getTouchActionProps() {
        if (!NATIVE_TOUCH_ACTION) {
          return false;
        }
        var touchMap = {};
        var cssSupports = window2.CSS && window2.CSS.supports;
        ["auto", "manipulation", "pan-y", "pan-x", "pan-x pan-y", "none"].forEach(function(val) {
          touchMap[val] = cssSupports ? window2.CSS.supports("touch-action", val) : true;
        });
        return touchMap;
      }
      var STATE_POSSIBLE = 1;
      var STATE_BEGAN = 2;
      var STATE_CHANGED = 4;
      var STATE_ENDED = 8;
      var STATE_RECOGNIZED = STATE_ENDED;
      var STATE_CANCELLED = 16;
      var STATE_FAILED = 32;
      function Recognizer(options) {
        this.options = assign({}, this.defaults, options || {});
        this.id = uniqueId();
        this.manager = null;
        this.options.enable = ifUndefined(this.options.enable, true);
        this.state = STATE_POSSIBLE;
        this.simultaneous = {};
        this.requireFail = [];
      }
      Recognizer.prototype = {
        defaults: {},
        set: function(options) {
          assign(this.options, options);
          this.manager && this.manager.touchAction.update();
          return this;
        },
        recognizeWith: function(otherRecognizer) {
          if (invokeArrayArg(otherRecognizer, "recognizeWith", this)) {
            return this;
          }
          var simultaneous = this.simultaneous;
          otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
          if (!simultaneous[otherRecognizer.id]) {
            simultaneous[otherRecognizer.id] = otherRecognizer;
            otherRecognizer.recognizeWith(this);
          }
          return this;
        },
        dropRecognizeWith: function(otherRecognizer) {
          if (invokeArrayArg(otherRecognizer, "dropRecognizeWith", this)) {
            return this;
          }
          otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
          delete this.simultaneous[otherRecognizer.id];
          return this;
        },
        requireFailure: function(otherRecognizer) {
          if (invokeArrayArg(otherRecognizer, "requireFailure", this)) {
            return this;
          }
          var requireFail = this.requireFail;
          otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
          if (inArray(requireFail, otherRecognizer) === -1) {
            requireFail.push(otherRecognizer);
            otherRecognizer.requireFailure(this);
          }
          return this;
        },
        dropRequireFailure: function(otherRecognizer) {
          if (invokeArrayArg(otherRecognizer, "dropRequireFailure", this)) {
            return this;
          }
          otherRecognizer = getRecognizerByNameIfManager(otherRecognizer, this);
          var index = inArray(this.requireFail, otherRecognizer);
          if (index > -1) {
            this.requireFail.splice(index, 1);
          }
          return this;
        },
        hasRequireFailures: function() {
          return this.requireFail.length > 0;
        },
        canRecognizeWith: function(otherRecognizer) {
          return !!this.simultaneous[otherRecognizer.id];
        },
        emit: function(input) {
          var self2 = this;
          var state = this.state;
          function emit(event) {
            self2.manager.emit(event, input);
          }
          if (state < STATE_ENDED) {
            emit(self2.options.event + stateStr(state));
          }
          emit(self2.options.event);
          if (input.additionalEvent) {
            emit(input.additionalEvent);
          }
          if (state >= STATE_ENDED) {
            emit(self2.options.event + stateStr(state));
          }
        },
        tryEmit: function(input) {
          if (this.canEmit()) {
            return this.emit(input);
          }
          this.state = STATE_FAILED;
        },
        canEmit: function() {
          var i = 0;
          while (i < this.requireFail.length) {
            if (!(this.requireFail[i].state & (STATE_FAILED | STATE_POSSIBLE))) {
              return false;
            }
            i++;
          }
          return true;
        },
        recognize: function(inputData) {
          var inputDataClone = assign({}, inputData);
          if (!boolOrFn(this.options.enable, [this, inputDataClone])) {
            this.reset();
            this.state = STATE_FAILED;
            return;
          }
          if (this.state & (STATE_RECOGNIZED | STATE_CANCELLED | STATE_FAILED)) {
            this.state = STATE_POSSIBLE;
          }
          this.state = this.process(inputDataClone);
          if (this.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED | STATE_CANCELLED)) {
            this.tryEmit(inputDataClone);
          }
        },
        process: function(inputData) {
        },
        getTouchAction: function() {
        },
        reset: function() {
        }
      };
      function stateStr(state) {
        if (state & STATE_CANCELLED) {
          return "cancel";
        } else if (state & STATE_ENDED) {
          return "end";
        } else if (state & STATE_CHANGED) {
          return "move";
        } else if (state & STATE_BEGAN) {
          return "start";
        }
        return "";
      }
      function directionStr(direction) {
        if (direction == DIRECTION_DOWN) {
          return "down";
        } else if (direction == DIRECTION_UP) {
          return "up";
        } else if (direction == DIRECTION_LEFT) {
          return "left";
        } else if (direction == DIRECTION_RIGHT) {
          return "right";
        }
        return "";
      }
      function getRecognizerByNameIfManager(otherRecognizer, recognizer) {
        var manager = recognizer.manager;
        if (manager) {
          return manager.get(otherRecognizer);
        }
        return otherRecognizer;
      }
      function AttrRecognizer() {
        Recognizer.apply(this, arguments);
      }
      inherit(AttrRecognizer, Recognizer, {
        defaults: {
          pointers: 1
        },
        attrTest: function(input) {
          var optionPointers = this.options.pointers;
          return optionPointers === 0 || input.pointers.length === optionPointers;
        },
        process: function(input) {
          var state = this.state;
          var eventType = input.eventType;
          var isRecognized = state & (STATE_BEGAN | STATE_CHANGED);
          var isValid = this.attrTest(input);
          if (isRecognized && (eventType & INPUT_CANCEL || !isValid)) {
            return state | STATE_CANCELLED;
          } else if (isRecognized || isValid) {
            if (eventType & INPUT_END) {
              return state | STATE_ENDED;
            } else if (!(state & STATE_BEGAN)) {
              return STATE_BEGAN;
            }
            return state | STATE_CHANGED;
          }
          return STATE_FAILED;
        }
      });
      function PanRecognizer() {
        AttrRecognizer.apply(this, arguments);
        this.pX = null;
        this.pY = null;
      }
      inherit(PanRecognizer, AttrRecognizer, {
        defaults: {
          event: "pan",
          threshold: 10,
          pointers: 1,
          direction: DIRECTION_ALL
        },
        getTouchAction: function() {
          var direction = this.options.direction;
          var actions = [];
          if (direction & DIRECTION_HORIZONTAL) {
            actions.push(TOUCH_ACTION_PAN_Y);
          }
          if (direction & DIRECTION_VERTICAL) {
            actions.push(TOUCH_ACTION_PAN_X);
          }
          return actions;
        },
        directionTest: function(input) {
          var options = this.options;
          var hasMoved = true;
          var distance = input.distance;
          var direction = input.direction;
          var x = input.deltaX;
          var y = input.deltaY;
          if (!(direction & options.direction)) {
            if (options.direction & DIRECTION_HORIZONTAL) {
              direction = x === 0 ? DIRECTION_NONE : x < 0 ? DIRECTION_LEFT : DIRECTION_RIGHT;
              hasMoved = x != this.pX;
              distance = Math.abs(input.deltaX);
            } else {
              direction = y === 0 ? DIRECTION_NONE : y < 0 ? DIRECTION_UP : DIRECTION_DOWN;
              hasMoved = y != this.pY;
              distance = Math.abs(input.deltaY);
            }
          }
          input.direction = direction;
          return hasMoved && distance > options.threshold && direction & options.direction;
        },
        attrTest: function(input) {
          return AttrRecognizer.prototype.attrTest.call(this, input) && (this.state & STATE_BEGAN || !(this.state & STATE_BEGAN) && this.directionTest(input));
        },
        emit: function(input) {
          this.pX = input.deltaX;
          this.pY = input.deltaY;
          var direction = directionStr(input.direction);
          if (direction) {
            input.additionalEvent = this.options.event + direction;
          }
          this._super.emit.call(this, input);
        }
      });
      function PinchRecognizer() {
        AttrRecognizer.apply(this, arguments);
      }
      inherit(PinchRecognizer, AttrRecognizer, {
        defaults: {
          event: "pinch",
          threshold: 0,
          pointers: 2
        },
        getTouchAction: function() {
          return [TOUCH_ACTION_NONE];
        },
        attrTest: function(input) {
          return this._super.attrTest.call(this, input) && (Math.abs(input.scale - 1) > this.options.threshold || this.state & STATE_BEGAN);
        },
        emit: function(input) {
          if (input.scale !== 1) {
            var inOut = input.scale < 1 ? "in" : "out";
            input.additionalEvent = this.options.event + inOut;
          }
          this._super.emit.call(this, input);
        }
      });
      function PressRecognizer() {
        Recognizer.apply(this, arguments);
        this._timer = null;
        this._input = null;
      }
      inherit(PressRecognizer, Recognizer, {
        defaults: {
          event: "press",
          pointers: 1,
          time: 251,
          threshold: 9
        },
        getTouchAction: function() {
          return [TOUCH_ACTION_AUTO];
        },
        process: function(input) {
          var options = this.options;
          var validPointers = input.pointers.length === options.pointers;
          var validMovement = input.distance < options.threshold;
          var validTime = input.deltaTime > options.time;
          this._input = input;
          if (!validMovement || !validPointers || input.eventType & (INPUT_END | INPUT_CANCEL) && !validTime) {
            this.reset();
          } else if (input.eventType & INPUT_START) {
            this.reset();
            this._timer = setTimeoutContext(function() {
              this.state = STATE_RECOGNIZED;
              this.tryEmit();
            }, options.time, this);
          } else if (input.eventType & INPUT_END) {
            return STATE_RECOGNIZED;
          }
          return STATE_FAILED;
        },
        reset: function() {
          clearTimeout(this._timer);
        },
        emit: function(input) {
          if (this.state !== STATE_RECOGNIZED) {
            return;
          }
          if (input && input.eventType & INPUT_END) {
            this.manager.emit(this.options.event + "up", input);
          } else {
            this._input.timeStamp = now();
            this.manager.emit(this.options.event, this._input);
          }
        }
      });
      function RotateRecognizer() {
        AttrRecognizer.apply(this, arguments);
      }
      inherit(RotateRecognizer, AttrRecognizer, {
        defaults: {
          event: "rotate",
          threshold: 0,
          pointers: 2
        },
        getTouchAction: function() {
          return [TOUCH_ACTION_NONE];
        },
        attrTest: function(input) {
          return this._super.attrTest.call(this, input) && (Math.abs(input.rotation) > this.options.threshold || this.state & STATE_BEGAN);
        }
      });
      function SwipeRecognizer() {
        AttrRecognizer.apply(this, arguments);
      }
      inherit(SwipeRecognizer, AttrRecognizer, {
        defaults: {
          event: "swipe",
          threshold: 10,
          velocity: 0.3,
          direction: DIRECTION_HORIZONTAL | DIRECTION_VERTICAL,
          pointers: 1
        },
        getTouchAction: function() {
          return PanRecognizer.prototype.getTouchAction.call(this);
        },
        attrTest: function(input) {
          var direction = this.options.direction;
          var velocity;
          if (direction & (DIRECTION_HORIZONTAL | DIRECTION_VERTICAL)) {
            velocity = input.overallVelocity;
          } else if (direction & DIRECTION_HORIZONTAL) {
            velocity = input.overallVelocityX;
          } else if (direction & DIRECTION_VERTICAL) {
            velocity = input.overallVelocityY;
          }
          return this._super.attrTest.call(this, input) && direction & input.offsetDirection && input.distance > this.options.threshold && input.maxPointers == this.options.pointers && abs(velocity) > this.options.velocity && input.eventType & INPUT_END;
        },
        emit: function(input) {
          var direction = directionStr(input.offsetDirection);
          if (direction) {
            this.manager.emit(this.options.event + direction, input);
          }
          this.manager.emit(this.options.event, input);
        }
      });
      function TapRecognizer() {
        Recognizer.apply(this, arguments);
        this.pTime = false;
        this.pCenter = false;
        this._timer = null;
        this._input = null;
        this.count = 0;
      }
      inherit(TapRecognizer, Recognizer, {
        defaults: {
          event: "tap",
          pointers: 1,
          taps: 1,
          interval: 300,
          time: 250,
          threshold: 9,
          posThreshold: 10
        },
        getTouchAction: function() {
          return [TOUCH_ACTION_MANIPULATION];
        },
        process: function(input) {
          var options = this.options;
          var validPointers = input.pointers.length === options.pointers;
          var validMovement = input.distance < options.threshold;
          var validTouchTime = input.deltaTime < options.time;
          this.reset();
          if (input.eventType & INPUT_START && this.count === 0) {
            return this.failTimeout();
          }
          if (validMovement && validTouchTime && validPointers) {
            if (input.eventType != INPUT_END) {
              return this.failTimeout();
            }
            var validInterval = this.pTime ? input.timeStamp - this.pTime < options.interval : true;
            var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;
            this.pTime = input.timeStamp;
            this.pCenter = input.center;
            if (!validMultiTap || !validInterval) {
              this.count = 1;
            } else {
              this.count += 1;
            }
            this._input = input;
            var tapCount = this.count % options.taps;
            if (tapCount === 0) {
              if (!this.hasRequireFailures()) {
                return STATE_RECOGNIZED;
              } else {
                this._timer = setTimeoutContext(function() {
                  this.state = STATE_RECOGNIZED;
                  this.tryEmit();
                }, options.interval, this);
                return STATE_BEGAN;
              }
            }
          }
          return STATE_FAILED;
        },
        failTimeout: function() {
          this._timer = setTimeoutContext(function() {
            this.state = STATE_FAILED;
          }, this.options.interval, this);
          return STATE_FAILED;
        },
        reset: function() {
          clearTimeout(this._timer);
        },
        emit: function() {
          if (this.state == STATE_RECOGNIZED) {
            this._input.tapCount = this.count;
            this.manager.emit(this.options.event, this._input);
          }
        }
      });
      function Hammer2(element, options) {
        options = options || {};
        options.recognizers = ifUndefined(options.recognizers, Hammer2.defaults.preset);
        return new Manager(element, options);
      }
      Hammer2.VERSION = "2.0.7";
      Hammer2.defaults = {
        domEvents: false,
        touchAction: TOUCH_ACTION_COMPUTE,
        enable: true,
        inputTarget: null,
        inputClass: null,
        preset: [
          [RotateRecognizer, { enable: false }],
          [PinchRecognizer, { enable: false }, ["rotate"]],
          [SwipeRecognizer, { direction: DIRECTION_HORIZONTAL }],
          [PanRecognizer, { direction: DIRECTION_HORIZONTAL }, ["swipe"]],
          [TapRecognizer],
          [TapRecognizer, { event: "doubletap", taps: 2 }, ["tap"]],
          [PressRecognizer]
        ],
        cssProps: {
          userSelect: "none",
          touchSelect: "none",
          touchCallout: "none",
          contentZooming: "none",
          userDrag: "none",
          tapHighlightColor: "rgba(0,0,0,0)"
        }
      };
      var STOP = 1;
      var FORCED_STOP = 2;
      function Manager(element, options) {
        this.options = assign({}, Hammer2.defaults, options || {});
        this.options.inputTarget = this.options.inputTarget || element;
        this.handlers = {};
        this.session = {};
        this.recognizers = [];
        this.oldCssProps = {};
        this.element = element;
        this.input = createInputInstance(this);
        this.touchAction = new TouchAction(this, this.options.touchAction);
        toggleCssProps(this, true);
        each(this.options.recognizers, function(item) {
          var recognizer = this.add(new item[0](item[1]));
          item[2] && recognizer.recognizeWith(item[2]);
          item[3] && recognizer.requireFailure(item[3]);
        }, this);
      }
      Manager.prototype = {
        set: function(options) {
          assign(this.options, options);
          if (options.touchAction) {
            this.touchAction.update();
          }
          if (options.inputTarget) {
            this.input.destroy();
            this.input.target = options.inputTarget;
            this.input.init();
          }
          return this;
        },
        stop: function(force) {
          this.session.stopped = force ? FORCED_STOP : STOP;
        },
        recognize: function(inputData) {
          var session = this.session;
          if (session.stopped) {
            return;
          }
          this.touchAction.preventDefaults(inputData);
          var recognizer;
          var recognizers = this.recognizers;
          var curRecognizer = session.curRecognizer;
          if (!curRecognizer || curRecognizer && curRecognizer.state & STATE_RECOGNIZED) {
            curRecognizer = session.curRecognizer = null;
          }
          var i = 0;
          while (i < recognizers.length) {
            recognizer = recognizers[i];
            if (session.stopped !== FORCED_STOP && (!curRecognizer || recognizer == curRecognizer || recognizer.canRecognizeWith(curRecognizer))) {
              recognizer.recognize(inputData);
            } else {
              recognizer.reset();
            }
            if (!curRecognizer && recognizer.state & (STATE_BEGAN | STATE_CHANGED | STATE_ENDED)) {
              curRecognizer = session.curRecognizer = recognizer;
            }
            i++;
          }
        },
        get: function(recognizer) {
          if (recognizer instanceof Recognizer) {
            return recognizer;
          }
          var recognizers = this.recognizers;
          for (var i = 0; i < recognizers.length; i++) {
            if (recognizers[i].options.event == recognizer) {
              return recognizers[i];
            }
          }
          return null;
        },
        add: function(recognizer) {
          if (invokeArrayArg(recognizer, "add", this)) {
            return this;
          }
          var existing = this.get(recognizer.options.event);
          if (existing) {
            this.remove(existing);
          }
          this.recognizers.push(recognizer);
          recognizer.manager = this;
          this.touchAction.update();
          return recognizer;
        },
        remove: function(recognizer) {
          if (invokeArrayArg(recognizer, "remove", this)) {
            return this;
          }
          recognizer = this.get(recognizer);
          if (recognizer) {
            var recognizers = this.recognizers;
            var index = inArray(recognizers, recognizer);
            if (index !== -1) {
              recognizers.splice(index, 1);
              this.touchAction.update();
            }
          }
          return this;
        },
        on: function(events, handler) {
          if (events === undefined2) {
            return;
          }
          if (handler === undefined2) {
            return;
          }
          var handlers = this.handlers;
          each(splitStr(events), function(event) {
            handlers[event] = handlers[event] || [];
            handlers[event].push(handler);
          });
          return this;
        },
        off: function(events, handler) {
          if (events === undefined2) {
            return;
          }
          var handlers = this.handlers;
          each(splitStr(events), function(event) {
            if (!handler) {
              delete handlers[event];
            } else {
              handlers[event] && handlers[event].splice(inArray(handlers[event], handler), 1);
            }
          });
          return this;
        },
        emit: function(event, data) {
          if (this.options.domEvents) {
            triggerDomEvent(event, data);
          }
          var handlers = this.handlers[event] && this.handlers[event].slice();
          if (!handlers || !handlers.length) {
            return;
          }
          data.type = event;
          data.preventDefault = function() {
            data.srcEvent.preventDefault();
          };
          var i = 0;
          while (i < handlers.length) {
            handlers[i](data);
            i++;
          }
        },
        destroy: function() {
          this.element && toggleCssProps(this, false);
          this.handlers = {};
          this.session = {};
          this.input.destroy();
          this.element = null;
        }
      };
      function toggleCssProps(manager, add) {
        var element = manager.element;
        if (!element.style) {
          return;
        }
        var prop;
        each(manager.options.cssProps, function(value, name) {
          prop = prefixed(element.style, name);
          if (add) {
            manager.oldCssProps[prop] = element.style[prop];
            element.style[prop] = value;
          } else {
            element.style[prop] = manager.oldCssProps[prop] || "";
          }
        });
        if (!add) {
          manager.oldCssProps = {};
        }
      }
      function triggerDomEvent(event, data) {
        var gestureEvent = document2.createEvent("Event");
        gestureEvent.initEvent(event, true, true);
        gestureEvent.gesture = data;
        data.target.dispatchEvent(gestureEvent);
      }
      assign(Hammer2, {
        INPUT_START,
        INPUT_MOVE,
        INPUT_END,
        INPUT_CANCEL,
        STATE_POSSIBLE,
        STATE_BEGAN,
        STATE_CHANGED,
        STATE_ENDED,
        STATE_RECOGNIZED,
        STATE_CANCELLED,
        STATE_FAILED,
        DIRECTION_NONE,
        DIRECTION_LEFT,
        DIRECTION_RIGHT,
        DIRECTION_UP,
        DIRECTION_DOWN,
        DIRECTION_HORIZONTAL,
        DIRECTION_VERTICAL,
        DIRECTION_ALL,
        Manager,
        Input,
        TouchAction,
        TouchInput,
        MouseInput,
        PointerEventInput,
        TouchMouseInput,
        SingleTouchInput,
        Recognizer,
        AttrRecognizer,
        Tap: TapRecognizer,
        Pan: PanRecognizer,
        Swipe: SwipeRecognizer,
        Pinch: PinchRecognizer,
        Rotate: RotateRecognizer,
        Press: PressRecognizer,
        on: addEventListeners,
        off: removeEventListeners,
        each,
        merge,
        extend,
        assign,
        inherit,
        bindFn,
        prefixed
      });
      var freeGlobal = typeof window2 !== "undefined" ? window2 : typeof self !== "undefined" ? self : {};
      freeGlobal.Hammer = Hammer2;
      if (typeof define === "function" && define.amd) {
        define(function() {
          return Hammer2;
        });
      } else if (typeof module != "undefined" && module.exports) {
        module.exports = Hammer2;
      } else {
        window2[exportName] = Hammer2;
      }
    })(window, document, "Hammer");
  }
});

// src/timeline.io.ts
var import_hammerjs = __toESM(require_hammer(), 1);
var Timeline = (elementIdentifier, settings) => {
  let ratio;
  let pivot;
  let timelineStart;
  let timelineEnd;
  let element;
  let options;
  let labelContainer;
  let dividerContainer;
  let eventsContainer;
  let rootTimeline;
  let currentTimeline;
  const MINUTES_IN_DAY = 1440;
  const MINUTES_IN_WEEK = 10080;
  const MINUTES_IN_YEAR = 525948.766;
  const MINUTES_IN_MONTH = MINUTES_IN_YEAR / 12;
  const SHOW_MONTH_DURATION = MINUTES_IN_MONTH * 18;
  const SHOW_DAY_DURATION = MINUTES_IN_WEEK * 6;
  const SHOW_TIME_DURATION = MINUTES_IN_DAY * 4;
  const isITimelineEventWithDetails = (timelineEvent) => "timelineEventDetails" in timelineEvent;
  const load = (loader) => __async(void 0, null, function* () {
    if (!loader)
      throw new Error(`Argument is empty. Please provide a loader function as first arg`);
    add(yield loader());
  });
  const add = (...timelineEvents) => {
    if (!timelineEvents)
      throw new Error(`Event argument is empty. Please provide Timeline event(s) as input`);
    addEvents(rootTimeline, ...timelineEvents);
    update();
  };
  const isViewInside = (timelineEvent) => {
    return timelineEvent.start < viewStart() && timelineEvent.end > viewEnd();
  };
  const init = (elementIdentifier2, settings2) => {
    if (!elementIdentifier2)
      throw new Error(`Element argument is empty. DOM element | selector as first arg`);
    if (typeof elementIdentifier2 === "string") {
      const elem = document.querySelector(elementIdentifier2);
      if (!elem)
        throw new Error(`Selector could not be found [${element}]`);
      element = elem;
    }
    if (elementIdentifier2 instanceof HTMLElement) {
      element = elementIdentifier2;
    }
    options = __spreadValues(__spreadValues({}, {
      labelCount: 5,
      zoomSpeed: 0.025,
      dragSpeed: 1e-3,
      timelineStart: "-1B",
      timelineEnd: "1M",
      start: "-100y",
      end: "now",
      minZoom: 1,
      maxZoom: 1e11,
      position: "bottom",
      eventHeight: 5,
      autoZoom: false,
      defaultColor: [140, 140, 140],
      classNames: {
        timeline: "tl",
        timelineEvent: "tl__event",
        timelineEventTitle: "tl__event__title",
        timelineLabels: "tl__labels",
        timelineDividers: "tl__dividers",
        timelineEvents: "tl__events",
        timelineLabel: "tl__label",
        timelineDivider: "tl__divider"
      }
    }), settings2);
    rootTimeline = parseEvent({
      title: "View",
      type: "container",
      start: options.start,
      end: options.end
    });
    timelineStart = parseToMinutes(options.timelineStart);
    timelineEnd = parseToMinutes(options.timelineEnd);
    const viewStart2 = rootTimeline.timelineEventDetails.startMinutes;
    const viewEnd2 = rootTimeline.timelineEventDetails.endMinutes;
    if (viewStart2 < timelineStart)
      timelineStart = viewStart2;
    if (viewEnd2 > timelineEnd)
      timelineEnd = viewEnd2;
    const viewDuration2 = viewEnd2 - viewStart2;
    ratio = timelineDuration() / viewDuration2;
    pivot = (timelineStart - viewStart2) / viewDuration2;
    setupContainerHTML();
    registerListeners(element);
    focus(rootTimeline, false);
  };
  const timelineDuration = () => {
    return timelineEnd - timelineStart;
  };
  const viewWidth = () => {
    return element.offsetWidth || 0;
  };
  const viewStart = () => {
    return timelineStart - viewDuration() * pivot;
  };
  const viewEnd = () => {
    return viewStart() + viewDuration();
  };
  const viewDuration = () => {
    return timelineDuration() / ratio;
  };
  const scaledZoomSpeed = () => {
    return options.zoomSpeed * ratio;
  };
  const getViewRatio = (minutes) => {
    return (minutes - viewStart()) / viewDuration();
  };
  const getTimelineRatio = (minutes) => {
    return (minutes - timelineStart) / timelineDuration();
  };
  const setRatio = (direction, deltaRatio) => {
    let newRatio = ratio - deltaRatio;
    if (direction === 1 /* Out */ && newRatio <= options.minZoom) {
      return false;
    }
    if (direction === -1 /* In */ && newRatio >= options.maxZoom) {
      return false;
    }
    ratio = newRatio;
    return true;
  };
  const setPivot = (deltaPivot) => {
    let newPivot = pivot + deltaPivot;
    if (newPivot >= 0) {
      newPivot = 0;
    }
    if (newPivot + ratio <= 1) {
      newPivot = 1 - ratio;
    }
    pivot = newPivot;
  };
  const onzoom = (direction, mouseX2timeline) => {
    const deltaRatio = direction * scaledZoomSpeed();
    const deltaPivot = mouseX2timeline * deltaRatio;
    if (setRatio(direction, deltaRatio))
      setPivot(deltaPivot);
    update();
  };
  const onmove = (deltaPivot) => {
    setPivot(deltaPivot * options.dragSpeed);
    update();
  };
  const focus = (timelineEvent, useAnimation = true, onfocused) => {
    if (!timelineEvent) {
      throw "first argument 'timelineEvent' of method 'zoom' must be an object";
    }
    if (!isITimelineEventWithDetails(timelineEvent)) {
      throw "first argument 'timelineEvent' of method 'zoom' must be an object of type ITimelineEventWithDetails";
    }
    currentTimeline = timelineEvent;
    zoomto(currentTimeline.timelineEventDetails.startMinutes, currentTimeline.timelineEventDetails.endMinutes, useAnimation, () => {
      element.dispatchEvent(
        new CustomEvent("focus.tl.event", {
          detail: currentTimeline,
          bubbles: false,
          cancelable: true
        })
      );
      if (onfocused)
        onfocused(currentTimeline);
    });
  };
  const reset = () => {
    currentTimeline = rootTimeline;
    zoomto(
      options.start ? parseToMinutes(options.start) : currentTimeline.timelineEventDetails.startMinutes,
      options.end ? parseToMinutes(options.end) : currentTimeline.timelineEventDetails.endMinutes
    );
  };
  const zoom = (timelineEvent, useAnimation = true, onzoomend) => {
    if (!timelineEvent) {
      throw "first argument 'timelineEvent' of method 'zoom' must be an object";
    }
    if (!isITimelineEventWithDetails(timelineEvent)) {
      throw "first argument 'timelineEvent' of method 'zoom' must be an object of type ITimelineEventWithDetails";
    }
    zoomto(timelineEvent.timelineEventDetails.startMinutes, timelineEvent.timelineEventDetails.endMinutes, useAnimation, () => {
      element.dispatchEvent(
        new CustomEvent("zoom.tl.event", {
          detail: timelineEvent,
          bubbles: false,
          cancelable: true
        })
      );
      if (onzoomend)
        onzoomend(timelineEvent);
    });
  };
  const zoomto = (startMinutes, endMinutes, useAnimation = true, onzoomend) => {
    if (!startMinutes) {
      throw "first argument 'startMinutes' of method 'zoomto' must be a number";
    }
    if (!endMinutes) {
      throw "second argument 'endMinutes' of method 'zoomto' must be a number";
    }
    const targetDurationExtension = (endMinutes - startMinutes) * 0.05;
    const targetStart = startMinutes - targetDurationExtension;
    const targetEnd = endMinutes + targetDurationExtension;
    const targetDuration = targetEnd - targetStart;
    const targetRatio = timelineDuration() / targetDuration;
    const zDirection = Math.sign(ratio - targetRatio);
    let back = zDirection > 0;
    let mouseX2Timeline = 0;
    if (back) {
      const offsetCenter = viewStart() + viewDuration() / 2;
      const offsetCenter2Target = (offsetCenter - targetStart) / targetDuration;
      const offsetCenterCorrected = viewStart() + viewDuration() * offsetCenter2Target;
      const offsetCenter2Timeline = getTimelineRatio(offsetCenterCorrected);
      mouseX2Timeline = offsetCenter2Timeline;
    } else {
      const targetCenter = targetStart + targetDuration / 2;
      const targetCenter2View = getViewRatio(targetCenter);
      const targetCenterCorrected = targetStart + targetDuration * targetCenter2View;
      const targetCenter2Timeline = getTimelineRatio(targetCenterCorrected);
      mouseX2Timeline = targetCenter2Timeline;
    }
    const animateZoom = () => {
      const stopZoom = () => {
        clearInterval(ratioTimer);
        const targetPivot = pivot - (targetStart - viewStart()) / viewDuration();
        const xDirection = Math.sign(targetPivot - pivot);
        const stopFocus = () => {
          clearInterval(pivotTimer);
          if (onzoomend)
            onzoomend();
        };
        const pivotTimer = setInterval(() => {
          onmove(xDirection * 10);
          if (xDirection < 0 && pivot < targetPivot)
            stopFocus();
          if (xDirection > 0 && pivot > targetPivot)
            stopFocus();
        }, 1);
      };
      const ratioTimer = setInterval(() => {
        onzoom(zDirection, mouseX2Timeline);
        if (zDirection < 0 && ratio > targetRatio)
          stopZoom();
        if (zDirection > 0 && ratio < targetRatio)
          stopZoom();
      }, 1);
    };
    if (useAnimation) {
      animateZoom();
    } else {
      ratio = targetRatio;
      pivot = (timelineStart - targetStart) / targetDuration;
      update();
    }
  };
  const registerListeners = (element2) => {
    window.addEventListener(
      "resize",
      () => {
        update();
      },
      { passive: true }
    );
    element2.addEventListener(
      "wheel",
      (event) => {
        if (event.defaultPrevented)
          return;
        var direction = Math.sign(event.deltaY);
        const leftRatio = event.target.attributes["starttime"] ? getViewRatio(event.target.attributes["starttime"]) : 0;
        const offsetX = leftRatio * element2.getBoundingClientRect().width + event.offsetX;
        const mouseX2view = offsetX / viewWidth();
        const mouseX2timeline = (mouseX2view - pivot) / ratio;
        onzoom(direction, mouseX2timeline);
      },
      { passive: true }
    );
    var hammertime = new import_hammerjs.default(element2);
    hammertime.get("pinch").set({ enable: true });
    hammertime.on("pan", function(ev) {
      console.log("pan", ev);
    });
    hammertime.on("pinch", function(ev) {
      console.log("pinch", ev);
    });
    let dragStartX, dragStartY;
    let inDrag = false;
    let enableCall = true;
    element2.addEventListener(
      "mousedown",
      (e) => {
        inDrag = true;
        dragStartX = e.pageX;
        dragStartY = e.pageY;
      },
      { passive: true }
    );
    element2.addEventListener(
      "mousemove",
      (event) => {
        if (!inDrag || !enableCall) {
          return;
        }
        enableCall = false;
        const deltaScrollLeft = event.pageX - dragStartX;
        if (deltaScrollLeft)
          onmove(deltaScrollLeft);
        dragStartX = event.pageX;
        dragStartY = event.pageY;
        setTimeout(() => enableCall = true, 10);
      },
      { passive: true }
    );
    element2.addEventListener(
      "mouseup",
      () => {
        inDrag = false;
      },
      { passive: true }
    );
  };
  const setupEventsHTML = (parentEvent) => {
    const eventsFragment = document.createDocumentFragment();
    for (const [key, timelineEvent] of Object.entries(parentEvent.timelineEventDetails.children)) {
      if (!timelineEvent || !timelineEvent.timelineEventDetails)
        continue;
      if (timelineEvent.timelineEventDetails.startMinutes >= viewEnd())
        continue;
      if (timelineEvent.timelineEventDetails.endMinutes <= viewStart())
        continue;
      const focused = false;
      if (focused)
        continue;
      const viewInside = isViewInside(timelineEvent);
      const createTimelineEventHTML = () => {
        const parentLevel = timelineEvent.timelineEventDetails.parentId ? parentEvent.timelineEventDetails.level : 0;
        const levelFactor = timelineEvent.timelineEventDetails.level * 1.5;
        const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.timelineEventDetails.startMinutes);
        const widthRatio = viewInside ? 100 : timelineEvent.timelineEventDetails.durationMinutes / viewDuration() * 100;
        const bgcolor = focused ? [
          timelineEvent.timelineEventDetails.color[0],
          timelineEvent.timelineEventDetails.color[1],
          timelineEvent.timelineEventDetails.color[2],
          0.1
        ] : timelineEvent.timelineEventDetails.color;
        const eventHTML = document.createElement("div");
        eventHTML.style.bottom = `${levelFactor * options.eventHeight}px`;
        eventHTML.style.minHeight = `${options.eventHeight}px`;
        eventHTML.style.borderRadius = "5px";
        eventHTML.style.boxSizing = "border-box";
        eventHTML.style.cursor = "pointer";
        eventHTML.style.backgroundColor = `rgb(${bgcolor.join(",")})`;
        eventHTML.style.zIndex = timelineEvent.timelineEventDetails.depth.toString();
        eventHTML.style.left = leftRatio * 100 + "%";
        eventHTML.style.width = widthRatio + "%";
        eventHTML.style.position = "absolute";
        eventHTML.style.minWidth = "5px";
        eventHTML.title = timelineEvent.title;
        eventHTML.classList.add(options.classNames.timelineEvent);
        eventHTML.setAttribute("level", timelineEvent.timelineEventDetails.level.toString());
        eventHTML.setAttribute("depth", timelineEvent.timelineEventDetails.depth.toString());
        eventHTML.setAttribute("height", timelineEvent.timelineEventDetails.height.toString());
        eventHTML.attributes["starttime"] = viewInside ? viewStart() : timelineEvent.timelineEventDetails.startMinutes;
        eventHTML.addEventListener("click", (e) => {
          element.dispatchEvent(
            new CustomEvent("click.tl.event", {
              detail: timelineEvent,
              bubbles: false,
              cancelable: true
            })
          );
          if (options.autoZoom) {
            zoom(timelineEvent);
          }
        });
        eventHTML.addEventListener("mouseenter", (e) => {
          element.dispatchEvent(
            new CustomEvent("mouseenter.tl.event", {
              detail: timelineEvent,
              bubbles: false,
              cancelable: true
            })
          );
        });
        eventHTML.addEventListener("mouseleave", (e) => {
          element.dispatchEvent(
            new CustomEvent("mouseleave.tl.event", {
              detail: timelineEvent,
              bubbles: false,
              cancelable: true
            })
          );
        });
        eventHTML.addEventListener("dblclick", (e) => {
          element.dispatchEvent(
            new CustomEvent("dblclick.tl.event", {
              detail: timelineEvent,
              bubbles: false,
              cancelable: true
            })
          );
        });
        return eventHTML;
      };
      const createBackgroundEventHTML = () => {
        const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.timelineEventDetails.startMinutes);
        const widthRatio = viewInside ? 100 : timelineEvent.timelineEventDetails.durationMinutes / viewDuration() * 100;
        const bgcolor = timelineEvent.timelineEventDetails.color.length === 3 ? [...timelineEvent.timelineEventDetails.color, 0.1] : timelineEvent.timelineEventDetails.color;
        const eventHTML = document.createElement("div");
        eventHTML.style.left = leftRatio * 100 + "%";
        eventHTML.style.width = widthRatio + "%";
        eventHTML.style.position = "absolute";
        eventHTML.style.minWidth = "5px";
        eventHTML.style.overflow = "hidden";
        eventHTML.style.bottom = `0px`;
        eventHTML.style.minHeight = `100%`;
        eventHTML.style.backgroundColor = `rgb(${bgcolor.join(",")})`;
        eventHTML.classList.add(options.classNames.timelineEvent);
        eventHTML.attributes["starttime"] = viewInside ? viewStart() : timelineEvent.timelineEventDetails.startMinutes;
        const titleHTML = document.createElement("div");
        titleHTML.innerText = timelineEvent.title;
        titleHTML.style.whiteSpace = "nowrap";
        titleHTML.style.pointerEvents = "none";
        titleHTML.style.userSelect = "none";
        titleHTML.classList.add(options.classNames.timelineEventTitle);
        eventHTML.appendChild(titleHTML);
        return eventHTML;
      };
      switch (timelineEvent.timelineEventDetails.type) {
        case "container": {
          eventsFragment.append(setupEventsHTML(timelineEvent));
          break;
        }
        case "timeline": {
          eventsFragment.append(createTimelineEventHTML());
          break;
        }
        case "background": {
          eventsFragment.append(createBackgroundEventHTML());
          break;
        }
      }
    }
    return eventsFragment;
  };
  const setupContainerHTML = () => {
    element.style.position = "relative";
    element.style.overflow = "hidden";
    element.style.minHeight = "3rem";
    const existingLabelContainer = element.querySelector(`.${options.classNames.timelineLabels}`);
    labelContainer = existingLabelContainer || document.createElement("div");
    if (!existingLabelContainer)
      element.appendChild(labelContainer);
    labelContainer.classList.add(options.classNames.timelineLabels);
    labelContainer.style.width = "100%";
    labelContainer.style.height = "50px";
    labelContainer.style.textAlign = "center";
    labelContainer.style.position = "absolute";
    labelContainer.style.pointerEvents = "none";
    labelContainer.style.userSelect = "none";
    switch (options.position) {
      case "top":
        labelContainer.style.top = "0";
        break;
      default:
        labelContainer.style.bottom = "0";
    }
    const existingDividerContainer = element.querySelector(`.${options.classNames.timelineDividers}`);
    dividerContainer = existingDividerContainer || document.createElement("div");
    if (!existingDividerContainer)
      element.appendChild(dividerContainer);
    dividerContainer.classList.add(options.classNames.timelineDividers);
    dividerContainer.style.width = "100%";
    dividerContainer.style.height = "100%";
    dividerContainer.style.position = "absolute";
    dividerContainer.style.zIndex = "-2";
    dividerContainer.style.bottom = "0";
    const existingEventsContainer = element.querySelector(`.${options.classNames.timelineEvents}`);
    eventsContainer = existingEventsContainer || document.createElement("div");
    if (!existingEventsContainer)
      element.appendChild(eventsContainer);
    eventsContainer.classList.add(options.classNames.timelineEvents);
    eventsContainer.style.position = "absolute";
    eventsContainer.style.bottom = "50px";
    eventsContainer.style.height = "calc(100% - 50px)";
    eventsContainer.style.width = "100%";
  };
  const formatDateLabel = (minutes) => {
    const yearsCount = Math.floor(minutes / MINUTES_IN_YEAR);
    const currentYear = yearsCount + 1970;
    const currentYearLessThan5Digits = currentYear > -1e4 && currentYear < 1e4;
    const currentYearString = currentYearLessThan5Digits ? currentYear.toString() : currentYear.toLocaleString("en-US", {
      notation: "compact",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    const currentRemainder = Math.abs(minutes - yearsCount * MINUTES_IN_YEAR);
    const momentInValidateRange = minutes > 27e4 * MINUTES_IN_YEAR * -1 && minutes < 27e4 * MINUTES_IN_YEAR;
    const date = momentInValidateRange ? new Date(minutes * 6e4) : new Date(currentRemainder * 6e4);
    if (viewDuration() < SHOW_TIME_DURATION) {
      return [
        Intl.DateTimeFormat(void 0, {
          month: "short",
          day: "numeric"
        }).format(date),
        currentYearString,
        Intl.DateTimeFormat(void 0, {
          hour: "numeric",
          minute: "numeric"
        }).format(date)
      ].join(" ");
    }
    if (viewDuration() < SHOW_DAY_DURATION) {
      return [
        Intl.DateTimeFormat(void 0, {
          month: "short",
          day: "numeric"
        }).format(date),
        currentYearString
      ].join(" ");
    }
    if (viewDuration() < SHOW_MONTH_DURATION) {
      return [
        Intl.DateTimeFormat(void 0, {
          month: "short"
        }).format(date),
        currentYearString
      ].join(" ");
    }
    return currentYearString;
  };
  const update = () => {
    if (!element || !currentTimeline)
      return;
    const currentLevel = Math.floor(ratio);
    const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
    const granularity = 1 / (options.labelCount + 1);
    const timelineViewDifference = viewStart() - timelineStart;
    const timestampDistance = timelineDuration() * granularity;
    const currentTimestampDistanceByLevel = timestampDistance / iterator;
    const integerDifFraction = Math.floor(timelineViewDifference / currentTimestampDistanceByLevel);
    const currentDif = integerDifFraction * currentTimestampDistanceByLevel;
    const labels = document.createDocumentFragment();
    const dividers = document.createDocumentFragment();
    for (let i = 0; i < options.labelCount + 2; i++) {
      const labelTime = (i + 1) * currentTimestampDistanceByLevel + timelineStart + currentDif - currentTimestampDistanceByLevel;
      const dividerTime = labelTime + currentTimestampDistanceByLevel / 2;
      const labelViewRatio = getViewRatio(labelTime);
      const labelViewLeftPosition = labelViewRatio * 100;
      const dividerViewRatio = getViewRatio(dividerTime);
      const dividerViewLeftPosition = dividerViewRatio * 100;
      const label = document.createElement("div");
      label.classList.add(options.classNames.timelineLabel);
      label.style.left = labelViewLeftPosition + "%";
      label.style.top = "50%";
      label.style.transform = "translate(calc(-50%), calc(-50%))";
      label.style.textAlign = "center";
      label.style.position = "absolute";
      label.style.zIndex = "-1";
      label.style.width = granularity * 100 + "%";
      label.innerHTML = formatDateLabel(labelTime);
      labels.appendChild(label);
      const divider = document.createElement("div");
      divider.classList.add(options.classNames.timelineDivider);
      divider.style.left = dividerViewLeftPosition + "%";
      divider.style.textAlign = "center";
      divider.style.position = "absolute";
      divider.style.height = "100%";
      divider.style.zIndex = "-10";
      divider.innerHTML = "";
      dividers.appendChild(divider);
    }
    labelContainer.innerHTML = "";
    labelContainer.appendChild(labels);
    dividerContainer.innerHTML = "";
    dividerContainer.appendChild(dividers);
    const eventsHtml = setupEventsHTML(currentTimeline);
    eventsContainer.innerHTML = "";
    if (eventsHtml)
      eventsContainer.appendChild(eventsHtml);
    element.dispatchEvent(
      new CustomEvent("update.tl.container", {
        detail: {
          options,
          viewStartDate: viewStart(),
          viewEndDate: viewEnd(),
          viewDuration: viewDuration(),
          ratio,
          pivot
        },
        bubbles: false,
        cancelable: true,
        composed: false
      })
    );
  };
  const parseToMinutes = (input) => {
    if (input === void 0)
      return void 0;
    const parseDateArray = (input2) => {
      const date = new Date();
      date.setDate(input2[2] ? input2[2] : 1);
      date.setMonth(input2[1] ? input2[1] - 1 : 0);
      date.setHours(input2[3] ? input2[3] : 0);
      date.setMinutes(input2[4] ? input2[4] : 0);
      date.setSeconds(0);
      if (!input2[0]) {
        return date.getTime() / 6e4;
      }
      if (input2[0] && input2[0] > -27e4 && input2[0] < 27e4) {
        date.setFullYear(input2[0]);
        return date.getTime() / 6e4;
      }
      const dateYearInMinutes = 525948.766 * input2[0];
      return dateYearInMinutes + date.getTime() / 6e4;
    };
    const parseDateString = (input2) => {
      switch (input2) {
        case "now":
          return parseDateArray([]);
        default:
          const years = input2.match(/y$/) ? Number(input2.replace(/y$/, "")) : NaN;
          if (!isNaN(years)) {
            return parseDateArray([years + 1970]);
          }
          const yearsK = input2.match(/K$/) ? Number(input2.replace(/K$/, "")) : NaN;
          if (!isNaN(yearsK)) {
            return parseDateArray([yearsK * 1e3]);
          }
          const yearsM = input2.match(/M$/) ? Number(input2.replace(/M$/, "")) : NaN;
          if (!isNaN(yearsM)) {
            return parseDateArray([yearsM * 1e6]);
          }
          const yearsB = input2.match(/B$/) ? Number(input2.replace(/B$/, "")) : NaN;
          if (!isNaN(yearsB)) {
            return parseDateArray([yearsB * 1e9]);
          }
          const yearsBC = input2.match(/bc$/) ? Number(input2.replace(/bc$/, "")) : NaN;
          if (!isNaN(yearsBC)) {
            return parseDateArray([-yearsBC]);
          }
          const yearsAD = input2.match(/ad$/) ? Number(input2.replace(/ad$/, "")) : NaN;
          if (!isNaN(yearsAD)) {
            return parseDateArray([yearsAD]);
          }
          const minutes = Number(input2);
          if (!isNaN(minutes)) {
            return new Date().getTime() / 6e4 + minutes * 6e4;
          }
          const timestamp = Date.parse(input2);
          if (isNaN(timestamp))
            return new Date().getTime() / 6e4;
          return timestamp / 6e4;
      }
    };
    if (Array.isArray(input)) {
      let inputArray = input;
      if (inputArray.length === 0)
        throw new Error("argument Array cannot be empty");
      const isNumberArray = inputArray.every((value) => {
        return typeof value === "number";
      });
      if (!isNumberArray)
        throw new Error("input Array must contain only numbers");
      return parseDateArray(inputArray);
    }
    if (typeof input === "object" && input.constructor.name === "Date") {
      return input.getTime() / 6e4;
    }
    if (typeof input === "string") {
      return parseDateString(input);
    }
    if (typeof input === "number") {
      return new Date(input).getTime() / 6e4;
    }
    return void 0;
  };
  const calcStart = (tl, parsedChildren) => {
    return tl.timelineEventDetails.startMinutes ? parsedChildren && parsedChildren.length ? Math.min(tl.timelineEventDetails.startMinutes, parsedChildren[0].timelineEventDetails.startMinutes) : tl.timelineEventDetails.startMinutes : parsedChildren && parsedChildren.length ? parsedChildren[0].timelineEventDetails.startMinutes : void 0;
  };
  const calcEnd = (tl, parsedChildren) => {
    return tl.timelineEventDetails.endMinutes ? tl.timelineEventDetails.endMinutes : tl.duration && !isNaN(Number(tl.duration)) ? tl.timelineEventDetails.startMinutes + Number(tl.duration) : parsedChildren && parsedChildren.length ? Math.max.apply(
      1,
      parsedChildren.map((child) => child.timelineEventDetails.endMinutes)
    ) : tl.timelineEventDetails.startMinutes + 1;
  };
  const calcLevel = (timelineEvent, parent) => {
    let level = 0;
    for (const eventLevel in parent.timelineEventDetails.levelMatrix) {
      level = Number(eventLevel);
      if (timelineEvent.timelineEventDetails.startMinutes > parent.timelineEventDetails.levelMatrix[eventLevel].time) {
        for (let i = 0; i < timelineEvent.timelineEventDetails.height; i++) {
          parent.timelineEventDetails.levelMatrix[(level + i).toString()] = {
            height: timelineEvent.timelineEventDetails.height,
            time: timelineEvent.timelineEventDetails.endMinutes
          };
        }
        return level;
      }
    }
    level++;
    for (let i = 0; i < timelineEvent.timelineEventDetails.height; i++) {
      parent.timelineEventDetails.levelMatrix[(level + i).toString()] = {
        height: timelineEvent.timelineEventDetails.height,
        time: timelineEvent.timelineEventDetails.endMinutes
      };
    }
    return level;
  };
  const addEvents = (parent, ...children) => {
    const parsedChildren = children.map((tl) => parseEvent(tl, parent)).filter((tl) => !!tl);
    if (parsedChildren && parsedChildren.length && parent) {
      parsedChildren.sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);
      parent.timelineEventDetails.startMinutes = calcStart(parent, parsedChildren);
      parent.timelineEventDetails.endMinutes = calcEnd(parent, parsedChildren);
      parent.timelineEventDetails.durationMinutes = parent.timelineEventDetails.endMinutes - parent.timelineEventDetails.startMinutes;
      parsedChildren.forEach((childEvent, i) => {
        parent.timelineEventDetails.children[childEvent.timelineEventDetails.id] = childEvent;
        childEvent.timelineEventDetails.level = ["timeline", "container"].includes(childEvent.timelineEventDetails.type) ? calcLevel(childEvent, parent) : 0;
      });
    }
    parent.timelineEventDetails.height = parsedChildren.length ? Math.max(...parsedChildren.map((child) => child.timelineEventDetails.level)) : 1;
  };
  const parseEvent = (timelineEvent, parent) => {
    if (!timelineEvent) {
      console.warn("Event object is empty");
      return void 0;
    }
    const timelineEventWithDetails = __spreadProps(__spreadValues({}, timelineEvent), {
      timelineEventDetails: {
        id: crypto.randomUUID(),
        durationMinutes: 0,
        type: timelineEvent.type || "timeline",
        open: timelineEvent.open || false,
        level: 1,
        step: 0,
        score: 0,
        height: 1,
        children: {},
        depth: parent ? parent.timelineEventDetails.depth + 1 : 0,
        parentId: parent == null ? void 0 : parent.timelineEventDetails.id,
        color: timelineEvent.color || options.defaultColor,
        startMinutes: parseToMinutes(timelineEvent.start),
        endMinutes: parseToMinutes(timelineEvent.end),
        levelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } }
      }
    });
    if (timelineEvent.events && timelineEvent.events.length) {
      addEvents(timelineEventWithDetails, ...timelineEvent.events);
    }
    timelineEventWithDetails.timelineEventDetails.startMinutes = calcStart(timelineEventWithDetails);
    if (!timelineEventWithDetails.timelineEventDetails.startMinutes) {
      console.warn("Missing start property on event - skipping", timelineEvent);
      return void 0;
    }
    timelineEventWithDetails.timelineEventDetails.endMinutes = calcEnd(timelineEventWithDetails);
    timelineEventWithDetails.timelineEventDetails.durationMinutes = timelineEventWithDetails.timelineEventDetails.endMinutes - timelineEventWithDetails.timelineEventDetails.startMinutes;
    return timelineEventWithDetails;
  };
  const parseTimelineHTML = (input) => {
    let result = [];
    const timelineEvents = input.querySelectorAll(".timelineEvent");
    if (timelineEvents) {
      timelineEvents.forEach((timelineEvent) => {
        try {
          result.push(__spreadProps(__spreadValues({}, timelineEvent.attributes), {
            events: parseTimelineHTML(timelineEvent)
          }));
        } catch (error) {
          console.error(error, "timelineEvent");
        }
      });
    }
    return result;
  };
  init(elementIdentifier, settings);
  return {
    focus,
    zoom,
    load,
    add,
    reset
  };
};
export {
  Timeline
};
/*! Hammer.JS - v2.0.7 - 2016-04-22
 * http://hammerjs.github.io/
 *
 * Copyright (c) 2016 Jorik Tangelder;
 * Licensed under the MIT license */
