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
        debug: boolean;
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
        render?: (timelineEvent: ITimelineEventDetails) => HTMLDivElement;
    }
    interface ITimelineProps {
        type?: string;
        color?: number[];
        open?: boolean;
    }
    interface ITimelineEventDetails extends Required<ITimelineProps> {
        id: string;
        startMinutes: number;
        endMinutes: number;
        durationMinutes: number;
        level: number;
        step: number;
        depth: number;
        height: number;
        score: number;
        parentId?: string;
        levelMatrix: IMatrix;
        children: {
            [key: string]: ITimelineEventWithDetails;
        };
    }
    interface ITimelineEventWithDetails extends ITimelineEvent {
        timelineEventDetails: ITimelineEventDetails;
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
