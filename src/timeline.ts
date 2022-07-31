import { IDater, dater } from "./dater.js";
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
}
interface ITimeline {
	options: ITimelineOptions;
	el: HTMLElement | undefined;
	startMoment: IDater;
	endMoment: IDater;
	timelineDurationMinutes: () => number;
	viewWidth: () => number;
	viewStartMinutes: () => number;
	viewEndMinutes: () => number;
	viewDurationMinutes: () => number;
	view2MinutesRatio: (minutes: number) => number;
	setRatio: (direction: Direction, deltaRatio: number) => void;
	setPivot: (deltaPivot: number) => void;
	zoom: (direction: Direction, mouseX: number) => void;
	move: (deltaPivot: number) => void;
	registerListeners: (element: HTMLElement) => void;
	format: (minutes: number) => string;
	update: () => void;
	initialize: (element: HTMLElement | string, options: object) => void;
}
enum Direction {
	In = -1,Out = 1
}
export const timeline: ITimeline = {
	timelineDurationMinutes() {
		return this.endMoment.inMinutes - this.startMoment.inMinutes;
	},
	viewWidth() {
		return this.el?.offsetWidth || 0;
	},
	viewStartMinutes() {
		return this.startMoment.inMinutes - this.viewDurationMinutes() * this.options.pivot;
	},
	viewEndMinutes() {
		return this.viewStartMinutes() + this.viewDurationMinutes();
	},
	viewDurationMinutes() {
		return this.timelineDurationMinutes() / this.options.ratio;
	},
	view2MinutesRatio(minutes: number) {
		return (minutes - this.viewStartMinutes()) / this.viewDurationMinutes();
	},
	setRatio(direction: Direction, deltaRatio: number) {
		let newRatio = this.options.ratio - deltaRatio;

		// If zoom OUT - test if zoom is allowed
		const ratioMin = this.options.minZoom;
		if (direction === Direction.Out && newRatio <= ratioMin) {
			newRatio = ratioMin;
		}

		// If zoom IN - test if zoom is allowed
		const ratioMax = this.options.maxZoom;
		if (direction === Direction.In && newRatio >= ratioMax) {
			newRatio = ratioMax;
		}

		this.options.ratio = newRatio;
	},
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
	},
	zoom(direction: Direction, mouseX: number) {
		this.options.mouseX = mouseX;

		// Make zoomSpeed relative to zoomLevel
		const zoomSpeedScale = this.options.zoomSpeed * this.options.ratio;
		const deltaRatio = direction * zoomSpeedScale;

		const mouseX2view = (this.options.mouseX || 0) / this.viewWidth();
		const mouseX2timeline = (mouseX2view - this.options.pivot) / this.options.ratio;
		const deltaPivot = mouseX2timeline * deltaRatio;

		this.setRatio(direction, deltaRatio);
		this.setPivot(deltaPivot);

		this.update();
	},
	move(deltaPivot: number) {
		this.setPivot(deltaPivot);
		this.update();
	},
	registerListeners(element: HTMLElement) {
		const vm: ITimeline = this;
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
	},
	format(minutes: number): string {
		const moment = dater(minutes);
		if (this.viewDurationMinutes() < 1440 * 4) {
			// minutes in an day = 1440
			return moment.asYMDHM;
		}
		if (this.viewDurationMinutes() < 10080 * 6) {
			// minutes in a week = 10080
			return moment.asYMD;
		}
		if (this.viewDurationMinutes() < 43829.0639 * 18) {
			// minutes in a month = 43829.0639
			return moment.asYM;
		}
		// minutes in a year = 525948.766
		return moment.asY;
	},
	update() {
		if (!this.el) return;
		const currentLevel = Math.floor(this.options.ratio);
		// https://math.stackexchange.com/questions/3381728/find-closest-power-of-2-to-a-specific-number
		const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
		const granularity = 1 / (this.options.labelCount + 1);
		const timelineDurationMinutesExtended = this.timelineDurationMinutes() * 1.2;
		const timelineStartMomentExtended = this.startMoment.inMinutes - this.timelineDurationMinutes() * 0.1;
		const timelineViewDifferenceMinutes = this.viewStartMinutes() - timelineStartMomentExtended;
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
			e.className = "moment";
			e.style.left = timestampViewLeftPosition + "%";
			e.style.transform = "translate(calc(-50%))";
			e.style.textAlign = "center";
			e.style.position = "absolute";
			e.style.zIndex = "-1";
			e.style.width = "54px";
			e.innerHTML = this.format(momentInMinutes);
			c.appendChild(e);
		}
		this.el.innerHTML = "";
		this.el.appendChild(c);
	},
	initialize(element: HTMLElement | string, options: object) {
		this.options = {
			...this.options,
			...options,
		};
		this.startMoment = dater(this.options.start);
		this.endMoment = dater(this.options.end);

		if (typeof element === "string") {
			const elem = document.querySelector(element) as HTMLElement;
			if (!elem) throw new Error(`Selector could not be found [${element}]`);
			this.el = elem;
		} else {
			this.el = element;
		}

		// Register parent as position = "relative" for absolute positioning to work
		this.el.style.position = "relative";
		// Register parent overflow = "hidden" to hide overflow moments
		this.el.style.overflow = "hidden";

		this.registerListeners(this.el);
		this.update();
	},
	options: {
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
	},
	el: undefined,
	startMoment: dater("-100y"),
	endMoment: dater("now"),
};

window["timeline"] = timeline;
