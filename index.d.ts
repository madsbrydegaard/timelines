declare module "timeline.io" {
    export interface ITimelineOptions {
        labelCount?: number;
        zoomSpeed?: number;
        dragSpeed?: number;
        start?: number[] | string | number | Date;
        end?: number[] | string | number | Date;
        timelineStart?: number[] | string | number | Date;
        timelineEnd?: number[] | string | number | Date;
        minZoom?: number;
        maxZoom?: number;
        position?: string;
        eventHeight?: number;
        autoFocus?: boolean;
        defaultColor?: number[];
        classNames?: {
            timeline?: string;
            timelineEvent?: string;
            timelineEventTitle?: string;
            timelineLabels?: string;
            timelineDividers?: string;
            timelineEvents?: string;
            timelineLabel?: string;
            timelineDivider?: string;
        };
    }
    interface IMatrix {
        [key: number]: {
            height: number;
            time: number;
        };
    }
    interface ITimelineBase {
        title: string;
    }
    interface ITimelineProps {
        type?: string;
        color?: number[];
    }
    export interface ITimelineEvent extends ITimelineBase, ITimelineProps {
        start?: number[] | string | number | Date;
        end?: number[] | string | number | Date;
        duration?: number | string;
        events?: ITimelineEvent[];
    }
    interface ITimelineEventConverted extends ITimelineBase, Required<ITimelineProps> {
        startMinutes: number;
        endMinutes: number;
        durationMinutes: number;
        children: ITimelineEventConverted[];
        level: number;
        step: number;
        depth: number;
        height: number;
        score: number;
        levelMatrix?: IMatrix;
    }
    export interface ITimelineContainer {
        load: (loader: () => Promise<ITimelineEvent>) => Promise<void>;
        add: (timelineEvent: ITimelineEvent) => void;
        focus: (timelineEvent: ITimelineEventConverted, onfocus?: () => void) => void;
    }
    export const Timeline: (elementIdentifier: HTMLElement | string, settings?: ITimelineOptions) => ITimelineContainer;
}
