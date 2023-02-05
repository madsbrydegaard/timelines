interface ITimelineOptions {
	labelCount: number;
	zoomSpeed: number;
	dragSpeed: number;
	viewStart?: number[] | string | number | Date;
	viewEnd?: number[] | string | number | Date;
	timelineStart: number[] | string | number | Date;
	timelineEnd: number[] | string | number | Date;
	minZoom: number;
	maxZoom: number;
	position: string;
	expandRatio: number;
	eventHeight: number;
}
interface ITimeline {
	start: number;
	end: number;
	duration: number;
	title: string;
	children: ITimeline[];
	level: number;
	step: number;
	depth: number;
	height: number;
	score: number;
	type: string;
	color: number[];
	expanded: boolean;
}
export interface ITimelineEvent {
	title: string;
	start?: number[] | string | number | Date;
	end?: number[] | string | number | Date;
	duration?: number;
	events?: ITimelineEvent[];
	type?: string;
	color?: number[];
}
enum Direction {
	In = -1,Out = 1
}

export const Timeline = (elementIdentifier: HTMLElement | string, timeline: ITimelineEvent, settings: object) => {
	let ratio: number
	let pivot: number
	let zoomX: number;
	let timelineStart: number
	let timelineEnd: number
	let element: HTMLElement
	let options: ITimelineOptions
	let labelContainer: HTMLDivElement
	let dividerContainer: HTMLDivElement
	let eventsContainer: HTMLDivElement
	let headerContainer: HTMLDivElement
	let history: ITimeline[] = []

	const init = (elementIdentifier: HTMLElement | string, timelineEvent: ITimelineEvent, settings: object) => {
		// Handle DOM Element
		if(!elementIdentifier) throw new Error(`Element argument is empty. DOM element | selector as first arg`);
		if (typeof elementIdentifier === "string") {
			const elem = document.querySelector(elementIdentifier) as HTMLElement;
			if (!elem) throw new Error(`Selector could not be found [${element}]`);
			element = elem;
		} 
		if(elementIdentifier instanceof HTMLElement) {
			element = elementIdentifier;
		}

		// Handle options
		options = {
			...{
				labelCount: 5,
				zoomSpeed: 0.025,
				dragSpeed: 0.001,
				timelineStart: "-1000y",
				timelineEnd: "100y",
				minZoom: 1,
				maxZoom: 1e11,
				position: "bottom",
				expandRatio: 80,
				eventHeight: 5,
			},
			...settings,
		};

		// Parse & sort all events
		history.push(parseTimelineEvent(timelineEvent));
		const timeline = currentTimeline();
		
		// Set timeline boundaries
		timelineStart = parseToMinutes(options.timelineStart);
		timelineEnd = parseToMinutes(options.timelineEnd);

		//Calculate view position on timeline
		const viewStart = options.viewStart 
			? parseToMinutes(options.viewStart) 
			: (timeline.start - (timeline.duration * .05)); // Create 10% spacing - 5% on each side of the timeline
		const viewEnd = options.viewEnd 
			? parseToMinutes(options.viewEnd) 
			: (timeline.end + (timeline.duration * .05)); // Create 10% spacing - 5% on each side of the timeline

		if(viewStart < timelineStart) timelineStart = viewStart
		if(viewEnd > timelineEnd) timelineEnd = viewEnd
		const viewDuration = (viewEnd - viewStart);
		
		ratio = timelineDuration() / viewDuration;
		pivot = (timelineStart - viewStart) / viewDuration; 

		//console.log(timeline, new Date(timeline.start * 6e4), new Date(timeline.end * 6e4))
		
		// Handle DOM elements setup
		setupContainerHTML();

		// Register Mouse and Resize event handlers
		registerListeners(element);

		// Draw
		update();
	}
	const currentTimeline = (): ITimeline => {
		const [currentTimeline] = history.slice(-1);
		return currentTimeline;
	}
	const timelineDuration = (): number => {
		return timelineEnd - timelineStart;
	}
	const viewWidth = (): number => {
		return element.offsetWidth || 0;
	}
	const viewStart = (): number => {
		return timelineStart - viewDuration() * pivot;
	}
	const viewEnd = (): number => {
		return viewStart() + viewDuration();
	}
	const viewDuration = (): number => {
		return timelineDuration() / ratio;
	}
	const getLeftRatio = (minutes: number): number => {
		return (minutes - viewStart()) / viewDuration();
	}
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
	}
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
	}
	const zoom = (direction: Direction, mouseX: number): void => {
		// Make zoomSpeed relative to zoomLevel
		const zoomSpeedScale = options.zoomSpeed * ratio;
		const deltaRatio = direction * zoomSpeedScale;

		const mouseX2view = (mouseX || 0) / viewWidth();
		const mouseX2timeline = (mouseX2view - pivot) / ratio;
		const deltaPivot = mouseX2timeline * deltaRatio;

		if(setRatio(direction, deltaRatio))
			setPivot(deltaPivot);

		update();
	}
	const move = (deltaPivot: number): void => {
		setPivot(deltaPivot);
		update();
	}
	const focus = (timelineEvent: ITimeline, back?: boolean) : void => {
		if(!timelineEvent) return;
		const steps = 400;
		// const targetDurationEnhanced = timelineEvent.duration * 1.1; // Add 10% spacing
		// const targetPivotEnhanced = (timelineStart - timelineEvent.start) / targetDurationEnhanced;
		// const targetCenterMinutes = timelineEvent.start + (timelineEvent.duration / 2);
		// const targetCenterLeftRatio = getLeftRatio(targetCenterMinutes);
		// const mouseXMinutesDelta = targetCenterLeftRatio * timelineEvent.duration;
		// const mouseXMinutes = timelineEvent.start + mouseXMinutesDelta * 0.95; // Make spacing 5% on each side
		// const targetCenter = getLeftRatio(mouseXMinutes) * viewWidth();
		let counter = 0;
		
		const targetStart = (timelineEvent.start - (timelineEvent.duration * .05)); // Create 10% spacing - 5% on each side of the timeline
		const targetEnd = (timelineEvent.end + (timelineEvent.duration * .05)); // Create 10% spacing - 5% on each side of the timeline
		const targetDuration = (targetEnd - targetStart);

		const targetRatio = timelineDuration() / targetDuration;
		//const targetPivot = (timelineStart - targetStart) / targetDuration;

		// const deltaRatio = targetRatio - ratio;
		// const deltaPivot = targetPivot - pivot;

		if(!back){
			const targetCenterMinutes = targetStart + (targetDuration / 2);
			const targetCenterLeftRatio = getLeftRatio(targetCenterMinutes);
			const mouseXMinutesDelta = targetCenterLeftRatio * targetDuration;
			const mouseXMinutes = targetStart + mouseXMinutesDelta;
			zoomX = getLeftRatio(mouseXMinutes) * viewWidth();
		}
		
		// const stepRatio = deltaRatio / steps
		// const stepPivot = deltaPivot / steps

		const direction = Math.sign(ratio-targetRatio);

		// console.log(timelineEvent, new Date(targetStart * 6e4), new Date(targetEnd * 6e4))
		// console.log(ratio, targetRatio)
		// console.log(pivot, targetPivot)
		// console.log(stepRatio, stepPivot)
		if(back){
			history.pop();
		}

		const focusTimeline = (source) => {
			//console.log(source, ratio, pivot)
			clearInterval(timer);
			// ratio=targetRatio;
			// pivot=targetPivot;
			if(!back&&timelineEvent.children.length>0){
				history.push(timelineEvent);
			}
			update();
		}

		// const skipRatio = targetRatio + stepRatio;
		// const speed = 
		//console.log(direction, targetRatio, ratio, targetPivot, pivot, zoomX)
		const timer = setInterval(()=>{
			// const zoomSpeedScale = options.zoomSpeed * ratio;
			// const deltaRatio = direction * zoomSpeedScale;
			// setRatio(direction, deltaRatio)
			// setPivot(stepPivot)
			zoom(direction, zoomX);
			if(direction<0 && ratio>targetRatio) {focusTimeline(1); return;}
			if(direction>0 && ratio<targetRatio) {focusTimeline(2); return;}
			// const exponent = (1 / (steps-counter));
			// const newRatio = Math.pow(targetRatio, exponent) + ratio;
			// console.log(newRatio)
			// ratio=newRatio;
			//pivot+=stepPivot;
			//update();
			// if(direction<0 && ratio>skipRatio) focusTimeline(1);
			// if(direction>0 && ratio<skipRatio) focusTimeline(2);
			//if(exponent >= 1) focusTimeline(1);
			if(counter++>steps) focusTimeline(3);
		}, 1);
	}
	const registerListeners = (element: HTMLElement): void => {
		// Add resize handler
		window.addEventListener("resize", () => {
			update();
		}, { passive: true });


		// Add zoom event handler
		element.addEventListener("wheel", (event) => {
			//event.preventDefault();
			// Decide whether zoom is IN (-) or OUT (+)
			var direction = Math.sign(event.deltaY) as Direction;
			// console.log('wheel', direction, event)
			// Adjust width of timeline for zooming effect
			const leftRatio = (event.target as HTMLElement).attributes["starttime"]
				? getLeftRatio((event.target as HTMLElement).attributes["starttime"])
				: 0
			const offsetX = leftRatio * element.getBoundingClientRect().width + event.offsetX;
			zoom(direction, offsetX);
		}, { passive: true });

		// Add drag event handler
		let dragStartX: number, dragStartY: number;
		let inDrag = false;
		let enableCall = true;
		element.addEventListener("mousedown", (e) => {
			inDrag = true;
			dragStartX = e.pageX;
			dragStartY = e.pageY;
		}, { passive: true });

		// Add move handler
		element.addEventListener("mousemove", (e) => {
			if (!inDrag || !enableCall) {
				return;
			}
			enableCall = false;
			const deltaScrollLeft = (e.pageX - dragStartX) * options.dragSpeed;
			//const deltaScrollTop = (e.pageY - dragStartY) * options.dragSpeed;
			if(deltaScrollLeft) move(deltaScrollLeft);
			dragStartX = e.pageX;
			dragStartY = e.pageY;
			setTimeout(() => enableCall = true, 10); // Throttle mousemove for performance reasons
		}, { passive: true });

		// Add mouse up handler
		element.addEventListener("mouseup", () => {
			inDrag = false;
		}, { passive: true });
	}
	const setupEventsHTML = (timelineEvent: ITimeline): DocumentFragment => {
		const eventsFragment = document.createDocumentFragment();

		const createTimelineEventHTML = (timelineEvent: ITimeline) : HTMLDivElement | undefined => {
			if(timelineEvent.start >= viewEnd()) return undefined;
			if(timelineEvent.end <= viewStart()) return undefined;

			const leftRatio = getLeftRatio(timelineEvent.start);
			const eventHTML = document.createElement("div");
			const widthRatio = (timelineEvent.duration / viewDuration()) * 100;

			eventHTML.style.left = (leftRatio * 100) + '%'
			eventHTML.style.width = widthRatio + '%'
			eventHTML.style.position = 'absolute';
			eventHTML.style.minWidth = '5px';
			eventHTML.style.overflow = 'hidden';
			eventHTML.title = timelineEvent.title;
			eventHTML.className = "timelineEventGenerated";
			eventHTML.attributes["starttime"] = timelineEvent.start;
			eventHTML.attributes["expanded"] = widthRatio > options.expandRatio;
			return eventHTML;
		}

		const createTimelineEventTitleHTML = (timelineEvent: ITimeline) : HTMLDivElement => {
			const eventHTML = document.createElement("div");
			eventHTML.title = timelineEvent.title;
			eventHTML.innerText = timelineEvent.title;
			eventHTML.className = "timelineEventGeneratedTitle";
			eventHTML.style.whiteSpace = 'nowrap';
			eventHTML.style.pointerEvents = 'none';
			eventHTML.style.userSelect = 'none';
			return eventHTML;
		}

		// Iterate background events
		timelineEvent.children
			.filter((rawEvent) => rawEvent.type === 'background')
			.forEach((backgroundEvent, i) => {
			try{
				const eventHTML = createTimelineEventHTML(backgroundEvent)
				if(eventHTML){
					const color = backgroundEvent.color.map((color)=>(color - Math.pow(10,backgroundEvent.depth)))
					eventHTML.style.bottom = `0px`;
					eventHTML.style.minHeight = `100%`;
					eventHTML.style.backgroundColor = `rgba(${color[0]},${color[1]},${color[2]}, .05)`;
					eventHTML.addEventListener("click", (e) => {
						eventHTML.dispatchEvent(new CustomEvent("background-event-click", {
							detail: backgroundEvent,
							bubbles: true
						}));
					});
					eventHTML.append(createTimelineEventTitleHTML(backgroundEvent))

					eventsFragment.appendChild(eventHTML);
				}
			} catch(error){
				console.error(error, 'backgroundEvent', backgroundEvent);
			}
		});

		// Iterate timline events
		timelineEvent.children
			.filter((rawEvent) => rawEvent.type === 'timeline')
			.forEach((childEvent, i) => {
			try{
				
				const eventHTML = createTimelineEventHTML(childEvent)
				if(eventHTML){
					let heightFactor = childEvent.height + ((childEvent.height - 1) * .5);
					let levelFactor = (childEvent.level + timelineEvent.level - 1) * 1.5;
					//const expanded = !!eventHTML.attributes["expanded"] || timelineEvent.expanded;
					const color = childEvent.color.map((color)=>(color - Math.pow(10,childEvent.depth)))
					// if(expanded && timelineEvent.children.length){
					// 	eventsFragment.append(setupEventsHTML(timelineEvent.children, timelineEvent));
					// }
					eventHTML.style.bottom = `${levelFactor*options.eventHeight}px`;
					eventHTML.style.minHeight = `${heightFactor*options.eventHeight}px`;
					eventHTML.style.borderRadius = '5px'
					eventHTML.style.boxSizing = 'border-box'
					eventHTML.style.border = '1px solid rgba(100,100,100,.5)'
					eventHTML.style.backgroundColor = `rgb(${color[0]},${color[1]},${color[2]})`
					eventHTML.style.zIndex = childEvent.depth.toString();
					eventHTML.addEventListener("click", (e) => {
						eventHTML.dispatchEvent(new CustomEvent("event-click", {
							detail: childEvent,
							bubbles: true
						}));
					});
					eventsFragment.appendChild(eventHTML);
				}
			} catch(error){
				console.error(error, 'timelineEvent', childEvent);
			}
		});

		return eventsFragment;
	}
	const setupContainerHTML = (): void => {
		// Register parent as position = "relative" for absolute positioning to work
		element.style.position = "relative";
		element.style.overflow = "hidden";
		element.style.minHeight = "3rem";

		// Initialize header
		const existingHeaderContainer = element.querySelector('.timelineHeaderContainer') as HTMLDivElement;
		headerContainer = existingHeaderContainer || document.createElement("div");
		if(!existingHeaderContainer) element.appendChild(headerContainer);

		headerContainer.className = "timelineHeaderContainer";
		headerContainer.style.width = "100%";
		headerContainer.style.height = "20px";
		// headerContainer.style.textAlign = "left";
		// headerContainer.style.position = "absolute";
		// headerContainer.style.pointerEvents = 'none';
		// headerContainer.style.userSelect = 'none';
		// headerContainer.style.top = "0";
		// headerContainer.style.zIndex = "2";
		headerContainer.style.backgroundColor = 'white';
		
		// Initialize labels
		const existingLabelContainer = element.querySelector('.timelineLabelContainer') as HTMLDivElement;
		labelContainer = existingLabelContainer || document.createElement("div");
		if(!existingLabelContainer) element.appendChild(labelContainer);

		labelContainer.className = "timelineLabelContainer";
		labelContainer.style.width = "100%";
		labelContainer.style.height = "50px";
		labelContainer.style.textAlign = "center";
		labelContainer.style.position = "absolute";
		labelContainer.style.pointerEvents = 'none';
		labelContainer.style.userSelect = 'none';
		switch(options.position){
			case "top":
				labelContainer.style.top = "20px";
				break;
			// case "center":
			// 	this.labelContainer.style.top = "50%";
			// 	this.labelContainer.style.transform = "translate(0, calc(-50%))";
			// 	break;
			default:
				labelContainer.style.bottom = "0";
		}

		// Initialize dividers
		const existingDividerContainer = element.querySelector('.timelineDividerContainer') as HTMLDivElement;
		dividerContainer = existingDividerContainer || document.createElement("div");
		if(!existingDividerContainer) element.appendChild(dividerContainer);

		dividerContainer.className = "timelineDividerContainer";
		dividerContainer.style.width = "100%";
		dividerContainer.style.height = "calc(100% - 20px)";
		dividerContainer.style.position = "absolute";
		dividerContainer.style.zIndex = "-2";
		dividerContainer.style.bottom = '0';

		// Initialize events container
		const existingEventsContainer = element.querySelector('.timelineEventsContainer') as HTMLDivElement;
		eventsContainer = existingEventsContainer || document.createElement("div");
		if(!existingEventsContainer) element.appendChild(eventsContainer);
		eventsContainer.className = "timelineEventsContainer";
		eventsContainer.style.position = 'absolute';
		eventsContainer.style.bottom = '50px';
		eventsContainer.style.height = "calc(100% - 70px)";
		eventsContainer.style.width = "100%";
	}
	const format = (minutes: number): string => {
		//console.log(2, minutes)
		const moment = new Date(minutes * 6e4);
		//console.log(3, moment)
		if (viewDuration() < 1440 * 4) {
			// minutes in an day = 1440
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "numeric",
			}).format(moment);
		}
		if (viewDuration() < 10080 * 6) {
			// minutes in a week = 10080
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(moment);
		}
		if (viewDuration() < 43829.0639 * 18) {
			// minutes in a month = 43829.0639
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
			}).format(moment);
		}
		// minutes in a year = 525948.766
		return moment.getFullYear().toString();
	}
	const update = (): void => {
		if (!element) return;
		const currentLevel = Math.floor(ratio);
		// https://math.stackexchange.com/questions/3381728/find-closest-power-of-2-to-a-specific-number
		const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
		const granularity = 1 / (options.labelCount + 1);
		const timelineViewDifference = viewStart() - timelineStart;
		const timestampDistance = timelineDuration() * granularity;
		//console.log(currentLevel, ratio)
		const currentTimestampDistanceByLevel = timestampDistance / iterator;

		// Find integer value of timestamp difference
		const integerDifFraction = Math.floor(timelineViewDifference / currentTimestampDistanceByLevel);
		const currentDif = integerDifFraction * currentTimestampDistanceByLevel;

		const labels = document.createDocumentFragment();
		const dividers = document.createDocumentFragment();
		for (let i = 0; i < options.labelCount + 2; i++) {
			const labelTime =
				(i + 1) * currentTimestampDistanceByLevel + timelineStart + currentDif - currentTimestampDistanceByLevel;
			const dividerTime = labelTime + (currentTimestampDistanceByLevel / 2);

			// Set label position
			const labelViewRatio = getLeftRatio(labelTime);
			const labelViewLeftPosition = labelViewRatio * 100;

			// Set divider position
			const dividerViewRatio = getLeftRatio(dividerTime);
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
			label.innerHTML = format(labelTime);
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
		labelContainer.innerHTML = "";
		labelContainer.appendChild(labels);

		dividerContainer.innerHTML = "";
		dividerContainer.appendChild(dividers);

		//
		const [currentTimeline] = history.slice(-1);
		const eventsHtml = setupEventsHTML(currentTimeline);
		eventsContainer.innerHTML = "";
		eventsContainer.appendChild(eventsHtml);

		const headers = document.createDocumentFragment();
		const header = document.createElement("div");
		header.className = "timelineHeader";
		header.style.textAlign = "center";
		//header.style.position = "absolute";
		header.innerHTML = currentTimeline.title;
		headers.appendChild(header);

		if(history.length > 1){
			const back = document.createElement("div");
			back.className = "timelineBack";
			back.style.position = "absolute";
			back.style.top = "0px";
			back.style.left = "5px";
			//back.style.zIndex = "1000";
			back.style.cursor = "pointer";
			back.innerHTML = "<";
			back.addEventListener("click", (e) => {
				back.dispatchEvent(new CustomEvent("back-click", {
					bubbles: true
				}));
				const [previousTimeline] = history.slice(-2);
				focus(previousTimeline, true);
			});
			headers.appendChild(back);
		}

		headerContainer.innerHTML = "";
		headerContainer.appendChild(headers);

		// Dispatch DOM event
		element.dispatchEvent(new CustomEvent("update", {
			detail: toJSON(),
			bubbles: true,
			cancelable: true,
			composed: false,
		}));
	}
	const parseToMinutes = (input: number[] | string | number | Date | undefined): number => {
		if(input === undefined) return undefined;

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
		// It should be noted that the maximum Date is not of the same value as the maximum safe integer (Number.MAX_SAFE_INTEGER is 9,007,199,254,740,991).
		// Instead, it is defined in ECMA-262 that a maximum of ±100,000,000 (one hundred million) days relative
		// to January 1, 1970 UTC (that is, April 20, 271821 BCE ~ September 13, 275760 CE)
		// can be represented by the standard Date object (equivalent to ±8,640,000,000,000,000 milliseconds).

		const parseDateArray = (input: number[]): number => {
			const date = new Date();
			date.setDate(input[2] ? input[2] : 1);
			date.setMonth(input[1] ? (input[1] - 1) : 0);
			date.setHours(input[3] ? input[3] : 0);
			date.setMinutes(input[4] ? input[4] : 0);
			date.setSeconds(0);

			if(!input[0]){
				return date.getTime() / 6e4;
			}
			
			if(input[0]&&input[0]>-270000&&input[0]<270000){
				date.setFullYear(input[0]);
				return date.getTime() / 6e4;
			}

			// 525948.766 = minutes in a year
			const yearRelativeTo1970InMinutes = 525948.766 * input[0];
			date.setFullYear(0);
			return yearRelativeTo1970InMinutes + (date.getTime() / 6e4);
		}

		const parseDateString = (input: string): Date => {
			switch (input) {
				case "now":
					return new Date(); 
				default:
					// 31556926 = Seconds in a year
					// 525948.766 = minutes in a year
					const years = Number(input.replace(/y$/, ''))
					if(!isNaN(years)){
						return new Date(Date.now() + (31556926 * 1e3 * years)); 
					}
					// const year0 = new Date('0001-01-01');
					// const yearsBC = Number(input.replace(/bc$/, ''))
					// if(!isNaN(yearsBC)){
					// 	return new Date(year0.getTime() - 31556926 * 1e3 * yearsBC); 
					// }
					// const yearsAD = Number(input.replace(/ad$/, ''))
					// if(!isNaN(yearsAD)){
					// 	return new Date(year0.getTime() + 31556926 * 1e3 * yearsAD); 
					// }
					return new Date(input);
			}
		}

		if(Array.isArray(input)){
			let inputArray = input as number[];
			if (inputArray.length === 0) throw new Error("argument Array cannot be empty");
			const isNumberArray =
			inputArray.every((value) => {
				return typeof value === 'number';
			});
			if (!isNumberArray) throw new Error("input Array must contain only numbers");
			return parseDateArray(inputArray);
		}

		if(typeof input === "object" && input.constructor.name === "Date"){
			return input.getTime() / 6e4;
		}

		if(typeof input === "string"){
			return parseDateString(input).getTime() / 6e4;
		}

		if(typeof input === "number"){
			return new Date(input).getTime() / 6e4;
		}

		return undefined;
	}
	const parseTimelineEvent = (timelineEvent: ITimelineEvent, parent?: ITimeline): ITimeline => {
		if(!timelineEvent){
			console.warn('Event object is empty'); 
			return undefined;
		}

		const isNumberArray = (array: any[]) => {
			return array.every(element => {
				return typeof element === 'number';
			});
		}

		const parsedTimelineEvent: ITimeline = {
			type: "timeline",
			duration: 0,
			color: [240,240,240],
			expanded: false,
			level: 0, step: 0, score: 0, height: 0, children: [],
			depth: parent ? parent.depth + 1 : 0,
			...timelineEvent,
			start: parseToMinutes(timelineEvent.start),
			end: parseToMinutes(timelineEvent.end),
		}

		const children = !timelineEvent.events ? [] : timelineEvent.events.reduce<ITimeline[]>((result, timelineEvent) => {
			const timeline = parseTimelineEvent(timelineEvent, parsedTimelineEvent);
			if(timeline) result.push(timeline)
			return result;
		}, []);

		// Sort children by start
		parsedTimelineEvent.children = children.sort((a,b)=>a.start - b.start);

		// Calculate start date - if children exists take lowest date
		const start = parsedTimelineEvent.start 
			? parsedTimelineEvent.children.length 
				? Math.min(parsedTimelineEvent.start, parsedTimelineEvent.children[0].start)
				: parsedTimelineEvent.start
			: parsedTimelineEvent.children.length ? parsedTimelineEvent.children[0].start : undefined;

		// Filter missing requirements
		if(!start) { 
			console.warn('Missing start property on event - skipping', timelineEvent)
			return undefined;
		}

		// Calculate end date
		const end = parsedTimelineEvent.end 
			? parsedTimelineEvent.end
			: parsedTimelineEvent.duration && !isNaN(Number(parsedTimelineEvent.duration)) 
				? start + Number(parsedTimelineEvent.duration) 
				: parsedTimelineEvent.children.length 
					? parsedTimelineEvent.children[parsedTimelineEvent.children.length-1].end || start + 1
					: start + 1;

		const color = timelineEvent.color 
			? isNumberArray(timelineEvent.color) 
				? timelineEvent.color
				: [240,240,240]
			: [240,240,240];

		// Level Calculator(s) for simultanious events
		const levelMatrix = {1:{height: 0, time: Number.MIN_SAFE_INTEGER}}
		const calcLevel = (timelineEvent: ITimeline): number => {
			let level = 0
			for(const eventLevel in levelMatrix){
				level = Number(eventLevel);
				if(timelineEvent.start > levelMatrix[eventLevel].time){
					for(let i = 0; i < timelineEvent.height; i++){
						levelMatrix[(level+i).toString()] = {
							height: timelineEvent.height,
							time: timelineEvent.end
						}
					}
					return level;
				}
			}
			level++
			for(let i = 0; i < timelineEvent.height; i++){
				levelMatrix[(level+i).toString()] = {
					height: timelineEvent.height,
					time: timelineEvent.end
				}
			}
			return level;
		}

		// Flat does not count height as part of level
		const stepMatrix = {1:{height: 0, time: Number.MIN_SAFE_INTEGER}}
		const calcStep = (timelineEvent: ITimeline): number => {
			let step = 0
			for(const eventLevel in stepMatrix){
				step = Number(eventLevel);
				if(timelineEvent.start > stepMatrix[eventLevel].time){
					stepMatrix[(step).toString()] = {
						height: timelineEvent.height,
						time: timelineEvent.end
					}
					return step;
				}
			}
			step++
			stepMatrix[(step).toString()] = {
				height: timelineEvent.height,
				time: timelineEvent.end
			}
			return step;
		}

		const calcScore = (timelineEvent: ITimeline): number => {
			let score = 1
			const durationRatio = (timelineEvent.duration || 1) / timelineDuration();
			score = durationRatio * parsedTimelineEvent.children.length
			return score;
		}

		// Add score to result in order to sort by importance
		parsedTimelineEvent.children.forEach((timelineEvent, i) => {
			timelineEvent.score = calcScore(timelineEvent)
			timelineEvent.level = timelineEvent.type === 'timeline' ? calcLevel(timelineEvent) : 0,
			timelineEvent.step = timelineEvent.type === 'timeline' ? calcStep(timelineEvent) : 0
		});

		parsedTimelineEvent.type = timelineEvent.type || "timeline";
		parsedTimelineEvent.duration = (end - start);
		parsedTimelineEvent.color = color;
		parsedTimelineEvent.start = start;
		parsedTimelineEvent.end = end;
		parsedTimelineEvent.height = children.length
			? Math.max.apply(1, children.map((child) => child.level))
			: 1;
		
		// Return
		return parsedTimelineEvent;
	}
	const parseTimelineHTML = (input: HTMLElement): any[] => {
		// Initialize events
		let result = []
		const timelineEvents = input.querySelectorAll<HTMLElement>('.timelineEvent');
		if(timelineEvents) {
			timelineEvents
				.forEach((timelineEvent) => {
					try{
						result.push({
							...timelineEvent.attributes,
							events: parseTimelineHTML(timelineEvent)
						})
					} catch(error){
						console.error(error, 'timelineEvent');
					}
				})
		}
		return result;
	}
	const toJSON = () => {
		return {
			options,
			viewStartDate: viewStart(),
			viewEndDate: viewEnd(),
			viewDuration: viewDuration(),
			ratio,
			pivot,
		}
	}

	init(elementIdentifier, timeline, settings);

	return {
		focus
	}
};