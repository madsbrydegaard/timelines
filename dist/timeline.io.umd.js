(() => {
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

  // src/timeline.io.ts
  var Timeline = class {
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
        zoomSpeed: 0.025,
        dragSpeed: 3e-3,
        startDate: "-100y",
        endDate: "10y",
        timelineStartDate: "-1000y",
        timelineEndDate: "1000y",
        minZoom: 1,
        maxZoom: 1e11,
        position: "bottom"
      }), options);
      this.timelineStart = this.parseDate(this.options.timelineStartDate);
      this.timelineEnd = this.parseDate(this.options.timelineEndDate);
      const start = this.parseDate(this.options.startDate);
      const end = this.parseDate(this.options.endDate);
      if (start.getTime() < this.timelineStart.getTime())
        this.timelineStart = start;
      if (end.getTime() > this.timelineEnd.getTime())
        this.timelineEnd = end;
      const duration = end.getTime() - start.getTime();
      this.ratio = this.timelineDuration / duration;
      this.pivot = (this.timelineStart.getTime() - start.getTime()) / duration;
      this.setupHTML();
      this.registerListeners(this.element);
      this.callback = callback;
      this.update();
    }
    get timelineDuration() {
      return this.timelineEnd.getTime() - this.timelineStart.getTime();
    }
    get viewWidth() {
      var _a;
      return ((_a = this.element) == null ? void 0 : _a.offsetWidth) || 0;
    }
    get start() {
      return this.timelineStart.getTime() - this.duration * this.pivot;
    }
    get end() {
      return this.start + this.duration;
    }
    get duration() {
      return this.timelineDuration / this.ratio;
    }
    get startDate() {
      return new Date(this.start);
    }
    get endDate() {
      return new Date(this.end);
    }
    view2TimeRatio(milliseconds) {
      return (milliseconds - this.start) / this.duration;
    }
    setRatio(direction, deltaRatio) {
      let newRatio = this.ratio - deltaRatio;
      if (direction === 1 /* Out */ && newRatio <= this.options.minZoom) {
        return false;
      }
      if (direction === -1 /* In */ && newRatio >= this.options.maxZoom) {
        return false;
      }
      this.ratio = newRatio;
      return true;
    }
    setPivot(deltaPivot) {
      let newPivot = this.pivot + deltaPivot;
      if (newPivot >= 0) {
        newPivot = 0;
      }
      if (newPivot + this.ratio <= 1) {
        newPivot = 1 - this.ratio;
      }
      this.pivot = newPivot;
    }
    zoom(direction, mouseX) {
      const zoomSpeedScale = this.options.zoomSpeed * this.ratio;
      const deltaRatio = direction * zoomSpeedScale;
      const mouseX2view = (mouseX || 0) / this.viewWidth;
      const mouseX2timeline = (mouseX2view - this.pivot) / this.ratio;
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
      this.element.innerHTML = "";
      this.element.style.position = "relative";
      this.element.style.overflow = "hidden";
      this.element.style.minHeight = "3rem";
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
    format(milliseconds) {
      const moment = new Date(milliseconds);
      if (this.duration < 1440 * 6e5 * 4) {
        return Intl.DateTimeFormat(void 0, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "numeric"
        }).format(moment);
      }
      if (this.duration < 10080 * 6e5 * 6) {
        return Intl.DateTimeFormat(void 0, {
          year: "numeric",
          month: "short",
          day: "numeric"
        }).format(moment);
      }
      if (this.duration < 43829.0639 * 6e5 * 18) {
        return Intl.DateTimeFormat(void 0, {
          year: "numeric",
          month: "short"
        }).format(moment);
      }
      return moment.getFullYear().toString();
    }
    update() {
      if (!this.element)
        return;
      const currentLevel = Math.floor(this.ratio);
      const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
      const granularity = 1 / (this.options.labelCount + 1);
      const timelineViewDifference = this.start - this.timelineStart.getTime();
      const timestampDistance = this.timelineDuration * granularity;
      const currentTimestampDistanceByLevel = timestampDistance / iterator;
      const integerDifFraction = Math.floor(timelineViewDifference / currentTimestampDistanceByLevel);
      const currentDif = integerDifFraction * currentTimestampDistanceByLevel;
      const labels = document.createDocumentFragment();
      const dividers = document.createDocumentFragment();
      for (let i = 0; i < this.options.labelCount + 2; i++) {
        const labelTime = (i + 1) * currentTimestampDistanceByLevel + this.timelineStart.getTime() + currentDif - currentTimestampDistanceByLevel;
        const dividerTime = labelTime + currentTimestampDistanceByLevel / 2;
        const labelViewRatio = this.view2TimeRatio(labelTime);
        const labelViewLeftPosition = labelViewRatio * 100;
        const dividerViewRatio = this.view2TimeRatio(dividerTime);
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
        label.innerHTML = this.format(labelTime);
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
    parseDate(input) {
      if (input === void 0)
        return new Date();
      if (Array.isArray(input)) {
        let inputArray = input;
        if (inputArray.length === 0)
          throw new Error("argument Array cannot be empty");
        const isNumberArray = inputArray.every((value) => {
          return typeof value === "number";
        });
        if (!isNumberArray)
          throw new Error("input Array must contain only numbers");
        return this.parseDateArray(inputArray);
      }
      if (typeof input === "object" && input.constructor.name === "Date") {
        return input;
      }
      if (typeof input === "string") {
        return this.parseDateString(input);
      }
      if (typeof input === "number") {
        return new Date(input);
      }
    }
    parseDateArray(input) {
      const date = new Date();
      date.setFullYear(input[0] || date.getFullYear());
      date.setMonth(input[1] ? input[1] - 1 : 0);
      date.setDate(input[2] ? input[2] : 1);
      date.setHours(input[3] ? input[3] : 0);
      date.setMinutes(input[4] ? input[4] : 0);
      return date;
    }
    parseDateString(input) {
      switch (input) {
        case "now":
          return new Date();
        case "max":
          return new Date(864e13);
        case "min":
          return new Date(-864e13);
        default:
          const years = Number(input.replace(/y$/, ""));
          if (!isNaN(years)) {
            return new Date(Date.now() + 31556926 * 1e3 * years);
          }
          const year0 = new Date("0001-01-01");
          const yearsBC = Number(input.replace(/bc$/, ""));
          if (!isNaN(yearsBC)) {
            return new Date(year0.getTime() - 31556926 * 1e3 * yearsBC);
          }
          const yearsAD = Number(input.replace(/ad$/, ""));
          if (!isNaN(yearsAD)) {
            return new Date(year0.getTime() + 31556926 * 1e3 * yearsAD);
          }
          throw new Error(`'[${input}]' could not be parsed as a date`);
      }
    }
    toJSON() {
      return {
        options: this.options,
        startDate: this.startDate,
        endDate: this.endDate,
        ratio: this.ratio,
        pivot: this.pivot
      };
    }
  };

  // src/timeline.io.umd.js
  window["Timeline"] = Timeline;
})();
