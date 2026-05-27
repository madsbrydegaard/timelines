const utcMinutesForYear = (year) => {
  const date = new Date(0);
  date.setUTCFullYear(year, 0, 1);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime() / 60000;
};

const romanEmpirePhases = [
  {
    year: -500,
    title: "City-state era",
    centerLng: 12.5,
    centerLat: 41.9,
    radiusLng: 0.8,
    radiusLat: 0.5,
  },
  {
    year: -264,
    title: "Italian expansion",
    centerLng: 12.0,
    centerLat: 42.0,
    radiusLng: 4.8,
    radiusLat: 2.9,
  },
  {
    year: -146,
    title: "Western Mediterranean dominance",
    centerLng: 10.0,
    centerLat: 39.0,
    radiusLng: 12.0,
    radiusLat: 6.2,
  },
  {
    year: -44,
    title: "Late Republic",
    centerLng: 12.0,
    centerLat: 38.0,
    radiusLng: 17.5,
    radiusLat: 8.5,
  },
  {
    year: 117,
    title: "Imperial peak under Trajan",
    centerLng: 20.0,
    centerLat: 37.0,
    radiusLng: 29.0,
    radiusLat: 10.8,
  },
  {
    year: 271,
    title: "Third-century crisis",
    centerLng: 19.0,
    centerLat: 37.0,
    radiusLng: 24.0,
    radiusLat: 9.1,
  },
  {
    year: 395,
    title: "Permanent East-West split",
    centerLng: 20.0,
    centerLat: 37.0,
    radiusLng: 21.5,
    radiusLat: 8.2,
  },
  {
    year: 476,
    title: "Fall of the Western Empire",
    centerLng: 25.0,
    centerLat: 37.0,
    radiusLng: 11.0,
    radiusLat: 5.2,
  },
].map((phase) => ({
  ...phase,
  minutes: utcMinutesForYear(phase.year),
}));

const romanEmpireTimelineData = {
  title: "Roman Empire rise and fall",
  timelineStart: "2000bc",
  timelineEnd: "2000ad",
  events: [
    {
      start: "500bc",
      end: "264bc",
      title: "Roman Republic foundations",
      description:
        "Rome grows from city-state influence into control of Italy.",
    },
    {
      start: "264bc",
      end: "146bc",
      title: "Punic Wars and western expansion",
      description:
        "Roman victories over Carthage reshape the western Mediterranean.",
    },
    {
      start: "146bc",
      end: "44bc",
      title: "Late Republican conquests",
      description:
        "Campaigns in Hispania, Gaul, Greece, and North Africa dramatically widen territory.",
    },
    {
      start: "44bc",
      end: "117ad",
      title: "Imperial ascent",
      description:
        "From Augustus to Trajan, the empire expands to its greatest recorded extent.",
    },
    {
      start: "117ad",
      end: "395ad",
      title: "Stabilization and pressure",
      description:
        "Defensive strategy, internal crises, and frontier pressure reduce cohesion and size.",
    },
    {
      start: "395ad",
      end: "476ad",
      title: "Western decline",
      description:
        "The western half contracts until imperial authority ends in 476 CE.",
    },
  ],
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const interpolateValue = (from, to, progress) => from + (to - from) * progress;

const interpolatePhase = (from, to, progress) => ({
  centerLng: interpolateValue(from.centerLng, to.centerLng, progress),
  centerLat: interpolateValue(from.centerLat, to.centerLat, progress),
  radiusLng: interpolateValue(from.radiusLng, to.radiusLng, progress),
  radiusLat: interpolateValue(from.radiusLat, to.radiusLat, progress),
  title: progress < 0.5 ? from.title : to.title,
});

const findInterpolatedPhase = (centerMinutes) => {
  const firstPhase = romanEmpirePhases[0];
  const lastPhase = romanEmpirePhases[romanEmpirePhases.length - 1];

  if (centerMinutes <= firstPhase.minutes) {
    return firstPhase;
  }

  if (centerMinutes >= lastPhase.minutes) {
    return lastPhase;
  }

  for (let index = 0; index < romanEmpirePhases.length - 1; index += 1) {
    const currentPhase = romanEmpirePhases[index];
    const nextPhase = romanEmpirePhases[index + 1];

    if (centerMinutes <= nextPhase.minutes) {
      const progress =
        (centerMinutes - currentPhase.minutes) /
        (nextPhase.minutes - currentPhase.minutes);
      return interpolatePhase(currentPhase, nextPhase, clamp(progress, 0, 1));
    }
  }

  return lastPhase;
};

const ellipsePolygon = (
  centerLng,
  centerLat,
  radiusLng,
  radiusLat,
  steps = 72,
) => {
  const coordinates = [];

  for (let step = 0; step <= steps; step += 1) {
    const theta = (Math.PI * 2 * step) / steps;
    const lng = centerLng + Math.cos(theta) * radiusLng;
    const lat = clamp(centerLat + Math.sin(theta) * radiusLat, -85, 85);
    coordinates.push([lng, lat]);
  }

  return coordinates;
};

const createEmpireFeature = (centerMinutes) => {
  const phase = findInterpolatedPhase(centerMinutes);
  return {
    type: "Feature",
    properties: {
      title: phase.title,
    },
    geometry: {
      type: "Polygon",
      coordinates: [
        ellipsePolygon(
          phase.centerLng,
          phase.centerLat,
          phase.radiusLng,
          phase.radiusLat,
        ),
      ],
    },
  };
};

const formatCenterDate = (centerMinutes) => {
  const centerDate = new Date(centerMinutes * 60000);
  const year = centerDate.getUTCFullYear();
  const era = year <= 0 ? "BCE" : "CE";
  const displayYear = year <= 0 ? Math.abs(year - 1) : year;
  return `${displayYear} ${era}`;
};

const formatCenterLabel = (centerMinutes) => {
  const phase = findInterpolatedPhase(centerMinutes);
  return `${formatCenterDate(centerMinutes)} - ${phase.title}`;
};

const initRomanEmpireDemo = () => {
  const timelineContainer = document.querySelector("#timeline");
  const mapContainer = document.querySelector("#map");
  const logElement = document.querySelector("#log");

  if (!timelineContainer || !mapContainer) {
    throw new Error("Missing demo containers");
  }

  const map = new globalThis.maplibregl.Map({
    container: mapContainer,
    style: "https://demotiles.maplibre.org/globe.json",
    center: [18, 38],
    zoom: 2.25,
    projection: "globe",
  });

  let mapReady = false;
  let empireSourceReady = false;
  let pendingEmpireFeature = createEmpireFeature(romanEmpirePhases[0].minutes);

  const renderEmpire = (centerMinutes) => {
    pendingEmpireFeature = createEmpireFeature(centerMinutes);

    if (!empireSourceReady) {
      return;
    }

    const empireSource = map.getSource("roman-empire");
    if (!empireSource) {
      return;
    }

    empireSource.setData(pendingEmpireFeature);
  };

  map.on("load", () => {
    map.addSource("roman-empire", {
      type: "geojson",
      data: pendingEmpireFeature,
    });

    map.addLayer({
      id: "roman-empire-fill",
      type: "fill",
      source: "roman-empire",
      paint: {
        "fill-color": "#c99a3d",
        "fill-opacity": 0.42,
      },
    });

    map.addLayer({
      id: "roman-empire-outline",
      type: "line",
      source: "roman-empire",
      layout: {
        "line-join": "round",
      },
      paint: {
        "line-color": "#7d3f00",
        "line-width": 2.5,
      },
    });

    mapReady = true;
    empireSourceReady = true;
    renderEmpire(romanEmpirePhases[0].minutes);
  });

  const timeline = globalThis.TimelineContainer(timelineContainer, {
    autoSelect: true,
    autoFocusOnTimelineAdd: true,
    includeBackgroundOnAutoFocus: true,
    labelCount: 8,
    timelineStart: romanEmpireTimelineData.timelineStart,
    timelineEnd: romanEmpireTimelineData.timelineEnd,
    start: "500bc",
    end: "476ad",
    showCenterMarker: true,
    showCenterLabel: true,
    formatCenterLabel,
  });

  const eventNames = [
    "update.tl.container",
    "pinch.tl.container",
    "wheel.tl.container",
    "drag.tl.container",
    "selected.tl.event",
  ];

  const log = [];

  eventNames.forEach((eventName) => {
    timelineContainer.addEventListener(eventName, (timelineEvent) => {
      if (eventName !== "update.tl.container") {
        log.unshift(timelineEvent.detail.name);
      }

      if (eventName === "update.tl.container") {
        renderEmpire(timelineEvent.detail.viewCenterMinutes);
        log.unshift(
          `center: ${formatCenterDate(timelineEvent.detail.viewCenterMinutes)}`,
        );
      }

      if (log.length > 20) {
        log.length = 20;
      }

      if (logElement) {
        logElement.textContent = log.join("\n");
      }

      if (
        mapReady &&
        eventName === "selected.tl.event" &&
        timelineEvent.detail.timelineEvent
      ) {
        const selectedEvent = timelineEvent.detail.timelineEvent;
        const start = selectedEvent.timelineEventDetails.startMinutes;
        const end = selectedEvent.timelineEventDetails.endMinutes;
        renderEmpire((start + end) / 2);
      }
    });
  });

  timeline.add({
    id: crypto.randomUUID(),
    ...romanEmpireTimelineData,
  });
};

initRomanEmpireDemo();
