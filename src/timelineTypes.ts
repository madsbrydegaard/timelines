import type {
  ITimelineOptions,
  ITimelineEvent,
  ITimelineCustomEventDetails,
  ITimelineContainer,
} from "./index";

export interface ITimelineEventDetails {
  id: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  startMinutesForTimelineChildren?: number;
  endMinutesForTimelineChildren?: number;
  durationMinutesForTimelineChildren?: number;
  level: number;
  step: number;
  depth: number;
  height: number;
  score: number;
  parentId?: string;
  timelineLevelMatrix: any;
  backgroundLevelMatrix: any;
  eventNode?: HTMLDivElement;
  previewNode?: HTMLDivElement;
  childrenByStartMinute: ITimelineEventWithDetails[];
  next?: string;
  previous?: string;
  hasTimelineEvents?: boolean;
}

export interface ITimelineEventWithDetails extends ITimelineEvent {
  timelineEventDetails: ITimelineEventDetails;
}

export type {
  ITimelineOptions,
  ITimelineEvent,
  ITimelineCustomEventDetails,
  ITimelineContainer,
};
