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
    const viewStart2 = rootTimeline.details.startMinutes;
    const viewEnd2 = rootTimeline.details.endMinutes;
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
    if (!timelineEvent)
      return;
    const timelineEventWithDetails = timelineEvent;
    if (!timelineEventWithDetails.details)
      return;
    currentTimeline = timelineEventWithDetails;
    zoom(timelineEvent, useAnimation, () => {
      update();
      if (onfocused)
        onfocused(timelineEventWithDetails);
    });
  };
  const reset = () => {
    focus(rootTimeline);
  };
  const zoom = (timelineEvent, useAnimation = true, onzoomend) => {
    if (!timelineEvent)
      return;
    const timelineEventWithDetails = timelineEvent;
    if (!timelineEventWithDetails.details)
      return;
    const targetDurationExtension = timelineEventWithDetails.details.durationMinutes * 0.05;
    const targetStart = timelineEventWithDetails.details.startMinutes - targetDurationExtension;
    const targetEnd = timelineEventWithDetails.details.endMinutes + targetDurationExtension;
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
          element.dispatchEvent(
            new CustomEvent("focus.tl.event", {
              detail: timelineEvent,
              bubbles: false,
              cancelable: true
            })
          );
          if (onzoomend)
            onzoomend(timelineEvent);
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
    for (const [key, timelineEvent] of Object.entries(parentEvent.details.children)) {
      if (!timelineEvent || !timelineEvent.details)
        continue;
      if (timelineEvent.details.startMinutes >= viewEnd())
        continue;
      if (timelineEvent.details.endMinutes <= viewStart())
        continue;
      const focused = false;
      if (focused)
        continue;
      const viewInside = isViewInside(timelineEvent);
      const createTimelineEventHTML = () => {
        const parentLevel = timelineEvent.details.parentId ? parentEvent.details.level : 0;
        const levelFactor = timelineEvent.details.level * 1.5;
        const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.details.startMinutes);
        const widthRatio = viewInside ? 100 : timelineEvent.details.durationMinutes / viewDuration() * 100;
        const bgcolor = focused ? [timelineEvent.details.color[0], timelineEvent.details.color[1], timelineEvent.details.color[2], 0.1] : timelineEvent.details.color;
        const eventHTML = document.createElement("div");
        eventHTML.style.bottom = `${levelFactor * options.eventHeight}px`;
        eventHTML.style.minHeight = `${options.eventHeight}px`;
        eventHTML.style.borderRadius = "5px";
        eventHTML.style.boxSizing = "border-box";
        eventHTML.style.cursor = "pointer";
        eventHTML.style.backgroundColor = `rgb(${bgcolor.join(",")})`;
        eventHTML.style.zIndex = timelineEvent.details.depth.toString();
        eventHTML.style.left = leftRatio * 100 + "%";
        eventHTML.style.width = widthRatio + "%";
        eventHTML.style.position = "absolute";
        eventHTML.style.minWidth = "5px";
        eventHTML.title = timelineEvent.title;
        eventHTML.classList.add(options.classNames.timelineEvent);
        eventHTML.setAttribute("level", timelineEvent.details.level.toString());
        eventHTML.setAttribute("depth", timelineEvent.details.depth.toString());
        eventHTML.setAttribute("height", timelineEvent.details.height.toString());
        eventHTML.attributes["starttime"] = viewInside ? viewStart() : timelineEvent.details.startMinutes;
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
        const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.details.startMinutes);
        const widthRatio = viewInside ? 100 : timelineEvent.details.durationMinutes / viewDuration() * 100;
        const bgcolor = timelineEvent.details.color.length === 3 ? [...timelineEvent.details.color, 0.1] : timelineEvent.details.color;
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
        eventHTML.attributes["starttime"] = viewInside ? viewStart() : timelineEvent.details.startMinutes;
        const titleHTML = document.createElement("div");
        titleHTML.innerText = timelineEvent.title;
        titleHTML.style.whiteSpace = "nowrap";
        titleHTML.style.pointerEvents = "none";
        titleHTML.style.userSelect = "none";
        titleHTML.classList.add(options.classNames.timelineEventTitle);
        eventHTML.appendChild(titleHTML);
        return eventHTML;
      };
      switch (timelineEvent.details.type) {
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
    return tl.details.startMinutes ? parsedChildren && parsedChildren.length ? Math.min(tl.details.startMinutes, parsedChildren[0].details.startMinutes) : tl.details.startMinutes : parsedChildren && parsedChildren.length ? parsedChildren[0].details.startMinutes : void 0;
  };
  const calcEnd = (tl, parsedChildren) => {
    return tl.details.endMinutes ? tl.details.endMinutes : tl.duration && !isNaN(Number(tl.duration)) ? tl.details.startMinutes + Number(tl.duration) : parsedChildren && parsedChildren.length ? Math.max.apply(
      1,
      parsedChildren.map((child) => child.details.endMinutes)
    ) : tl.details.startMinutes + 1;
  };
  const calcLevel = (timelineEvent, parent) => {
    let level = 0;
    for (const eventLevel in parent.details.levelMatrix) {
      level = Number(eventLevel);
      if (timelineEvent.details.startMinutes > parent.details.levelMatrix[eventLevel].time) {
        for (let i = 0; i < timelineEvent.details.height; i++) {
          parent.details.levelMatrix[(level + i).toString()] = {
            height: timelineEvent.details.height,
            time: timelineEvent.details.endMinutes
          };
        }
        return level;
      }
    }
    level++;
    for (let i = 0; i < timelineEvent.details.height; i++) {
      parent.details.levelMatrix[(level + i).toString()] = {
        height: timelineEvent.details.height,
        time: timelineEvent.details.endMinutes
      };
    }
    return level;
  };
  const addEvents = (parent, ...children) => {
    const parsedChildren = children.map((tl) => parseEvent(tl, parent)).filter((tl) => !!tl);
    if (parsedChildren && parsedChildren.length && parent) {
      parsedChildren.sort((a, b) => a.details.startMinutes - b.details.startMinutes);
      parent.details.startMinutes = calcStart(parent, parsedChildren);
      parent.details.endMinutes = calcEnd(parent, parsedChildren);
      parent.details.durationMinutes = parent.details.endMinutes - parent.details.startMinutes;
      parsedChildren.forEach((childEvent, i) => {
        parent.details.children[childEvent.details.id] = childEvent;
        childEvent.details.level = ["timeline", "container"].includes(childEvent.details.type) ? calcLevel(childEvent, parent) : 0;
      });
    }
    parent.details.height = parsedChildren.length ? Math.max(...parsedChildren.map((child) => child.details.level)) : 1;
  };
  const parseEvent = (timelineEvent, parent) => {
    if (!timelineEvent) {
      console.warn("Event object is empty");
      return void 0;
    }
    const timelineEventWithDetails = __spreadProps(__spreadValues({}, timelineEvent), {
      details: {
        id: crypto.randomUUID(),
        durationMinutes: 0,
        type: timelineEvent.type || "timeline",
        open: timelineEvent.open || false,
        level: 1,
        step: 0,
        score: 0,
        height: 1,
        children: {},
        depth: parent ? parent.details.depth + 1 : 0,
        parentId: parent == null ? void 0 : parent.details.id,
        color: timelineEvent.color || options.defaultColor,
        startMinutes: parseToMinutes(timelineEvent.start),
        endMinutes: parseToMinutes(timelineEvent.end),
        levelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } }
      }
    });
    if (timelineEvent.events && timelineEvent.events.length) {
      addEvents(timelineEventWithDetails, ...timelineEvent.events);
    }
    timelineEventWithDetails.details.startMinutes = calcStart(timelineEventWithDetails);
    if (!timelineEventWithDetails.details.startMinutes) {
      console.warn("Missing start property on event - skipping", timelineEvent);
      return void 0;
    }
    timelineEventWithDetails.details.endMinutes = calcEnd(timelineEventWithDetails);
    timelineEventWithDetails.details.durationMinutes = timelineEventWithDetails.details.endMinutes - timelineEventWithDetails.details.startMinutes;
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
