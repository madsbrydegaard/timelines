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
}
interface ITimeline {
	options: ITimelineOptions;
	element: HTMLElement;
	startDate: Date;
	endDate: Date;
	ratio: number;
	pivot: number;
}
enum Direction {
	In = -1,Out = 1
}

export class Timeline implements ITimeline {
	ratio: number
	pivot: number
	options: ITimelineOptions
	element: HTMLElement
	timelineStart: Date
	timelineEnd: Date
	callback: (option: ITimeline) => void
	labelContainer: HTMLDivElement
	dividerContainer: HTMLDivElement
	constructor(element: HTMLElement | string, options: object, callback?: (option: ITimeline) => void) {
		// Handle DOM Element
		if(!element) throw new Error(`Element argument is empty. Please add DOM element | selector as first arg`);
		if (typeof element === "string") {
			const elem = document.querySelector(element) as HTMLElement;
			if (!elem) throw new Error(`Selector could not be found [${element}]`);
			this.element = elem;
		} 
		if(element instanceof Element) {
			this.element = element;
		}

		// Handle options
		this.options = {
			...{
				labelCount: 5,
				zoomSpeed: 0.025,
				dragSpeed: 0.003,
				startDate: "-100y",
				endDate: "now",
				timelineStartDate: "-1000y",
				timelineEndDate: "1000y",
				minZoom: 1,
				maxZoom: 1e11,
				position: "bottom",
			},
			...options,
		};

		// Set timeline boundaries
		this.timelineStart = this.parseDate(this.options.timelineStartDate);
		this.timelineEnd = this.parseDate(this.options.timelineEndDate);

		//Calculate view position on timeline
		const start = this.parseDate(this.options.startDate);
		const end = this.parseDate(this.options.endDate);
		const duration = end.getTime() - start.getTime();
		
		this.ratio = this.timelineDuration / duration;
		this.pivot = (this.timelineStart.getTime() - start.getTime()) / duration;
		
		// Handle DOM elements setup
		this.setupHTML();

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
	view2TimeRatio(milliseconds: number): number {
		return (milliseconds - this.start) / this.duration;
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
				if (!inDrag) {
					return;
				}
				const deltaScrollLeft = (e.pageX - dragStartX) * vm.options.dragSpeed;
				//const deltaScrollTop = (e.pageY - dragStartY) * vm.options.dragSpeed;
				vm.move(deltaScrollLeft);
				dragStartX = e.pageX;
				dragStartY = e.pageY;
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
	setupHTML(): void{
		// Empty parent container
		this.element.innerHTML = '';
		// Register parent as position = "relative" for absolute positioning to work
		this.element.style.position = "relative";
		// Register parent overflow = "hidden" to hide overflow moments
		this.element.style.overflow = "hidden";
		this.element.style.minHeight = "3rem";

		this.labelContainer = document.createElement("div");
		this.labelContainer.className = "timelineLabelContainer";
		this.labelContainer.style.width = "100%";
		this.labelContainer.style.height = "3rem";
		this.labelContainer.style.textAlign = "center";
		this.labelContainer.style.position = "absolute";
		this.labelContainer.style.zIndex = "-1";
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
		this.element.appendChild(this.labelContainer);

		this.dividerContainer = document.createElement("div");
		this.dividerContainer.className = "timelineDividerContainer";
		this.dividerContainer.style.width = "100%";
		this.dividerContainer.style.height = "100%";
		this.dividerContainer.style.position = "absolute";
		this.dividerContainer.style.zIndex = "-10";
		this.element.appendChild(this.dividerContainer);
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
			const labelViewRatio = this.view2TimeRatio(labelTime);
			const labelViewLeftPosition = labelViewRatio * 100;

			// Set divider position
			const dividerViewRatio = this.view2TimeRatio(dividerTime);
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

		// Dispatch DOM event
		const update = new CustomEvent("update", {
			detail: {timeline: this.toJSON()},
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
		date.setMonth(input[1] ? input[1] - 1 : 0);
		date.setDate(input[2] ? input[2] : 1);
		date.setHours(input[3] ? input[3] : 0);
		date.setMinutes(input[4] ? input[4] : 0);
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
				throw new Error(`'[${input}]' could not be parsed as a date`)
		}
	}
	toJSON(){
		return {
			options: this.options,
			startDate: this.startDate,
			endDate: this.endDate,
			ratio: this.ratio,
			pivot: this.pivot,
		}
	}
};