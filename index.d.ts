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
        duration: number;
        ratio: number;
        pivot: number;
    }
    export interface ITimelineEvent {
        startdate: Date;
        enddate?: Date;
        duration?: number;
        title: string;
        events?: ITimelineEvent[];
    }
    enum Direction {
        In = -1,
        Out = 1
    }
    export class Timeline implements ITimeline {
        ratio: number;
        pivot: number;
        options: ITimelineOptions;
        events: ITimelineEvent[];
        element: HTMLElement;
        timelineStart: Date;
        timelineEnd: Date;
        callback: (option: ITimeline) => void;
        labelContainer: HTMLDivElement;
        dividerContainer: HTMLDivElement;
        eventsContainer: HTMLDivElement;
        constructor(element: HTMLElement | string, events: ITimelineEvent[], options: object, callback?: (timeline: ITimeline) => void);
        get timelineDuration(): number;
        get viewWidth(): number;
        get start(): number;
        get end(): number;
        get duration(): number;
        get startDate(): Date;
        get endDate(): Date;
        setRatio(direction: Direction, deltaRatio: number): boolean;
        setPivot(deltaPivot: number): void;
        zoom(direction: Direction, mouseX: number): void;
        move(deltaPivot: number): void;
        registerListeners(element: HTMLElement): void;
        setupEventsHTML(sortedEvents: any[], level?: number): void;
        setupContainerHTML(): void;
        format(milliseconds: number): string;
        update(): void;
        parseDate(input: number[] | string | number | Date): Date;
        parseDateArray(input: number[]): Date;
        parseDateString(input: string): Date;
        parseEvents(events: ITimelineEvent[]): ITimelineEvent[];
        parseTimelineHTML(input: HTMLElement): any[];
        addCSS(css: string): void;
        toJSON(): {
            options: ITimelineOptions;
            startDate: Date;
            endDate: Date;
            duration: number;
            ratio: number;
            pivot: number;
            getLeftRatio: (milliseconds: number) => number;
        };
    }
}
