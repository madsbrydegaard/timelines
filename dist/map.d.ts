import { ITimelineEvent, IMapEntry } from "./timeline";
export type DemoDateInput = number | number[] | string | Date | undefined | null;
export declare const demoParseToMinutes: (input: DemoDateInput) => number | undefined;
export declare const demoClamp: (v: number, min: number, max: number) => number;
export declare const demoLerp: (a: number, b: number, t: number) => number;
export type MapType = "line" | "polygon" | null;
export declare const detectMapType: (timeline: ITimelineEvent) => MapType;
export interface Waypoint {
    minutes: number;
    coordinates: [number, number];
}
export declare const buildWaypoints: (timeline: ITimelineEvent) => Waypoint[];
export declare const buildLineCoords: (waypoints: Waypoint[], centerMinutes: number) => [number, number][];
export interface Phase {
    minutes: number;
    centerLng: number;
    centerLat: number;
    radiusLng: number;
    radiusLat: number;
}
export declare const buildPhases: (timeline: ITimelineEvent) => Phase[];
export declare const interpolatePhase: (a: Phase, b: Phase, t: number) => Phase;
export declare const getPhaseAtTime: (phases: Phase[], centerMinutes: number) => Phase | null;
export declare const ellipseCoords: (centerLng: number, centerLat: number, radiusLng: number, radiusLat: number, steps?: number) => [number, number][];
export declare const asLineFeature: (coords: [number, number][]) => {
    type: "Feature";
    properties: {};
    geometry: {
        type: "LineString";
        coordinates: [number, number][];
    };
};
export declare const asPolygonFeature: (phase: Phase) => {
    type: "Feature";
    properties: {};
    geometry: {
        type: "Polygon";
        coordinates: [number, number][][];
    };
};
export interface FlatMapEvent {
    map: IMapEntry;
    startM: number;
    endM: number;
    depth: number;
    duration: number;
}
export declare const flattenMapEvents: (events: ITimelineEvent[] | undefined, depth?: number) => FlatMapEvent[];
export declare const computeTimeRange: (timeline: ITimelineEvent) => {
    startM: number;
    endM: number;
} | null;
export declare const findMapAtTime: (allMapEvents: FlatMapEvent[], centerMinutes: number) => IMapEntry | null;
