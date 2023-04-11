export interface ITimelineOptions {
	labelCount?: number;
	zoomSpeed?: number;
	dragSpeed?: number;
	start?: number[] | string | number | Date;
	end?: number[] | string | number | Date;
	timelineStart?: number[] | string | number | Date;
	timelineEnd?: number[] | string | number | Date;
	minZoom?: number;
	maxZoom?: number;
	position?: string;
	eventHeight?: number;
	autoZoom?: boolean;
	defaultColor?: number[];
	debug: boolean;
	classNames?: {
		timeline?: string;
		timelineEvent?: string;
		timelineEventTitle?: string;
		timelineLabels?: string;
		timelineDividers?: string;
		timelineEvents?: string;
		timelineLabel?: string;
		timelineDivider?: string;
	};
}
interface IMatrix {
	[key: number]: {
		height: number;
		time: number;
	};
}
interface ITimelineBase {
	title: string;
}
interface ITimelineProps {
	type?: string;
	color?: number[];
	open?: boolean;
}
interface ITimelineEventDetails extends Required<ITimelineProps> {
	id: string;
	startMinutes: number;
	endMinutes: number;
	durationMinutes: number;
	level: number;
	step: number;
	depth: number;
	height: number;
	score: number;
	parentId?: string;
	levelMatrix: IMatrix;
	children: { [key: string]: ITimelineEventWithDetails };
	// ratio?: number;
	// pivot?: number;
}
interface ITimelineEventWithDetails extends ITimelineEvent {
	timelineEventDetails: ITimelineEventDetails;
}
export interface ITimelineEvent extends ITimelineBase, ITimelineProps {
	start?: number[] | string | number | Date;
	end?: number[] | string | number | Date;
	duration?: number | string;
	events?: ITimelineEvent[];
}
export interface ITimelineContainer {
	load: (loader: () => Promise<ITimelineEvent>) => Promise<void>;
	add: (timelineEvent: ITimelineEvent) => void;
	zoom: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onzoomend?: (timelineEvent: ITimelineEvent) => void) => void;
	focus: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onfocused?: (timelineEvent: ITimelineEvent) => void) => void;
	reset: () => void;
}
enum Direction {
	In = -1,
	Out = 1,
}

export const Timeline = (elementIdentifier: HTMLElement | string, settings?: ITimelineOptions): ITimelineContainer => {
	let ratio: number;
	let pivot: number;
	let timelineStart: number;
	let timelineEnd: number;
	let element: HTMLElement;
	let options: ITimelineOptions;
	let labelContainer: HTMLDivElement;
	let dividerContainer: HTMLDivElement;
	let eventsContainer: HTMLDivElement;
	let rootTimeline: ITimelineEventWithDetails;
	let currentTimeline: ITimelineEventWithDetails;

	const MINUTES_IN_DAY = 1440; // minutes in a day
	const MINUTES_IN_WEEK = 10080; // minutes in a week
	const MINUTES_IN_YEAR = 525948.766; // minutes in a year
	const MINUTES_IN_MONTH = MINUTES_IN_YEAR / 12; // minutes in a month
	const SHOW_MONTH_DURATION = MINUTES_IN_MONTH * 18; // When to show monthname in time label
	const SHOW_DAY_DURATION = MINUTES_IN_WEEK * 6; // When to show date in time label
	const SHOW_TIME_DURATION = MINUTES_IN_DAY * 4; // When to show time in time label

	// ITimelineEventWithDetails guard
	const isITimelineEventWithDetails = (timelineEvent: ITimelineEvent): timelineEvent is ITimelineEventWithDetails =>
		"timelineEventDetails" in timelineEvent;
	const load = async (loader: () => Promise<ITimelineEvent>): Promise<void> => {
		if (!loader) throw new Error(`Argument is empty. Please provide a loader function as first arg`);
		add(await loader());
	};
	const add = (...timelineEvents: ITimelineEvent[]): void => {
		if (!timelineEvents) throw new Error(`Event argument is empty. Please provide Timeline event(s) as input`);

		// Parse & sort all events
		addEvents(rootTimeline, ...timelineEvents);

		// Draw
		update();
	};
	const isViewInside = (timelineEvent: ITimelineEvent): boolean => {
		return timelineEvent.start < viewStart() && timelineEvent.end > viewEnd();
	};
	const init = (elementIdentifier: HTMLElement | string, settings?: ITimelineOptions): void => {
		// Handle DOM Element
		if (!elementIdentifier) throw new Error(`Element argument is empty. DOM element | selector as first arg`);
		if (typeof elementIdentifier === "string") {
			const elem = document.querySelector(elementIdentifier) as HTMLElement;
			if (!elem) throw new Error(`Selector could not be found [${element}]`);
			element = elem;
		}
		if (elementIdentifier instanceof HTMLElement) {
			element = elementIdentifier;
		}

		// Handle options
		options = {
			...{
				labelCount: 5,
				zoomSpeed: 0.025,
				dragSpeed: 0.003,
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
				debug: false,
				classNames: {
					timeline: "tl",
					timelineEvent: "tl__event",
					timelineEventTitle: "tl__event__title",
					timelineLabels: "tl__labels",
					timelineDividers: "tl__dividers",
					timelineEvents: "tl__events",
					timelineLabel: "tl__label",
					timelineDivider: "tl__divider",
				},
			},
			...settings,
		};

		rootTimeline = parseEvent({
			title: "View",
			type: "container",
			start: options.start,
			end: options.end,
		});

		// Set timeline boundaries
		timelineStart = parseToMinutes(options.timelineStart);
		timelineEnd = parseToMinutes(options.timelineEnd);

		const viewStart = rootTimeline.timelineEventDetails.startMinutes;
		const viewEnd = rootTimeline.timelineEventDetails.endMinutes;

		if (viewStart < timelineStart) timelineStart = viewStart;
		if (viewEnd > timelineEnd) timelineEnd = viewEnd;
		const viewDuration = viewEnd - viewStart;

		ratio = timelineDuration() / viewDuration;
		pivot = (timelineStart - viewStart) / viewDuration;

		// Handle DOM elements setup
		setupContainerHTML();

		// Register Mouse and Resize event handlers
		registerListeners(element);

		// Draw inital timeline
		focus(rootTimeline, false);
	};
	const timelineDuration = (): number => {
		return timelineEnd - timelineStart;
	};
	const viewWidth = (): number => {
		return element.offsetWidth || 0;
	};
	const viewStart = (): number => {
		return timelineStart - viewDuration() * pivot;
	};
	const viewEnd = (): number => {
		return viewStart() + viewDuration();
	};
	const viewDuration = (): number => {
		return timelineDuration() / ratio;
	};
	const scaledZoomSpeed = (): number => {
		return options.zoomSpeed * ratio;
	};
	const getViewRatio = (minutes: number): number => {
		return (minutes - viewStart()) / viewDuration();
	};
	const getTimelineRatio = (minutes: number): number => {
		return (minutes - timelineStart) / timelineDuration();
	};
	const setRatio = (direction: Direction, deltaRatio: number): boolean => {
		let newRatio = ratio - deltaRatio;

		// If zoom OUT - test if zoom is allowed
		if (direction === Direction.Out && newRatio <= options.minZoom) {
			return false;
		}

		// If zoom IN - test if zoom is allowed
		if (direction === Direction.In && newRatio >= options.maxZoom) {
			return false;
		}

		ratio = newRatio;
		return true;
	};
	const setPivot = (deltaPivot: number): void => {
		let newPivot = pivot + deltaPivot;

		if (newPivot >= 0) {
			// pivot larger than allowed (too much to the right)
			newPivot = 0;
		}

		if (newPivot + ratio <= 1) {
			// pivot smaller than allowed (too much to the left)
			newPivot = 1 - ratio;
		}

		pivot = newPivot;
	};
	const onzoom = (direction: Direction, mouseX2timeline: number): void => {
		// Make zoomSpeed relative to zoomLevel
		const deltaRatio = direction * scaledZoomSpeed();
		const deltaPivot = mouseX2timeline * deltaRatio;

		if (setRatio(direction, deltaRatio)) setPivot(deltaPivot);

		update();
	};
	const onmove = (deltaPivot: number): void => {
		setPivot(deltaPivot * options.dragSpeed);

		update();
	};
	const focus = (timelineEvent: ITimelineEvent, useAnimation: boolean = true, onfocused?: (timelineEvent: ITimelineEvent) => void): void => {
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
					cancelable: true,
				})
			);
			if (onfocused) onfocused(currentTimeline);
		});
	};
	const reset = (): void => {
		currentTimeline = rootTimeline;
		zoomto(
			options.start ? parseToMinutes(options.start) : currentTimeline.timelineEventDetails.startMinutes,
			options.end ? parseToMinutes(options.end) : currentTimeline.timelineEventDetails.endMinutes
		);
	};
	const zoom = (timelineEvent: ITimelineEvent, useAnimation: boolean = true, onzoomend?: (timelineEvent: ITimelineEvent) => void): void => {
		if (!timelineEvent) {
			throw "first argument 'timelineEvent' of method 'zoom' must be an object";
		}
		if (!isITimelineEventWithDetails(timelineEvent)) {
			throw "first argument 'timelineEvent' of method 'zoom' must be an object of type ITimelineEventWithDetails";
		}

		zoomto(timelineEvent.timelineEventDetails.startMinutes, timelineEvent.timelineEventDetails.endMinutes, useAnimation, () => {
			fire("zoom.tl.event", timelineEvent);
			if (onzoomend) onzoomend(timelineEvent);
		});
	};
	const zoomto = (startMinutes: number, endMinutes: number, useAnimation: boolean = true, onzoomend?: () => void): void => {
		if (!startMinutes) {
			throw "first argument 'startMinutes' of method 'zoomto' must be a number";
		}
		if (!endMinutes) {
			throw "second argument 'endMinutes' of method 'zoomto' must be a number";
		}

		const targetDurationExtension = (endMinutes - startMinutes) * 0.05;
		const targetStart = startMinutes - targetDurationExtension; // Create 10% spacing - 5% on each side of the timeline
		const targetEnd = endMinutes + targetDurationExtension; // Create 10% spacing - 5% on each side of the timeline
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

					if (onzoomend) onzoomend();
				};

				const pivotTimer = setInterval(() => {
					onmove(xDirection * 10);
					if (xDirection < 0 && pivot < targetPivot) stopFocus(); // Right (Forward in time)
					if (xDirection > 0 && pivot > targetPivot) stopFocus(); // Left (Back in time)
				}, 1);
			};

			const ratioTimer = setInterval(() => {
				onzoom(zDirection, mouseX2Timeline);
				if (zDirection < 0 && ratio > targetRatio) stopZoom(); // In
				if (zDirection > 0 && ratio < targetRatio) stopZoom(); // Out
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
	const registerListeners = (element: HTMLElement): void => {
		// Touch Point cache
		let tpCache: Touch[] = [];
		// Add drag event handler
		let dragStartX: number, dragStartY: number;
		let inDrag = false;
		let canDrag = true;

		// Drag handlers
		const drag = (x: number, y: number) => {
			if (!inDrag || !canDrag) {
				return;
			}
			canDrag = false;
			const deltaScrollLeft = x - dragStartX;
			//const deltaScrollTop = (e.pageY - dragStartY);
			if (deltaScrollLeft) onmove(deltaScrollLeft);
			dragStartX = x;
			dragStartY = y;
			setTimeout(() => (canDrag = true), 10); // Throttle drag for performance reasons
			fire("drag.tl.container");
		};
		const startDrag = (x: number, y: number) => {
			inDrag = true;
			dragStartX = x;
			dragStartY = y;

			fire("startpan.tl.container");
		};
		const endDrag = () => {
			inDrag = false;

			fire("endpan.tl.container");
		};

		// Add resize handler
		window.addEventListener("resize", (event) => {
			update();

			fire("resize.tl.container");
		});

		// Add zoom event handler
		element.addEventListener("wheel", (event: WheelEvent) => {
			if (event.defaultPrevented) return;
			event.preventDefault();
			// Decide whether zoom is IN (-) or OUT (+)
			var direction = Math.sign(event.deltaY) as Direction;
			// console.log('wheel', direction, event)
			// Adjust width of timeline for zooming effect
			const leftRatio = (event.target as HTMLElement).attributes["starttime"]
				? getViewRatio((event.target as HTMLElement).attributes["starttime"])
				: 0;

			const offsetX = leftRatio * element.getBoundingClientRect().width + event.offsetX;
			const mouseX2view = offsetX / viewWidth();
			const mouseX2timeline = (mouseX2view - pivot) / ratio;
			onzoom(direction, mouseX2timeline);

			fire("wheel.tl.container");
		});

		//
		element.addEventListener("touchstart", (event: TouchEvent) => {
			// If the user makes simultaneous touches, the browser will fire a
			// separate touchstart event for each touch point. Thus if there are
			// three simultaneous touches, the first touchstart event will have
			// targetTouches length of one, the second event will have a length
			// of two, and so on.
			event.preventDefault();

			//
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

		element.addEventListener("touchend", (event: TouchEvent) => {
			// If the user makes simultaneous touches, the browser will fire a
			// separate touchstart event for each touch point. Thus if there are
			// three simultaneous touches, the first touchstart event will have
			// targetTouches length of one, the second event will have a length
			// of two, and so on.
			endDrag();
			fire("touchend.tl.container");
		});

		// This is a very basic 2-touch move/pinch/zoom handler that does not include
		// error handling, only handles horizontal moves, etc.
		element.addEventListener("touchmove", (event: TouchEvent) => {
			// If the user makes simultaneous touches, the browser will fire a
			// separate touchstart event for each touch point. Thus if there are
			// three simultaneous touches, the first touchstart event will have
			// targetTouches length of one, the second event will have a length
			// of two, and so on.
			//event.preventDefault();
			if (event.targetTouches.length === 2 && event.changedTouches.length === 2) {
				// Check if the two target touches are the same ones that started
				// the 2-touch
				const touch1 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[0].identifier);
				const touch2 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[1].identifier);
				const target = event.target as HTMLDivElement;

				if (touch1 >= 0 && touch2 >= 0) {
					// Calculate the difference between the start and move coordinates
					const diff1 = Math.abs(tpCache[touch1].clientX - event.targetTouches[0].clientX);
					const diff2 = Math.abs(tpCache[touch2].clientX - event.targetTouches[1].clientX);

					tpCache = [];
					for (let i = 0; i < event.targetTouches.length; i++) {
						tpCache.push(event.targetTouches[i]);
					}
					fire("pinch.tl.container");
				} else {
					// empty tpCache
					tpCache = [];
				}
			}
			if (event.targetTouches.length === 1 && event.changedTouches.length === 1) {
				drag(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
				fire("touchmove.tl.container");
			}
		});

		element.addEventListener("mousedown", (event) => {
			startDrag(event.clientX, event.clientY);
			fire("mousedown.tl.container");
		});

		// Add move handler
		element.addEventListener("mousemove", (event) => {
			drag(event.clientX, event.clientY);
			fire("mousemove.tl.container");
		});

		// Add mouse up handler
		element.addEventListener("mouseup", (event) => {
			endDrag();
			fire("mouseup.tl.container");
		});
	};
	const setupEventsHTML = (parentEvent: ITimelineEventWithDetails): DocumentFragment | undefined => {
		const eventsFragment = document.createDocumentFragment();
		for (const [key, timelineEvent] of Object.entries<ITimelineEventWithDetails>(parentEvent.timelineEventDetails.children)) {
			if (!timelineEvent || !timelineEvent.timelineEventDetails) continue;
			if (timelineEvent.timelineEventDetails.startMinutes >= viewEnd()) continue;
			if (timelineEvent.timelineEventDetails.endMinutes <= viewStart()) continue;
			//if (openTimelines.includes(timelineEvent.timelineEventDetails.id)) continue;
			//if (timelineEvent.timelineEventDetails.parentId && !openTimelines.includes(timelineEvent.timelineEventDetails.parentId)) continue;

			const focused = false;
			if (focused) continue;

			const viewInside = isViewInside(timelineEvent);

			const createTimelineEventHTML = (): HTMLDivElement => {
				const parentLevel = timelineEvent.timelineEventDetails.parentId ? parentEvent.timelineEventDetails.level : 0;
				const levelFactor = timelineEvent.timelineEventDetails.level * 1.5;
				const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.timelineEventDetails.startMinutes);
				const widthRatio = viewInside ? 100 : (timelineEvent.timelineEventDetails.durationMinutes / viewDuration()) * 100;
				const bgcolor = focused
					? [
							timelineEvent.timelineEventDetails.color[0],
							timelineEvent.timelineEventDetails.color[1],
							timelineEvent.timelineEventDetails.color[2],
							0.1,
					  ]
					: timelineEvent.timelineEventDetails.color;

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
							cancelable: true,
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
							cancelable: true,
						})
					);
				});
				eventHTML.addEventListener("mouseleave", (e) => {
					element.dispatchEvent(
						new CustomEvent("mouseleave.tl.event", {
							detail: timelineEvent,
							bubbles: false,
							cancelable: true,
						})
					);
				});
				eventHTML.addEventListener("dblclick", (e) => {
					element.dispatchEvent(
						new CustomEvent("dblclick.tl.event", {
							detail: timelineEvent,
							bubbles: false,
							cancelable: true,
						})
					);
				});

				return eventHTML;
			};

			const createBackgroundEventHTML = (): HTMLDivElement => {
				const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.timelineEventDetails.startMinutes);
				const widthRatio = viewInside ? 100 : (timelineEvent.timelineEventDetails.durationMinutes / viewDuration()) * 100;

				const bgcolor =
					timelineEvent.timelineEventDetails.color.length === 3
						? [...timelineEvent.timelineEventDetails.color, 0.1]
						: timelineEvent.timelineEventDetails.color;
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
	const setupContainerHTML = (): void => {
		// Register parent as position = "relative" for absolute positioning to work
		element.style.position = "relative";
		element.style.overflow = "hidden";
		element.style.minHeight = "3rem";

		// Initialize labels
		const existingLabelContainer = element.querySelector(`.${options.classNames.timelineLabels}`) as HTMLDivElement;
		labelContainer = existingLabelContainer || document.createElement("div");
		if (!existingLabelContainer) element.appendChild(labelContainer);

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
			// case "center":
			// 	this.labelContainer.style.top = "50%";
			// 	this.labelContainer.style.transform = "translate(0, calc(-50%))";
			// 	break;
			default:
				labelContainer.style.bottom = "0";
		}

		// Initialize dividers
		const existingDividerContainer = element.querySelector(`.${options.classNames.timelineDividers}`) as HTMLDivElement;
		dividerContainer = existingDividerContainer || document.createElement("div");
		if (!existingDividerContainer) element.appendChild(dividerContainer);

		dividerContainer.classList.add(options.classNames.timelineDividers);
		dividerContainer.style.width = "100%";
		dividerContainer.style.height = "100%";
		dividerContainer.style.position = "absolute";
		dividerContainer.style.zIndex = "-2";
		dividerContainer.style.bottom = "0";

		// Initialize events container
		const existingEventsContainer = element.querySelector(`.${options.classNames.timelineEvents}`) as HTMLDivElement;
		eventsContainer = existingEventsContainer || document.createElement("div");
		if (!existingEventsContainer) element.appendChild(eventsContainer);
		eventsContainer.classList.add(options.classNames.timelineEvents);
		eventsContainer.style.position = "absolute";
		eventsContainer.style.bottom = "50px";
		eventsContainer.style.height = "calc(100% - 50px)";
		eventsContainer.style.width = "100%";
	};
	const formatDateLabel = (minutes: number): string => {
		const yearsCount = Math.floor(minutes / MINUTES_IN_YEAR);
		const currentYear = yearsCount + 1970;
		const currentYearLessThan5Digits = currentYear > -10000 && currentYear < 10000;
		const currentYearString = currentYearLessThan5Digits
			? currentYear.toString()
			: currentYear.toLocaleString("en-US", {
					notation: "compact",
					minimumFractionDigits: 1,
					maximumFractionDigits: 1,
			  });
		const currentRemainder = Math.abs(minutes - yearsCount * MINUTES_IN_YEAR);
		const momentInValidateRange = minutes > 270000 * MINUTES_IN_YEAR * -1 && minutes < 270000 * MINUTES_IN_YEAR;
		const date = momentInValidateRange ? new Date(minutes * 6e4) : new Date(currentRemainder * 6e4);

		if (viewDuration() < SHOW_TIME_DURATION) {
			return [
				Intl.DateTimeFormat(undefined, {
					month: "short",
					day: "numeric",
				}).format(date),
				currentYearString,
				Intl.DateTimeFormat(undefined, {
					hour: "numeric",
					minute: "numeric",
				}).format(date),
			].join(" ");
		}
		if (viewDuration() < SHOW_DAY_DURATION) {
			return [
				Intl.DateTimeFormat(undefined, {
					month: "short",
					day: "numeric",
				}).format(date),
				currentYearString,
			].join(" ");
		}
		if (viewDuration() < SHOW_MONTH_DURATION) {
			return [
				Intl.DateTimeFormat(undefined, {
					month: "short",
				}).format(date),
				currentYearString,
			].join(" ");
		}
		return currentYearString;
	};
	const update = (): void => {
		if (!element || !currentTimeline) return;

		const currentLevel = Math.floor(ratio);
		// https://math.stackexchange.com/questions/3381728/find-closest-power-of-2-to-a-specific-number
		const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
		const granularity = 1 / (options.labelCount + 1);
		const timelineViewDifference = viewStart() - timelineStart;
		const timestampDistance = timelineDuration() * granularity;
		const currentTimestampDistanceByLevel = timestampDistance / iterator;

		// Find integer value of timestamp difference
		const integerDifFraction = Math.floor(timelineViewDifference / currentTimestampDistanceByLevel);
		const currentDif = integerDifFraction * currentTimestampDistanceByLevel;

		const labels = document.createDocumentFragment();
		const dividers = document.createDocumentFragment();

		for (let i = 0; i < options.labelCount + 2; i++) {
			const labelTime = (i + 1) * currentTimestampDistanceByLevel + timelineStart + currentDif - currentTimestampDistanceByLevel;
			const dividerTime = labelTime + currentTimestampDistanceByLevel / 2;

			// Set label position
			const labelViewRatio = getViewRatio(labelTime);
			const labelViewLeftPosition = labelViewRatio * 100;

			// Set divider position
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
		if (eventsHtml) eventsContainer.appendChild(eventsHtml);

		// Dispatch DOM event
		fire("update.tl.container");
	};
	const parseToMinutes = (input: number[] | string | number | Date | undefined): number | undefined => {
		if (input === undefined) return undefined;

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
		// It should be noted that the maximum Date is not of the same value as the maximum safe integer (Number.MAX_SAFE_INTEGER is 9,007,199,254,740,991).
		// Instead, it is defined in ECMA-262 that a maximum of ±100,000,000 (one hundred million) days relative
		// to January 1, 1970 UTC (that is, April 20, 271821 BCE ~ September 13, 275760 CE)
		// can be represented by the standard Date object (equivalent to ±8,640,000,000,000,000 milliseconds).

		const parseDateArray = (input: number[]): number => {
			const date = new Date();
			date.setDate(input[2] ? input[2] : 1);
			date.setMonth(input[1] ? input[1] - 1 : 0);
			date.setHours(input[3] ? input[3] : 0);
			date.setMinutes(input[4] ? input[4] : 0);
			date.setSeconds(0);

			if (!input[0]) {
				return date.getTime() / 6e4;
			}

			if (input[0] && input[0] > -270000 && input[0] < 270000) {
				date.setFullYear(input[0]);
				return date.getTime() / 6e4;
			}

			// 525948.766 = minutes in a year
			const dateYearInMinutes = 525948.766 * input[0];
			return dateYearInMinutes + date.getTime() / 6e4;
		};

		const parseDateString = (input: string): number => {
			switch (input) {
				case "now":
					return parseDateArray([]);
				default:
					// 31556926 = Seconds in a year
					// 525948.766 = minutes in a year
					const years = input.match(/y$/) ? Number(input.replace(/y$/, "")) : NaN;
					if (!isNaN(years)) {
						return parseDateArray([years + 1970]);
					}
					const yearsK = input.match(/K$/) ? Number(input.replace(/K$/, "")) : NaN;
					if (!isNaN(yearsK)) {
						return parseDateArray([yearsK * 1e3]);
					}
					const yearsM = input.match(/M$/) ? Number(input.replace(/M$/, "")) : NaN;
					if (!isNaN(yearsM)) {
						return parseDateArray([yearsM * 1e6]);
					}
					const yearsB = input.match(/B$/) ? Number(input.replace(/B$/, "")) : NaN;
					if (!isNaN(yearsB)) {
						return parseDateArray([yearsB * 1e9]);
					}
					const yearsBC = input.match(/bc$/) ? Number(input.replace(/bc$/, "")) : NaN;
					if (!isNaN(yearsBC)) {
						return parseDateArray([-yearsBC]);
					}
					const yearsAD = input.match(/ad$/) ? Number(input.replace(/ad$/, "")) : NaN;
					if (!isNaN(yearsAD)) {
						return parseDateArray([yearsAD]);
					}
					const minutes = Number(input);
					if (!isNaN(minutes)) {
						return new Date().getTime() / 6e4 + minutes * 6e4;
					}

					const timestamp = Date.parse(input);
					if (isNaN(timestamp)) return new Date().getTime() / 6e4;
					return timestamp / 6e4;
			}
		};

		if (Array.isArray(input)) {
			let inputArray = input as number[];
			if (inputArray.length === 0) throw new Error("argument Array cannot be empty");
			const isNumberArray = inputArray.every((value) => {
				return typeof value === "number";
			});
			if (!isNumberArray) throw new Error("input Array must contain only numbers");
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

		return undefined;
	};
	const calcStart = (tl: ITimelineEventWithDetails, parsedChildren?: ITimelineEventWithDetails[]): number | undefined => {
		return tl.timelineEventDetails.startMinutes
			? parsedChildren && parsedChildren.length
				? Math.min(tl.timelineEventDetails.startMinutes, parsedChildren[0].timelineEventDetails.startMinutes)
				: tl.timelineEventDetails.startMinutes
			: parsedChildren && parsedChildren.length
			? parsedChildren[0].timelineEventDetails.startMinutes
			: undefined;
	};
	const calcEnd = (tl: ITimelineEventWithDetails, parsedChildren?: ITimelineEventWithDetails[]): number => {
		return tl.timelineEventDetails.endMinutes
			? tl.timelineEventDetails.endMinutes
			: tl.duration && !isNaN(Number(tl.duration))
			? tl.timelineEventDetails.startMinutes + Number(tl.duration)
			: parsedChildren && parsedChildren.length
			? Math.max.apply(
					1,
					parsedChildren.map((child) => child.timelineEventDetails.endMinutes)
			  )
			: tl.timelineEventDetails.startMinutes + 1;
	};
	const calcLevel = (timelineEvent: ITimelineEventWithDetails, parent: ITimelineEventWithDetails): number => {
		let level = 0;
		for (const eventLevel in parent.timelineEventDetails.levelMatrix) {
			level = Number(eventLevel);
			if (timelineEvent.timelineEventDetails.startMinutes > parent.timelineEventDetails.levelMatrix[eventLevel].time) {
				for (let i = 0; i < timelineEvent.timelineEventDetails.height; i++) {
					parent.timelineEventDetails.levelMatrix[(level + i).toString()] = {
						height: timelineEvent.timelineEventDetails.height,
						time: timelineEvent.timelineEventDetails.endMinutes,
					};
				}
				return level;
			}
		}
		level++;
		for (let i = 0; i < timelineEvent.timelineEventDetails.height; i++) {
			parent.timelineEventDetails.levelMatrix[(level + i).toString()] = {
				height: timelineEvent.timelineEventDetails.height,
				time: timelineEvent.timelineEventDetails.endMinutes,
			};
		}
		return level;
	};
	// const calcScore = (timelineEvent: ITimelineEventWithDetails, parent: ITimelineEventWithDetails): number => {
	// 	const durationRatio = timelineEvent.timelineEventDetails.durationMinutes / parent.timelineEventDetails.durationMinutes;
	// 	const score = durationRatio * timelineEvent.timelineEventDetails.children.length || 1;
	// 	return score;
	// };
	const addEvents = (parent: ITimelineEventWithDetails, ...children: ITimelineEvent[]): void => {
		const parsedChildren = children.map((tl) => parseEvent(tl, parent)).filter((tl) => !!tl);
		if (parsedChildren && parsedChildren.length && parent) {
			parsedChildren.sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);
			parent.timelineEventDetails.startMinutes = calcStart(parent, parsedChildren);
			parent.timelineEventDetails.endMinutes = calcEnd(parent, parsedChildren);
			parent.timelineEventDetails.durationMinutes = parent.timelineEventDetails.endMinutes - parent.timelineEventDetails.startMinutes;

			parsedChildren.forEach((childEvent, i) => {
				parent.timelineEventDetails.children[childEvent.timelineEventDetails.id] = childEvent;

				// Add score to result in order to sort by importance
				// childEvent.timelineEventDetails.score = ["container", "timeline"].includes(childEvent.timelineEventDetails.type) ? calcScore(childEvent, parent) : 0;

				// Add level
				childEvent.timelineEventDetails.level = ["timeline", "container"].includes(childEvent.timelineEventDetails.type)
					? calcLevel(childEvent, parent)
					: 0;
			});
		}

		parent.timelineEventDetails.height = parsedChildren.length ? Math.max(...parsedChildren.map((child) => child.timelineEventDetails.level)) : 1;
	};
	const parseEvent = (timelineEvent: ITimelineEvent, parent?: ITimelineEventWithDetails): ITimelineEventWithDetails | undefined => {
		if (!timelineEvent) {
			console.warn("Event object is empty");
			return undefined;
		}

		const timelineEventWithDetails = {
			...timelineEvent,
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
				parentId: parent?.timelineEventDetails.id,
				color: timelineEvent.color || options.defaultColor,
				startMinutes: parseToMinutes(timelineEvent.start),
				endMinutes: parseToMinutes(timelineEvent.end),
				levelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } },
			},
		};

		if (timelineEvent.events && timelineEvent.events.length) {
			addEvents(timelineEventWithDetails, ...timelineEvent.events);
		}

		// Calculate start date - if children exists take lowest date
		timelineEventWithDetails.timelineEventDetails.startMinutes = calcStart(timelineEventWithDetails);

		// Filter missing requirements
		if (!timelineEventWithDetails.timelineEventDetails.startMinutes) {
			console.warn("Missing start property on event - skipping", timelineEvent);
			return undefined;
		}

		// Calculate end date
		timelineEventWithDetails.timelineEventDetails.endMinutes = calcEnd(timelineEventWithDetails);
		timelineEventWithDetails.timelineEventDetails.durationMinutes =
			timelineEventWithDetails.timelineEventDetails.endMinutes - timelineEventWithDetails.timelineEventDetails.startMinutes;

		// Return
		return timelineEventWithDetails;
	};
	const parseTimelineHTML = (input: HTMLElement): any[] => {
		// Initialize events
		let result = [];
		const timelineEvents = input.querySelectorAll<HTMLElement>(".timelineEvent");
		if (timelineEvents) {
			timelineEvents.forEach((timelineEvent) => {
				try {
					result.push({
						...timelineEvent.attributes,
						events: parseTimelineHTML(timelineEvent),
					});
				} catch (error) {
					console.error(error, "timelineEvent");
				}
			});
		}
		return result;
	};
	const fire = (name: string, timelineEvent?: ITimelineEvent) => {
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
					pivot,
				},
				bubbles: false,
				cancelable: true,
				composed: false,
			})
		);
	};

	init(elementIdentifier, settings);

	return {
		focus,
		zoom,
		load,
		add,
		reset,
	};
};
