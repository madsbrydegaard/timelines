// Replicates the library's parseDateArray logic for BC/AD string dates so
// that event start times can be converted to minutes for interpolation.
const parseToMinutes = (input) => {
  if (input === undefined || input === null) return undefined;
  if (typeof input === "number") return input;
  if (input instanceof Date) return input.getTime() / 60000;
  if (typeof input !== "string") return undefined;

  const setYear = (year) => {
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

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;

// --- Map type detection ---

const detectMapType = (timeline) => {
  const withMap = (timeline.events || []).filter((e) => e.map);
  if (!withMap.length) return null;
  const m = withMap[0].map;
  if ("lat" in m || "lng" in m) return "line";
  if ("centerLat" in m) return "polygon";
  return null;
};

// --- Line (waypoint) helpers ---

const buildWaypoints = (timeline) =>
  (timeline.events || [])
    .filter((e) => e.map && ("lat" in e.map || "lng" in e.map))
    .map((e) => ({
      minutes: parseToMinutes(e.start),
      coordinates: [e.map.lng, e.map.lat],
    }))
    .sort((a, b) => a.minutes - b.minutes);

const buildLineCoords = (waypoints, centerMinutes) => {
  if (!waypoints.length) return [];
  const first = waypoints[0];
  const last = waypoints[waypoints.length - 1];

  if (centerMinutes <= first.minutes) return [first.coordinates];
  if (centerMinutes >= last.minutes) return waypoints.map((w) => w.coordinates);

  const coords = [first.coordinates];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (centerMinutes > b.minutes) {
      coords.push(b.coordinates);
      continue;
    }
    const t = clamp(
      (centerMinutes - a.minutes) / (b.minutes - a.minutes),
      0,
      1,
    );
    coords.push([
      lerp(a.coordinates[0], b.coordinates[0], t),
      lerp(a.coordinates[1], b.coordinates[1], t),
    ]);
    break;
  }
  return coords;
};

// --- Polygon (ellipse) helpers ---

const buildPhases = (timeline) =>
  (timeline.events || [])
    .filter((e) => e.map && "centerLat" in e.map)
    .map((e) => ({
      minutes: parseToMinutes(e.start),
      centerLng: e.map.centerLng,
      centerLat: e.map.centerLat,
      radiusLng: e.map.radiusLng,
      radiusLat: e.map.radiusLat,
    }))
    .sort((a, b) => a.minutes - b.minutes);

const interpolatePhase = (a, b, t) => ({
  centerLng: lerp(a.centerLng, b.centerLng, t),
  centerLat: lerp(a.centerLat, b.centerLat, t),
  radiusLng: lerp(a.radiusLng, b.radiusLng, t),
  radiusLat: lerp(a.radiusLat, b.radiusLat, t),
});

const getPhaseAtTime = (phases, centerMinutes) => {
  if (!phases.length) return null;
  const first = phases[0];
  const last = phases[phases.length - 1];
  if (centerMinutes <= first.minutes) return first;
  if (centerMinutes >= last.minutes) return last;
  for (let i = 0; i < phases.length - 1; i++) {
    const a = phases[i];
    const b = phases[i + 1];
    if (centerMinutes <= b.minutes) {
      const t = clamp(
        (centerMinutes - a.minutes) / (b.minutes - a.minutes),
        0,
        1,
      );
      return interpolatePhase(a, b, t);
    }
  }
  return last;
};

const ellipseCoords = (
  centerLng,
  centerLat,
  radiusLng,
  radiusLat,
  steps = 72,
) => {
  const coords = [];
  for (let s = 0; s <= steps; s++) {
    const theta = (Math.PI * 2 * s) / steps;
    coords.push([
      centerLng + Math.cos(theta) * radiusLng,
      clamp(centerLat + Math.sin(theta) * radiusLat, -85, 85),
    ]);
  }
  return coords;
};

// --- GeoJSON feature builders ---

const asLineFeature = (coords) => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    // LineString requires >= 2 coordinates; duplicate the point when stationary.
    coordinates: coords.length >= 2 ? coords : coords.concat(coords),
  },
});

const asPolygonFeature = (phase) => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
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

// --- Centre-label formatter ---

const formatCenterLabel = (centerMinutes) => {
  const d = new Date(centerMinutes * 60000);
  const year = d.getUTCFullYear();
  if (year < 1000) {
    const absYear = year <= 0 ? Math.abs(year - 1) : year;
    return `${absYear} ${year <= 0 ? "BCE" : "CE"}`;
  }
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(d);
};

// --- Main ---

const init = async () => {
  const timelineContainer = document.querySelector("#timeline");
  const mapContainer = document.querySelector("#map");
  if (!timelineContainer || !mapContainer)
    throw new Error("Missing demo containers");

  const timelinesData = await fetch("./src/timelines.json").then((r) =>
    r.json(),
  );

  // Classify timelines by map rendering type
  const lineTimelines = timelinesData
    .filter((tl) => detectMapType(tl) === "line")
    .map((tl) => ({ ...tl, waypoints: buildWaypoints(tl) }));

  const polygonTimelines = timelinesData
    .filter((tl) => detectMapType(tl) === "polygon")
    .map((tl) => ({ ...tl, phases: buildPhases(tl) }));

  // Initial map view from first timeline that declares a mapConfig
  const firstMapConfig =
    timelinesData.find((tl) => tl.mapConfig)?.mapConfig ?? {};

  const map = new globalThis.maplibregl.Map({
    container: mapContainer,
    style: firstMapConfig.style ?? "https://demotiles.maplibre.org/globe.json",
    center: firstMapConfig.center ?? [0, 30],
    zoom: firstMapConfig.zoom ?? 1.5,
    projection: "globe",
  });

  // Create a marker for each line timeline (follows the route tip)
  const lineMarkers = {};
  for (const lt of lineTimelines) {
    const el = document.createElement("div");
    el.className = "voyage-marker";
    const marker = new globalThis.maplibregl.Marker({
      element: el,
      anchor: "center",
    });
    if (lt.waypoints.length) {
      marker.setLngLat(lt.waypoints[0].coordinates).addTo(map);
    }
    lineMarkers[lt.id] = marker;
  }

  let mapReady = false;

  const renderAll = (centerMinutes) => {
    if (!mapReady) return;

    for (const lt of lineTimelines) {
      const coords = buildLineCoords(lt.waypoints, centerMinutes);
      map.getSource(`line-${lt.id}`)?.setData(asLineFeature(coords));
      if (coords.length) {
        lineMarkers[lt.id]?.setLngLat(coords[coords.length - 1]);
      }
    }

    for (const pt of polygonTimelines) {
      const phase = getPhaseAtTime(pt.phases, centerMinutes);
      if (phase) {
        map.getSource(`polygon-${pt.id}`)?.setData(asPolygonFeature(phase));
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

    // Apply fitBounds from the first timeline that specifies bounds
    const boundsTimeline = timelinesData.find((tl) => tl.mapConfig?.bounds);
    if (boundsTimeline) {
      map.fitBounds(boundsTimeline.mapConfig.bounds, {
        padding: 60,
        duration: 0,
      });
    }
  });

  // Compute overall scroll boundaries from all timeline declarations
  const allStartPairs = timelinesData
    .map((tl) => ({ tl, m: parseToMinutes(tl.timelineStart) }))
    .filter(({ m }) => m !== undefined);
  const allEndPairs = timelinesData
    .map((tl) => ({ tl, m: parseToMinutes(tl.timelineEnd) }))
    .filter(({ m }) => m !== undefined);

  const timelineStart = allStartPairs.length
    ? allStartPairs.reduce((a, b) => (a.m < b.m ? a : b)).tl.timelineStart
    : "-15B";
  const timelineEnd = allEndPairs.length
    ? allEndPairs.reduce((a, b) => (a.m > b.m ? a : b)).tl.timelineEnd
    : "5B";

  const timeline = globalThis.TimelineContainer(timelineContainer, {
    autoSelect: true,
    autoFocusOnTimelineAdd: true,
    includeBackgroundOnAutoFocus: true,
    labelCount: 8,
    timelineStart,
    timelineEnd,
    showCenterMarker: true,
    showCenterLabel: true,
    formatCenterLabel,
  });

  timelineContainer.addEventListener("update.tl.container", (e) => {
    renderAll(e.detail.viewCenterMinutes);
  });

  // Add all timelines — the last add triggers the final auto-focus
  for (const tl of timelinesData) {
    timeline.add({ id: tl.id, ...tl });
  }
};

init();
