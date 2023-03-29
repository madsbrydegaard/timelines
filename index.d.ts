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
        autoZoom?: boolean;
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
    interface ITimelineBase {
        title: string;
    }
    interface ITimelineProps {
        type?: string;
        color?: number[];
        open?: boolean;
    }
    export interface ITimelineEvent extends ITimelineBase, ITimelineProps {
        start?: number[] | string | number | Date;
        end?: number[] | string | number | Date;
        duration?: number | string;
        events?: ITimelineEvent[];
    }
    export interface ITimelineContainer {
        load: (loader: () => Promise<ITimelineEvent>) => Promise<void>;
        add: (timelineEvent: ITimelineEvent) => void;
        zoom: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onzoomend?: (timelineEvent: ITimelineEvent) => void) => void;
        focus: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onfocused?: (timelineEvent: ITimelineEvent) => void) => void;
        reset: () => void;
    }
    export const Timeline: (elementIdentifier: HTMLElement | string, settings?: ITimelineOptions) => ITimelineContainer;
}
