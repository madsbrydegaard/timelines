import { ITimelineEvent, IMapEntry } from "./timeline";

// =============================================================================
// Map Helpers & Types
// =============================================================================

// ---------------------------------------------------------------------------
// Date / time helpers (demo-local, mirrors the library's parseDateToMinutes)
// ---------------------------------------------------------------------------

export type DemoDateInput =
  | number
  | number[]
  | string
  | Date
  | undefined
  | null;

export const demoParseToMinutes = (
  input: DemoDateInput,
): number | undefined => {
  if (input === undefined || input === null) return undefined;
  if (typeof input === "number") return input;
  if (Array.isArray(input)) return undefined;
  if (input instanceof Date) return input.getTime() / 60000;
  if (typeof input !== "string") return undefined;

  const setYear = (year: number): number => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(0);
    d.setHours(0, 0, 0, 0);
    d.setFullYear(year);
    return d.getTime() / 60000;
  };

  const bcMatch = input.match(/^(\d+(?:\.\d+)?)bc$/i);
  if (bcMatch) return setYear(-parseFloat(bcMatch[1]));

  const adMatch = input.match(/^(\d+(?:\.\d+)?)ad$/i);
  if (adMatch) return setYear(parseFloat(adMatch[1]));

  const ts = Date.parse(input);
  return isNaN(ts) ? undefined : ts / 60000;
};

export const demoClamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const demoLerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

// ---------------------------------------------------------------------------
// Map type detection
// ---------------------------------------------------------------------------

export type MapType = "line" | "polygon" | null;

export const detectMapType = (timeline: ITimelineEvent): MapType => {
  const withMap = (timeline.events || []).filter((e) => e.map);
  if (!withMap.length) return null;
  const m = withMap[0].map as IMapEntry;
  if (m.lat !== undefined || m.lng !== undefined) return "line";
  if (m.centerLat !== undefined) return "polygon";
  return null;
};

// ---------------------------------------------------------------------------
// Line (waypoint) helpers
// ---------------------------------------------------------------------------

export interface Waypoint {
  minutes: number;
  coordinates: [number, number];
}

export const buildWaypoints = (timeline: ITimelineEvent): Waypoint[] =>
  (timeline.events || [])
    .filter(
      (e) => e.map && (e.map.lat !== undefined || e.map.lng !== undefined),
    )
    .map((e) => ({
      minutes: demoParseToMinutes(e.start) as number,
      coordinates: [(e.map as IMapEntry).lng!, (e.map as IMapEntry).lat!] as [
        number,
        number,
      ],
    }))
    .sort((a, b) => a.minutes - b.minutes);

export const buildLineCoords = (
  waypoints: Waypoint[],
  centerMinutes: number,
): [number, number][] => {
  if (!waypoints.length) return [];
  const first = waypoints[0];
  const last = waypoints[waypoints.length - 1];

  if (centerMinutes <= first.minutes) return [first.coordinates];
  if (centerMinutes >= last.minutes) return waypoints.map((w) => w.coordinates);

  const coords: [number, number][] = [first.coordinates];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (centerMinutes > b.minutes) {
      coords.push(b.coordinates);
      continue;
    }
    const t = demoClamp(
      (centerMinutes - a.minutes) / (b.minutes - a.minutes),
      0,
      1,
    );
    coords.push([
      demoLerp(a.coordinates[0], b.coordinates[0], t),
      demoLerp(a.coordinates[1], b.coordinates[1], t),
    ]);
    break;
  }
  return coords;
};

// ---------------------------------------------------------------------------
// Polygon (ellipse) helpers
// ---------------------------------------------------------------------------

export interface Phase {
  minutes: number;
  centerLng: number;
  centerLat: number;
  radiusLng: number;
  radiusLat: number;
}

export const buildPhases = (timeline: ITimelineEvent): Phase[] =>
  (timeline.events || [])
    .filter((e) => e.map && e.map.centerLat !== undefined)
    .map((e) => {
      const m = e.map as IMapEntry;
      return {
        minutes: demoParseToMinutes(e.start) as number,
        centerLng: m.centerLng!,
        centerLat: m.centerLat!,
        radiusLng: m.radiusLng!,
        radiusLat: m.radiusLat!,
      };
    })
    .sort((a, b) => a.minutes - b.minutes);

export const interpolatePhase = (a: Phase, b: Phase, t: number): Phase => ({
  minutes: demoLerp(a.minutes, b.minutes, t),
  centerLng: demoLerp(a.centerLng, b.centerLng, t),
  centerLat: demoLerp(a.centerLat, b.centerLat, t),
  radiusLng: demoLerp(a.radiusLng, b.radiusLng, t),
  radiusLat: demoLerp(a.radiusLat, b.radiusLat, t),
});

export const getPhaseAtTime = (
  phases: Phase[],
  centerMinutes: number,
): Phase | null => {
  if (!phases.length) return null;
  const first = phases[0];
  const last = phases[phases.length - 1];
  if (centerMinutes <= first.minutes) return first;
  if (centerMinutes >= last.minutes) return last;
  for (let i = 0; i < phases.length - 1; i++) {
    const a = phases[i];
    const b = phases[i + 1];
    if (centerMinutes <= b.minutes) {
      const t = demoClamp(
        (centerMinutes - a.minutes) / (b.minutes - a.minutes),
        0,
        1,
      );
      return interpolatePhase(a, b, t);
    }
  }
  return last;
};

export const ellipseCoords = (
  centerLng: number,
  centerLat: number,
  radiusLng: number,
  radiusLat: number,
  steps = 72,
): [number, number][] => {
  const coords: [number, number][] = [];
  for (let s = 0; s <= steps; s++) {
    const theta = (Math.PI * 2 * s) / steps;
    coords.push([
      centerLng + Math.cos(theta) * radiusLng,
      demoClamp(centerLat + Math.sin(theta) * radiusLat, -85, 85),
    ]);
  }
  return coords;
};

// ---------------------------------------------------------------------------
// GeoJSON feature builders
// ---------------------------------------------------------------------------

export const asLineFeature = (coords: [number, number][]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    // LineString requires >= 2 coordinates; duplicate the point when stationary.
    coordinates: coords.length >= 2 ? coords : coords.concat(coords),
  },
});

export const asPolygonFeature = (phase: Phase) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "Polygon" as const,
    coordinates: [
      ellipseCoords(
        phase.centerLng,
        phase.centerLat,
        phase.radiusLng,
        phase.radiusLat,
      ),
    ],
  },
});

// ---------------------------------------------------------------------------
// Event-at-time helpers
// ---------------------------------------------------------------------------

export interface FlatMapEvent {
  map: IMapEntry;
  startM: number;
  endM: number;
  depth: number;
  duration: number;
}

export const flattenMapEvents = (
  events: ITimelineEvent[] | undefined,
  depth = 0,
): FlatMapEvent[] => {
  const result: FlatMapEvent[] = [];
  for (const e of events || []) {
    if (e.map) {
      const startM = demoParseToMinutes(e.start);
      const endM = demoParseToMinutes(e.end ?? e.start);
      if (startM !== undefined && endM !== undefined) {
        result.push({
          map: e.map,
          startM,
          endM,
          depth,
          duration: Math.abs(endM - startM),
        });
      }
    }
    if (e.events?.length) result.push(...flattenMapEvents(e.events, depth + 1));
  }
  return result;
};

// Compute the overall time range (min start, max end) across all direct events.
export const computeTimeRange = (
  timeline: ITimelineEvent,
): { startM: number; endM: number } | null => {
  const mins: number[] = [];
  for (const e of timeline.events || []) {
    const s = demoParseToMinutes(e.start);
    const en = demoParseToMinutes(e.end ?? e.start);
    if (s !== undefined) mins.push(s);
    if (en !== undefined) mins.push(en);
  }
  if (!mins.length) return null;
  return { startM: Math.min(...mins), endM: Math.max(...mins) };
};

// Find the most specific event (deepest hierarchy, smallest duration) whose
// range contains centerMinutes. Returns its map entry or null.
export const findMapAtTime = (
  allMapEvents: FlatMapEvent[],
  centerMinutes: number,
): IMapEntry | null => {
  const candidates = allMapEvents.filter(
    (e) =>
      centerMinutes >= Math.min(e.startM, e.endM) &&
      centerMinutes <= Math.max(e.startM, e.endM),
  );
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.depth - a.depth || a.duration - b.duration);
  return candidates[0].map;
};
