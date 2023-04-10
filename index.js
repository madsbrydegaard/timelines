var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
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
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
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

// src/timeline.io.ts
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
    window.addEventListener("resize", () => {
      update();
    });
    element2.addEventListener("wheel", (event) => {
      if (event.defaultPrevented)
        return;
      event.preventDefault();
      var direction = Math.sign(event.deltaY);
      const leftRatio = event.target.attributes["starttime"] ? getViewRatio(event.target.attributes["starttime"]) : 0;
      const offsetX = leftRatio * element2.getBoundingClientRect().width + event.offsetX;
      const mouseX2view = offsetX / viewWidth();
      const mouseX2timeline = (mouseX2view - pivot) / ratio;
      onzoom(direction, mouseX2timeline);
    });
    const logEvents = false;
    let tpCache = [];
    element2.addEventListener("touchstart", (event) => {
      event.preventDefault();
      if (event.targetTouches.length === 2) {
        for (let i = 0; i < event.targetTouches.length; i++) {
          tpCache.push(event.targetTouches[i]);
        }
      }
      if (logEvents)
        console.log("touchstart", event);
    });
    element2.addEventListener("touchmove", (event) => {
      event.preventDefault();
      if (event.targetTouches.length === 2 && event.changedTouches.length === 2) {
        const point1 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[0].identifier);
        const point2 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[1].identifier);
        const target = event.target;
        if (point1 >= 0 && point2 >= 0) {
          const diff1 = Math.abs(tpCache[point1].clientX - event.targetTouches[0].clientX);
          const diff2 = Math.abs(tpCache[point2].clientX - event.targetTouches[1].clientX);
          const PINCH_THRESHOLD = target.clientWidth / 10;
          if (diff1 >= PINCH_THRESHOLD && diff2 >= PINCH_THRESHOLD) {
            if (logEvents)
              console.log("touchmove", event);
          }
        } else {
          tpCache = [];
        }
      }
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
