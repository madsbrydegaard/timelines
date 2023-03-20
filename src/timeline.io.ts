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
	autoFocus?: boolean;
	defaultColor?: number[];
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
}
export interface ITimelineEvent extends ITimelineBase, ITimelineProps {
	start?: number[] | string | number | Date;
	end?: number[] | string | number | Date;
	duration?: number | string;
	events?: ITimelineEvent[];
}
interface ITimelineEventConverted extends ITimelineBase, Required<ITimelineProps> {
	startMinutes: number;
	endMinutes: number;
	durationMinutes: number;
	children: ITimelineEventConverted[];
	level: number;
	step: number;
	depth: number;
	height: number;
	score: number;
	levelMatrix?: IMatrix;
}
export interface ITimelineContainer {
	load: (loader: () => Promise<ITimelineEvent>) => Promise<void>;
	add: (timelineEvent: ITimelineEvent) => void;
	focus: (timelineEvent: ITimelineEventConverted, focused?: () => void) => void;
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
	let rootTimeline: ITimelineEventConverted;

	const MINUTES_IN_DAY = 1440; // minutes in a day
	const MINUTES_IN_WEEK = 10080; // minutes in a week
	const MINUTES_IN_YEAR = 525948.766; // minutes in a year
	const MINUTES_IN_MONTH = MINUTES_IN_YEAR / 12; // minutes in a month
	const SHOW_MONTH_DURATION = MINUTES_IN_MONTH * 18; // When to show monthname in time label
	const SHOW_DAY_DURATION = MINUTES_IN_WEEK * 6; // When to show date in time label
	const SHOW_TIME_DURATION = MINUTES_IN_DAY * 4; // When to show time in time label

	const load = async (loader: () => Promise<ITimelineEvent>): Promise<void> => {
		if (!loader) throw new Error(`Argument is empty. Please provide a loader function as first arg`);
		add(await loader());
	};
	const add = (timelineEvent: ITimelineEvent): void => {
		if (!timelineEvent) throw new Error(`Event argument is empty. Please provide Timeline event as first arg`);

		// Parse & sort all events
		addEvents(rootTimeline, timelineEvent);

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
				dragSpeed: 0.001,
				timelineStart: "-1B",
				timelineEnd: "1M",
				start: "-100y",
				end: "now",
				minZoom: 1,
				maxZoom: 1e11,
				position: "bottom",
				eventHeight: 5,
				autoFocus: false,
				defaultColor: [140, 140, 140],
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

		const viewStart = rootTimeline.startMinutes;
		const viewEnd = rootTimeline.endMinutes;

		if (viewStart < timelineStart) timelineStart = viewStart;
		if (viewEnd > timelineEnd) timelineEnd = viewEnd;
		const viewDuration = viewEnd - viewStart;

		ratio = timelineDuration() / viewDuration;
		pivot = (timelineStart - viewStart) / viewDuration;

		// Handle DOM elements setup
		setupContainerHTML();

		// Register Mouse and Resize event handlers
		registerListeners(element);

		// Draw
		update();
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
	const zoom = (direction: Direction, mouseX2timeline: number): void => {
		// Make zoomSpeed relative to zoomLevel
		const deltaRatio = direction * scaledZoomSpeed();
		const deltaPivot = mouseX2timeline * deltaRatio;

		if (setRatio(direction, deltaRatio)) setPivot(deltaPivot);

		update();
	};
	const move = (deltaPivot: number): void => {
		setPivot(deltaPivot * options.dragSpeed);

		update();
	};
	const focus = (timelineEvent: ITimelineEventConverted, focused?: () => void): void => {
		if (!timelineEvent) return;

		element.dispatchEvent(
			new CustomEvent("focus.tl.event", {
				detail: timelineEvent,
				bubbles: false,
				cancelable: true,
			})
		);

		const targetDurationExtension = timelineEvent.durationMinutes * 0.05;
		const targetStart = timelineEvent.startMinutes - targetDurationExtension; // Create 10% spacing - 5% on each side of the timeline
		const targetEnd = timelineEvent.endMinutes + targetDurationExtension; // Create 10% spacing - 5% on each side of the timeline
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

		const stopZoom = () => {
			clearInterval(ratioTimer);

			const targetPivot = pivot - (targetStart - viewStart()) / viewDuration();
			const xDirection = Math.sign(targetPivot - pivot);

			const stopFocus = () => {
				clearInterval(pivotTimer);

				element.dispatchEvent(
					new CustomEvent("focused.tl.event", {
						detail: timelineEvent,
						bubbles: false,
						cancelable: true,
					})
				);

				if (focused) focused();
			};

			const pivotTimer = setInterval(() => {
				move(xDirection * 10);
				if (xDirection < 0 && pivot < targetPivot) stopFocus(); // Right (Forward in time)
				if (xDirection > 0 && pivot > targetPivot) stopFocus(); // Left (Back in time)
			}, 1);
		};

		const ratioTimer = setInterval(() => {
			zoom(zDirection, mouseX2Timeline);
			if (zDirection < 0 && ratio > targetRatio) stopZoom(); // In
			if (zDirection > 0 && ratio < targetRatio) stopZoom(); // Out
		}, 1);
	};
	const registerListeners = (element: HTMLElement): void => {
		// Add resize handler
		window.addEventListener(
			"resize",
			() => {
				update();
			},
			{ passive: true }
		);

		// Add zoom event handler
		element.addEventListener(
			"wheel",
			(event) => {
				if (event.defaultPrevented) return;
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
				zoom(direction, mouseX2timeline);
			},
			{ passive: true }
		);

		// Add drag event handler
		let dragStartX: number, dragStartY: number;
		let inDrag = false;
		let enableCall = true;
		element.addEventListener(
			"mousedown",
			(e) => {
				inDrag = true;
				dragStartX = e.pageX;
				dragStartY = e.pageY;
			},
			{ passive: true }
		);

		// Add move handler
		element.addEventListener(
			"mousemove",
			(event) => {
				if (!inDrag || !enableCall) {
					return;
				}
				enableCall = false;
				const deltaScrollLeft = event.pageX - dragStartX;
				//const deltaScrollTop = (e.pageY - dragStartY);
				if (deltaScrollLeft) move(deltaScrollLeft);
				dragStartX = event.pageX;
				dragStartY = event.pageY;
				setTimeout(() => (enableCall = true), 10); // Throttle mousemove for performance reasons
			},
			{ passive: true }
		);

		// Add mouse up handler
		element.addEventListener(
			"mouseup",
			() => {
				inDrag = false;
			},
			{ passive: true }
		);
	};
	const setupEventsHTML = (timelineEvent: ITimelineEventConverted): DocumentFragment | undefined => {
		if (!timelineEvent) return undefined;
		if (timelineEvent.startMinutes >= viewEnd()) return undefined;
		if (timelineEvent.endMinutes <= viewStart()) return undefined;

		const eventsFragment = document.createDocumentFragment();

		const appendChildrenEventsHTML = () => {
			eventsFragment.append(
				...timelineEvent.children.reduce((result, evt) => {
					const child = setupEventsHTML({
						...evt,
						level: timelineEvent.level + (evt.level - 1),
					});
					if (child) result.push(child);
					return result;
				}, new Array<DocumentFragment>())
			);
		};

		const appendTimelineEventHTML = (fullWidth: boolean) => {
			const levelFactor = timelineEvent.level * 1.5;
			const leftRatio = fullWidth ? 0 : getViewRatio(timelineEvent.startMinutes);
			const widthRatio = fullWidth ? 100 : (timelineEvent.durationMinutes / viewDuration()) * 100;

			const eventHTML = document.createElement("div");
			eventHTML.style.bottom = `${levelFactor * options.eventHeight}px`;
			eventHTML.style.minHeight = `${options.eventHeight}px`;
			eventHTML.style.borderRadius = "5px";
			eventHTML.style.boxSizing = "border-box";
			eventHTML.style.cursor = "pointer";
			eventHTML.style.backgroundColor = `rgb(${timelineEvent.color.join(",")})`;
			eventHTML.style.zIndex = timelineEvent.depth.toString();
			eventHTML.addEventListener("click", (e) => {
				element.dispatchEvent(
					new CustomEvent("click.tl.event", {
						detail: timelineEvent,
						bubbles: false,
						cancelable: true,
					})
				);

				if (options.autoFocus) {
					focus(timelineEvent);
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
			eventHTML.style.left = leftRatio * 100 + "%";
			eventHTML.style.width = widthRatio + "%";
			eventHTML.style.position = "absolute";
			eventHTML.style.minWidth = "5px";
			eventHTML.title = timelineEvent.title;
			eventHTML.classList.add(options.classNames.timelineEvent);

			eventHTML.attributes["starttime"] = fullWidth ? viewStart() : timelineEvent.startMinutes;

			eventsFragment.appendChild(eventHTML);
		};

		const appendBackgroundEventHTML = (fullWidth: boolean) => {
			const leftRatio = fullWidth ? 0 : getViewRatio(timelineEvent.startMinutes);
			const widthRatio = fullWidth ? 100 : (timelineEvent.durationMinutes / viewDuration()) * 100;

			const bgcolor = timelineEvent.color.length === 3 ? [...timelineEvent.color, 0.1] : timelineEvent.color;
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

			eventHTML.attributes["starttime"] = fullWidth ? viewStart() : timelineEvent.startMinutes;

			eventsFragment.appendChild(eventHTML);

			const titleHTML = document.createElement("div");
			titleHTML.innerText = timelineEvent.title;
			titleHTML.style.whiteSpace = "nowrap";
			titleHTML.style.pointerEvents = "none";
			titleHTML.style.userSelect = "none";
			titleHTML.classList.add(options.classNames.timelineEventTitle);
			eventHTML.appendChild(titleHTML);
		};

		switch (timelineEvent.type) {
			case "container":
				appendChildrenEventsHTML();
				break;
			case "timeline": {
				appendTimelineEventHTML(isViewInside(timelineEvent));
				break;
			}
			case "background": {
				appendBackgroundEventHTML(isViewInside(timelineEvent));
				break;
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
		if (!element) return;
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

		//
		const eventsHtml = setupEventsHTML(rootTimeline);
		eventsContainer.innerHTML = "";
		if (eventsHtml) eventsContainer.appendChild(eventsHtml);

		// Dispatch DOM event
		element.dispatchEvent(
			new CustomEvent("update.tl.container", {
				detail: {
					options,
					viewStartDate: viewStart(),
					viewEndDate: viewEnd(),
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
	const parseToMinutes = (input: number[] | string | number | Date | undefined): number => {
		if (input === undefined) return new Date().getTime() / 6e4;

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
	const calcStart = (tl: ITimelineEventConverted): number | undefined => {
		return tl.startMinutes
			? tl.children.length
				? Math.min(tl.startMinutes, tl.children[0].startMinutes)
				: tl.startMinutes
			: tl.children.length
			? tl.children[0].startMinutes
			: undefined;
	};
	const calcEnd = (tl: ITimelineEventConverted, duration?: number | string): number => {
		return tl.endMinutes
			? tl.endMinutes
			: duration && !isNaN(Number(duration))
			? tl.startMinutes + Number(duration)
			: tl.children.length
			? tl.children[tl.children.length - 1].endMinutes || tl.startMinutes + 1
			: tl.startMinutes + 1;
	};
	const calcLevel = (timelineEvent: ITimelineEventConverted, parent: ITimelineEventConverted): number => {
		let level = 0;
		for (const eventLevel in parent.levelMatrix) {
			level = Number(eventLevel);
			if (timelineEvent.startMinutes > parent.levelMatrix[eventLevel].time) {
				for (let i = 0; i < timelineEvent.height; i++) {
					parent.levelMatrix[(level + i).toString()] = {
						height: timelineEvent.height,
						time: timelineEvent.endMinutes,
					};
				}
				return level;
			}
		}
		level++;
		for (let i = 0; i < timelineEvent.height; i++) {
			parent.levelMatrix[(level + i).toString()] = {
				height: timelineEvent.height,
				time: timelineEvent.endMinutes,
			};
		}
		return level;
	};
	const addEvents = (parent: ITimelineEventConverted, ...children: ITimelineEvent[]): void => {
		const calcScore = (timelineEvent: ITimelineEventConverted, parent: ITimelineEventConverted): number => {
			const durationRatio = timelineEvent.durationMinutes / parent.durationMinutes;
			const score = durationRatio * timelineEvent.children.length || 1;
			return score;
		};

		const parsedChildren = children.map((tl) => parseEvent(tl, parent)).filter((tl) => !!tl);
		if (parsedChildren && parsedChildren.length && parent) {
			parent.children.push(...parsedChildren);
			parent.children.sort((a, b) => a.startMinutes - b.startMinutes);
			parent.startMinutes = calcStart(parent);
			parent.endMinutes = calcEnd(parent);
			parent.durationMinutes = parent.endMinutes - parent.startMinutes;

			parent.levelMatrix = { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } };
			parent.children.forEach((timelineEvent, i) => {
				// Add score to result in order to sort by importance
				timelineEvent.score = ["container", "timeline"].includes(timelineEvent.type) ? calcScore(timelineEvent, parent) : 0;
				timelineEvent.level = ["container", "timeline"].includes(timelineEvent.type) ? calcLevel(timelineEvent, parent) : 0;
			});
		}

		parent.height = parent.children.length
			? Math.max.apply(
					1,
					parent.children.map((child) => child.level)
			  )
			: 1;
	};
	const parseEvent = (timelineEvent: ITimelineEvent, parent?: ITimelineEventConverted): ITimelineEventConverted | undefined => {
		if (!timelineEvent) {
			console.warn("Event object is empty");
			return undefined;
		}

		const parsedTimelineEvent: ITimelineEventConverted = {
			durationMinutes: 0,
			type: "timeline",
			level: 1,
			step: 0,
			score: 0,
			height: 1,
			children: [],
			depth: parent ? parent.depth + 1 : 0,
			...timelineEvent,
			color: timelineEvent.color || options.defaultColor,
			startMinutes: parseToMinutes(timelineEvent.start),
			endMinutes: parseToMinutes(timelineEvent.end),
		};

		if (timelineEvent.events && timelineEvent.events.length) {
			addEvents(parsedTimelineEvent, ...timelineEvent.events);
		}

		// Calculate start date - if children exists take lowest date
		parsedTimelineEvent.startMinutes = calcStart(parsedTimelineEvent);

		// Filter missing requirements
		if (!parsedTimelineEvent.startMinutes) {
			console.warn("Missing start property on event - skipping", timelineEvent);
			return undefined;
		}

		// Calculate end date
		parsedTimelineEvent.endMinutes = calcEnd(parsedTimelineEvent, timelineEvent.duration);
		parsedTimelineEvent.durationMinutes = parsedTimelineEvent.endMinutes - parsedTimelineEvent.startMinutes;

		// Return
		return parsedTimelineEvent;
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

	init(elementIdentifier, settings);

	return {
		focus,
		load,
		add,
	};
};
