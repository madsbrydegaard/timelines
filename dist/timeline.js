"use strict";
(() => {
  // src/dater.ts
  var Dater = class {
    constructor(date) {
      this.date = date || new Date();
    }
    date;
    get asArray() {
      return [
        this.date.getFullYear(),
        this.date.getMonth(),
        this.date.getDate(),
        this.date.getHours(),
        this.date.getMinutes()
      ];
    }
    get inMinutes() {
      return Math.floor(this.date.getTime() / 6e4);
    }
    get asYMDHM() {
      return Intl.DateTimeFormat(void 0, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric"
      }).format(this.date);
    }
    get asYMD() {
      return Intl.DateTimeFormat(void 0, {
        year: "numeric",
        month: "short",
        day: "numeric"
      }).format(this.date);
    }
    get asYM() {
      return Intl.DateTimeFormat(void 0, {
        year: "numeric",
        month: "short"
      }).format(this.date);
    }
    get asY() {
      return this.date.getFullYear().toString();
    }
  };
  var dater = function(input) {
    const fromArray = function(array) {
      const result2 = new Dater();
      result2.date.setFullYear(array[0] || result2.date.getFullYear());
      result2.date.setMonth(array[1] ? array[1] + 1 : 0);
      result2.date.setDate(array[2] ? array[2] : 1);
      result2.date.setHours(array[3] ? array[3] : 0);
      result2.date.setMinutes(array[4] ? array[4] : 0);
      return result2;
    };
    const fromMinutes = function(minutes) {
      const result2 = new Dater(new Date(minutes * 6e4));
      return result2;
    };
    const result = new Dater();
    if (!input)
      return result;
    switch (typeof input) {
      case "object":
        switch (input.constructor.name) {
          case "Array":
            if (input.length === 0)
              throw new Error("argument Array cannot be empty");
            if (typeof input[0] !== "number")
              throw new Error("argument Array must contain only numbers");
            return fromArray(input);
          default:
            return result;
        }
      case "number": {
        return fromMinutes(input);
      }
      case "string":
        switch (input) {
          case "now":
            return result;
          case "-100y":
            result.date.setFullYear(result.date.getFullYear() - 100);
            return result;
          default:
            if (isNaN(Number(input))) {
              throw new Error("Argument not supported `" + input + "`");
            } else {
              return result;
            }
        }
      default:
        return result;
    }
  };

  // src/index.ts
  var timeline = {
    timelineDurationMinutes() {
      return this.endMoment.inMinutes - this.startMoment.inMinutes;
    },
    viewWidth() {
      return this.el?.offsetWidth || 0;
    },
    viewStartMinutes() {
      return this.startMoment.inMinutes - this.viewDurationMinutes() * this.options.pivot;
    },
    viewEndMinutes() {
      return this.viewStartMinutes() + this.viewDurationMinutes();
    },
    viewDurationMinutes() {
      return this.timelineDurationMinutes() / this.options.ratio;
    },
    view2MinutesRatio(minutes) {
      return (minutes - this.viewStartMinutes()) / this.viewDurationMinutes();
    },
    setRatio(direction, deltaRatio) {
      let newRatio = this.options.ratio - deltaRatio;
      const ratioMin = this.options.minZoom;
      if (direction > 0 && newRatio <= ratioMin) {
        newRatio = ratioMin;
      }
      const ratioMax = this.options.maxZoom;
      if (direction < 0 && newRatio >= ratioMax) {
        newRatio = ratioMax;
      }
      this.options.ratio = newRatio;
    },
    setPivot(direction, deltaPivot) {
      let newPivot = this.options.pivot + deltaPivot;
      if (newPivot >= 0) {
        newPivot = 0;
      }
      if (newPivot + this.options.ratio <= 1) {
        newPivot = 1 - this.options.ratio;
      }
      this.options.pivot = newPivot;
    },
    zoom(direction, mouseX) {
      this.options.mouseX = mouseX;
      const zoomSpeedScale = this.options.zoomSpeed * this.options.ratio;
      const deltaRatio = direction * zoomSpeedScale;
      const mouseX2view = (this.options.mouseX || 0) / this.viewWidth();
      const mouseX2timeline = (mouseX2view - this.options.pivot) / this.options.ratio;
      const deltaPivot = mouseX2timeline * deltaRatio;
      this.setRatio(direction, deltaRatio);
      this.setPivot(direction, deltaPivot);
      this.update();
    },
    move(deltaPivot) {
      this.setPivot(0, deltaPivot);
      this.update();
    },
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
    },
    format(minutes) {
      const moment = dater(minutes);
      if (this.viewDurationMinutes() < 1440 * 4) {
        return moment.asYMDHM;
      }
      if (this.viewDurationMinutes() < 10080 * 6) {
        return moment.asYMD;
      }
      if (this.viewDurationMinutes() < 43829.0639 * 18) {
        return moment.asYM;
      }
      return moment.asY;
    },
    update() {
      if (!this.el)
        return;
      const currentLevel = Math.floor(this.options.ratio);
      const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
      const granularity = 1 / (this.options.labelCount + 1);
      const timelineDurationMinutesExtended = this.timelineDurationMinutes() * 1.2;
      const timelineStartMomentExtended = this.startMoment.inMinutes - this.timelineDurationMinutes() * 0.1;
      const timelineViewDifferenceMinutes = this.viewStartMinutes() - timelineStartMomentExtended;
      const timestampDistanceMinutes = timelineDurationMinutesExtended * granularity;
      const currentTimestampDistanceByLevelMinutes = timestampDistanceMinutes / iterator;
      const integerDifFraction = Math.floor(
        timelineViewDifferenceMinutes / currentTimestampDistanceByLevelMinutes
      );
      const currentDifInMinutes = integerDifFraction * currentTimestampDistanceByLevelMinutes;
      const c = document.createDocumentFragment();
      for (let i = 0; i < this.options.labelCount + 2; i++) {
        const momentInMinutes = (i + 1) * currentTimestampDistanceByLevelMinutes + timelineStartMomentExtended + currentDifInMinutes - currentTimestampDistanceByLevelMinutes;
        const timestampViewRatio = this.view2MinutesRatio(momentInMinutes);
        const timestampViewLeftPosition = timestampViewRatio * 100;
        const e = document.createElement("div");
        e.className = "moment";
        e.style.left = timestampViewLeftPosition + "%";
        e.style.transform = "translate(calc(-50%))";
        e.style.textAlign = "center";
        e.style.position = "absolute";
        e.style.zIndex = "-1";
        e.style.width = "54px";
        e.innerHTML = this.format(momentInMinutes);
        c.appendChild(e);
      }
      this.el.innerHTML = "";
      this.el.appendChild(c);
    },
    initialize(element, options) {
      this.options = {
        ...this.options,
        ...options
      };
      this.startMoment = dater(this.options.start);
      this.endMoment = dater(this.options.end);
      if (typeof element === "string") {
        const elem = document.querySelector(element);
        if (!elem)
          throw new Error(`Selector could not be found [${element}]`);
        this.el = elem;
      } else {
        this.el = element;
      }
      this.el.style.position = "relative";
      this.el.style.overflow = "hidden";
      this.registerListeners(this.el);
      this.update();
    },
    options: {
      labelCount: 5,
      ratio: 1,
      pivot: 0,
      zoomSpeed: 0.025,
      dragSpeed: 3e-3,
      start: "-100y",
      end: "now",
      minZoom: 1,
      maxZoom: 1e5,
      mouseX: 0
    },
    el: void 0,
    startMoment: dater("-100y"),
    endMoment: dater("now")
  };
  window["timeline"] = timeline;
})();
//# sourceMappingURL=timeline.js.map
