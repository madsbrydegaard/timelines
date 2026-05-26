// --- Timeline Calculation Utilities ---
export function calcStart(
  timelineEventWithDetails: ITimelineEventWithDetails,
): number | undefined {
  const result = timelineEventWithDetails.timelineEventDetails
    .childrenByStartMinute.length
    ? Math.min(
        timelineEventWithDetails.timelineEventDetails.startMinutes ??
          Number.MAX_SAFE_INTEGER,
        timelineEventWithDetails.timelineEventDetails.childrenByStartMinute[0]
          .timelineEventDetails.startMinutes ?? Number.MAX_SAFE_INTEGER,
      )
    : timelineEventWithDetails.timelineEventDetails.startMinutes;
  return result ?? 0;
}

export function calcEnd(
  timelineEventWithDetails: ITimelineEventWithDetails,
): number {
  const result = timelineEventWithDetails.timelineEventDetails
    .childrenByStartMinute.length
    ? Math.max(
        ...timelineEventWithDetails.timelineEventDetails.childrenByStartMinute
          .map((child) => child.timelineEventDetails.endMinutes)
          .filter((v): v is number => typeof v === "number"),
        0,
      )
    : timelineEventWithDetails.timelineEventDetails.endMinutes !== undefined
      ? timelineEventWithDetails.timelineEventDetails.endMinutes
      : timelineEventWithDetails.timelineEventDetails.durationMinutes !==
            undefined &&
          timelineEventWithDetails.timelineEventDetails.startMinutes !==
            undefined
        ? timelineEventWithDetails.timelineEventDetails.startMinutes +
          timelineEventWithDetails.timelineEventDetails.durationMinutes
        : timelineEventWithDetails.timelineEventDetails.startMinutes !==
            undefined
          ? timelineEventWithDetails.timelineEventDetails.startMinutes + 1
          : 1;
  return result;
}

export function calcStartForTimeline(
  timelineEventWithDetails: ITimelineEventWithDetails,
): number | undefined {
  const timelineChildren =
    timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.filter(
      (tl) =>
        ["background"].find((ect) => ect !== tl.type) &&
        (!!tl.timelineEventDetails.hasTimelineEvents ||
          !tl.timelineEventDetails.childrenByStartMinute.length),
    );
  const result = timelineChildren.length
    ? Math.min(
        ...[
          timelineEventWithDetails.timelineEventDetails
            .startMinutesForTimelineChildren,
          timelineChildren[0].timelineEventDetails
            .startMinutesForTimelineChildren,
        ].filter((v): v is number => typeof v === "number"),
      )
    : timelineEventWithDetails.timelineEventDetails
          .startMinutesForTimelineChildren !== undefined
      ? timelineEventWithDetails.timelineEventDetails
          .startMinutesForTimelineChildren
      : timelineEventWithDetails.timelineEventDetails.startMinutes;
  return result;
}

export function calcEndForTimeline(
  timelineEventWithDetails: ITimelineEventWithDetails,
): number {
  const timelineChildren =
    timelineEventWithDetails.timelineEventDetails.childrenByStartMinute.filter(
      (tl) =>
        ["background"].find((ect) => ect !== tl.type) &&
        (!!tl.timelineEventDetails.hasTimelineEvents ||
          !tl.timelineEventDetails.childrenByStartMinute.length),
    );
  const result = timelineChildren.length
    ? Math.max(
        ...timelineChildren
          .map(
            (child) => child.timelineEventDetails.endMinutesForTimelineChildren,
          )
          .filter((v): v is number => typeof v === "number"),
        0,
      )
    : timelineEventWithDetails.timelineEventDetails
          .endMinutesForTimelineChildren !== undefined
      ? timelineEventWithDetails.timelineEventDetails
          .endMinutesForTimelineChildren
      : timelineEventWithDetails.timelineEventDetails
            .durationMinutesForTimelineChildren !== undefined &&
          timelineEventWithDetails.timelineEventDetails
            .startMinutesForTimelineChildren !== undefined
        ? timelineEventWithDetails.timelineEventDetails
            .startMinutesForTimelineChildren +
          timelineEventWithDetails.timelineEventDetails
            .durationMinutesForTimelineChildren
        : timelineEventWithDetails.timelineEventDetails.endMinutes !== undefined
          ? timelineEventWithDetails.timelineEventDetails.endMinutes
          : (timelineEventWithDetails.timelineEventDetails
              .startMinutesForTimelineChildren !== undefined
              ? timelineEventWithDetails.timelineEventDetails
                  .startMinutesForTimelineChildren
              : 0) + 1;
  return result;
}

// --- Event Parsing Utility ---
export function parseEvent(
  timelineEvent: ITimelineEvent,
  parent?: ITimelineEventWithDetails,
  options?: ITimelineOptions,
): ITimelineEventWithDetails | undefined {
  if (!timelineEvent) {
    console.warn("Event object is empty");
    return undefined;
  }
  const timelineEventType =
    timelineEvent.type || timelineEvent.start
      ? timelineEvent.type || "timeline"
      : "wrapper";
  const timelineEventWithDetails: ITimelineEventWithDetails = {
    ...timelineEvent,
    ...{
      type: timelineEventType,
      color:
        timelineEventType === "timeline"
          ? timelineEvent.color || options?.defaultColor
          : timelineEventType === "background"
            ? timelineEvent.color || options?.defaultBackgroundColor
            : undefined,
      highlightedColor:
        timelineEventType === "timeline"
          ? timelineEvent.highlightedColor || options?.defaultHighlightedColor
          : timelineEventType === "background"
            ? timelineEvent.highlightedColor ||
              options?.defaultBackgroundHightligtedColor
            : undefined,
    },
    timelineEventDetails: {
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      level: 0,
      step: timelineEvent.step || parent?.step || 0,
      score: 0,
      height: 1,
      childrenByStartMinute: [],
      depth: parent ? parent.timelineEventDetails.depth + 1 : 0,
      parentId: parent?.timelineEventDetails.id,
      startMinutes: parseDateToMinutes(timelineEvent.start) ?? 0,
      endMinutes: parseDateToMinutes(timelineEvent.end) ?? 0,
      durationMinutes: parseNumberToMinutes(timelineEvent.duration) || 0,
      timelineLevelMatrix: { 1: { height: 0, time: Number.MIN_SAFE_INTEGER } },
      backgroundLevelMatrix: {
        1: { height: 0, time: Number.MIN_SAFE_INTEGER },
      },
    },
  };
  if (
    parent &&
    timelineEventWithDetails.type === "timeline" &&
    parent.type === "wrapper"
  )
    parent.type = "container";
  if (timelineEvent.events && timelineEvent.events.length) {
    // Recursively parse children
    timelineEventWithDetails.timelineEventDetails.childrenByStartMinute =
      timelineEvent.events
        .map((tl) => parseEvent(tl, timelineEventWithDetails, options))
        .filter((tl) => !!tl) as ITimelineEventWithDetails[];
  }
  // Calculate start date - if childrenByStartMinute exists take lowest date
  timelineEventWithDetails.timelineEventDetails.startMinutes =
    calcStart(timelineEventWithDetails) ?? 0;
  timelineEventWithDetails.timelineEventDetails.startMinutesForTimelineChildren =
    calcStartForTimeline(timelineEventWithDetails);
  if (!timelineEventWithDetails.timelineEventDetails.startMinutes) {
    console.warn("Missing start property on event - skipping", timelineEvent);
    return undefined;
  }
  // Calculate end date
  timelineEventWithDetails.timelineEventDetails.endMinutes = calcEnd(
    timelineEventWithDetails,
  );
  timelineEventWithDetails.timelineEventDetails.endMinutesForTimelineChildren =
    calcEndForTimeline(timelineEventWithDetails);
  timelineEventWithDetails.timelineEventDetails.durationMinutes =
    timelineEventWithDetails.timelineEventDetails.endMinutes -
    timelineEventWithDetails.timelineEventDetails.startMinutes;
  timelineEventWithDetails.timelineEventDetails.durationMinutesForTimelineChildren =
    timelineEventWithDetails.timelineEventDetails
      .endMinutesForTimelineChildren -
    (timelineEventWithDetails.timelineEventDetails
      .startMinutesForTimelineChildren ?? 0);
  return timelineEventWithDetails;
}
// Utility functions for timeline logic migrated from index.ts
import type {
  ITimelineOptions,
  ITimelineEvent,
  ITimelineEventWithDetails,
} from "./timelineTypes";

// --- Date/Time Utilities ---
export const MINUTES_IN_DAY = 1440;
export const MINUTES_IN_WEEK = 10080;
export const MINUTES_IN_YEAR = 525948.766;
export const MINUTES_IN_MONTH = MINUTES_IN_YEAR / 12;
export const SHOW_MONTH_DURATION = MINUTES_IN_MONTH * 18;
export const SHOW_DAY_DURATION = MINUTES_IN_WEEK * 6;
export const SHOW_TIME_DURATION = MINUTES_IN_DAY * 4;

export function parseDateToMinutes(
  input: number[] | string | number | Date | undefined,
): number | undefined {
  if (input === undefined) return undefined;
  const parseDateArray = (input: number[]): number => {
    const date = new Date();
    date.setDate(input[2] ? input[2] : 1);
    date.setMonth(input[1] ? input[1] - 1 : 0);
    date.setHours(input[3] ? input[3] : 0);
    date.setMinutes(input[4] ? input[4] : 0);
    date.setSeconds(0);
    if (!input[0]) return date.getTime() / 6e4;
    if (input[0] && input[0] > -270000 && input[0] < 270000) {
      date.setFullYear(input[0]);
      return date.getTime() / 6e4;
    }
    const dateYearInMinutes = MINUTES_IN_YEAR * input[0];
    return dateYearInMinutes + date.getTime() / 6e4;
  };
  const parseDateString = (input: string): number => {
    switch (input) {
      case "now":
        return parseDateArray([]);
      default:
        const years = input.match(/y$/) ? Number(input.replace(/y$/, "")) : NaN;
        if (!isNaN(years)) return parseDateArray([years + 1970]);
        const yearsK = input.match(/K$/)
          ? Number(input.replace(/K$/, ""))
          : NaN;
        if (!isNaN(yearsK)) return parseDateArray([yearsK * 1e3]);
        const yearsM = input.match(/M$/)
          ? Number(input.replace(/M$/, ""))
          : NaN;
        if (!isNaN(yearsM)) return parseDateArray([yearsM * 1e6]);
        const yearsB = input.match(/B$/)
          ? Number(input.replace(/B$/, ""))
          : NaN;
        if (!isNaN(yearsB)) return parseDateArray([yearsB * 1e9]);
        const yearsBC = input.match(/bc$/)
          ? Number(input.replace(/bc$/, ""))
          : NaN;
        if (!isNaN(yearsBC)) return parseDateArray([-yearsBC]);
        const yearsAD = input.match(/ad$/)
          ? Number(input.replace(/ad$/, ""))
          : NaN;
        if (!isNaN(yearsAD)) return parseDateArray([yearsAD]);
        const minutes = Number(input);
        if (!isNaN(minutes)) return new Date().getTime() / 6e4 + minutes * 6e4;
        const timestamp = Date.parse(input);
        if (isNaN(timestamp)) return new Date().getTime() / 6e4;
        return timestamp / 6e4;
    }
  };
  if (Array.isArray(input)) {
    let inputArray = input as number[];
    if (inputArray.length === 0)
      throw new Error("argument Array cannot be empty");
    const isNumberArray = inputArray.every(
      (value) => typeof value === "number",
    );
    if (!isNumberArray)
      throw new Error("input Array must contain only numbers");
    return parseDateArray(inputArray);
  }
  if (typeof input === "object" && input.constructor.name === "Date") {
    return input.getTime() / 6e4;
  }
  if (typeof input === "string") {
    return parseDateString(input);
  }
  if (typeof input === "number") {
    return new Date(input).getTime() / 6e4;
  }
  return undefined;
}

export function parseNumberToMinutes(
  input: string | number | undefined,
): number | undefined {
  if (input === undefined) return undefined;
  if (typeof input === "string") {
    const seconds = input.match(/s$/) ? Number(input.replace(/s$/, "")) : NaN;
    if (!isNaN(seconds)) return seconds / 60;
    const hours = input.match(/H$/) ? Number(input.replace(/H$/, "")) : NaN;
    if (!isNaN(hours)) return hours * 60;
    const days = input.match(/d$/) ? Number(input.replace(/d$/, "")) : NaN;
    if (!isNaN(days)) return days * 24 * 60;
    const weeks = input.match(/w$/) ? Number(input.replace(/w$/, "")) : NaN;
    if (!isNaN(weeks)) return weeks * 7 * 24 * 60;
    const years = input.match(/y$/) ? Number(input.replace(/y$/, "")) : NaN;
    if (!isNaN(years)) return years * MINUTES_IN_YEAR;
    const yearsK = input.match(/K$/) ? Number(input.replace(/K$/, "")) : NaN;
    if (!isNaN(yearsK)) return yearsK * MINUTES_IN_YEAR * 1e3;
    const yearsM = input.match(/M$/) ? Number(input.replace(/M$/, "")) : NaN;
    if (!isNaN(yearsM)) return yearsM * MINUTES_IN_YEAR * 1e6;
    const yearsB = input.match(/B$/) ? Number(input.replace(/B$/, "")) : NaN;
    if (!isNaN(yearsB)) return yearsB * MINUTES_IN_YEAR * 1e9;
    const minutes = Number(input);
    if (!isNaN(minutes)) return minutes;
  }
  if (typeof input === "number") return input;
  return undefined;
}
