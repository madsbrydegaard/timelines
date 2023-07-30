declare module "timelines" {
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
        eventSpacing?: number;
        autoZoom?: boolean;
        zoomMargin?: number;
        autoSelect?: boolean;
        defaultColor?: number[];
        zoomDuration?: number;
        easing?: string | ((time: number, start: number, change: number, duration: number) => number);
        numberOfHighscorePreviews?: number;
        highscorePreviewDelay?: number;
        highscorePreviewWidth?: number;
        classNames?: {
            timeline?: string;
            timelineEvent?: string;
            timelinePreview?: string;
            timelineEventTitle?: string;
            timelineLabels?: string;
            timelineDividers?: string;
            timelineEvents?: string;
            timelinePreviews?: string;
            timelineIo?: string;
            timelineLabel?: string;
            timelineDivider?: string;
        };
    }
    export interface ITimelineCustomEventDetails {
        name: string;
        options: ITimelineOptions;
        timelineEvent: ITimelineEventWithDetails;
        viewStartDate: string;
        viewEndDate: string;
        viewDuration: number;
        ratio: number;
        pivot: number;
    }
    interface IMatrix {
        [key: number]: {
            height: number;
            time: number;
        };
    }
    interface ITimelineBase {
        title: string;
        renderEventNode?: (timelineEvent: ITimelineEventWithDetails) => HTMLDivElement;
        renderPreviewNode?: (timelineEvent: ITimelineEventWithDetails) => HTMLDivElement;
    }
    interface ITimelineProps {
        type?: string;
        color?: number[];
        highlightedColor?: number[];
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
        timelineLevelMatrix: IMatrix;
        backgroundLevelMatrix: IMatrix;
        eventNode?: HTMLDivElement;
        previewNode?: HTMLDivElement;
        childrenByStartMinute: ITimelineEventWithDetails[];
        next?: string;
        previous?: string;
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
        add: (...timelineEvents: ITimelineEvent[]) => void;
        zoom: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onzoomend?: (timelineEvent: ITimelineEvent) => void) => void;
        focus: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onfocused?: (timelineEvent: ITimelineEvent) => void) => void;
        reset: () => void;
        select: (timelineEventIdentifier?: string) => void;
    }
    export const TimelineContainer: (elementIdentifier: HTMLElement | string, settings?: ITimelineOptions) => ITimelineContainer;
}
