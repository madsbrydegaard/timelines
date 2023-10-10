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
	zoomMargin?: number;
	autoSelect?: boolean;
	defaultColor?: string;
	defaultHighlightedColor?: string;
	defaultBackgroundColor?: string;
	defaultBackgroundHightligtedColor?: string;
	zoomDuration?: number;
	easing?: string | ((time: number, start: number, change: number, duration: number) => number);
	numberOfHighscorePreviews?: number;
	highscorePreviewDelay?: number;
	highscorePreviewWidth?: number;
	classNames?: {
		timeline?: string;
		timelineEvent?: string;
		timelinePreview?: string;
		timelineEventTitle?: string;
		timelineLabels?: string;
		timelineDividers?: string;
		timelineEvents?: string;
		timelinePreviews?: string;
		timelineIo?: string;
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
	renderEventNode?: (timelineEvent: ITimelineEventWithDetails) => HTMLDivElement;
	renderPreviewNode?: (timelineEvent: ITimelineEventWithDetails) => HTMLDivElement;
}
interface ITimelineProps {
	type?: string;
	color?: string;
	highlightedColor?: string;
	preventNextPreviewRender?: boolean;
}
interface ITimelineEventDetails {
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
	timelineLevelMatrix: IMatrix;
	backgroundLevelMatrix: IMatrix;
	eventNode?: HTMLDivElement;
	previewNode?: HTMLDivElement;
	childrenByStartMinute: ITimelineEventWithDetails[];
	next?: string;
	previous?: string;
}
interface ITimelineEventWithDetails extends ITimelineEvent {
	timelineEventDetails: ITimelineEventDetails;
}
export interface ITimelineEvent extends ITimelineBase, ITimelineProps {
	start?: number[] | string | number | Date;
	end?: number[] | string | number | Date;
	duration?: number | string;
	events?: ITimelineEvent[];
	step?: number;
}
export interface ITimelineContainer {
	add: (...timelineEvents: ITimelineEvent[]) => void;
	zoom: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onzoomend?: (timelineEvent: ITimelineEvent) => void) => void;
	focus: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onfocused?: (timelineEvent: ITimelineEvent) => void) => void;
	reset: () => void;
	select: (timelineEventIdentifier?: string) => void;
	preventNextPreviewRender: () => void;
	setPreventPreviewRender: (prevent: boolean) => void;
	clear: () => void;
}
enum Direction {
	In = -1,
	Out = 1,
}

export const TimelineContainer = (elementIdentifier: HTMLElement | string, settings?: ITimelineOptions): ITimelineContainer => {
	let ratio: number;
	let pivot: number;
	let timelineStart: number;
	let timelineEnd: number;
	let element: HTMLElement;
	let options: ITimelineOptions;
	let labelContainer: HTMLDivElement;
	let dividerContainer: HTMLDivElement;
	let eventsContainer: HTMLDivElement;
	let previewsContainer: HTMLDivElement;
	let ioContainer: HTMLDivElement;
	let rootTimeline: ITimelineEventWithDetails;
	let currentTimeline: ITimelineEventWithDetails;
	let selectedTimelineIds: string[];
	let visibleEvents: ITimelineEventWithDetails[];
	let previewTimer: NodeJS.Timeout;
	let preventNextPreviewRender: boolean = false;
	let preventPreviewRender: boolean = false;
	let eventBatchCount: number = 0;
	let touchDragFactor: number = 1;

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
	const add = (...timelineEvents: ITimelineEvent[]): void => {
		if (!timelineEvents) throw new Error(`Event argument is empty. Please provide Timeline event(s) as input`);

		// Prepare events
		timelineEvents = timelineEvents.map((tl) => ({ ...tl, step: tl.step || ++eventBatchCount }));

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
					timelineDivider: "tl__divider",
				},
			},
			...settings,
		} as ITimelineOptions;

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
		appendContainerHTML();

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
		setPivot(deltaPivot * options.dragSpeed * touchDragFactor);

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
		select();
		zoom(timelineEvent, useAnimation, onfocused);
	};
	const reset = (): void => {
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
	const findFirstEvent = (timelineEventIdentifier: string, parent?: ITimelineEventWithDetails): ITimelineEventWithDetails | undefined => {
		let result = undefined;
		const parentNode = parent || rootTimeline;
		if (parentNode.timelineEventDetails.id === timelineEventIdentifier) return parentNode;
		for (const child of parentNode.timelineEventDetails.childrenByStartMinute) {
			if (child.title === timelineEventIdentifier || child.timelineEventDetails.id === timelineEventIdentifier) {
				result = child;
				break;
			} else {
				result = findFirstEvent(timelineEventIdentifier, child);
				if (result) break;
			}
		}
		return result;
	};
	const select = (timelineEventIdentifier?: string): void => {
		try {
			if (!timelineEventIdentifier) {
				selectedTimelineIds = [];
			} else if (typeof timelineEventIdentifier === "string") {
				if (timelineEventIdentifier === "next") {
					const result = findFirstEvent(selectedTimelineIds[0]);
					if (!result) throw `No event selected`;
					if (!result.timelineEventDetails.next) throw `No next event available`;
					selectedTimelineIds = [result.timelineEventDetails.next];
					fire("selected.tl.event", findFirstEvent(selectedTimelineIds[0]));
				} else if (timelineEventIdentifier === "previous") {
					const result = findFirstEvent(selectedTimelineIds[0]);
					if (!result) throw `No event selected`;
					if (!result.timelineEventDetails.previous) throw `No previous event available`;
					selectedTimelineIds = [result.timelineEventDetails.previous];
					fire("selected.tl.event", findFirstEvent(selectedTimelineIds[0]));
				} else {
					const result = findFirstEvent(timelineEventIdentifier);
					if (!result) throw `Cannot find ${timelineEventIdentifier} by title nor timelineEventDetails.id`;
					selectedTimelineIds = [result.timelineEventDetails.id];
					fire("selected.tl.event", result);
				}
			}

			update();
		} catch (error) {
			raise(error);
		}
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

		// Create options.zoomMargin spacing on each side of the timeline
		const targetDurationExtension = (endMinutes - startMinutes) * options.zoomMargin;
		const targetStart = startMinutes - targetDurationExtension;
		const targetEnd = endMinutes + targetDurationExtension;
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

		// Move handlers
		const move = (clientX: number, clientY: number) => {
			if (inDrag) {
				const offsetX = clientX - dragStartX;
				const offsetY = clientY - dragStartY;
				drag(offsetX, offsetY);
				dragStartX = clientX;
				dragStartY = clientY;
			}
			hover(clientX, clientY);
		};
		const drag = (offsetX: number, offsetY: number) => {
			if (offsetX) onmove(offsetX);
			fire("drag.tl.container");
		};
		const hover = (clientX: number, clientY: number) => {
			const hoverElements = document.elementsFromPoint(clientX, clientY);
			let hoverEvent = hoverElements.find((element) => {
				return element.hasAttribute("eventid");
			});
			if (!hoverEvent) {
				element.style.cursor = "";
				element.title = "";
				return;
			}
			const timelineEvent = visibleEvents.find((ev) => ev.timelineEventDetails.id === hoverEvent.getAttribute("eventid"));
			if (timelineEvent) {
				fire(`hover.tl.event`, timelineEvent);
				element.style.cursor = "pointer";
				element.title = timelineEvent.title;
			} else {
				element.style.cursor = "";
				element.title = "";
			}
		};
		const pinch = (offsetX: number, direction: Direction) => {
			//canPinch = false;
			const mouseX2view = offsetX / viewWidth();
			const mouseX2timeline = (mouseX2view - pivot) / ratio;
			onzoom(direction, mouseX2timeline);
			//setTimeout(() => (canPinch = true), 10); // Throttle pinch for performance reasons
			fire("pinch.tl.container");
		};
		const onEventClick = (event: CustomEvent<ITimelineCustomEventDetails>) => {
			if (options.autoSelect && event.detail.timelineEvent) {
				select(event.detail.timelineEvent.timelineEventDetails.id);
			}
		};
		const onEventSelected = (event: CustomEvent<ITimelineCustomEventDetails>) => {
			if (options.autoZoom && event.detail.timelineEvent) {
				zoom(event.detail.timelineEvent);
			}
		};
		const click = (clientX: number, clientY: number) => {
			const clickedElements = document.elementsFromPoint(clientX, clientY);
			let clickedEvent = clickedElements.find((element) => {
				return element.hasAttribute("eventid");
			});
			if (!clickedEvent) return;
			const eventid = clickedEvent.getAttribute("eventid");
			const timelineEvent = visibleEvents.find((ev) => ev.timelineEventDetails.id === eventid);
			if (timelineEvent) {
				fire(`click.tl.event`, timelineEvent);
			}
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

			// Adjust width of timeline for zooming effect
			const leftRatio = (event.target as HTMLElement).attributes["starttime"]
				? getViewRatio((event.target as HTMLElement).attributes["starttime"])
				: 0;

			const offsetX = leftRatio * viewWidth() + event.offsetX;
			pinch(offsetX, direction);

			fire("wheel.tl.container");
		});

		element.addEventListener("touchstart", (event: TouchEvent) => {
			// If the user makes simultaneous touches, the browser will fire a
			// separate touchstart event for each touch point. Thus if there are
			// three simultaneous touches, the first touchstart event will have
			// targetTouches length of one, the second event will have a length
			// of two, and so on.

			// Prevent to not zoom screen on mobile
			event.preventDefault();

			tpCache = [];
			tpCache.push(...event.targetTouches);

			fire("touchstart.tl.container");
		});

		element.addEventListener(
			"touchend",
			(event: TouchEvent) => {
				click(tpCache[0].clientX, tpCache[0].clientY);
				//if (!inDrag) click(tpCache[0].clientX, tpCache[0].clientY);
				inDrag = false;
				fire("touchend.tl.container");
			},
			{ passive: true }
		);

		// This is a very basic 2-touch move/pinch/zoom handler that does not include
		// error handling, only handles horizontal moves, etc.
		element.addEventListener(
			"touchmove",
			(event: TouchEvent) => {
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
						const offsetX = Math.min(event.targetTouches[0].clientX, event.targetTouches[1].clientX) + diff2 / 2;
						// Decide whether zoom is IN (-) or OUT (+)
						var direction = Math.sign(diff) as Direction;
						pinch(offsetX, direction);
					}
				}

				if (event.targetTouches.length === 1 && event.changedTouches.length === 1) {
					// Check if the target touches are the same one that started
					const touch1 = tpCache.findIndex((tp) => tp.identifier === event.targetTouches[0].identifier);
					if (touch1 >= 0) {
						// Calculate the difference between the start and move coordinates
						const diffX = event.targetTouches[0].clientX - tpCache[touch1].clientX;
						if (diffX !== 0) {
							inDrag = true;
							touchDragFactor = 3;
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

		element.addEventListener(
			"mousedown",
			(event) => {
				dragStartX = event.clientX;
				dragStartY = event.clientY;
				//
				inDrag = true;
				touchDragFactor = 1;

				fire("mousedown.tl.container");
			},
			{ passive: true }
		);

		// Add move handler
		element.addEventListener(
			"mousemove",
			(event) => {
				move(event.clientX, event.clientY);
				fire("mousemove.tl.container");
			},
			{ passive: true }
		);

		// Add mouse up handler
		element.addEventListener(
			"mouseup",
			(event) => {
				inDrag = false;
				fire("mouseup.tl.container");
			},
			{ passive: true }
		);

		element.addEventListener("click", (e) => click(e.clientX, e.clientY));

		// Add event click handler
		element.addEventListener("click.tl.event", onEventClick);
		element.addEventListener("selected.tl.event", onEventSelected);

		// update.tl.container event handler
		element.addEventListener("update.tl.container", onUpdate);
	};
	const createPreviewHTML = (): DocumentFragment | undefined => {
		const eventsFragment = document.createDocumentFragment();
		const svgContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svgContainer.style.height = "100%";
		svgContainer.style.width = "100%";
		svgContainer.style.position = "absolute";
		eventsFragment.append(svgContainer);

		const highscores = visibleEvents
			.filter((evt) => !!evt.timelineEventDetails.previewNode)
			.filter((evt) => !evt.preventNextPreviewRender)
			.sort((a, b) => b.timelineEventDetails.score - a.timelineEventDetails.score) // Sort from high to low
			.slice(0, options.numberOfHighscorePreviews)
			.sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);

		for (const [i, timelineEvent] of highscores.entries()) {
			const fraction = 1 / highscores.length;
			const previewWidthFactor = options.highscorePreviewWidth / viewWidth();
			const randomLeftPosition = fraction * i + fraction / 2 - previewWidthFactor / 2;
			const randomTopPosition = Math.random() / 3 + 0.08;

			const createTimelinePreviewHTML = (): void => {
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
	const createEventHTML = (parentEvent: ITimelineEventWithDetails): DocumentFragment | undefined => {
		const eventsFragment = document.createDocumentFragment();
		for (const timelineEvent of parentEvent.timelineEventDetails.childrenByStartMinute) {
			if (!timelineEvent || !timelineEvent.timelineEventDetails) continue;
			if (timelineEvent.timelineEventDetails.startMinutes >= viewEnd()) continue;
			if (timelineEvent.timelineEventDetails.endMinutes <= viewStart()) continue;

			const viewInside = isViewInside(timelineEvent);
			const leftRatio = viewInside ? 0 : getViewRatio(timelineEvent.timelineEventDetails.startMinutes);
			const widthRatio = viewInside ? 100 : (timelineEvent.timelineEventDetails.durationMinutes / viewDuration()) * 100;
			const isHighlighted = !!selectedTimelineIds.length && !!selectedTimelineIds.find((tlId) => tlId === timelineEvent.timelineEventDetails.id);
			const levelFactor =
				(timelineEvent.timelineEventDetails.level - 1) * options.eventHeight + (timelineEvent.timelineEventDetails.level - 1) * options.eventSpacing;
			const stepFactor = timelineEvent.timelineEventDetails.step * options.eventSpacing;

			switch (timelineEvent.type) {
				default: {
					eventsFragment.append(createEventHTML(timelineEvent));
					continue;
				}
				case "container": {
					const heightFactor =
						timelineEvent.timelineEventDetails.height * options.eventHeight + timelineEvent.timelineEventDetails.height * options.eventSpacing;
					timelineEvent.timelineEventDetails.eventNode.style.bottom = `${levelFactor + heightFactor + stepFactor}px`;
					eventsFragment.append(timelineEvent.timelineEventDetails.eventNode);
					eventsFragment.append(createEventHTML(timelineEvent));
					continue;
				}
				case "timeline": {
					const parentfactor =
						(parentEvent.timelineEventDetails.level - 1) * options.eventHeight + (parentEvent.timelineEventDetails.level - 1) * options.eventSpacing;
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
			timelineEvent.timelineEventDetails.eventNode.attributes["starttime"] = viewInside
				? viewStart()
				: timelineEvent.timelineEventDetails.startMinutes;
			eventsFragment.append(timelineEvent.timelineEventDetails.eventNode);
			visibleEvents.push(timelineEvent);
		}
		return eventsFragment;
	};
	const appendContainerHTML = (): void => {
		// Register parent as position = "relative" for absolute positioning to work
		element.style.position = "relative";
		element.style.overflow = "hidden";
		element.style.minHeight = "3rem";

		// Initialize labels
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
			// case "center":
			// 	this.labelContainer.style.top = "50%";
			// 	this.labelContainer.style.transform = "translate(0, calc(-50%))";
			// 	break;
			default:
				labelContainer.style.bottom = "0";
		}

		// Initialize dividers
		dividerContainer = document.createElement("div");
		element.appendChild(dividerContainer);

		dividerContainer.classList.add(options.classNames.timelineDividers);
		dividerContainer.style.width = "100%";
		dividerContainer.style.height = "100%";
		dividerContainer.style.position = "absolute";
		dividerContainer.style.zIndex = "-2";
		dividerContainer.style.bottom = "0";

		// Initialize events container
		eventsContainer = document.createElement("div");
		element.appendChild(eventsContainer);
		eventsContainer.classList.add(options.classNames.timelineEvents);
		eventsContainer.style.position = "absolute";
		eventsContainer.style.bottom = "50px";
		eventsContainer.style.height = "calc(100% - 50px)";
		eventsContainer.style.width = "100%";
		eventsContainer.style.overflowY = "auto";
		eventsContainer.style.overflowX = "hidden";

		// Initialize previews container
		previewsContainer = document.createElement("div");
		element.appendChild(previewsContainer);
		previewsContainer.classList.add(options.classNames.timelinePreviews);
		previewsContainer.style.position = "absolute";
		previewsContainer.style.bottom = "50px";
		previewsContainer.style.height = "calc(100% - 50px)";
		previewsContainer.style.width = "100%";
		previewsContainer.style.overflowY = "auto";
		previewsContainer.style.overflowX = "hidden";

		// Initialize User I/O container
		ioContainer = document.createElement("div");
		element.appendChild(ioContainer);
		ioContainer.classList.add(options.classNames.timelineIo);
		ioContainer.style.position = "absolute";
		ioContainer.style.bottom = "0";
		ioContainer.style.top = "0";
		ioContainer.style.width = "100%";
	};
	const appendLabelHTML = (): void => {
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

		labelContainer.appendChild(labels);
		dividerContainer.appendChild(dividers);
	};
	const appendEventHTML = (): void => {
		const eventsHtml = createEventHTML(currentTimeline);
		if (eventsHtml) eventsContainer.appendChild(eventsHtml);
	};
	const appendPreviewHTML = (): void => {
		if (!preventPreviewRender && !preventNextPreviewRender) {
			const previewsHtml = createPreviewHTML();
			if (previewsHtml) previewsContainer.appendChild(previewsHtml);
		}
		preventNextPreviewRender = false;
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
		// Empty all containers
		if (dividerContainer) dividerContainer.innerHTML = "";
		if (labelContainer) labelContainer.innerHTML = "";
		if (eventsContainer) eventsContainer.innerHTML = "";
		if (previewsContainer) previewsContainer.innerHTML = "";
		visibleEvents = [];

		// Dispatch DOM event
		fire("update.tl.container");
	};
	const clear = (): void => {
		if (!currentTimeline) return;

		currentTimeline.events = [];
		currentTimeline.timelineEventDetails.childrenByStartMinute = [];
		currentTimeline.timelineEventDetails.timelineLevelMatrix = { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } };
		currentTimeline.timelineEventDetails.backgroundLevelMatrix = { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } };
		eventBatchCount = 0;

		// Dispatch DOM event
		fire("cleared.tl.container");

		update();
	};
	const onUpdate = (): void => {
		appendLabelHTML();
		appendEventHTML();

		if (options.numberOfHighscorePreviews > 0) {
			clearTimeout(previewTimer); // Throttle by $options.highscorePreviewDelay
			previewTimer = setTimeout(() => {
				appendPreviewHTML();
			}, options.highscorePreviewDelay);
		}
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
			? timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.length
				? Math.min(
						timelineEventWithDetails.timelineEventDetails.startMinutes,
						timelineEventWithDetails.timelineEventDetails.childrenByStartMinute[0].timelineEventDetails.startMinutes
				  )
				: timelineEventWithDetails.timelineEventDetails.startMinutes
			: timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.length
			? timelineEventWithDetails.timelineEventDetails.childrenByStartMinute[0].timelineEventDetails.startMinutes
			: undefined;
	};
	const calcEnd = (timelineEventWithDetails: ITimelineEventWithDetails): number => {
		return timelineEventWithDetails.timelineEventDetails.endMinutes
			? timelineEventWithDetails.timelineEventDetails.endMinutes
			: timelineEventWithDetails.timelineEventDetails.durationMinutes
			? timelineEventWithDetails.timelineEventDetails.startMinutes + timelineEventWithDetails.timelineEventDetails.durationMinutes
			: timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.length
			? Math.max.apply(
					1,
					timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.map((child) => child.timelineEventDetails.endMinutes)
			  )
			: timelineEventWithDetails.timelineEventDetails.startMinutes + 1;
	};
	const addEvents = (parent: ITimelineEventWithDetails, ...events: ITimelineEvent[]): void => {
		const parsedSortedChildren = events
			.map((tl) => parseEvent(tl, parent))
			.filter((tl) => !!tl)
			.sort((a, b) => a.timelineEventDetails.startMinutes - b.timelineEventDetails.startMinutes);

		const createEventNode = (timelineEvent: ITimelineEventWithDetails): HTMLDivElement => {
			const eventHTML = document.createElement("div");

			eventHTML.style.boxSizing = "border-box";
			eventHTML.style.position = "absolute";
			eventHTML.style.minWidth = "5px";
			//eventHTML.style.overflow = "hidden";
			//eventHTML.style.display = "contents"; // Ignore wrapping div in DOM so custom styling takes preceedence
			eventHTML.classList.add(options.classNames.timelineEvent);
			eventHTML.setAttribute("level", timelineEvent.timelineEventDetails.level.toString());
			eventHTML.setAttribute("depth", timelineEvent.timelineEventDetails.depth.toString());
			eventHTML.setAttribute("score", timelineEvent.timelineEventDetails.score.toString());
			eventHTML.setAttribute("step", timelineEvent.timelineEventDetails.step.toString());

			return eventHTML;
		};
		const setTimelineNode = (timelineEvent: ITimelineEventWithDetails) => {
			const node = createEventNode(timelineEvent);
			node.style.minHeight = `${options.eventHeight}px`;
			node.style.cursor = "pointer";
			node.style.borderRadius = "5px";
			node.title = timelineEvent.title;
			if (timelineEvent.renderEventNode) {
				const elementToAppend = document.createElement("div");
				//elementToAppend.style.display = "contents"; // Ignore wrapping div in DOM so custom styling takes preceedence
				elementToAppend.append(timelineEvent.renderEventNode(timelineEvent));
				node.append(elementToAppend);
			}
			node.setAttribute("eventid", timelineEvent.timelineEventDetails.id);
			timelineEvent.timelineEventDetails.eventNode = node;
		};
		const setBackgroundNode = (timelineEvent: ITimelineEventWithDetails) => {
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
				//elementToAppend.style.display = "contents"; // Ignore wrapping div in DOM so custom styling takes preceedence
				elementToAppend.append(timelineEvent.renderEventNode(timelineEvent));
				elementToAppend.setAttribute("eventid", timelineEvent.timelineEventDetails.id);
				node.append(elementToAppend);
			}

			timelineEvent.timelineEventDetails.eventNode = node;
		};
		const setContainerNode = (timelineEvent: ITimelineEventWithDetails) => {
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
		const setPreviewNode = (timelineEvent: ITimelineEventWithDetails) => {
			if (!timelineEvent.renderPreviewNode) return;
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
		const setScore = (timelineEvent: ITimelineEventWithDetails) => {
			const durationRatio = timelineEvent.timelineEventDetails.durationMinutes / parent.timelineEventDetails.durationMinutes;
			const score = durationRatio * (timelineEvent.timelineEventDetails.childrenByStartMinute.length + 1);
			timelineEvent.timelineEventDetails.score = score;
		};
		const setLevel = (timelineEvent: ITimelineEventWithDetails, matrix: IMatrix, useEqual: boolean = true) => {
			let level = 0;
			let height = 0;
			for (const eventLevel in matrix) {
				level = Number(eventLevel);
				if (
					useEqual
						? timelineEvent.timelineEventDetails.startMinutes >= matrix[eventLevel].time
						: timelineEvent.timelineEventDetails.startMinutes > matrix[eventLevel].time
				) {
					matrix[eventLevel] = {
						height: timelineEvent.timelineEventDetails.height,
						time: timelineEvent.timelineEventDetails.endMinutes,
					};
					timelineEvent.timelineEventDetails.level = level;
					return;
				}
				height = matrix[eventLevel].height;
			}
			level += height;
			matrix[level.toString()] = {
				height: timelineEvent.timelineEventDetails.height,
				time: timelineEvent.timelineEventDetails.endMinutes,
			};
			timelineEvent.timelineEventDetails.level = level;
		};
		const setNeighborsTo = (timelineEvent: ITimelineEventWithDetails, me: number) => {
			// Assign neighbor titles
			timelineEvent.timelineEventDetails.next =
				parent.timelineEventDetails.childrenByStartMinute.length > me + 1
					? parent.timelineEventDetails.childrenByStartMinute[me + 1].timelineEventDetails.id
					: undefined;
			timelineEvent.timelineEventDetails.previous =
				me > 0 ? parent.timelineEventDetails.childrenByStartMinute[me - 1].timelineEventDetails.id : undefined;
		};

		// push parsed children
		parent.timelineEventDetails.childrenByStartMinute.push(...parsedSortedChildren);

		// Adjust parent start & end if childrenByStartMinute changed range
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
	const parseEvent = (timelineEvent: ITimelineEvent, parent?: ITimelineEventWithDetails): ITimelineEventWithDetails | undefined => {
		if (!timelineEvent) {
			console.warn("Event object is empty");
			return undefined;
		}

		const timelineEventType = timelineEvent.type || timelineEvent.start ? timelineEvent.type || "timeline" : "wrapper";
		const timelineEventWithDetails = {
			...timelineEvent,
			...{
				type: timelineEventType,
				color:
					timelineEventType === "timeline"
						? timelineEvent.color || options.defaultColor
						: timelineEventType === "background"
						? timelineEvent.color || options.defaultBackgroundColor
						: undefined,
				highlightedColor:
					timelineEventType === "timeline"
						? timelineEvent.highlightedColor || options.defaultHighlightedColor
						: timelineEventType === "background"
						? timelineEvent.highlightedColor || options.defaultBackgroundHightligtedColor
						: undefined,
			},
			timelineEventDetails: {
				id: crypto.randomUUID(),
				level: 0,
				step: timelineEvent.step || parent?.step || 0,
				score: 0,
				height: 1,
				childrenByStartMinute: [],
				childrenByScore: [],
				depth: parent ? parent.timelineEventDetails.depth + 1 : 0,
				parentId: parent?.timelineEventDetails.id,
				startMinutes: parseDateToMinutes(timelineEvent.start),
				endMinutes: parseDateToMinutes(timelineEvent.end),
				durationMinutes: parseNumberToMinutes(timelineEvent.duration) || 0,
				timelineLevelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } },
				backgroundLevelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } },
			} as ITimelineEventDetails,
		};

		if (parent && timelineEventWithDetails.type === "timeline" && parent.type === "wrapper") parent.type = "container";

		if (timelineEvent.events && timelineEvent.events.length) {
			addEvents(timelineEventWithDetails, ...timelineEvent.events);
		}

		// Calculate start date - if childrenByStartMinute exists take lowest date
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
	const raise = (error?: any) => {
		element.dispatchEvent(
			new CustomEvent<string>("err.tl.container", {
				detail: error,
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
		add,
		reset,
		select,
		preventNextPreviewRender: () => {
			preventNextPreviewRender = true;
		},
		setPreventPreviewRender: (prevent: boolean) => {
			preventPreviewRender = prevent;
		},
		clear,
	};
};
