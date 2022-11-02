interface ITimelineOptions {
	labelCount: number | undefined;
	zoomSpeed: number | undefined;
	dragSpeed: number | undefined;
	startDate: number[] | string | number | Date | undefined;
	endDate: number[] | string | number | Date | undefined;
	timelineStartDate: number[] | string | number | Date | undefined;
	timelineEndDate: number[] | string | number | Date | undefined;
	minZoom: number | undefined;
	maxZoom: number | undefined;
	position: string | undefined;
	expandRatio: number | undefined;
}
interface ITimeline {
	options: ITimelineOptions;
	element: HTMLElement;
	startDate: Date;
	endDate: Date;
	duration: number;
	ratio: number;
	pivot: number;
}
export interface ITimelineEvent {
	startdate: Date;
	enddate: Date | undefined;
	duration: number | undefined;
	title: string;
	events: ITimelineEvent[] | undefined;
	level: number;
	nestingLevel: number;
	maxLevel: number;
}
enum Direction {
	In = -1,Out = 1
}

export class Timeline implements ITimeline {
	ratio: number
	pivot: number
	options: ITimelineOptions
	events: ITimelineEvent[]
	element: HTMLElement
	timelineStart: Date
	timelineEnd: Date
	callback: (option: ITimeline) => void
	labelContainer: HTMLDivElement
	dividerContainer: HTMLDivElement
	eventsContainer: HTMLDivElement
	constructor(element: HTMLElement | string, events: ITimelineEvent[], options: object, callback?: (timeline: ITimeline) => void) {
		// Handle DOM Element
		if(!element) throw new Error(`Events argument is empty. Please add Array of events | DOM element | selector as first arg`);
		if (typeof element === "string") {
			const elem = document.querySelector(element) as HTMLElement;
			if (!elem) throw new Error(`Selector could not be found [${element}]`);
			this.element = elem;
		} 
		if(element instanceof HTMLElement) {
			this.element = element;
		}
		
		// Merge events param and HTML events
		const mergedEvents = [...(Array.isArray(events) ? events : []), ...this.parseTimelineHTML(this.element)];

		// Parse & sort all events
		this.events = [...this.parseEvents(mergedEvents)];

		// Handle options
		this.options = {
			...{
				labelCount: 5,
				zoomSpeed: 0.025,
				dragSpeed: 0.001,
				startDate: "-100y",
				endDate: "10y",
				timelineStartDate: "-1000y",
				timelineEndDate: "1000y",
				minZoom: 1,
				maxZoom: 1e11,
				position: "bottom",
				expandRatio: 30,
			},
			...options,
		};

		// Set timeline boundaries
		this.timelineStart = this.parseDate(this.options.timelineStartDate);
		this.timelineEnd = this.parseDate(this.options.timelineEndDate);

		//Calculate view position on timeline
		const start = this.parseDate(this.options.startDate);
		const end = this.parseDate(this.options.endDate);
		if(start.getTime() < this.timelineStart.getTime()) this.timelineStart = start
		if(end.getTime() > this.timelineEnd.getTime()) this.timelineEnd = end
		const viewDuration = end.getTime() - start.getTime();

		this.ratio = this.timelineDuration / viewDuration;
		this.pivot = (this.timelineStart.getTime() - start.getTime()) / viewDuration;

		console.log(this.events)
		
		// Handle DOM elements setup
		this.setupContainerHTML();

		// Register Mouse and Resize event handlers
		this.registerListeners(this.element);

		// Register callback
		this.callback = callback;

		// Draw
		this.update();
	}
	get timelineDuration(): number {
		return this.timelineEnd.getTime() - this.timelineStart.getTime();
	}
	get viewWidth(): number {
		return this.element?.offsetWidth || 0;
	}
	get start(): number {
		return this.timelineStart.getTime() - this.duration * this.pivot;
	}
	get end(): number {
		return this.start + this.duration;
	}
	get duration(): number {
		return this.timelineDuration / this.ratio;
	}
	get startDate(): Date {
		return new Date(this.start);
	}
	get endDate(): Date {
		return new Date(this.end);
	}
	setRatio(direction: Direction, deltaRatio: number): boolean {
		let newRatio = this.ratio - deltaRatio;

		// If zoom OUT - test if zoom is allowed
		if (direction === Direction.Out && newRatio <= this.options.minZoom) {
			return false;
		}

		// If zoom IN - test if zoom is allowed
		if (direction === Direction.In && newRatio >= this.options.maxZoom) {
			return false;
		}

		this.ratio = newRatio;
		return true;
	}
	setPivot(deltaPivot: number): void {
		let newPivot = this.pivot + deltaPivot;

		if (newPivot >= 0) {
			// pivot larger than allowed (too much to the right)
			newPivot = 0;
		}

		if (newPivot + this.ratio <= 1) {
			// pivot smaller than allowed (too much to the left)
			newPivot = 1 - this.ratio;
		}

		this.pivot = newPivot;
	}
	zoom(direction: Direction, mouseX: number): void {
		// Make zoomSpeed relative to zoomLevel
		const zoomSpeedScale = this.options.zoomSpeed * this.ratio;
		const deltaRatio = direction * zoomSpeedScale;

		const mouseX2view = (mouseX || 0) / this.viewWidth;
		const mouseX2timeline = (mouseX2view - this.pivot) / this.ratio;
		const deltaPivot = mouseX2timeline * deltaRatio;

		if(this.setRatio(direction, deltaRatio))
			this.setPivot(deltaPivot);

		this.update();
	}
	move(deltaPivot: number): void {
		this.setPivot(deltaPivot);
		this.update();
	}
	registerListeners(element: HTMLElement): void {
		const vm = this;
		window.addEventListener(
			"resize",
			function () {
				vm.update();
			},
			{ passive: true }
		);

		// Add zoom event handler
		element.addEventListener(
			"wheel",
			function (event) {
				event.preventDefault();
				// Decide whether zoom is IN (-) or OUT (+)
				var direction = Math.sign(event.deltaY) as Direction;
				// console.log('wheel', direction, event)
				// Adjust width of timeline for zooming effect
				vm.zoom(direction, event.offsetX);
			},
			{ passive: false }
		);

		// Add drag event handler
		let dragStartX: number, dragStartY: number;
		let inDrag = false;
		let enableCall = true;
		element.addEventListener(
			"mousedown",
			function (e) {
				inDrag = true;
				dragStartX = e.pageX;
				dragStartY = e.pageY;
			},
			{ passive: false }
		);
		element.addEventListener(
			"mousemove",
			function (e) {
				if (!inDrag || !enableCall) {
					return;
				}
				enableCall = false;
				const deltaScrollLeft = (e.pageX - dragStartX) * vm.options.dragSpeed;
				//const deltaScrollTop = (e.pageY - dragStartY) * vm.options.dragSpeed;
				vm.move(deltaScrollLeft);
				dragStartX = e.pageX;
				dragStartY = e.pageY;
				setTimeout(() => enableCall = true, 10); // Throttle mousemove for performance reasons
			},
			{ passive: false }
		);
		document.addEventListener(
			"mouseup",
			function () {
				inDrag = false;
			},
			{ passive: false }
		);
	}
	setupEventsHTML(sortedEvents: ITimelineEvent[], container: HTMLElement, nestingLevel: number = 0): void{
		const eventsFragment = document.createDocumentFragment();
		sortedEvents.forEach((timelineEvent, i) => {
			try{
				const startTime = timelineEvent.startdate.getTime();
				const endTime = timelineEvent.enddate.getTime();
				const leftRatio = (startTime - this.startDate.getTime()) / this.duration;
				const rightRatio = (endTime - this.startDate.getTime()) / this.duration;
				const visible = rightRatio > 0 && leftRatio < 1;
				if(!visible) return;
				const eventHTML = document.createElement("div");
				eventHTML.className = "timelineGeneratedEvent";
				const eventDuration = Number(timelineEvent.duration) * 6e4;
				const widthRatio = (eventDuration / this.duration) * 100
				const expanded = widthRatio > this.options.expandRatio;
				const greyScale = 240 - Math.pow(4,nestingLevel)
				if(expanded && timelineEvent.events.length){
					this.setupEventsHTML(timelineEvent.events, container, timelineEvent.nestingLevel);
					eventHTML.style.minHeight = `${(timelineEvent.maxLevel+1)}rem`;
					eventHTML.style.bottom = `${timelineEvent.level-.2}rem`;
					eventHTML.style.left = (leftRatio * 100) - 1 + '%'
					eventHTML.style.width = widthRatio + 2 + '%'
				} else {
					eventHTML.style.minHeight = `${(timelineEvent.maxLevel+1)*.5}rem`;
					eventHTML.style.bottom = `${timelineEvent.level}rem`;
					eventHTML.style.left = leftRatio * 100 + '%'
					eventHTML.style.width = widthRatio + '%'
				}
				eventHTML.style.position = 'absolute';
				
				eventHTML.style.minWidth = '5px';
				eventHTML.style.borderRadius = '5px'
				eventHTML.style.border = 'solid 1px black';
				eventHTML.style.backgroundColor = `rgb(${greyScale},${greyScale},${greyScale})`
				//eventHTML.style.bottom = `${timelineEvent.level}rem`;
				eventHTML.style.zIndex = timelineEvent.nestingLevel.toString();
				eventHTML.title = timelineEvent.title;
				//eventHTML.ariaLevel = timelineEvent.level.toString();
				
				eventsFragment.appendChild(eventHTML);
			} catch(error){
				console.error(error, 'timelineEvent', timelineEvent);
			}
		});

		container.appendChild(eventsFragment);
	}
	setupContainerHTML(): void{
		// Register parent as position = "relative" for absolute positioning to work
		this.element.style.position = "relative";
		// Register parent overflow = "hidden" to hide overflow moments
		this.element.style.overflow = "hidden";
		this.element.style.minHeight = "3rem";
		this.element.style.zIndex = "0";

		// this.addCSS(`
		// 	.timeline{position: absolute; z-index: -1}
		// 	.timeline.hidden{display:none}
		// 	.timeline.collapsed{border: solid 1px red; width: 5px; height: 5px}
		// 	.timeline.collapsed *{display: none}
		// `)

		// Initialize labels
		const labelContainer = this.element.querySelector('.timelineLabelContainer') as HTMLDivElement;
		this.labelContainer = labelContainer || document.createElement("div");
		if(!labelContainer) this.element.appendChild(this.labelContainer);

		this.labelContainer.className = "timelineLabelContainer";
		this.labelContainer.style.width = "100%";
		this.labelContainer.style.height = "3rem";
		this.labelContainer.style.textAlign = "center";
		this.labelContainer.style.position = "absolute";
		this.labelContainer.style.zIndex = "-9";
		switch(this.options.position){
			case "top":
				this.labelContainer.style.top = "0";
				break;
			case "center":
				this.labelContainer.style.top = "50%";
				this.labelContainer.style.transform = "translate(0, calc(-50%))";
				break;
			default:
				this.labelContainer.style.bottom = "0";
		}

		// Initialize dividers
		const dividerContainer = this.element.querySelector('.timelineDividerContainer') as HTMLDivElement;
		this.dividerContainer = dividerContainer || document.createElement("div");
		if(!dividerContainer) this.element.appendChild(this.dividerContainer);

		this.dividerContainer.className = "timelineDividerContainer";
		this.dividerContainer.style.width = "100%";
		this.dividerContainer.style.height = "100%";
		this.dividerContainer.style.position = "absolute";
		this.dividerContainer.style.zIndex = "-10";

		// Initialize events container
		const eventsContainer = this.element.querySelector('.timelineEventsContainer') as HTMLDivElement;
		this.eventsContainer = eventsContainer || document.createElement("div");
		if(!eventsContainer) this.element.appendChild(this.eventsContainer);
		this.eventsContainer.className = "timelineEventsContainer";
		this.eventsContainer.style.position = 'absolute';
		this.eventsContainer.style.bottom = '4rem';
		//this.eventsContainer.style.height = `7rem`
		this.eventsContainer.style.width = "100%";
		this.eventsContainer.style.zIndex = "-1";
	}
	format(milliseconds: number): string {
		const moment = new Date(milliseconds);
		if (this.duration < 1440 * 6e5 * 4) {
			// minutes in an day = 1440
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "numeric",
			}).format(moment);
		}
		if (this.duration < 10080 * 6e5 * 6) {
			// minutes in a week = 10080
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(moment);
		}
		if (this.duration < 43829.0639 * 6e5 * 18) {
			// minutes in a month = 43829.0639
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
			}).format(moment);
		}
		// minutes in a year = 525948.766
		return moment.getFullYear().toString();
	}
	update(): void {
		if (!this.element) return;
		const currentLevel = Math.floor(this.ratio);
		// https://math.stackexchange.com/questions/3381728/find-closest-power-of-2-to-a-specific-number
		const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
		const granularity = 1 / (this.options.labelCount + 1);
		const timelineViewDifference = this.start - this.timelineStart.getTime();
		const timestampDistance = this.timelineDuration * granularity;

		const currentTimestampDistanceByLevel = timestampDistance / iterator;

		// Find integer value of timestamp difference
		const integerDifFraction = Math.floor(timelineViewDifference / currentTimestampDistanceByLevel);
		const currentDif = integerDifFraction * currentTimestampDistanceByLevel;

		const labels = document.createDocumentFragment();
		const dividers = document.createDocumentFragment();
		for (let i = 0; i < this.options.labelCount + 2; i++) {
			const labelTime =
				(i + 1) * currentTimestampDistanceByLevel + this.timelineStart.getTime() + currentDif - currentTimestampDistanceByLevel;
			const dividerTime = labelTime + (currentTimestampDistanceByLevel / 2);

			// Set label position
			const labelViewRatio = this.toJSON().getLeftRatio(labelTime);
			const labelViewLeftPosition = labelViewRatio * 100;

			// Set divider position
			const dividerViewRatio = this.toJSON().getLeftRatio(dividerTime);
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
			label.innerHTML = this.format(labelTime);
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
		this.labelContainer.innerHTML = "";
		this.labelContainer.appendChild(labels);

		this.dividerContainer.innerHTML = "";
		this.dividerContainer.appendChild(dividers);

		//
		this.eventsContainer.innerHTML = "";
		this.setupEventsHTML(this.events, this.eventsContainer)

		// Dispatch DOM event
		const update = new CustomEvent("update", {
			detail: this.toJSON(),
			bubbles: true,
			cancelable: true,
			composed: false,
		});
		this.element.dispatchEvent(update);

		// Dispatch callback
		if(this.callback) this.callback(this);
	}
	parseDate(input: number[] | string | number | Date): Date {
		if(input === undefined) return new Date();

		if(Array.isArray(input)){
			let inputArray = input as number[];
			if (inputArray.length === 0) throw new Error("argument Array cannot be empty");
			const isNumberArray =
			inputArray.every((value) => {
				return typeof value === 'number';
			});
			if (!isNumberArray) throw new Error("input Array must contain only numbers");
			return this.parseDateArray(inputArray);
		}

		if(typeof input === "object" && input.constructor.name === "Date"){
			return input;
		}

		if(typeof input === "string"){
			return this.parseDateString(input);
		}

		if(typeof input === "number"){
			return new Date(input);
		}
	}
	parseDateArray(input: number[]): Date {
		const date = new Date();
		date.setFullYear(input[0] || date.getFullYear());
		date.setDate(input[2] ? input[2] : 1);
		date.setMonth(input[1] ? (input[1] - 1) : 0);
		date.setHours(input[3] ? input[3] : 0);
		date.setMinutes(input[4] ? input[4] : 0);
		date.setSeconds(0);
		return date;
	}
	parseDateString(input: string): Date {
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
		// It should be noted that the maximum Date is not of the same value as the maximum safe integer (Number.MAX_SAFE_INTEGER is 9,007,199,254,740,991).
		// Instead, it is defined in ECMA-262 that a maximum of ±100,000,000 (one hundred million) days relative
		// to January 1, 1970 UTC (that is, April 20, 271821 BCE ~ September 13, 275760 CE)
		// can be represented by the standard Date object (equivalent to ±8,640,000,000,000,000 milliseconds).
		switch (input) {
			case "now":
				return new Date(); 
			case "max":
				return new Date(8640e12); 
			case "min":
				return new Date(-8640e12); 
			default:
				// 31556926 = Seconds in a year
				const years = Number(input.replace(/y$/, ''))
				if(!isNaN(years)){
					return new Date(Date.now() + (31556926 * 1e3 * years)); 
				}
				const year0 = new Date('0001-01-01');
				const yearsBC = Number(input.replace(/bc$/, ''))
				if(!isNaN(yearsBC)){
					return new Date(year0.getTime() - 31556926 * 1e3 * yearsBC); 
				}
				const yearsAD = Number(input.replace(/ad$/, ''))
				if(!isNaN(yearsAD)){
					return new Date(year0.getTime() + 31556926 * 1e3 * yearsAD); 
				}
				return new Date(input);
		}
	}
	parseEvents(events: ITimelineEvent[], nestingLevel: number = 0): ITimelineEvent[] {
		if(!Array.isArray(events)){
			console.warn('Events object is not an array', events); 
			return [];
		}
		
		// Level Calculator for simultanious events
		const eventLevelMatrix = {0:0}
		const calcEventLevel = (startTime: number, endTime: number): number => {
			let maxLevel = 0;
			for(const eventLevel in eventLevelMatrix){
				if(startTime > eventLevelMatrix[eventLevel]){
					maxLevel = Number(eventLevel);
					eventLevelMatrix[maxLevel.toString()] = endTime;
					return maxLevel;
				}
			}
			maxLevel++
			eventLevelMatrix[maxLevel.toString()] = endTime;
			return maxLevel;
		}
		
		// Enrich and Reduce result
		const result = events.reduce<ITimelineEvent[]>((result, timelineEvent) => {
			// Parse children events
			const children = timelineEvent.events ? [...this.parseEvents(timelineEvent.events, nestingLevel + 1)] : []

			// Filter missing requirements
			if(!timelineEvent.startdate && !children.length) { 
				console.warn('Missing startdate on event', timelineEvent, events)
				return result;
			}

			// Calculate start date
			const startDate = timelineEvent.startdate 
				? this.parseDate(timelineEvent.startdate)
				: children[0].startdate;

			// Calculate end date
			const endDate = timelineEvent.enddate 
				? this.parseDate(timelineEvent.enddate) 
				: timelineEvent.duration && !isNaN(Number(timelineEvent.duration)) 
					? new Date(startDate.getTime() + Number(timelineEvent.duration)*6e4) 
					: children.length 
						? children[children.length-1].enddate 
						: startDate

			// Calculate duration
			const startTime = startDate.getTime()
			const endTime = endDate.getTime()
			const durationMinutes = (endTime - startTime) / 6e4;

			// Add to result
			result.push({
				duration: durationMinutes,
				...timelineEvent,
				startdate: startDate,
				enddate: endDate,
				events: children,
				nestingLevel: nestingLevel,
			});
			return result;
		}, []);

		// Sort result
		const sortedResult = result.sort((a,b)=>a.startdate.getTime() - b.startdate.getTime());

		// Add level to sorted result in order to stack simultanous events
		const levelResult = sortedResult.map((timelineEvent) => ({
			...timelineEvent, 
			level: calcEventLevel(timelineEvent.startdate.getTime(), timelineEvent.enddate.getTime())
		}));

		// Calc max level for nested events
		return levelResult.map((timelineEvent) => ({
			...timelineEvent, 
			maxLevel: timelineEvent.events.length
				? Math.max.apply(0, timelineEvent.events.map((child) => child.level))
				: 0
		}));
	}
	parseTimelineHTML(input: HTMLElement): any[] {
		// Initialize events
		let result = []
		const timelineEvents = input.querySelectorAll<HTMLElement>('.timelineEvent');
		if(timelineEvents) {
			timelineEvents
				.forEach((timelineEvent) => {
					try{
						result.push({
							...timelineEvent.attributes,
							events: this.parseTimelineHTML(timelineEvent)
						})
					} catch(error){
						console.error(error, 'timelineEvent');
					}
				})
		}
		return result;
	}
	addCSS(css: string){document.head.appendChild(document.createElement("style")).innerHTML = css}
	toJSON(){
		return {
			options: this.options,
			startDate: this.startDate,
			endDate: this.endDate,
			duration: this.duration,
			ratio: this.ratio,
			pivot: this.pivot,
			getLeftRatio: (milliseconds: number): number => {
				return (milliseconds - this.startDate.getTime()) / this.duration;
			},
		}
	}
};