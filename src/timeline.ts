import { IDater, Dater } from "./dater.js";
interface ITimelineOptions {
	labelCount: number;
	ratio: number;
	pivot: number;
	zoomSpeed: number;
	dragSpeed: number;
	start: string | number[];
	end: string | number[];
	minZoom: number;
	maxZoom: number;
	mouseX: number;
	position: string;
}
interface ITimeline {
	options: ITimelineOptions;
	element: HTMLElement | undefined;
	timelineStart: IDater;
	timelineEnd: IDater;
	timelineDurationMinutes: number;
	viewStart: IDater;
	viewEnd: IDater;
	viewDurationMinutes: number;
}
enum Direction {
	In = -1,Out = 1
}
export class Timeline implements ITimeline {
	get timelineDurationMinutes() {
		return this.timelineEnd.asMinutes - this.timelineStart.asMinutes;
	}
	get viewWidth() {
		return this.element?.offsetWidth || 0;
	}
	get viewStartMinutes() {
		return this.timelineStart.asMinutes - this.viewDurationMinutes * this.options.pivot;
	}
	get viewEndMinutes() {
		return this.viewStartMinutes + this.viewDurationMinutes;
	}
	get viewDurationMinutes() {
		return this.timelineDurationMinutes / this.options.ratio;
	}
	get viewStart() {
		return new Dater(this.viewStartMinutes);
	}
	get viewEnd() {
		return new Dater(this.viewEndMinutes);
	}
	view2MinutesRatio(minutes: number) {
		return (minutes - this.viewStartMinutes) / this.viewDurationMinutes;
	}
	setRatio(direction: Direction, deltaRatio: number): boolean {
		let newRatio = this.options.ratio - deltaRatio;

		// If zoom OUT - test if zoom is allowed
		const ratioMin = this.options.minZoom;
		if (direction === Direction.Out && newRatio <= ratioMin) {
			//this.options.ratio = ratioMin;
			return false;
		}

		// If zoom IN - test if zoom is allowed
		const ratioMax = this.options.maxZoom;
		if (direction === Direction.In && newRatio >= ratioMax) {
			//this.options.ratio = ratioMax;
			return false;
		}

		this.options.ratio = newRatio;
		return true;
	}
	setPivot(deltaPivot: number) {
		let newPivot = this.options.pivot + deltaPivot;

		if (newPivot >= 0) {
			// pivot larger than allowed (too much to the right)
			newPivot = 0;
		}

		if (newPivot + this.options.ratio <= 1) {
			// pivot smaller than allowed (too much to the left)
			newPivot = 1 - this.options.ratio;
		}

		this.options.pivot = newPivot;
	}
	zoom(direction: Direction, mouseX: number) {
		this.options.mouseX = mouseX;

		// Make zoomSpeed relative to zoomLevel
		const zoomSpeedScale = this.options.zoomSpeed * this.options.ratio;
		const deltaRatio = direction * zoomSpeedScale;

		const mouseX2view = (this.options.mouseX || 0) / this.viewWidth;
		const mouseX2timeline = (mouseX2view - this.options.pivot) / this.options.ratio;
		const deltaPivot = mouseX2timeline * deltaRatio;

		if(this.setRatio(direction, deltaRatio))
			this.setPivot(deltaPivot);

		this.update();
	}
	move(deltaPivot: number) {
		this.setPivot(deltaPivot);
		this.update();
	}
	registerListeners(element: HTMLElement) {
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
	setupHTML(){
		// Register parent as position = "relative" for absolute positioning to work
		this.element.style.position = "relative";
		// Register parent overflow = "hidden" to hide overflow moments
		this.element.style.overflow = "hidden";

		this.timelineContainer = document.createElement("div");
		this.timelineContainer.className = "timelineContainer";
		this.timelineContainer.style.width = "100%";
		this.timelineContainer.style.height = "3rem";
		this.timelineContainer.style.textAlign = "center";
		this.timelineContainer.style.position = "absolute";
		this.timelineContainer.style.zIndex = "-1";
		switch(this.options.position){
			case "top":
				this.timelineContainer.style.top = "0";
				break;
			default:
				this.timelineContainer.style.bottom = "0";
		}
		this.element.appendChild(this.timelineContainer);
	}
	format(minutes: number): string {
		const moment = new Dater(minutes);
		if (this.viewDurationMinutes < 1440 * 4) {
			// minutes in an day = 1440
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "numeric",
			}).format(moment.date);
		}
		if (this.viewDurationMinutes < 10080 * 6) {
			// minutes in a week = 10080
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(moment.date);
		}
		if (this.viewDurationMinutes < 43829.0639 * 18) {
			// minutes in a month = 43829.0639
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
			}).format(moment.date);
		}
		// minutes in a year = 525948.766
		return moment.date.getFullYear().toString();
	}
	update() {
		if (!this.element) return;
		const currentLevel = Math.floor(this.options.ratio);
		// https://math.stackexchange.com/questions/3381728/find-closest-power-of-2-to-a-specific-number
		const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
		const granularity = 1 / (this.options.labelCount + 1);
		const timelineDurationMinutesExtended = this.timelineDurationMinutes * 1.2;
		const timelineStartMomentExtended = this.timelineStart.asMinutes - this.timelineDurationMinutes * 0.1;
		const timelineViewDifferenceMinutes = this.viewStartMinutes - timelineStartMomentExtended;
		const timestampDistanceMinutes = timelineDurationMinutesExtended * granularity;

		const currentTimestampDistanceByLevelMinutes = timestampDistanceMinutes / iterator;

		// Find integer value of timestamp difference
		const integerDifFraction = Math.floor(timelineViewDifferenceMinutes / currentTimestampDistanceByLevelMinutes);
		const currentDifInMinutes = integerDifFraction * currentTimestampDistanceByLevelMinutes;

		const c = document.createDocumentFragment();
		for (let i = 0; i < this.options.labelCount + 2; i++) {
			const momentInMinutes =
				(i + 1) * currentTimestampDistanceByLevelMinutes + timelineStartMomentExtended + currentDifInMinutes - currentTimestampDistanceByLevelMinutes;

			// Set left position
			const timestampViewRatio = this.view2MinutesRatio(momentInMinutes);
			const timestampViewLeftPosition = timestampViewRatio * 100;

			const e = document.createElement("div");
			e.className = "timelineLabel";
			e.style.left = timestampViewLeftPosition + "%";
			e.style.top = "50%";
			e.style.transform = "translate(calc(-50%), calc(-50%))";
			e.style.textAlign = "center";
			e.style.position = "absolute";
			e.style.zIndex = "-1";
			e.style.width = granularity * 100 + "%";
			e.innerHTML = this.format(momentInMinutes);
			c.appendChild(e);
		}
		this.timelineContainer.innerHTML = "";
		this.timelineContainer.appendChild(c);

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
				ratio: 1,
				pivot: 0,
				zoomSpeed: 0.025,
				dragSpeed: 0.003,
				start: "-100y",
				end: "now",
				minZoom: 1,
				maxZoom: 100000,
				mouseX: 0,
				position: "bottom",
			},
			...options,
		};

		// Handle start and end moments
		this.timelineStart = new Dater(this.options.start);
		this.timelineEnd = new Dater(this.options.end);

		// Handle DOM elements setup
		this.setupHTML();

		// Register Mouse and Resize event handlers
		this.registerListeners(this.element);

		// Register callback
		this.callback = callback;

		// Draw
		this.update();
	}
	options: ITimelineOptions
	element: HTMLElement
	timelineStart: IDater
	timelineEnd: IDater
	callback: (option: ITimeline) => void
	timelineContainer: HTMLDivElement
	toJSON(){
		return {
			options: this.options,
			timelineStart: this.timelineStart,
			timelineEnd: this.timelineEnd,
			timelineDurationMinutes: this.timelineDurationMinutes,
			viewStart: this.viewStart,
			viewEnd: this.viewEnd,
			viewDurationMinutes: this.viewDurationMinutes,
		}
	}
};
