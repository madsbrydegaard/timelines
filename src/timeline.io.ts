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
	eventSpacing?: number;
	autoZoom?: boolean;
	autoHighlight?: boolean;
	defaultColor?: number[];
	zoomDuration?: number;
	easing?: string | ((time: number, start: number, change: number, duration: number) => number);
	debug?: boolean;
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
export interface ITimelineCustomEventDetails {
	name: string;
	options: ITimelineOptions;
	timelineEvent: ITimelineEventWithDetails;
	viewStartDate: string;
	viewEndDate: string;
	viewDuration: number;
	ratio: number;
	pivot: number;
}
interface IMatrix {
	[key: number]: {
		height: number;
		time: number;
	};
}
interface ITimelineBase {
	title: string;
	render?: (timelineEvent: ITimelineEventWithDetails) => HTMLDivElement;
}
interface ITimelineProps {
	type?: string;
	color?: number[];
	open?: boolean;
}
interface ITimelineEventDetails extends Required<ITimelineProps> {
	id: string;
	startMinutes?: number;
	endMinutes?: number;
	durationMinutes: number;
	level: number;
	step: number;
	depth: number;
	height: number;
	score: number;
	parentId?: string;
	levelMatrix: IMatrix;
	html?: HTMLDivElement;
	children: ITimelineEventWithDetails[];
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
	highlight: (timelineEvent?: ITimelineEvent) => void;
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
	let hightligtedTimelineId: string;

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
	const isViewInside = (timelineEvent: ITimelineEventWithDetails): boolean => {
		return timelineEvent.timelineEventDetails.startMinutes < viewStart() && timelineEvent.timelineEventDetails.endMinutes > viewEnd();
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
				zoomSpeed: 0.04,
				dragSpeed: 0.001,
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
				autoHighlight: false,
				defaultColor: [140, 140, 140],
				zoomDuration: 200,
				easing: "easeOutCubic",
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
		timelineStart = parseDateToMinutes(options.timelineStart);
		timelineEnd = parseDateToMinutes(options.timelineEnd);

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
		return element.getBoundingClientRect().width || 0;
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
		highlight();

		zoomto(currentTimeline.timelineEventDetails.startMinutes, currentTimeline.timelineEventDetails.endMinutes, useAnimation, () => {
			fire("focus.tl.event");
			if (onfocused) onfocused(currentTimeline);
		});
	};
	const reset = (): void => {
		currentTimeline = rootTimeline;
		zoomto(
			options.start ? parseDateToMinutes(options.start) : currentTimeline.timelineEventDetails.startMinutes,
			options.end ? parseDateToMinutes(options.end) : currentTimeline.timelineEventDetails.endMinutes
		);
		if (options.autoHighlight) {
			highlight();
		}
	};
	const highlight = (timelineEvent?: ITimelineEvent): void => {
		if (!timelineEvent) {
			hightligtedTimelineId = undefined;
		}
		if (timelineEvent && isITimelineEventWithDetails(timelineEvent)) {
			hightligtedTimelineId = timelineEvent.timelineEventDetails.id;
		}

		update();
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
		const targetPivot = (timelineStart - targetStart) / targetDuration;

		const animate = () => {
			let i = 0;
			const animationDuration = options.zoomDuration;

			// Thanks to http://robertpenner.com/easing/
			// Exampled @ https://spicyyoghurt.com/tools/easing-functions
			const easings = {
				easeOutExpo: (time: number, start: number, change: number, duration: number) => {
					return time == duration ? start + change : change * (-Math.pow(2, (-10 * time) / duration) + 1) + start;
				},
				easeOutCubic: (time: number, start: number, change: number, duration: number) => {
					return change * ((time = time / duration - 1) * time * time + 1) + start;
				},
				easeLinear: (time: number, start: number, change: number, duration: number) => {
					return (change * time) / duration + start;
				},
			};

			const startRatio = ratio;
			const startPivot = pivot;
			const deltaRatio = targetRatio - ratio;
			const deltaPivot = targetPivot - pivot;
			const easing = typeof options.easing === "string" ? easings[options.easing] : options.easing;

			const myTimer = setInterval(() => {
				if (++i > animationDuration) {
					clearInterval(myTimer);
					if (onzoomend) onzoomend();
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
			if (onzoomend) onzoomend();
		}
	};
	const registerListeners = (element: HTMLElement): void => {
		// Touch Point cache
		let tpCache: Touch[] = [];
		// Add drag event handler
		let dragStartX: number, dragStartY: number;
		let inDrag = false;
		let canDrag = true;
		let canPinch = true;

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
		const pinch = (offsetX: number, direction: Direction) => {
			if (!canPinch) {
				return;
			}
			canPinch = false;
			const mouseX2view = offsetX / viewWidth();
			const mouseX2timeline = (mouseX2view - pivot) / ratio;
			onzoom(direction, mouseX2timeline);
			setTimeout(() => (canPinch = true), 10); // Throttle drag for performance reasons
			fire("pinch.tl.container");
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

			const offsetX = leftRatio * viewWidth() + event.offsetX;
			pinch(offsetX, direction);

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

			if (event.targetTouches.length === 2 && event.changedTouches.length === 2) {
				// Check if the two target touches are the same ones that started
				// the 2-touch
				const touch1 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[0].identifier);
				const touch2 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[1].identifier);
				// const target = event.target as HTMLDivElement;

				if (touch1 >= 0 && touch2 >= 0) {
					// Calculate the difference between the start and move coordinates
					const diff1 = Math.abs(tpCache[touch1].clientX - tpCache[touch2].clientX);
					const diff2 = Math.abs(event.targetTouches[0].clientX - event.targetTouches[1].clientX);
					const diff = diff1 - diff2;
					const offsetX = event.targetTouches[0].clientX + diff2 / 2;
					// Decide whether zoom is IN (-) or OUT (+)
					var direction = Math.sign(diff) as Direction;
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

		// Add event click handler
		element.addEventListener("click.tl.event", (event: CustomEvent<ITimelineCustomEventDetails>) => {
			if (options.autoHighlight) {
				highlight(event.detail.timelineEvent);
			}
			if (options.autoZoom) {
				zoom(event.detail.timelineEvent);
			}
		});
	};
	const setupEventsHTML = (parentEvent: ITimelineEventWithDetails): DocumentFragment | undefined => {
		const eventsFragment = document.createDocumentFragment();
		for (const timelineEvent of parentEvent.timelineEventDetails.children) {
			if (!timelineEvent || !timelineEvent.timelineEventDetails) continue;
			if (timelineEvent.timelineEventDetails.startMinutes >= viewEnd()) continue;
			if (timelineEvent.timelineEventDetails.endMinutes <= viewStart()) continue;

			const viewInside = isViewInside(timelineEvent);
			const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.timelineEventDetails.startMinutes);
			const widthRatio = viewInside ? 100 : (timelineEvent.timelineEventDetails.durationMinutes / viewDuration()) * 100;
			const isHighlighted = hightligtedTimelineId === undefined || hightligtedTimelineId === timelineEvent.timelineEventDetails.id;

			const createTimelineEventHTML = (): HTMLDivElement => {
				timelineEvent.timelineEventDetails.html.style.backgroundColor = `rgba(${[
					...timelineEvent.timelineEventDetails.color,
					isHighlighted ? 1 : 0.3,
				].join(",")})`;
				timelineEvent.timelineEventDetails.html.style.left = leftRatio * 100 + "%";
				timelineEvent.timelineEventDetails.html.style.width = widthRatio + "%";
				timelineEvent.timelineEventDetails.html.attributes["starttime"] = viewInside ? viewStart() : timelineEvent.timelineEventDetails.startMinutes;

				return timelineEvent.timelineEventDetails.html;
			};

			const createBackgroundEventHTML = (): HTMLDivElement => {
				const eventHTML = document.createElement("div");
				eventHTML.style.left = leftRatio * 100 + "%";
				eventHTML.style.width = widthRatio + "%";
				eventHTML.style.position = "absolute";
				eventHTML.style.minWidth = "5px";
				eventHTML.style.overflow = "hidden";
				eventHTML.style.bottom = `0px`;
				eventHTML.style.minHeight = `100%`;
				eventHTML.style.backgroundColor = `rgba(${[...timelineEvent.timelineEventDetails.color, 0.1].join(",")})`;
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
		eventsContainer.style.overflowY = "auto";
		eventsContainer.style.overflowX = "hidden";
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
	const parseDateToMinutes = (input: number[] | string | number | Date | undefined): number | undefined => {
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
	const parseNumberToMinutes = (input: string | number | undefined): number | undefined => {
		if (input === undefined) return undefined;

		if (typeof input === "string") {
			// 31556926 = Seconds in a year
			// 525948.766 = minutes in a year
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

		return undefined;
	};
	const calcStart = (timelineEventWithDetails: ITimelineEventWithDetails): number | undefined => {
		return timelineEventWithDetails.timelineEventDetails.startMinutes
			? timelineEventWithDetails.timelineEventDetails.children.length
				? Math.min(
						timelineEventWithDetails.timelineEventDetails.startMinutes,
						timelineEventWithDetails.timelineEventDetails.children[0].timelineEventDetails.startMinutes
				  )
				: timelineEventWithDetails.timelineEventDetails.startMinutes
			: timelineEventWithDetails.timelineEventDetails.children.length
			? timelineEventWithDetails.timelineEventDetails.children[0].timelineEventDetails.startMinutes
			: undefined;
	};
	const calcEnd = (timelineEventWithDetails: ITimelineEventWithDetails): number => {
		return timelineEventWithDetails.timelineEventDetails.endMinutes
			? timelineEventWithDetails.timelineEventDetails.endMinutes
			: timelineEventWithDetails.timelineEventDetails.durationMinutes
			? timelineEventWithDetails.timelineEventDetails.startMinutes + timelineEventWithDetails.timelineEventDetails.durationMinutes
			: timelineEventWithDetails.timelineEventDetails.children.length
			? Math.max.apply(
					1,
					timelineEventWithDetails.timelineEventDetails.children.map((child) => child.timelineEventDetails.endMinutes)
			  )
			: timelineEventWithDetails.timelineEventDetails.startMinutes + 1;
	};
	const addEvents = (parent: ITimelineEventWithDetails, ...children: ITimelineEvent[]): void => {
		const parsedSortedChildren = children
			.map((tl) => parseEvent(tl, parent))
			.filter((tl) => !!tl)
			.sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);

		const calcLevel = (timelineEvent: ITimelineEventWithDetails): number => {
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
		const calcScore = (timelineEvent: ITimelineEventWithDetails): number => {
			const durationRatio = timelineEvent.timelineEventDetails.durationMinutes / parent.timelineEventDetails.durationMinutes;
			const score = durationRatio * (Object.keys(timelineEvent.timelineEventDetails.children).length || 1);
			return score;
		};
		const createEventNode = (timelineEvent: ITimelineEventWithDetails): HTMLDivElement => {
			const spaceFactor = timelineEvent.timelineEventDetails.level * options.eventSpacing;
			const heightFactor = (timelineEvent.timelineEventDetails.level - 1) * options.eventHeight;
			const eventHTML = document.createElement("div");
			eventHTML.style.bottom = `${spaceFactor + heightFactor}px`;
			eventHTML.style.height = `${options.eventHeight}px`;
			eventHTML.style.borderRadius = "5px";
			eventHTML.style.boxSizing = "border-box";
			eventHTML.style.cursor = "pointer";
			eventHTML.style.zIndex = timelineEvent.timelineEventDetails.depth.toString();
			eventHTML.style.position = "absolute";
			eventHTML.style.minWidth = "5px";
			eventHTML.style.overflow = "hidden";
			eventHTML.title = timelineEvent.title;
			eventHTML.classList.add(options.classNames.timelineEvent);
			eventHTML.setAttribute("level", timelineEvent.timelineEventDetails.level.toString());
			eventHTML.setAttribute("depth", timelineEvent.timelineEventDetails.depth.toString());
			eventHTML.setAttribute("height", timelineEvent.timelineEventDetails.height.toString());

			if (timelineEvent.render) {
				eventHTML.append(timelineEvent.render(timelineEvent));
			}

			eventHTML.addEventListener("click", (e) => fire("click.tl.event", timelineEvent));
			eventHTML.addEventListener("mouseenter", (e) => fire("mouseenter.tl.event", timelineEvent));
			eventHTML.addEventListener("mouseleave", (e) => fire("mouseleave.tl.event", timelineEvent));
			eventHTML.addEventListener("dblclick", (e) => fire("dblclick.tl.event", timelineEvent));

			return eventHTML;
		};

		parsedSortedChildren.forEach((childEvent, i) => {
			// Add score to result in order to sort by importance
			childEvent.timelineEventDetails.score = ["container", "timeline"].includes(childEvent.timelineEventDetails.type) ? calcScore(childEvent) : 0;

			// Add level
			childEvent.timelineEventDetails.level = ["timeline", "container"].includes(childEvent.timelineEventDetails.type) ? calcLevel(childEvent) : 0;

			// Create HTML Node
			childEvent.timelineEventDetails.html = createEventNode(childEvent);
		});

		parent.timelineEventDetails.children.push(...parsedSortedChildren);

		// Adjust parent start & end if children changed range
		parent.timelineEventDetails.startMinutes = calcStart(parent);
		parent.timelineEventDetails.endMinutes = calcEnd(parent);
		parent.timelineEventDetails.durationMinutes = parent.timelineEventDetails.endMinutes - parent.timelineEventDetails.startMinutes;

		//parent.timelineEventDetails.height = parsedChildren.length ? Math.max(...parsedChildren.map((child) => child.timelineEventDetails.level)) : 1;
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
				type: timelineEvent.type || "timeline",
				open: timelineEvent.open || false,
				level: 1,
				step: 0,
				score: 0,
				height: 1,
				children: [],
				depth: parent ? parent.timelineEventDetails.depth + 1 : 0,
				parentId: parent?.timelineEventDetails.id,
				color: timelineEvent.color || options.defaultColor,
				startMinutes: parseDateToMinutes(timelineEvent.start),
				endMinutes: parseDateToMinutes(timelineEvent.end),
				durationMinutes: parseNumberToMinutes(timelineEvent.duration) || 0,
				levelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } },
			} as ITimelineEventDetails,
		};

		if (timelineEvent.events && timelineEvent.events.length) {
			addEvents(timelineEventWithDetails, ...timelineEvent.events);
		}

		// Calculate start date - if children exists take lowest date
		timelineEventWithDetails.timelineEventDetails.startMinutes = calcStart(timelineEventWithDetails);

		// // Filter missing requirements
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
	const fire = (name: string, timelineEvent?: ITimelineEventWithDetails) => {
		element.dispatchEvent(
			new CustomEvent<ITimelineCustomEventDetails>(name, {
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
		highlight,
	};
};
