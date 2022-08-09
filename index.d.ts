declare module "timeline.io" {
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
        In = -1,
        Out = 1
    }
    export class Timeline implements ITimeline {
        ratio: number;
        pivot: number;
        options: ITimelineOptions;
        element: HTMLElement;
        timelineStart: Date;
        timelineEnd: Date;
        callback: (option: ITimeline) => void;
        labelContainer: HTMLDivElement;
        dividerContainer: HTMLDivElement;
        constructor(element: HTMLElement | string, options: object, callback?: (option: ITimeline) => void);
        get timelineDuration(): number;
        get viewWidth(): number;
        get start(): number;
        get end(): number;
        get duration(): number;
        get startDate(): Date;
        get endDate(): Date;
        view2TimeRatio(milliseconds: number): number;
        setRatio(direction: Direction, deltaRatio: number): boolean;
        setPivot(deltaPivot: number): void;
        zoom(direction: Direction, mouseX: number): void;
        move(deltaPivot: number): void;
        registerListeners(element: HTMLElement): void;
        setupHTML(): void;
        format(milliseconds: number): string;
        update(): void;
        parseDate(input: number[] | string | number | Date): Date;
        parseDateArray(input: number[]): Date;
        parseDateString(input: string): Date;
        toJSON(): {
            options: ITimelineOptions;
            startDate: Date;
            endDate: Date;
            ratio: number;
            pivot: number;
        };
    }
}
