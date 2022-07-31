declare module "dater" {
    export interface IDater {
        date: Date;
        asArray: number[];
        inMinutes: number;
        asYMDHM: string;
        asYMD: string;
        asYM: string;
        asY: string;
    }
    export class Dater implements IDater {
        constructor(input: number[] | string | number);
        date: Date;
        parseArray: (input: number[]) => void;
        parseMinutes: (minutes: number) => void;
        parseString: (input: string) => void;
        get asArray(): number[];
        get inMinutes(): number;
        get asYMDHM(): string;
        get asYMD(): string;
        get asYM(): string;
        get asY(): string;
    }
}
declare module "timeline" {
    import { IDater } from "dater";
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
    }
    enum Direction {
        In = -1,
        Out = 1
    }
    export class Timeline implements ITimeline {
        timelineDurationMinutes(): number;
        viewWidth(): number;
        viewStartMinutes(): number;
        viewEndMinutes(): number;
        viewDurationMinutes(): number;
        view2MinutesRatio(minutes: number): number;
        setRatio(direction: Direction, deltaRatio: number): void;
        setPivot(deltaPivot: number): void;
        zoom(direction: Direction, mouseX: number): void;
        move(deltaPivot: number): void;
        registerListeners(element: HTMLElement): void;
        setupHTML(): void;
        format(minutes: number): string;
        update(): void;
        constructor(element: HTMLElement | string, options: object, callback?: (option: ITimelineOptions) => void);
        options: ITimelineOptions;
        element: HTMLElement;
        startMoment: IDater;
        endMoment: IDater;
        callback: (option: ITimelineOptions) => void;
        timelineContainer: HTMLDivElement;
    }
}
