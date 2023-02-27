declare module "timeline.io" {
    interface IMatrix {
        [key: number]: {
            height: number;
            time: number;
        };
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
        wikipedia?: string;
        description?: string;
        levelMatrix?: IMatrix;
    }
    export interface ITimelineEvent {
        title: string;
        start?: number[] | string | number | Date;
        end?: number[] | string | number | Date;
        duration?: number;
        events?: ITimelineEvent[];
        type?: string;
        color?: number[];
        wikipedia?: string;
        description?: string;
    }
    export const Timeline: (elementIdentifier: HTMLElement | string, settings: object | undefined) => {
        focus: (timelineEvent: ITimeline) => void;
        load: (loader: () => Promise<ITimelineEvent>) => Promise<void>;
        add: (timelineEvent: ITimelineEvent) => void;
        on: (eventName: string, action: (e: Event) => void) => void;
    };
}
