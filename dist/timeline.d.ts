declare module "dater" {
    export interface IDater {
        date: Date;
        asArray: number[];
        asMinutes: number;
        asYMDHM: string;
        asYMD: string;
        asYM: string;
        asY: string;
    }
    export class Dater implements IDater {
        constructor(input: number[] | string | number);
        date: Date;
        toJSON(): {
            date: Date;
            asMinutes: number;
        };
        parseArray: (input: number[]) => void;
        parseMinutes: (minutes: number) => void;
        parseString: (input: string) => void;
        get asArray(): number[];
        get asMinutes(): number;
        get asYMDHM(): string;
        get asYMD(): string;
        get asYM(): string;
        get asY(): string;
    }
}
declare module "timeline" {
    import { IDater, Dater } from "dater";
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
        In = -1,
        Out = 1
    }
    export class Timeline implements ITimeline {
        get timelineDurationMinutes(): number;
        get viewWidth(): number;
        get viewStartMinutes(): number;
        get viewEndMinutes(): number;
        get viewDurationMinutes(): number;
        get viewStart(): Dater;
        get viewEnd(): Dater;
        view2MinutesRatio(minutes: number): number;
        setRatio(direction: Direction, deltaRatio: number): boolean;
        setPivot(deltaPivot: number): void;
        zoom(direction: Direction, mouseX: number): void;
        move(deltaPivot: number): void;
        registerListeners(element: HTMLElement): void;
        setupHTML(): void;
        format(minutes: number): string;
        update(): void;
        constructor(element: HTMLElement | string, options: object, callback?: (option: ITimeline) => void);
        options: ITimelineOptions;
        element: HTMLElement;
        timelineStart: IDater;
        timelineEnd: IDater;
        callback: (option: ITimeline) => void;
        timelineContainer: HTMLDivElement;
        toJSON(): {
            options: ITimelineOptions;
            timelineStart: IDater;
            timelineEnd: IDater;
            timelineDurationMinutes: number;
            viewStart: Dater;
            viewEnd: Dater;
            viewDurationMinutes: number;
        };
    }
}
