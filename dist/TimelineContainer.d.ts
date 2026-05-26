import React from "react";
import type { ITimelineOptions, ITimelineEvent } from "./timelineTypes";
interface TimelineContainerProps {
    options?: ITimelineOptions;
    events?: ITimelineEvent[];
    onSelect?: (event: any) => void;
}
export declare const TimelineContainer: React.FC<TimelineContainerProps>;
export default TimelineContainer;
