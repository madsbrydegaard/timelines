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
  let previewsContainer;
  let rootTimeline;
  let currentTimeline;
  let hightligtedTimelineId;
  let visibleEvents;
  let previewTimer;
  const MINUTES_IN_DAY = 1440;
  const MINUTES_IN_WEEK = 10080;
  const MINUTES_IN_YEAR = 525948.766;
  const MINUTES_IN_MONTH = MINUTES_IN_YEAR / 12;
  const SHOW_MONTH_DURATION = MINUTES_IN_MONTH * 18;
  const SHOW_DAY_DURATION = MINUTES_IN_WEEK * 6;
  const SHOW_TIME_DURATION = MINUTES_IN_DAY * 4;
  const isITimelineEventWithDetails = (timelineEvent) => "timelineEventDetails" in timelineEvent;
  const add = (...timelineEvents) => {
    if (!timelineEvents)
      throw new Error(`Event argument is empty. Please provide Timeline event(s) as input`);
    addEvents(rootTimeline, ...timelineEvents);
    update();
  };
  const isViewInside = (timelineEvent) => {
    return timelineEvent.timelineEventDetails.startMinutes < viewStart() && timelineEvent.timelineEventDetails.endMinutes > viewEnd();
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
      zoomSpeed: 0.04,
      dragSpeed: 1e-3,
      timelineStart: "-1B",
      timelineEnd: "1M",
      start: "-100y",
      end: "now",
      minZoom: 1,
      maxZoom: 1e11,
      position: "bottom",
      eventHeight: 5,
      eventSpacing: 3,
      autoZoom: false,
      zoomMargin: 0.1,
      autoHighlight: false,
      defaultColor: [140, 140, 140],
      zoomDuration: 200,
      easing: "easeOutCubic",
      numberOfHighscorePreviews: 5,
      highscorePreviewDelay: 500,
      debug: false,
      classNames: {
        timeline: "tl",
        timelineEvent: "tl__event",
        timelinePreview: "tl__preview",
        timelineEventTitle: "tl__event__title",
        timelineLabels: "tl__labels",
        timelineDividers: "tl__dividers",
        timelineEvents: "tl__events",
        timelinePreviews: "tl__previews",
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
    timelineStart = parseDateToMinutes(options.timelineStart);
    timelineEnd = parseDateToMinutes(options.timelineEnd);
    const viewStart2 = rootTimeline.timelineEventDetails.startMinutes;
    const viewEnd2 = rootTimeline.timelineEventDetails.endMinutes;
    if (viewStart2 < timelineStart)
      timelineStart = viewStart2;
    if (viewEnd2 > timelineEnd)
      timelineEnd = viewEnd2;
    const viewDuration2 = viewEnd2 - viewStart2;
    ratio = timelineDuration() / viewDuration2;
    pivot = (timelineStart - viewStart2) / viewDuration2;
    appendContainerHTML();
    registerListeners(element);
    focus(rootTimeline, false);
  };
  const timelineDuration = () => {
    return timelineEnd - timelineStart;
  };
  const viewWidth = () => {
    return element.getBoundingClientRect().width || 0;
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
    highlight();
    zoomto(currentTimeline.timelineEventDetails.startMinutes, currentTimeline.timelineEventDetails.endMinutes, useAnimation, () => {
      fire("focus.tl.event");
      if (onfocused)
        onfocused(currentTimeline);
    });
  };
  const reset = () => {
    currentTimeline = rootTimeline;
    zoomto(
      options.start ? parseDateToMinutes(options.start) : currentTimeline.timelineEventDetails.startMinutes,
      options.end ? parseDateToMinutes(options.end) : currentTimeline.timelineEventDetails.endMinutes
    );
    if (options.autoHighlight) {
      highlight();
    }
  };
  const highlight = (timelineEvent) => {
    if (!timelineEvent) {
      hightligtedTimelineId = void 0;
    }
    if (timelineEvent && isITimelineEventWithDetails(timelineEvent)) {
      hightligtedTimelineId = timelineEvent.timelineEventDetails.id;
    }
    update();
  };
  const zoom = (timelineEvent, useAnimation = true, onzoomend) => {
    if (!timelineEvent) {
      throw "first argument 'timelineEvent' of method 'zoom' must be an object";
    }
    if (!isITimelineEventWithDetails(timelineEvent)) {
      throw "first argument 'timelineEvent' of method 'zoom' must be an object of type ITimelineEventWithDetails";
    }
    zoomto(timelineEvent.timelineEventDetails.startMinutes, timelineEvent.timelineEventDetails.endMinutes, useAnimation, () => {
      fire("zoom.tl.event", timelineEvent);
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
    const targetDurationExtension = (endMinutes - startMinutes) * options.zoomMargin;
    const targetStart = startMinutes - targetDurationExtension;
    const targetEnd = endMinutes + targetDurationExtension;
    const targetDuration = targetEnd - targetStart;
    const targetRatio = timelineDuration() / targetDuration;
    const targetPivot = (timelineStart - targetStart) / targetDuration;
    const animate = () => {
      let i = 0;
      const animationDuration = options.zoomDuration;
      const easings = {
        easeOutExpo: (time, start, change, duration) => {
          return time == duration ? start + change : change * (-Math.pow(2, -10 * time / duration) + 1) + start;
        },
        easeOutCubic: (time, start, change, duration) => {
          return change * ((time = time / duration - 1) * time * time + 1) + start;
        },
        easeLinear: (time, start, change, duration) => {
          return change * time / duration + start;
        }
      };
      const startRatio = ratio;
      const startPivot = pivot;
      const deltaRatio = targetRatio - ratio;
      const deltaPivot = targetPivot - pivot;
      const easing = typeof options.easing === "string" ? easings[options.easing] : options.easing;
      const myTimer = setInterval(() => {
        if (++i > animationDuration) {
          clearInterval(myTimer);
          if (onzoomend)
            onzoomend();
        }
        ratio = easing(i, startRatio, deltaRatio, animationDuration);
        pivot = easing(i, startPivot, deltaPivot, animationDuration);
        update();
      }, 1);
    };
    if (useAnimation) {
      animate();
    } else {
      ratio = targetRatio;
      pivot = targetPivot;
      update();
      if (onzoomend)
        onzoomend();
    }
  };
  const registerListeners = (element2) => {
    let tpCache = [];
    let dragStartX, dragStartY;
    let inDrag = false;
    let canDrag = false;
    let canPinch = true;
    const drag = (x, y) => {
      if (!inDrag && !canDrag) {
        return;
      }
      const deltaScrollLeft = x - dragStartX;
      if (deltaScrollLeft)
        onmove(deltaScrollLeft);
      dragStartX = x;
      dragStartY = y;
      fire("drag.tl.container");
    };
    const startDrag = (x, y) => {
      inDrag = true;
      dragStartX = x;
      dragStartY = y;
      fire("startpan.tl.container");
    };
    const endDrag = () => {
      inDrag = false;
      fire("endpan.tl.container");
    };
    const pinch = (offsetX, direction) => {
      if (!canPinch) {
        return;
      }
      const mouseX2view = offsetX / viewWidth();
      const mouseX2timeline = (mouseX2view - pivot) / ratio;
      onzoom(direction, mouseX2timeline);
      fire("pinch.tl.container");
    };
    const onEventClick = (event) => {
      if (options.autoHighlight) {
        highlight(event.detail.timelineEvent);
      }
      if (options.autoZoom) {
        zoom(event.detail.timelineEvent);
      }
    };
    window.addEventListener("resize", (event) => {
      update();
      fire("resize.tl.container");
    });
    element2.addEventListener("wheel", (event) => {
      if (event.defaultPrevented)
        return;
      event.preventDefault();
      var direction = Math.sign(event.deltaY);
      const leftRatio = event.target.attributes["starttime"] ? getViewRatio(event.target.attributes["starttime"]) : 0;
      const offsetX = leftRatio * viewWidth() + event.offsetX;
      pinch(offsetX, direction);
      fire("wheel.tl.container");
    });
    element2.addEventListener("touchstart", (event) => {
      event.preventDefault();
      if (event.targetTouches.length === 2) {
        tpCache = [];
        for (let i = 0; i < event.targetTouches.length; i++) {
          tpCache.push(event.targetTouches[i]);
        }
      }
      if (event.targetTouches.length === 1) {
        startDrag(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
      }
      fire("touchstart.tl.container");
    });
    element2.addEventListener("touchend", (event) => {
      endDrag();
      fire("touchend.tl.container");
    });
    element2.addEventListener("touchmove", (event) => {
      if (event.targetTouches.length === 2 && event.changedTouches.length === 2) {
        const touch1 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[0].identifier);
        const touch2 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[1].identifier);
        if (touch1 >= 0 && touch2 >= 0) {
          const diff1 = Math.abs(tpCache[touch1].clientX - tpCache[touch2].clientX);
          const diff2 = Math.abs(event.targetTouches[0].clientX - event.targetTouches[1].clientX);
          const diff = diff1 - diff2;
          const offsetX = Math.min(event.targetTouches[0].clientX, event.targetTouches[1].clientX) + diff2 / 2;
          var direction = Math.sign(diff);
          pinch(offsetX, direction);
          fire("touchmove.tl.container");
        }
        tpCache = [];
        for (let i = 0; i < event.targetTouches.length; i++) {
          tpCache.push(event.targetTouches[i]);
        }
      }
      if (event.targetTouches.length === 1 && event.changedTouches.length === 1) {
        drag(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
        fire("touchmove.tl.container");
      }
    });
    element2.addEventListener("mousedown", (event) => {
      startDrag(event.clientX, event.clientY);
      fire("mousedown.tl.container");
    });
    element2.addEventListener("mousemove", (event) => {
      drag(event.clientX, event.clientY);
      fire("mousemove.tl.container");
    });
    element2.addEventListener("mouseup", (event) => {
      endDrag();
      fire("mouseup.tl.container");
    });
    element2.addEventListener("click.tl.event", onEventClick);
    element2.addEventListener("click.tl.preview", onEventClick);
    element2.addEventListener("update.tl.container", onUpdate);
  };
  const createPreviewsHTML = () => {
    const eventsFragment = document.createDocumentFragment();
    const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgContainer.style.height = "100%";
    svgContainer.style.width = "100%";
    svgContainer.style.position = "absolute";
    eventsFragment.append(svgContainer);
    const highscores = visibleEvents.sort((a, b) => b.timelineEventDetails.score - a.timelineEventDetails.score).filter((evt) => !!evt.timelineEventDetails.previewNode).slice(0, options.numberOfHighscorePreviews).sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);
    for (const [i, timelineEvent] of highscores.entries()) {
      const fraction = 1 / options.numberOfHighscorePreviews;
      const randomLeftPosition = fraction * i + fraction / 4;
      const randomTopPosition = Math.random() / 3 + 0.08;
      const createTimelinePreviewHTML = () => {
        timelineEvent.timelineEventDetails.previewNode.style.left = randomLeftPosition * 100 + "%";
        timelineEvent.timelineEventDetails.previewNode.style.top = randomTopPosition * 100 + "%";
        const lineFragment = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineFragment.setAttribute("x1", `calc(${randomLeftPosition * 100}% + 25px)`);
        lineFragment.setAttribute("y1", `calc(${randomTopPosition * 100}% + 50px)`);
        lineFragment.setAttribute(
          "x2",
          timelineEvent.timelineEventDetails.eventNode.offsetLeft + timelineEvent.timelineEventDetails.eventNode.offsetWidth / 2 + "px"
        );
        lineFragment.setAttribute("y2", timelineEvent.timelineEventDetails.eventNode.offsetTop + "px");
        lineFragment.setAttribute("style", `stroke:rgb(${[...timelineEvent.timelineEventDetails.color, 1].join(",")});stroke-width:2`);
        svgContainer.appendChild(lineFragment);
        eventsFragment.append(timelineEvent.timelineEventDetails.previewNode);
      };
      createTimelinePreviewHTML();
    }
    return eventsFragment;
  };
  const createEventsHTML = (parentEvent) => {
    const eventsFragment = document.createDocumentFragment();
    for (const timelineEvent of parentEvent.timelineEventDetails.childrenByStartMinute) {
      if (!timelineEvent || !timelineEvent.timelineEventDetails)
        continue;
      if (timelineEvent.timelineEventDetails.startMinutes >= viewEnd())
        continue;
      if (timelineEvent.timelineEventDetails.endMinutes <= viewStart())
        continue;
      const viewInside = isViewInside(timelineEvent);
      const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.timelineEventDetails.startMinutes);
      const widthRatio = viewInside ? 100 : timelineEvent.timelineEventDetails.durationMinutes / viewDuration() * 100;
      const isHighlighted = hightligtedTimelineId === void 0 || hightligtedTimelineId === timelineEvent.timelineEventDetails.id;
      timelineEvent.timelineEventDetails.eventNode.style.left = leftRatio * 100 + "%";
      timelineEvent.timelineEventDetails.eventNode.style.width = widthRatio + "%";
      timelineEvent.timelineEventDetails.eventNode.attributes["starttime"] = viewInside ? viewStart() : timelineEvent.timelineEventDetails.startMinutes;
      switch (timelineEvent.timelineEventDetails.type) {
        default: {
          eventsFragment.append(createEventsHTML(timelineEvent));
          break;
        }
        case "timeline": {
          timelineEvent.timelineEventDetails.eventNode.style.opacity = isHighlighted ? "1" : "0.3";
          eventsFragment.append(timelineEvent.timelineEventDetails.eventNode);
          visibleEvents.push(timelineEvent);
          break;
        }
        case "background": {
          eventsFragment.append(timelineEvent.timelineEventDetails.eventNode);
          break;
        }
      }
    }
    return eventsFragment;
  };
  const appendContainerHTML = () => {
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
    eventsContainer.style.overflowY = "auto";
    eventsContainer.style.overflowX = "hidden";
    const existingPreviewsContainer = element.querySelector(`.${options.classNames.timelinePreviews}`);
    previewsContainer = existingPreviewsContainer || document.createElement("div");
    if (!existingPreviewsContainer)
      element.appendChild(previewsContainer);
    previewsContainer.classList.add(options.classNames.timelinePreviews);
    previewsContainer.style.position = "absolute";
    previewsContainer.style.bottom = "50px";
    previewsContainer.style.height = "calc(100% - 50px)";
    previewsContainer.style.width = "100%";
    previewsContainer.style.overflowY = "auto";
    previewsContainer.style.overflowX = "hidden";
    const ioContainer = document.createElement("div");
    element.appendChild(ioContainer);
    ioContainer.style.position = "absolute";
    ioContainer.style.bottom = "0";
    ioContainer.style.top = "0";
    ioContainer.style.width = "100%";
  };
  const appendLabelsHTML = () => {
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
    labelContainer.appendChild(labels);
    dividerContainer.appendChild(dividers);
  };
  const appendEventsHTML = () => {
    const eventsHtml = createEventsHTML(currentTimeline);
    if (eventsHtml)
      eventsContainer.appendChild(eventsHtml);
  };
  const appendPreviewsHTML = () => {
    const previewsHtml = createPreviewsHTML();
    if (previewsHtml)
      previewsContainer.appendChild(previewsHtml);
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
    dividerContainer.innerHTML = "";
    labelContainer.innerHTML = "";
    eventsContainer.innerHTML = "";
    previewsContainer.innerHTML = "";
    visibleEvents = [];
    fire("update.tl.container");
  };
  const onUpdate = () => {
    appendLabelsHTML();
    appendEventsHTML();
    if (options.numberOfHighscorePreviews > 0 && !hightligtedTimelineId) {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        appendPreviewsHTML();
      }, options.highscorePreviewDelay);
    }
  };
  const parseDateToMinutes = (input) => {
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
  const parseNumberToMinutes = (input) => {
    if (input === void 0)
      return void 0;
    if (typeof input === "string") {
      const seconds = input.match(/s$/) ? Number(input.replace(/s$/, "")) : NaN;
      if (!isNaN(seconds)) {
        return seconds / 60;
      }
      const hours = input.match(/H$/) ? Number(input.replace(/H$/, "")) : NaN;
      if (!isNaN(hours)) {
        return hours * 60;
      }
      const days = input.match(/d$/) ? Number(input.replace(/d$/, "")) : NaN;
      if (!isNaN(days)) {
        return days * 24 * 60;
      }
      const weeks = input.match(/w$/) ? Number(input.replace(/w$/, "")) : NaN;
      if (!isNaN(weeks)) {
        return weeks * 7 * 24 * 60;
      }
      const minutes = Number(input);
      if (!isNaN(minutes)) {
        return minutes;
      }
    }
    if (typeof input === "number") {
      return input;
    }
    return void 0;
  };
  const calcStart = (timelineEventWithDetails) => {
    return timelineEventWithDetails.timelineEventDetails.startMinutes ? timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.length ? Math.min(
      timelineEventWithDetails.timelineEventDetails.startMinutes,
      timelineEventWithDetails.timelineEventDetails.childrenByStartMinute[0].timelineEventDetails.startMinutes
    ) : timelineEventWithDetails.timelineEventDetails.startMinutes : timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.length ? timelineEventWithDetails.timelineEventDetails.childrenByStartMinute[0].timelineEventDetails.startMinutes : void 0;
  };
  const calcEnd = (timelineEventWithDetails) => {
    return timelineEventWithDetails.timelineEventDetails.endMinutes ? timelineEventWithDetails.timelineEventDetails.endMinutes : timelineEventWithDetails.timelineEventDetails.durationMinutes ? timelineEventWithDetails.timelineEventDetails.startMinutes + timelineEventWithDetails.timelineEventDetails.durationMinutes : timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.length ? Math.max.apply(
      1,
      timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.map((child) => child.timelineEventDetails.endMinutes)
    ) : timelineEventWithDetails.timelineEventDetails.startMinutes + 1;
  };
  const addEvents = (parent, ...childrenByStartMinute) => {
    const parsedSortedChildren = childrenByStartMinute.map((tl) => parseEvent(tl, parent)).filter((tl) => !!tl).sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);
    const calcLevel = (timelineEvent) => {
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
      level += 1;
      for (let i = 0; i < timelineEvent.timelineEventDetails.height; i++) {
        parent.timelineEventDetails.levelMatrix[(level + i).toString()] = {
          height: timelineEvent.timelineEventDetails.height,
          time: timelineEvent.timelineEventDetails.endMinutes
        };
      }
      return level;
    };
    const calcScore = (timelineEvent) => {
      const durationRatio = timelineEvent.timelineEventDetails.durationMinutes / parent.timelineEventDetails.durationMinutes;
      const score = durationRatio * (timelineEvent.timelineEventDetails.childrenByStartMinute.length + 1);
      return score;
    };
    const createEventNode = (timelineEvent) => {
      const eventHTML = document.createElement("div");
      switch (timelineEvent.timelineEventDetails.type) {
        case "timeline":
          {
            const spaceFactor = timelineEvent.timelineEventDetails.level * options.eventSpacing;
            const heightFactor = (timelineEvent.timelineEventDetails.level - 1) * options.eventHeight;
            eventHTML.style.bottom = `${spaceFactor + heightFactor}px`;
            eventHTML.style.minHeight = `${options.eventHeight}px`;
            eventHTML.style.zIndex = timelineEvent.timelineEventDetails.depth.toString();
            eventHTML.style.cursor = "pointer";
            eventHTML.style.borderRadius = "5px";
            eventHTML.style.backgroundColor = `rgba(${[...timelineEvent.timelineEventDetails.color, 1].join(",")})`;
            eventHTML.title = timelineEvent.title;
          }
          break;
        case "background":
          {
            eventHTML.style.bottom = `0`;
            eventHTML.style.top = `0`;
          }
          break;
        default:
      }
      eventHTML.addEventListener("click", (e) => fire("click.tl.event", timelineEvent));
      eventHTML.addEventListener("mouseenter", (e) => fire("mouseenter.tl.event", timelineEvent));
      eventHTML.addEventListener("mouseleave", (e) => fire("mouseleave.tl.event", timelineEvent));
      eventHTML.addEventListener("dblclick", (e) => fire("dblclick.tl.event", timelineEvent));
      eventHTML.style.boxSizing = "border-box";
      eventHTML.style.position = "absolute";
      eventHTML.style.minWidth = "5px";
      eventHTML.style.overflow = "hidden";
      eventHTML.classList.add(options.classNames.timelineEvent);
      eventHTML.setAttribute("level", timelineEvent.timelineEventDetails.level.toString());
      eventHTML.setAttribute("depth", timelineEvent.timelineEventDetails.depth.toString());
      eventHTML.setAttribute("score", timelineEvent.timelineEventDetails.score.toString());
      if (timelineEvent.renderEventNode) {
        const elementToAppend = timelineEvent.renderEventNode(timelineEvent);
        elementToAppend.style.display = "contents";
        eventHTML.append(elementToAppend);
      }
      return eventHTML;
    };
    const createPreviewNode = (timelineEvent) => {
      if (!timelineEvent.renderPreviewNode)
        return void 0;
      const previewHTML = document.createElement("div");
      previewHTML.style.boxSizing = "border-box";
      previewHTML.style.cursor = "pointer";
      previewHTML.style.position = "absolute";
      previewHTML.style.overflow = "hidden";
      previewHTML.style.cursor = "pointer";
      previewHTML.style.zIndex = timelineEvent.timelineEventDetails.depth.toString();
      previewHTML.title = timelineEvent.title;
      previewHTML.classList.add(options.classNames.timelinePreview);
      previewHTML.addEventListener("click", (e) => fire("click.tl.preview", timelineEvent));
      previewHTML.addEventListener("mouseenter", (e) => fire("mouseenter.tl.preview", timelineEvent));
      previewHTML.addEventListener("mouseleave", (e) => fire("mouseleave.tl.preview", timelineEvent));
      previewHTML.addEventListener("dblclick", (e) => fire("dblclick.tl.preview", timelineEvent));
      previewHTML.append(timelineEvent.renderPreviewNode(timelineEvent));
      return previewHTML;
    };
    parent.timelineEventDetails.childrenByStartMinute.push(...parsedSortedChildren);
    parent.timelineEventDetails.startMinutes = calcStart(parent);
    parent.timelineEventDetails.endMinutes = calcEnd(parent);
    parent.timelineEventDetails.durationMinutes = parent.timelineEventDetails.endMinutes - parent.timelineEventDetails.startMinutes;
    parent.timelineEventDetails.childrenByStartMinute.forEach((childEvent, i) => {
      childEvent.timelineEventDetails.score = ["timeline"].includes(childEvent.timelineEventDetails.type) ? calcScore(childEvent) : 0;
      childEvent.timelineEventDetails.level = ["container", "timeline"].includes(childEvent.timelineEventDetails.type) ? calcLevel(childEvent) : 0;
      childEvent.timelineEventDetails.eventNode = createEventNode(childEvent);
      childEvent.timelineEventDetails.previewNode = createPreviewNode(childEvent);
    });
    parent.timelineEventDetails.height = Object.entries(parent.timelineEventDetails.levelMatrix).length;
  };
  const parseEvent = (timelineEvent, parent) => {
    if (!timelineEvent) {
      console.warn("Event object is empty");
      return void 0;
    }
    const timelineEventWithDetails = __spreadProps(__spreadValues({}, timelineEvent), {
      timelineEventDetails: {
        id: crypto.randomUUID(),
        type: timelineEvent.type || timelineEvent.start ? timelineEvent.type || "timeline" : "wrapper",
        level: 0,
        step: 0,
        score: 0,
        height: 1,
        childrenByStartMinute: [],
        childrenByScore: [],
        depth: parent ? parent.timelineEventDetails.depth + 1 : 0,
        parentId: parent == null ? void 0 : parent.timelineEventDetails.id,
        color: (timelineEvent.color || options.defaultColor).slice(0, 3),
        highlightedColor: (timelineEvent.highlightedColor || options.defaultColor).slice(0, 3),
        startMinutes: parseDateToMinutes(timelineEvent.start),
        endMinutes: parseDateToMinutes(timelineEvent.end),
        durationMinutes: parseNumberToMinutes(timelineEvent.duration) || 0,
        levelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } }
      }
    });
    if (timelineEventWithDetails.timelineEventDetails.type === "timeline" && parent.timelineEventDetails.type === "wrapper")
      parent.timelineEventDetails.type = "container";
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
  const fire = (name, timelineEvent) => {
    element.dispatchEvent(
      new CustomEvent(name, {
        detail: {
          name,
          options,
          timelineEvent,
          viewStartDate: formatDateLabel(viewStart()),
          viewEndDate: formatDateLabel(viewEnd()),
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
  init(elementIdentifier, settings);
  return {
    focus,
    zoom,
    add,
    reset,
    highlight
  };
};
export {
  Timeline
};
