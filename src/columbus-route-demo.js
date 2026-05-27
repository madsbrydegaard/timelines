const toMinutes = (input) => Date.parse(input) / 60000;

const voyageWaypoints = [
  {
    date: "1492-08-03T00:00:00Z",
    lng: -6.9292,
    lat: 37.1882,
    title: "Palos de la Frontera",
  },
  {
    date: "1492-08-12T00:00:00Z",
    lng: -17.925,
    lat: 28.099,
    title: "La Gomera",
  },
  {
    date: "1492-09-06T00:00:00Z",
    lng: -17.925,
    lat: 28.099,
    title: "Westbound departure",
  },
  {
    date: "1492-09-22T00:00:00Z",
    lng: -31.5,
    lat: 25.0,
    title: "Mid-Atlantic",
  },
  {
    date: "1492-10-07T00:00:00Z",
    lng: -61.0,
    lat: 24.0,
    title: "Approaching the islands",
  },
  {
    date: "1492-10-12T00:00:00Z",
    lng: -74.4862,
    lat: 24.043,
    title: "San Salvador",
  },
].map((waypoint) => ({
  ...waypoint,
  minutes: toMinutes(waypoint.date),
  coordinates: [waypoint.lng, waypoint.lat],
}));

const voyageTimelineData = {
  title: "Columbus' first voyage",
  timelineStart: "1491-01-01T00:00:00Z",
  timelineEnd: "1494-01-01T00:00:00Z",
  events: [
    {
      start: "1492-08-03T00:00:00Z",
      end: "1492-08-12T00:00:00Z",
      title: "Departure from Palos",
      description:
        "Christopher Columbus leaves Spain and sails to the Canary Islands.",
    },
    {
      start: "1492-08-12T00:00:00Z",
      end: "1492-09-06T00:00:00Z",
      title: "Canary Islands stopover",
      description:
        "The expedition repairs, provisions, and turns west into the Atlantic.",
    },
    {
      start: "1492-09-06T00:00:00Z",
      end: "1492-10-12T00:00:00Z",
      title: "Atlantic crossing",
      description: "The voyage continues west until landfall in the Bahamas.",
    },
  ],
};

const interpolate = (start, end, progress) => [
  start[0] + (end[0] - start[0]) * progress,
  start[1] + (end[1] - start[1]) * progress,
];

const buildRouteCoordinates = (centerMinutes) => {
  const firstWaypoint = voyageWaypoints[0];
  const lastWaypoint = voyageWaypoints[voyageWaypoints.length - 1];

  if (centerMinutes <= firstWaypoint.minutes) {
    return [firstWaypoint.coordinates];
  }

  if (centerMinutes >= lastWaypoint.minutes) {
    return voyageWaypoints.map((waypoint) => waypoint.coordinates);
  }

  const coordinates = [firstWaypoint.coordinates];

  for (let index = 0; index < voyageWaypoints.length - 1; index += 1) {
    const start = voyageWaypoints[index];
    const end = voyageWaypoints[index + 1];

    if (centerMinutes > end.minutes) {
      coordinates.push(end.coordinates);
      continue;
    }

    const segmentProgress = Math.min(
      1,
      Math.max(
        0,
        (centerMinutes - start.minutes) / (end.minutes - start.minutes),
      ),
    );
    coordinates.push(
      interpolate(start.coordinates, end.coordinates, segmentProgress),
    );
    break;
  }

  return coordinates;
};

const createRouteFeature = (centerMinutes) => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: buildRouteCoordinates(centerMinutes),
  },
});

const formatCenterDate = (centerMinutes) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(centerMinutes * 60000));

const initColumbusDemo = () => {
  const timelineContainer = document.querySelector("#timeline");
  const logElement = document.querySelector("#log");
  const mapContainer = document.querySelector("#map");

  if (!timelineContainer || !mapContainer) {
    throw new Error("Missing demo containers");
  }

  const log = [];
  const eventNames = [
    "update.tl.container",
    "pinch.tl.container",
    "wheel.tl.container",
    "drag.tl.container",
    "selected.tl.event",
  ];

  const map = new globalThis.maplibregl.Map({
    container: mapContainer,
    style: "https://demotiles.maplibre.org/globe.json",
    center: [-40, 25],
    zoom: 1.8,
    projection: "globe",
  });

  const routeMarkerElement = document.createElement("div");
  routeMarkerElement.className = "voyage-marker";
  const routeMarker = new globalThis.maplibregl.Marker({
    element: routeMarkerElement,
    anchor: "center",
  })
    .setLngLat(voyageWaypoints[0].coordinates)
    .addTo(map);

  let routeSourceReady = false;
  let mapReady = false;
  let pendingRouteFeature = createRouteFeature(voyageWaypoints[0].minutes);

  const autoFollowMarker = (center) => {
    if (!mapReady) {
      return;
    }

    map.easeTo({
      center,
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch(),
      duration: 260,
      essential: true,
    });
  };

  const renderRoute = (centerMinutes) => {
    pendingRouteFeature = createRouteFeature(centerMinutes);

    if (!routeSourceReady) {
      return;
    }

    const source = map.getSource("voyage-route");
    if (!source) {
      return;
    }

    source.setData(pendingRouteFeature);
    const routeCoordinates = pendingRouteFeature.geometry.coordinates;
    const currentMarkerPosition = routeCoordinates[routeCoordinates.length - 1];
    routeMarker.setLngLat(currentMarkerPosition);
    autoFollowMarker(currentMarkerPosition);
  };

  map.on("load", () => {
    map.addSource("voyage-route", {
      type: "geojson",
      data: pendingRouteFeature,
    });

    map.addLayer({
      id: "voyage-route-glow",
      type: "line",
      source: "voyage-route",
      paint: {
        "line-color": "rgba(255, 255, 255, 0.28)",
        "line-width": 7,
        "line-blur": 1,
      },
    });

    map.addLayer({
      id: "voyage-route-line",
      type: "line",
      source: "voyage-route",
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#f8b84e",
        "line-width": 4,
      },
    });

    routeSourceReady = true;
    mapReady = true;
    renderRoute(voyageWaypoints[0].minutes);
    map.fitBounds(
      [
        [-74.4862, 24.043],
        [-6.9292, 37.1882],
      ],
      { padding: 60, duration: 0 },
    );
  });

  const timeline = globalThis.TimelineContainer(timelineContainer, {
    autoSelect: true,
    autoFocusOnTimelineAdd: true,
    includeBackgroundOnAutoFocus: true,
    labelCount: 8,
    timelineStart: voyageTimelineData.timelineStart,
    timelineEnd: voyageTimelineData.timelineEnd,
    showCenterMarker: true,
    showCenterLabel: true,
    formatCenterLabel: formatCenterDate,
  });

  eventNames.forEach((eventName) => {
    timelineContainer.addEventListener(eventName, (timelineEvent) => {
      log.unshift(timelineEvent.detail.name);
      if (log.length > 20) {
        log.pop();
      }

      const currentLabel =
        eventName === "update.tl.container"
          ? `center: ${formatCenterDate(timelineEvent.detail.viewCenterMinutes)}`
          : timelineEvent.detail.name;
      logElement.textContent = [currentLabel, ...log].join("\n");

      if (eventName === "update.tl.container") {
        renderRoute(timelineEvent.detail.viewCenterMinutes);
      }
    });
  });

  timeline.add({
    id: crypto.randomUUID(),
    ...voyageTimelineData,
  });
};

initColumbusDemo();
