var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
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

// src/dater.ts
var Dater = class {
  constructor(input) {
    this.parseArray = (input) => {
      this.date.setFullYear(input[0] || this.date.getFullYear());
      this.date.setMonth(input[1] ? input[1] + 1 : 0);
      this.date.setDate(input[2] ? input[2] : 1);
      this.date.setHours(input[3] ? input[3] : 0);
      this.date.setMinutes(input[4] ? input[4] : 0);
    };
    this.parseMinutes = (minutes) => {
      this.date = new Date(minutes * 6e4);
    };
    this.parseString = (input) => {
      switch (input) {
        case "-100y":
          this.date.setFullYear(this.date.getFullYear() - 100);
      }
    };
    this.date = new Date();
    if (input === void 0)
      return;
    if (Array.isArray(input)) {
      let inputArray = input;
      if (inputArray.length === 0)
        throw new Error("argument Array cannot be empty");
      const isNumberArray = inputArray.every((value) => {
        return typeof value === "number";
      });
      if (!isNumberArray)
        throw new Error("input Array must contain only numbers");
      this.parseArray(inputArray);
    }
    if (typeof input === "string") {
      this.parseString(input);
    }
    if (typeof input === "number") {
      this.parseMinutes(input);
    }
  }
  toJSON() {
    return {
      date: this.date,
      asMinutes: this.asMinutes
    };
  }
  get asArray() {
    return [this.date.getFullYear(), this.date.getMonth(), this.date.getDate(), this.date.getHours(), this.date.getMinutes()];
  }
  get asMinutes() {
    return Math.floor(this.date.getTime() / 6e4);
  }
};

// src/timeline.ts
var Timeline = class {
  get timelineDurationMinutes() {
    return this.timelineEnd.asMinutes - this.timelineStart.asMinutes;
  }
  get viewWidth() {
    var _a;
    return ((_a = this.element) == null ? void 0 : _a.offsetWidth) || 0;
  }
  get viewStartMinutes() {
    return this.timelineStart.asMinutes - this.viewDurationMinutes * this.options.pivot;
  }
  get viewEndMinutes() {
    return this.viewStartMinutes + this.viewDurationMinutes;
  }
  get viewDurationMinutes() {
    return this.timelineDurationMinutes / this.options.ratio;
  }
  get viewStart() {
    return new Dater(this.viewStartMinutes);
  }
  get viewEnd() {
    return new Dater(this.viewEndMinutes);
  }
  view2MinutesRatio(minutes) {
    return (minutes - this.viewStartMinutes) / this.viewDurationMinutes;
  }
  setRatio(direction, deltaRatio) {
    let newRatio = this.options.ratio - deltaRatio;
    const ratioMin = this.options.minZoom;
    if (direction === 1 /* Out */ && newRatio <= ratioMin) {
      return false;
    }
    const ratioMax = this.options.maxZoom;
    if (direction === -1 /* In */ && newRatio >= ratioMax) {
      return false;
    }
    this.options.ratio = newRatio;
    return true;
  }
  setPivot(deltaPivot) {
    let newPivot = this.options.pivot + deltaPivot;
    if (newPivot >= 0) {
      newPivot = 0;
    }
    if (newPivot + this.options.ratio <= 1) {
      newPivot = 1 - this.options.ratio;
    }
    this.options.pivot = newPivot;
  }
  zoom(direction, mouseX) {
    this.options.mouseX = mouseX;
    const zoomSpeedScale = this.options.zoomSpeed * this.options.ratio;
    const deltaRatio = direction * zoomSpeedScale;
    const mouseX2view = (this.options.mouseX || 0) / this.viewWidth;
    const mouseX2timeline = (mouseX2view - this.options.pivot) / this.options.ratio;
    const deltaPivot = mouseX2timeline * deltaRatio;
    if (this.setRatio(direction, deltaRatio))
      this.setPivot(deltaPivot);
    this.update();
  }
  move(deltaPivot) {
    this.setPivot(deltaPivot);
    this.update();
  }
  registerListeners(element) {
    const vm = this;
    window.addEventListener(
      "resize",
      function() {
        vm.update();
      },
      { passive: true }
    );
    element.addEventListener(
      "wheel",
      function(event) {
        event.preventDefault();
        var direction = Math.sign(event.deltaY);
        vm.zoom(direction, event.offsetX);
      },
      { passive: false }
    );
    let dragStartX, dragStartY;
    let inDrag = false;
    element.addEventListener(
      "mousedown",
      function(e) {
        inDrag = true;
        dragStartX = e.pageX;
        dragStartY = e.pageY;
      },
      { passive: false }
    );
    element.addEventListener(
      "mousemove",
      function(e) {
        if (!inDrag) {
          return;
        }
        const deltaScrollLeft = (e.pageX - dragStartX) * vm.options.dragSpeed;
        vm.move(deltaScrollLeft);
        dragStartX = e.pageX;
        dragStartY = e.pageY;
      },
      { passive: false }
    );
    document.addEventListener(
      "mouseup",
      function() {
        inDrag = false;
      },
      { passive: false }
    );
  }
  setupHTML() {
    this.element.style.position = "relative";
    this.element.style.overflow = "hidden";
    this.labelContainer = document.createElement("div");
    this.labelContainer.className = "timelineLabelContainer";
    this.labelContainer.style.width = "100%";
    this.labelContainer.style.height = "3rem";
    this.labelContainer.style.textAlign = "center";
    this.labelContainer.style.position = "absolute";
    this.labelContainer.style.zIndex = "-1";
    switch (this.options.position) {
      case "top":
        this.labelContainer.style.top = "0";
        break;
      case "center":
        this.labelContainer.style.top = "50%";
        this.labelContainer.style.transform = "translate(0, calc(-50%))";
        break;
      default:
        this.labelContainer.style.bottom = "0";
    }
    this.element.appendChild(this.labelContainer);
    this.dividerContainer = document.createElement("div");
    this.dividerContainer.className = "timelineDividerContainer";
    this.dividerContainer.style.width = "100%";
    this.dividerContainer.style.height = "100%";
    this.dividerContainer.style.position = "absolute";
    this.dividerContainer.style.zIndex = "-10";
    this.element.appendChild(this.dividerContainer);
  }
  format(minutes) {
    const moment = new Dater(minutes);
    if (this.viewDurationMinutes < 1440 * 4) {
      return Intl.DateTimeFormat(void 0, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
      }).format(moment.date);
    }
    if (this.viewDurationMinutes < 10080 * 6) {
      return Intl.DateTimeFormat(void 0, {
        year: "numeric",
        month: "short",
        day: "numeric"
      }).format(moment.date);
    }
    if (this.viewDurationMinutes < 43829.0639 * 18) {
      return Intl.DateTimeFormat(void 0, {
        year: "numeric",
        month: "short"
      }).format(moment.date);
    }
    return moment.date.getFullYear().toString();
  }
  update() {
    if (!this.element)
      return;
    const currentLevel = Math.floor(this.options.ratio);
    const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
    const granularity = 1 / (this.options.labelCount + 1);
    const timelineDurationMinutesExtended = this.timelineDurationMinutes * 1.2;
    const timelineStartMomentExtended = this.timelineStart.asMinutes - this.timelineDurationMinutes * 0.1;
    const timelineViewDifferenceMinutes = this.viewStartMinutes - timelineStartMomentExtended;
    const timestampDistanceMinutes = timelineDurationMinutesExtended * granularity;
    const currentTimestampDistanceByLevelMinutes = timestampDistanceMinutes / iterator;
    const integerDifFraction = Math.floor(timelineViewDifferenceMinutes / currentTimestampDistanceByLevelMinutes);
    const currentDifInMinutes = integerDifFraction * currentTimestampDistanceByLevelMinutes;
    const labels = document.createDocumentFragment();
    const dividers = document.createDocumentFragment();
    for (let i = 0; i < this.options.labelCount + 2; i++) {
      const labelMinutes = (i + 1) * currentTimestampDistanceByLevelMinutes + timelineStartMomentExtended + currentDifInMinutes - currentTimestampDistanceByLevelMinutes;
      const dividerMinutes = labelMinutes + currentTimestampDistanceByLevelMinutes / 2;
      const labelViewRatio = this.view2MinutesRatio(labelMinutes);
      const labelViewLeftPosition = labelViewRatio * 100;
      const dividerViewRatio = this.view2MinutesRatio(dividerMinutes);
      const dividerViewLeftPosition = dividerViewRatio * 100;
      const label = document.createElement("div");
      label.className = "timelineLabel";
      label.style.left = labelViewLeftPosition + "%";
      label.style.top = "50%";
      label.style.transform = "translate(calc(-50%), calc(-50%))";
      label.style.textAlign = "center";
      label.style.position = "absolute";
      label.style.zIndex = "-1";
      label.style.width = granularity * 100 + "%";
      label.innerHTML = this.format(labelMinutes);
      labels.appendChild(label);
      const divider = document.createElement("div");
      divider.className = "timelineDivider";
      divider.style.left = dividerViewLeftPosition + "%";
      divider.style.textAlign = "center";
      divider.style.position = "absolute";
      divider.style.height = "100%";
      divider.style.zIndex = "-10";
      divider.innerHTML = "";
      dividers.appendChild(divider);
    }
    this.labelContainer.innerHTML = "";
    this.labelContainer.appendChild(labels);
    this.dividerContainer.innerHTML = "";
    this.dividerContainer.appendChild(dividers);
    const update = new CustomEvent("update", {
      detail: { timeline: this.toJSON() },
      bubbles: true,
      cancelable: true,
      composed: false
    });
    this.element.dispatchEvent(update);
    if (this.callback)
      this.callback(this);
  }
  constructor(element, options, callback) {
    if (!element)
      throw new Error(`Element argument is empty. Please add DOM element | selector as first arg`);
    if (typeof element === "string") {
      const elem = document.querySelector(element);
      if (!elem)
        throw new Error(`Selector could not be found [${element}]`);
      this.element = elem;
    }
    if (element instanceof Element) {
      this.element = element;
    }
    this.options = __spreadValues(__spreadValues({}, {
      labelCount: 5,
      ratio: 1,
      pivot: 0,
      zoomSpeed: 0.025,
      dragSpeed: 3e-3,
      start: "-100y",
      end: "now",
      minZoom: 1,
      maxZoom: 1e5,
      mouseX: 0,
      position: "bottom"
    }), options);
    this.timelineStart = new Dater(this.options.start);
    this.timelineEnd = new Dater(this.options.end);
    this.setupHTML();
    this.registerListeners(this.element);
    this.callback = callback;
    this.update();
  }
  toJSON() {
    return {
      options: this.options,
      timelineStart: this.timelineStart,
      timelineEnd: this.timelineEnd,
      timelineDurationMinutes: this.timelineDurationMinutes,
      viewStart: this.viewStart,
      viewEnd: this.viewEnd,
      viewDurationMinutes: this.viewDurationMinutes
    };
  }
};
export {
  Timeline
};
