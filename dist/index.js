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

// src/index.ts
var TimelineContainer = (elementIdentifier, settings) => {
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
  let ioContainer;
  let rootTimeline;
  let currentTimeline;
  let selectedTimelineIds;
  let visibleEvents;
  let previewTimer;
  let preventNextPreviewRender = false;
  let preventPreviewRender = false;
  let eventBatchCount = 0;
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
    timelineEvents = timelineEvents.map((tl) => __spreadProps(__spreadValues({}, tl), { step: tl.step || ++eventBatchCount }));
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
      autoSelect: false,
      defaultColor: "#aaa",
      defaultHighlightedColor: "#444",
      defaultBackgroundColor: "#eeee",
      defaultBackgroundHightligtedColor: "#eee7",
      zoomDuration: 200,
      easing: "easeOutCubic",
      numberOfHighscorePreviews: 5,
      highscorePreviewDelay: 500,
      highscorePreviewWidth: 100,
      classNames: {
        timeline: "tl",
        timelineEvent: "tl__event",
        timelinePreview: "tl__preview",
        timelineEventTitle: "tl__event__title",
        timelineLabels: "tl__labels",
        timelineDividers: "tl__dividers",
        timelineEvents: "tl__events",
        timelinePreviews: "tl__previews",
        timelineIo: "tl__io",
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
    select();
    zoom(timelineEvent, useAnimation, onfocused);
  };
  const reset = () => {
    preventPreviewRender = false;
    preventNextPreviewRender = false;
    currentTimeline = rootTimeline;
    zoomto(
      options.start ? parseDateToMinutes(options.start) : currentTimeline.timelineEventDetails.startMinutes,
      options.end ? parseDateToMinutes(options.end) : currentTimeline.timelineEventDetails.endMinutes
    );
    if (options.autoSelect) {
      select();
    }
  };
  const findFirstEvent = (timelineEventIdentifier, parent) => {
    let result = void 0;
    const parentNode = parent || rootTimeline;
    if (parentNode.timelineEventDetails.id === timelineEventIdentifier)
      return parentNode;
    for (const child of parentNode.timelineEventDetails.childrenByStartMinute) {
      if (child.title === timelineEventIdentifier || child.timelineEventDetails.id === timelineEventIdentifier) {
        result = child;
        break;
      } else {
        result = findFirstEvent(timelineEventIdentifier, child);
        if (result)
          break;
      }
    }
    return result;
  };
  const select = (timelineEventIdentifier) => {
    try {
      if (!timelineEventIdentifier) {
        selectedTimelineIds = [];
      } else if (typeof timelineEventIdentifier === "string") {
        if (timelineEventIdentifier === "next") {
          const result = findFirstEvent(selectedTimelineIds[0]);
          if (!result)
            throw `No event selected`;
          if (!result.timelineEventDetails.next)
            throw `No next event available`;
          selectedTimelineIds = [result.timelineEventDetails.next];
          fire("selected.tl.event", findFirstEvent(selectedTimelineIds[0]));
        } else if (timelineEventIdentifier === "previous") {
          const result = findFirstEvent(selectedTimelineIds[0]);
          if (!result)
            throw `No event selected`;
          if (!result.timelineEventDetails.previous)
            throw `No previous event available`;
          selectedTimelineIds = [result.timelineEventDetails.previous];
          fire("selected.tl.event", findFirstEvent(selectedTimelineIds[0]));
        } else {
          const result = findFirstEvent(timelineEventIdentifier);
          if (!result)
            throw `Cannot find ${timelineEventIdentifier} by title nor timelineEventDetails.id`;
          selectedTimelineIds = [result.timelineEventDetails.id];
          fire("selected.tl.event", result);
        }
      }
      update();
    } catch (error) {
      raise(error);
    }
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
    const move = (clientX, clientY) => {
      if (inDrag) {
        const offsetX = clientX - dragStartX;
        const offsetY = clientY - dragStartY;
        drag(offsetX, offsetY);
        dragStartX = clientX;
        dragStartY = clientY;
      }
      hover(clientX, clientY);
    };
    const drag = (offsetX, offsetY) => {
      if (offsetX)
        onmove(offsetX);
      fire("drag.tl.container");
    };
    const hover = (clientX, clientY) => {
      const hoverElements = document.elementsFromPoint(clientX, clientY);
      let hoverEvent = hoverElements.find((element3) => {
        return element3.hasAttribute("eventid");
      });
      if (!hoverEvent) {
        element2.style.cursor = "";
        element2.title = "";
        return;
      }
      const timelineEvent = visibleEvents.find((ev) => ev.timelineEventDetails.id === hoverEvent.getAttribute("eventid"));
      if (timelineEvent) {
        fire(`hover.tl.event`, timelineEvent);
        element2.style.cursor = "pointer";
        element2.title = timelineEvent.title;
      } else {
        element2.style.cursor = "";
        element2.title = "";
      }
    };
    const pinch = (offsetX, direction) => {
      const mouseX2view = offsetX / viewWidth();
      const mouseX2timeline = (mouseX2view - pivot) / ratio;
      onzoom(direction, mouseX2timeline);
      fire("pinch.tl.container");
    };
    const onEventClick = (event) => {
      if (options.autoSelect && event.detail.timelineEvent) {
        select(event.detail.timelineEvent.timelineEventDetails.id);
      }
    };
    const onEventSelected = (event) => {
      if (options.autoZoom && event.detail.timelineEvent) {
        zoom(event.detail.timelineEvent);
      }
    };
    const click = (clientX, clientY) => {
      const clickedElements = document.elementsFromPoint(clientX, clientY);
      let clickedEvent = clickedElements.find((element3) => {
        return element3.hasAttribute("eventid");
      });
      if (!clickedEvent)
        return;
      const eventid = clickedEvent.getAttribute("eventid");
      const timelineEvent = visibleEvents.find((ev) => ev.timelineEventDetails.id === eventid);
      if (timelineEvent) {
        fire(`click.tl.event`, timelineEvent);
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
      tpCache = [];
      tpCache.push(...event.targetTouches);
      fire("touchstart.tl.container");
    });
    element2.addEventListener(
      "touchend",
      (event) => {
        click(tpCache[0].clientX, tpCache[0].clientY);
        inDrag = false;
        fire("touchend.tl.container");
      },
      { passive: true }
    );
    element2.addEventListener(
      "touchmove",
      (event) => {
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
          }
        }
        if (event.targetTouches.length === 1 && event.changedTouches.length === 1) {
          const touch1 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[0].identifier);
          if (touch1 >= 0) {
            const diffX = event.targetTouches[0].clientX - tpCache[touch1].clientX;
            if (diffX !== 0) {
              inDrag = true;
              dragStartX = tpCache[touch1].clientX;
              dragStartY = tpCache[touch1].clientY;
              move(event.targetTouches[0].clientX, event.targetTouches[0].clientY);
            }
          }
        }
        tpCache = [];
        tpCache.push(...event.targetTouches);
        fire("touchmove.tl.container");
      },
      { passive: true }
    );
    element2.addEventListener(
      "mousedown",
      (event) => {
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        inDrag = true;
        fire("mousedown.tl.container");
      },
      { passive: true }
    );
    element2.addEventListener(
      "mousemove",
      (event) => {
        move(event.clientX, event.clientY);
        fire("mousemove.tl.container");
      },
      { passive: true }
    );
    element2.addEventListener(
      "mouseup",
      (event) => {
        inDrag = false;
        fire("mouseup.tl.container");
      },
      { passive: true }
    );
    element2.addEventListener("click", (e) => click(e.clientX, e.clientY));
    element2.addEventListener("click.tl.event", onEventClick);
    element2.addEventListener("selected.tl.event", onEventSelected);
    element2.addEventListener("update.tl.container", onUpdate);
  };
  const createPreviewHTML = () => {
    const eventsFragment = document.createDocumentFragment();
    const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgContainer.style.height = "100%";
    svgContainer.style.width = "100%";
    svgContainer.style.position = "absolute";
    eventsFragment.append(svgContainer);
    const highscores = visibleEvents.filter((evt) => !!evt.timelineEventDetails.previewNode).filter((evt) => !evt.preventNextPreviewRender).sort((a, b) => b.timelineEventDetails.score - a.timelineEventDetails.score).slice(0, options.numberOfHighscorePreviews).sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);
    for (const [i, timelineEvent] of highscores.entries()) {
      const fraction = 1 / highscores.length;
      const previewWidthFactor = options.highscorePreviewWidth / viewWidth();
      const randomLeftPosition = fraction * i + fraction / 2 - previewWidthFactor / 2;
      const randomTopPosition = Math.random() / 3 + 0.08;
      const createTimelinePreviewHTML = () => {
        timelineEvent.timelineEventDetails.previewNode.style.left = randomLeftPosition * 100 + "%";
        timelineEvent.timelineEventDetails.previewNode.style.top = randomTopPosition * 100 + "%";
        let x2 = getViewRatio(timelineEvent.timelineEventDetails.startMinutes + timelineEvent.timelineEventDetails.durationMinutes / 2);
        if (isViewInside(timelineEvent)) {
          x2 = 0.5;
        }
        if (x2 > 1) {
          x2 = getViewRatio(timelineEvent.timelineEventDetails.startMinutes + (viewEnd() - timelineEvent.timelineEventDetails.startMinutes) / 2);
        }
        if (x2 < 0) {
          x2 = getViewRatio((viewStart() + timelineEvent.timelineEventDetails.endMinutes) / 2);
        }
        const lineFragment = document.createElementNS("http://www.w3.org/2000/svg", "line");
        lineFragment.setAttribute("x1", `calc(${(randomLeftPosition + previewWidthFactor / 2) * 100}%)`);
        lineFragment.setAttribute("y1", `calc(${randomTopPosition * 100}% + 50px)`);
        lineFragment.setAttribute("x2", x2 * 100 + "%");
        lineFragment.setAttribute("y2", timelineEvent.timelineEventDetails.eventNode.offsetTop + "px");
        lineFragment.setAttribute("style", `stroke:${timelineEvent.color};stroke-width:2`);
        svgContainer.appendChild(lineFragment);
        eventsFragment.append(timelineEvent.timelineEventDetails.previewNode);
      };
      createTimelinePreviewHTML();
    }
    visibleEvents.forEach((ev) => {
      ev.preventNextPreviewRender = false;
    });
    return eventsFragment;
  };
  const createEventHTML = (parentEvent) => {
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
      const isHighlighted = !!selectedTimelineIds.length && !!selectedTimelineIds.find((tlId) => tlId === timelineEvent.timelineEventDetails.id);
      const levelFactor = (timelineEvent.timelineEventDetails.level - 1) * options.eventHeight + (timelineEvent.timelineEventDetails.level - 1) * options.eventSpacing;
      const stepFactor = timelineEvent.timelineEventDetails.step * options.eventSpacing;
      switch (timelineEvent.type) {
        default: {
          eventsFragment.append(createEventHTML(timelineEvent));
          continue;
        }
        case "container": {
          const heightFactor = timelineEvent.timelineEventDetails.height * options.eventHeight + timelineEvent.timelineEventDetails.height * options.eventSpacing;
          timelineEvent.timelineEventDetails.eventNode.style.bottom = `${levelFactor + heightFactor + stepFactor}px`;
          eventsFragment.append(timelineEvent.timelineEventDetails.eventNode);
          eventsFragment.append(createEventHTML(timelineEvent));
          continue;
        }
        case "timeline": {
          const parentfactor = (parentEvent.timelineEventDetails.level - 1) * options.eventHeight + (parentEvent.timelineEventDetails.level - 1) * options.eventSpacing;
          timelineEvent.timelineEventDetails.eventNode.style.bottom = `${parentfactor + levelFactor + stepFactor}px`;
          timelineEvent.timelineEventDetails.eventNode.style.backgroundColor = isHighlighted ? timelineEvent.highlightedColor : timelineEvent.color;
          break;
        }
        case "background": {
          break;
        }
      }
      timelineEvent.timelineEventDetails.eventNode.style.left = leftRatio * 100 + "%";
      timelineEvent.timelineEventDetails.eventNode.style.width = widthRatio + "%";
      timelineEvent.timelineEventDetails.eventNode.attributes["starttime"] = viewInside ? viewStart() : timelineEvent.timelineEventDetails.startMinutes;
      eventsFragment.append(timelineEvent.timelineEventDetails.eventNode);
      visibleEvents.push(timelineEvent);
    }
    return eventsFragment;
  };
  const appendContainerHTML = () => {
    element.style.position = "relative";
    element.style.overflow = "hidden";
    element.style.minHeight = "3rem";
    labelContainer = document.createElement("div");
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
    dividerContainer = document.createElement("div");
    element.appendChild(dividerContainer);
    dividerContainer.classList.add(options.classNames.timelineDividers);
    dividerContainer.style.width = "100%";
    dividerContainer.style.height = "100%";
    dividerContainer.style.position = "absolute";
    dividerContainer.style.zIndex = "-2";
    dividerContainer.style.bottom = "0";
    eventsContainer = document.createElement("div");
    element.appendChild(eventsContainer);
    eventsContainer.classList.add(options.classNames.timelineEvents);
    eventsContainer.style.position = "absolute";
    eventsContainer.style.bottom = "50px";
    eventsContainer.style.height = "calc(100% - 50px)";
    eventsContainer.style.width = "100%";
    eventsContainer.style.overflowY = "auto";
    eventsContainer.style.overflowX = "hidden";
    previewsContainer = document.createElement("div");
    element.appendChild(previewsContainer);
    previewsContainer.classList.add(options.classNames.timelinePreviews);
    previewsContainer.style.position = "absolute";
    previewsContainer.style.bottom = "50px";
    previewsContainer.style.height = "calc(100% - 50px)";
    previewsContainer.style.width = "100%";
    previewsContainer.style.overflowY = "auto";
    previewsContainer.style.overflowX = "hidden";
    ioContainer = document.createElement("div");
    element.appendChild(ioContainer);
    ioContainer.classList.add(options.classNames.timelineIo);
    ioContainer.style.position = "absolute";
    ioContainer.style.bottom = "0";
    ioContainer.style.top = "0";
    ioContainer.style.width = "100%";
  };
  const appendLabelHTML = () => {
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
  const appendEventHTML = () => {
    const eventsHtml = createEventHTML(currentTimeline);
    if (eventsHtml)
      eventsContainer.appendChild(eventsHtml);
  };
  const appendPreviewHTML = () => {
    if (!preventPreviewRender && !preventNextPreviewRender) {
      const previewsHtml = createPreviewHTML();
      if (previewsHtml)
        previewsContainer.appendChild(previewsHtml);
    }
    preventNextPreviewRender = false;
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
    if (dividerContainer)
      dividerContainer.innerHTML = "";
    if (labelContainer)
      labelContainer.innerHTML = "";
    if (eventsContainer)
      eventsContainer.innerHTML = "";
    if (previewsContainer)
      previewsContainer.innerHTML = "";
    visibleEvents = [];
    fire("update.tl.container");
  };
  const clear = () => {
    if (!currentTimeline)
      return;
    currentTimeline.events = [];
    currentTimeline.timelineEventDetails.childrenByStartMinute = [];
    currentTimeline.timelineEventDetails.timelineLevelMatrix = { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } };
    currentTimeline.timelineEventDetails.backgroundLevelMatrix = { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } };
    eventBatchCount = 0;
    fire("cleared.tl.container");
    update();
  };
  const onUpdate = () => {
    appendLabelHTML();
    appendEventHTML();
    if (options.numberOfHighscorePreviews > 0) {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(() => {
        appendPreviewHTML();
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
  const addEvents = (parent, ...events) => {
    const parsedSortedChildren = events.map((tl) => parseEvent(tl, parent)).filter((tl) => !!tl).sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);
    const createEventNode = (timelineEvent) => {
      const eventHTML = document.createElement("div");
      eventHTML.style.boxSizing = "border-box";
      eventHTML.style.position = "absolute";
      eventHTML.style.minWidth = "5px";
      eventHTML.classList.add(options.classNames.timelineEvent);
      eventHTML.setAttribute("level", timelineEvent.timelineEventDetails.level.toString());
      eventHTML.setAttribute("depth", timelineEvent.timelineEventDetails.depth.toString());
      eventHTML.setAttribute("score", timelineEvent.timelineEventDetails.score.toString());
      eventHTML.setAttribute("step", timelineEvent.timelineEventDetails.step.toString());
      return eventHTML;
    };
    const setTimelineNode = (timelineEvent) => {
      const node = createEventNode(timelineEvent);
      node.style.minHeight = `${options.eventHeight}px`;
      node.style.cursor = "pointer";
      node.style.borderRadius = "5px";
      node.title = timelineEvent.title;
      if (timelineEvent.renderEventNode) {
        const elementToAppend = document.createElement("div");
        elementToAppend.append(timelineEvent.renderEventNode(timelineEvent));
        node.append(elementToAppend);
      }
      node.setAttribute("eventid", timelineEvent.timelineEventDetails.id);
      timelineEvent.timelineEventDetails.eventNode = node;
    };
    const setBackgroundNode = (timelineEvent) => {
      const node = createEventNode(timelineEvent);
      const topFactor = (timelineEvent.timelineEventDetails.level - 1) * 25;
      node.style.bottom = `0`;
      node.style.top = `${topFactor}px`;
      node.style.zIndex = "-1";
      node.style.overflow = "hidden";
      node.style.background = `linear-gradient(to right, ${options.defaultBackgroundColor}, 1px, #0000)`;
      node.title = timelineEvent.title;
      if (timelineEvent.renderEventNode) {
        const elementToAppend = document.createElement("div");
        elementToAppend.append(timelineEvent.renderEventNode(timelineEvent));
        elementToAppend.setAttribute("eventid", timelineEvent.timelineEventDetails.id);
        node.append(elementToAppend);
      }
      timelineEvent.timelineEventDetails.eventNode = node;
    };
    const setContainerNode = (timelineEvent) => {
      const node = createEventNode(timelineEvent);
      node.style.height = `15px`;
      node.style.borderBottomColor = options.defaultBackgroundColor;
      node.style.borderBottomWidth = "1px";
      node.style.borderBottomStyle = "solid";
      node.style.width = "100%";
      const titleNode = document.createElement("div");
      titleNode.style.position = "relative";
      titleNode.style.bottom = "-12px";
      titleNode.style.fontSize = "x-small";
      titleNode.style.width = "fit-content";
      titleNode.style.backgroundColor = "white";
      titleNode.style.zIndex = "1";
      titleNode.style.padding = "0px 3px 0px 3px";
      titleNode.append(timelineEvent.title);
      node.appendChild(titleNode);
      timelineEvent.timelineEventDetails.eventNode = node;
    };
    const setPreviewNode = (timelineEvent) => {
      if (!timelineEvent.renderPreviewNode)
        return;
      const previewHTML = document.createElement("div");
      previewHTML.style.boxSizing = "border-box";
      previewHTML.style.position = "absolute";
      previewHTML.style.overflow = "hidden";
      previewHTML.style.width = options.highscorePreviewWidth + "px";
      previewHTML.title = timelineEvent.title;
      previewHTML.classList.add(options.classNames.timelinePreview);
      previewHTML.setAttribute("eventid", timelineEvent.timelineEventDetails.id);
      previewHTML.append(timelineEvent.renderPreviewNode(timelineEvent));
      timelineEvent.timelineEventDetails.previewNode = previewHTML;
    };
    const setScore = (timelineEvent) => {
      const durationRatio = timelineEvent.timelineEventDetails.durationMinutes / parent.timelineEventDetails.durationMinutes;
      const score = durationRatio * (timelineEvent.timelineEventDetails.childrenByStartMinute.length + 1);
      timelineEvent.timelineEventDetails.score = score;
    };
    const setLevel = (timelineEvent, matrix, useEqual = true) => {
      let level = 0;
      let height = 0;
      for (const eventLevel in matrix) {
        level = Number(eventLevel);
        if (useEqual ? timelineEvent.timelineEventDetails.startMinutes >= matrix[eventLevel].time : timelineEvent.timelineEventDetails.startMinutes > matrix[eventLevel].time) {
          matrix[eventLevel] = {
            height: timelineEvent.timelineEventDetails.height,
            time: timelineEvent.timelineEventDetails.endMinutes
          };
          timelineEvent.timelineEventDetails.level = level;
          return;
        }
        height = matrix[eventLevel].height;
      }
      level += height;
      matrix[level.toString()] = {
        height: timelineEvent.timelineEventDetails.height,
        time: timelineEvent.timelineEventDetails.endMinutes
      };
      timelineEvent.timelineEventDetails.level = level;
    };
    const setNeighborsTo = (timelineEvent, me) => {
      timelineEvent.timelineEventDetails.next = parent.timelineEventDetails.childrenByStartMinute.length > me + 1 ? parent.timelineEventDetails.childrenByStartMinute[me + 1].timelineEventDetails.id : void 0;
      timelineEvent.timelineEventDetails.previous = me > 0 ? parent.timelineEventDetails.childrenByStartMinute[me - 1].timelineEventDetails.id : void 0;
    };
    parent.timelineEventDetails.childrenByStartMinute.push(...parsedSortedChildren);
    parent.timelineEventDetails.startMinutes = calcStart(parent);
    parent.timelineEventDetails.endMinutes = calcEnd(parent);
    parent.timelineEventDetails.durationMinutes = parent.timelineEventDetails.endMinutes - parent.timelineEventDetails.startMinutes;
    parent.timelineEventDetails.childrenByStartMinute.forEach((childEvent, i) => {
      switch (childEvent.type) {
        case "container":
          setLevel(childEvent, parent.timelineEventDetails.timelineLevelMatrix);
          setContainerNode(childEvent);
          break;
        case "timeline":
          setScore(childEvent);
          setLevel(childEvent, parent.timelineEventDetails.timelineLevelMatrix, false);
          setTimelineNode(childEvent);
          break;
        case "background":
          setLevel(childEvent, currentTimeline.timelineEventDetails.backgroundLevelMatrix);
          setBackgroundNode(childEvent);
          break;
        default:
      }
      setPreviewNode(childEvent);
      setNeighborsTo(childEvent, i);
    });
    parent.timelineEventDetails.height = Math.max(...Object.entries(parent.timelineEventDetails.timelineLevelMatrix).map(([key, o]) => Number(key)));
  };
  const parseEvent = (timelineEvent, parent) => {
    if (!timelineEvent) {
      console.warn("Event object is empty");
      return void 0;
    }
    const timelineEventType = timelineEvent.type || timelineEvent.start ? timelineEvent.type || "timeline" : "wrapper";
    const timelineEventWithDetails = __spreadProps(__spreadValues(__spreadValues({}, timelineEvent), {
      type: timelineEventType,
      color: timelineEventType === "timeline" ? timelineEvent.color || options.defaultColor : timelineEventType === "background" ? timelineEvent.color || options.defaultBackgroundColor : void 0,
      highlightedColor: timelineEventType === "timeline" ? timelineEvent.highlightedColor || options.defaultHighlightedColor : timelineEventType === "background" ? timelineEvent.highlightedColor || options.defaultBackgroundHightligtedColor : void 0
    }), {
      timelineEventDetails: {
        id: crypto.randomUUID(),
        level: 0,
        step: timelineEvent.step || (parent == null ? void 0 : parent.step) || 0,
        score: 0,
        height: 1,
        childrenByStartMinute: [],
        childrenByScore: [],
        depth: parent ? parent.timelineEventDetails.depth + 1 : 0,
        parentId: parent == null ? void 0 : parent.timelineEventDetails.id,
        startMinutes: parseDateToMinutes(timelineEvent.start),
        endMinutes: parseDateToMinutes(timelineEvent.end),
        durationMinutes: parseNumberToMinutes(timelineEvent.duration) || 0,
        timelineLevelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } },
        backgroundLevelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } }
      }
    });
    if (parent && timelineEventWithDetails.type === "timeline" && parent.type === "wrapper")
      parent.type = "container";
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
  const raise = (error) => {
    element.dispatchEvent(
      new CustomEvent("err.tl.container", {
        detail: error,
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
    select,
    preventNextPreviewRender: () => {
      preventNextPreviewRender = true;
    },
    setPreventPreviewRender: (prevent) => {
      preventPreviewRender = prevent;
    },
    clear
  };
};
export {
  TimelineContainer
};
