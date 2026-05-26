import React, { useRef, useEffect, useState, useMemo } from "react";
import type { ITimelineOptions, ITimelineEvent } from "./timelineTypes";
import { parseEvent } from "./timelineUtils";

interface TimelineContainerProps {
  options?: ITimelineOptions;
  events?: ITimelineEvent[];
  onSelect?: (event: any) => void;
}

export const TimelineContainer: React.FC<TimelineContainerProps> = ({
  options,
  events,
  onSelect,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [timelineEvents, setTimelineEvents] = useState<ITimelineEvent[]>(
    events || [],
  );
  const [rootTimeline, setRootTimeline] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!timelineEvents.length) return;
    const root = parseEvent(
      {
        title: "View",
        type: "container",
        start: options?.start,
        end: options?.end,
        events: timelineEvents,
      },
      undefined,
      options,
    );
    setRootTimeline(root);
  }, [timelineEvents, options]);

  // Timeline boundaries and ratios
  const timelineStart = useMemo(
    () => rootTimeline?.timelineEventDetails?.startMinutes ?? 0,
    [rootTimeline],
  );
  const timelineEnd = useMemo(
    () => rootTimeline?.timelineEventDetails?.endMinutes ?? 1,
    [rootTimeline],
  );
  const timelineDuration = timelineEnd - timelineStart;
  const labelCount = options?.labelCount ?? 5;

  // Calculate label and divider positions
  const labels = useMemo(() => {
    if (!rootTimeline) return [];
    const granularity = 1 / (labelCount + 1);
    const timestampDistance = timelineDuration * granularity;
    const arr: { label: string; left: number }[] = [];
    for (let i = 0; i < labelCount + 2; i++) {
      const labelTime =
        (i + 1) * timestampDistance + timelineStart - timestampDistance;
      const labelViewLeftPosition =
        ((labelTime - timelineStart) / timelineDuration) * 100;
      arr.push({
        label: labelTime.toFixed(0),
        left: labelViewLeftPosition,
      });
    }
    return arr;
  }, [rootTimeline, labelCount, timelineDuration, timelineStart]);

  const dividers = useMemo(() => {
    if (!rootTimeline) return [];
    const granularity = 1 / (labelCount + 1);
    const timestampDistance = timelineDuration * granularity;
    const arr: { left: number }[] = [];
    for (let i = 0; i < labelCount + 2; i++) {
      const dividerTime =
        (i + 1) * timestampDistance +
        timelineStart -
        timestampDistance +
        timestampDistance / 2;
      const dividerViewLeftPosition =
        ((dividerTime - timelineStart) / timelineDuration) * 100;
      arr.push({
        left: dividerViewLeftPosition,
      });
    }
    return arr;
  }, [rootTimeline, labelCount, timelineDuration, timelineStart]);

  // Helper: Render timeline events recursively with selection
  const TimelineEvents = ({
    parentEvent,
    timelineDuration,
    timelineStart,
    options,
    selectedId,
    onSelect,
  }: {
    parentEvent: any;
    timelineDuration: number;
    timelineStart: number;
    options?: ITimelineOptions;
    selectedId?: string | null;
    onSelect?: (event: any) => void;
  }) => {
    if (!parentEvent?.timelineEventDetails?.childrenByStartMinute) return null;
    return (
      <>
        {parentEvent.timelineEventDetails.childrenByStartMinute.map(
          (timelineEvent: any, idx: number) => {
            if (
              timelineEvent.timelineEventDetails.startMinutes >=
                timelineStart + timelineDuration ||
              timelineEvent.timelineEventDetails.endMinutes <= timelineStart
            ) {
              return null;
            }
            const leftRatio =
              ((timelineEvent.timelineEventDetails.startMinutes -
                timelineStart) /
                timelineDuration) *
              100;
            const widthRatio =
              (timelineEvent.timelineEventDetails.durationMinutes /
                timelineDuration) *
              100;
            const levelFactor =
              (timelineEvent.timelineEventDetails.level - 1) *
                (options?.eventHeight ?? 5) +
              timelineEvent.timelineEventDetails.level *
                (options?.eventSpacing ?? 3);
            const color =
              timelineEvent.color || options?.defaultColor || "#aaa";
            const highlightedColor =
              timelineEvent.highlightedColor ||
              options?.defaultHighlightedColor ||
              "#444";
            const isSelected =
              selectedId === timelineEvent.timelineEventDetails.id;
            return (
              <div
                key={timelineEvent.timelineEventDetails.id}
                className={options?.classNames?.timelineEvent || "tl__event"}
                style={{
                  position: "absolute",
                  left: `${leftRatio}%`,
                  width: `${widthRatio}%`,
                  minWidth: 5,
                  bottom: `${levelFactor}px`,
                  minHeight: options?.eventHeight ?? 5,
                  background: isSelected ? highlightedColor : color,
                  borderRadius: 5,
                  cursor: "pointer",
                  boxSizing: "border-box",
                  overflow: "hidden",
                  outline: isSelected ? "2px solid #222" : undefined,
                  zIndex: isSelected ? 2 : 1,
                  transition: "background 0.2s, outline 0.2s",
                }}
                title={timelineEvent.title}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelect) onSelect(timelineEvent);
                }}
              >
                <div
                  className={
                    options?.classNames?.timelineEventTitle ||
                    "tl__event__title"
                  }
                  style={{ fontSize: "small", padding: 2 }}
                >
                  {timelineEvent.title}
                </div>
                {timelineEvent.timelineEventDetails.childrenByStartMinute
                  ?.length > 0 && (
                  <TimelineEvents
                    parentEvent={timelineEvent}
                    timelineDuration={timelineDuration}
                    timelineStart={timelineStart}
                    options={options}
                    selectedId={selectedId}
                    onSelect={onSelect}
                  />
                )}
              </div>
            );
          },
        )}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="tl"
      style={{ position: "relative", overflow: "hidden", minHeight: "3rem" }}
    >
      {/* Labels */}
      <div
        className="tl__labels"
        style={{
          width: "100%",
          height: 50,
          textAlign: "center",
          position: "absolute",
          pointerEvents: "none",
          userSelect: "none",
          bottom: options?.position === "top" ? undefined : 0,
          top: options?.position === "top" ? 0 : undefined,
        }}
      >
        {labels.map((l, i) => (
          <div
            key={i}
            className="tl__label"
            style={{
              left: `${l.left}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              position: "absolute",
              zIndex: -1,
              width: `${100 / (labelCount + 2)}%`,
              fontSize: "small",
            }}
          >
            {l.label}
          </div>
        ))}
      </div>
      {/* Dividers */}
      <div
        className="tl__dividers"
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          zIndex: -2,
          bottom: 0,
        }}
      >
        {dividers.map((d, i) => (
          <div
            key={i}
            className="tl__divider"
            style={{
              left: `${d.left}%`,
              textAlign: "center",
              position: "absolute",
              height: "100%",
              zIndex: -10,
            }}
          />
        ))}
      </div>
      {/* Events, Previews, IO containers (to be implemented) */}
      <div
        className="tl__events"
        style={{
          position: "absolute",
          bottom: 50,
          height: "calc(100% - 50px)",
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {rootTimeline && (
          <TimelineEvents
            parentEvent={rootTimeline}
            timelineDuration={timelineDuration}
            timelineStart={timelineStart}
            options={options}
            selectedId={selectedId}
            onSelect={(event) => {
              setSelectedId(event.timelineEventDetails.id);
              if (typeof onSelect === "function") onSelect(event);
            }}
          />
        )}
      </div>
      <div
        className="tl__previews"
        style={{
          position: "absolute",
          bottom: 50,
          height: "calc(100% - 50px)",
          width: "100%",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      />
      <div
        className="tl__io"
        style={{ position: "absolute", bottom: 0, top: 0, width: "100%" }}
      />
    </div>
  );
};

export default TimelineContainer;
