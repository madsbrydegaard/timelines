export interface ITimelineOptions {
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
export interface ITimeline {
	options: ITimelineOptions;
	element: HTMLElement;
	startDate: Date;
	endDate: Date;
	ratio: number;
	pivot: number;
}
export enum Direction {
	In = -1,Out = 1
}