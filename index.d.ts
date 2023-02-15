declare module "timeline.io" {
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
        expanded: boolean;
        wikipedia?: string;
        description?: string;
        parent?: ITimeline;
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
    export const Timeline: (elementIdentifier: HTMLElement | string, timeline: ITimelineEvent, settings: object) => {
        focus: (timelineEvent: ITimeline) => void;
    };
}
