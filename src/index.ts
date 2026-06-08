import {
  ITimelineEvent,
  ITimelineOptions,
  ITimelineCustomEventDetails,
  TimelineContainer,
} from "./timeline";

import {
  detectMapType,
  computeTimeRange,
  buildWaypoints,
  buildPhases,
  flattenMapEvents,
  buildLineCoords,
  asLineFeature,
  getPhaseAtTime,
  asPolygonFeature,
  findMapAtTime,
  demoParseToMinutes,
} from "./map";

import { initWiki } from "./wiki";

// =============================================================================
// Map / demo runtime
// =============================================================================

// MapLibre GL is loaded via CDN <script> tag in the HTML.
declare const maplibregl: any;

interface TimelineData extends ITimelineEvent {
  id: string;
}

interface ISettings {
  timelineStart?: ITimelineOptions["timelineStart"];
  timelineEnd?: ITimelineOptions["timelineEnd"];
  timelines: string[];
}

// Recursively collect all event start/end minutes for fallback bounds calculation.
const collectEventMinutes = (
  events: ITimelineEvent[] | undefined,
): number[] => {
  const minutes: number[] = [];
  for (const e of events || []) {
    const startM = demoParseToMinutes(e.start);
    const endM = demoParseToMinutes(e.end ?? e.start);
    if (startM !== undefined) minutes.push(startM);
    if (endM !== undefined) minutes.push(endM);
    if (e.events?.length) minutes.push(...collectEventMinutes(e.events));
  }
  return minutes;
};

const init = async () => {
  const timelineContainer = document.querySelector<HTMLElement>("#timeline");
  const mapContainer = document.querySelector<HTMLElement>("#map");
  const wikiContainer = document.querySelector<HTMLElement>("#wiki");
  if (!timelineContainer || !mapContainer || !wikiContainer) return;

  initWiki(wikiContainer, timelineContainer);

  const settings: ISettings = await fetch("./src/settings.json").then((r) =>
    r.json(),
  );

  const timelinesData: TimelineData[] = await Promise.all(
    settings.timelines.map((url) => fetch(url).then((r) => r.json())),
  );

  const lineTimelines = timelinesData
    .filter((tl) => detectMapType(tl) === "line")
    .map((tl) => {
      const range = computeTimeRange(tl);
      return {
        ...tl,
        waypoints: buildWaypoints(tl),
        startM: range?.startM ?? 0,
        endM: range?.endM ?? 0,
      };
    });

  const polygonTimelines = timelinesData
    .filter((tl) => detectMapType(tl) === "polygon")
    .map((tl) => {
      const range = computeTimeRange(tl);
      return {
        ...tl,
        phases: buildPhases(tl),
        startM: range?.startM ?? 0,
        endM: range?.endM ?? 0,
      };
    });

  const allMapEvents = timelinesData.flatMap((tl) =>
    flattenMapEvents(tl.events),
  );

  const map = new maplibregl.Map({
    container: mapContainer,
    style: "https://demotiles.maplibre.org/globe.json",
    center: [0, 30],
    zoom: 1.5,
    projection: "globe",
  });

  // Tracks the most recent timeline view state so the map can sync when ready.
  let lastKnownCenter: number | undefined;
  let lastKnownViewStart: number | undefined;
  let lastKnownViewEnd: number | undefined;

  const lineMarkers: Record<string, any> = {};
  for (const lt of lineTimelines) {
    const el = document.createElement("div");
    el.className = "voyage-marker";
    const marker = new maplibregl.Marker({ element: el, anchor: "center" });
    if (lt.waypoints.length) {
      marker.setLngLat(lt.waypoints[0].coordinates).addTo(map);
    }
    lineMarkers[lt.id] = marker;
  }

  let mapReady = false;

  const renderAll = (
    centerMinutes: number,
    viewStart: number,
    viewEnd: number,
  ) => {
    if (!mapReady) return;

    for (const lt of lineTimelines) {
      const visible = centerMinutes >= lt.startM && centerMinutes <= lt.endM;
      const visibility = visible ? "visible" : "none";
      map.setLayoutProperty(`line-glow-${lt.id}`, "visibility", visibility);
      map.setLayoutProperty(`line-stroke-${lt.id}`, "visibility", visibility);
      const markerEl = lineMarkers[lt.id]?.getElement() as
        | HTMLElement
        | undefined;
      if (markerEl) markerEl.style.display = visible ? "" : "none";
      if (visible) {
        const coords = buildLineCoords(lt.waypoints, centerMinutes);
        map.getSource(`line-${lt.id}`)?.setData(asLineFeature(coords));
        if (coords.length) {
          lineMarkers[lt.id]?.setLngLat(coords[coords.length - 1]);
        }
      }
    }

    for (const pt of polygonTimelines) {
      const visible = centerMinutes >= pt.startM && centerMinutes <= pt.endM;
      const visibility = visible ? "visible" : "none";
      map.setLayoutProperty(`polygon-fill-${pt.id}`, "visibility", visibility);
      map.setLayoutProperty(
        `polygon-outline-${pt.id}`,
        "visibility",
        visibility,
      );
      if (visible) {
        const phase = getPhaseAtTime(pt.phases, centerMinutes);
        if (phase) {
          map.getSource(`polygon-${pt.id}`)?.setData(asPolygonFeature(phase));
        }
      }
    }
  };

  map.on("load", () => {
    for (const lt of lineTimelines) {
      const initial = asLineFeature(
        lt.waypoints.length
          ? [lt.waypoints[0].coordinates, lt.waypoints[0].coordinates]
          : [
              [0, 0],
              [0, 0],
            ],
      );
      map.addSource(`line-${lt.id}`, { type: "geojson", data: initial });
      map.addLayer({
        id: `line-glow-${lt.id}`,
        type: "line",
        source: `line-${lt.id}`,
        paint: {
          "line-color": "rgba(255,255,255,0.28)",
          "line-width": 7,
          "line-blur": 1,
        },
      });
      map.addLayer({
        id: `line-stroke-${lt.id}`,
        type: "line",
        source: `line-${lt.id}`,
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#f8b84e", "line-width": 4 },
      });
    }

    for (const pt of polygonTimelines) {
      const initial = pt.phases.length
        ? asPolygonFeature(pt.phases[0])
        : asPolygonFeature({
            minutes: 0,
            centerLng: 0,
            centerLat: 0,
            radiusLng: 0.1,
            radiusLat: 0.1,
          });
      map.addSource(`polygon-${pt.id}`, { type: "geojson", data: initial });
      map.addLayer({
        id: `polygon-fill-${pt.id}`,
        type: "fill",
        source: `polygon-${pt.id}`,
        paint: { "fill-color": "#c99a3d", "fill-opacity": 0.42 },
      });
      map.addLayer({
        id: `polygon-outline-${pt.id}`,
        type: "line",
        source: `polygon-${pt.id}`,
        layout: { "line-join": "round" },
        paint: { "line-color": "#7d3f00", "line-width": 2.5 },
      });
    }

    mapReady = true;

    // Sync map to wherever the timeline auto-focused while the map was loading.
    if (lastKnownCenter !== undefined) {
      flyToPosition(lastKnownCenter, 0);
      if (lastKnownViewStart !== undefined && lastKnownViewEnd !== undefined) {
        renderAll(lastKnownCenter, lastKnownViewStart, lastKnownViewEnd);
      }
    }
  });

  // Compute overall scroll boundaries: use settings values when present,
  // otherwise fall back to the outer bounds of all timeline events.
  let timelineStart: ITimelineOptions["timelineStart"] = settings.timelineStart;
  let timelineEnd: ITimelineOptions["timelineEnd"] = settings.timelineEnd;

  if (!timelineStart || !timelineEnd) {
    const allMinutes = timelinesData.flatMap((tl) =>
      collectEventMinutes(tl.events),
    );
    if (allMinutes.length) {
      if (!timelineStart) timelineStart = Math.min(...allMinutes);
      if (!timelineEnd) timelineEnd = Math.max(...allMinutes);
    }
  }

  const timelineOptions: ITimelineOptions = {
    autoSelect: true,
    autoFocusOnTimelineAdd: true,
    autoZoom: true,
    includeBackgroundOnAutoFocus: true,
    labelCount: 8,
    timelineStart,
    timelineEnd,
    showCenterMarker: true,
    showCenterLabel: true,
  };

  const flyToPosition = (centerMinutes: number, duration = 800) => {
    if (!mapReady || !timelineOptions.autoZoom) return;

    const mapEntry = findMapAtTime(allMapEvents, centerMinutes);
    if (!mapEntry) return;

    if (mapEntry.centerLat !== undefined && mapEntry.centerLng !== undefined) {
      const { centerLng, centerLat, radiusLng = 0, radiusLat = 0 } = mapEntry;
      map.fitBounds(
        [
          [centerLng - radiusLng, centerLat - radiusLat],
          [centerLng + radiusLng, centerLat + radiusLat],
        ],
        { padding: 60, duration },
      );
    } else if (mapEntry.lat !== undefined && mapEntry.lng !== undefined) {
      map.flyTo({ center: [mapEntry.lng, mapEntry.lat], duration });
    }
  };

  const timeline = TimelineContainer(timelineContainer, timelineOptions);

  timelineContainer.addEventListener("update.tl.container", (e) => {
    const detail = (e as CustomEvent<ITimelineCustomEventDetails>).detail;
    lastKnownCenter = detail.viewCenterMinutes;
    lastKnownViewStart = detail.viewStartMinutes;
    lastKnownViewEnd = detail.viewEndMinutes;
    renderAll(
      detail.viewCenterMinutes,
      detail.viewStartMinutes,
      detail.viewEndMinutes,
    );
  });

  timelineContainer.addEventListener("drag.tl.container", (e) => {
    flyToPosition(
      (e as CustomEvent<ITimelineCustomEventDetails>).detail.viewCenterMinutes,
    );
  });

  timelineContainer.addEventListener("selected.tl.event", (e) => {
    const detail = (e as CustomEvent<ITimelineCustomEventDetails>).detail;
    if (!mapReady || !timelineOptions.autoZoom) return;
    const mapEntry = detail.timelineEvent?.map;
    if (!mapEntry) return;

    if (mapEntry.centerLat !== undefined && mapEntry.centerLng !== undefined) {
      const { centerLng, centerLat, radiusLng = 0, radiusLat = 0 } = mapEntry;
      map.fitBounds(
        [
          [centerLng - radiusLng, centerLat - radiusLat],
          [centerLng + radiusLng, centerLat + radiusLat],
        ],
        { padding: 60, duration: 800 },
      );
    } else if (mapEntry.lat !== undefined && mapEntry.lng !== undefined) {
      map.flyTo({ center: [mapEntry.lng, mapEntry.lat], duration: 800 });
    }
  });

  // Add all timelines, then select the first one so the timeline and map
  // both focus on it.
  for (const tl of timelinesData) {
    timeline.add(tl);
  }

  if (timelinesData.length) {
    timeline.select(timelinesData[0].title);
  }
};

init();
