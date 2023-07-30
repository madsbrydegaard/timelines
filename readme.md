# @madsbrydegaard/timelines

Timeline engine for creating robust and flexible timelines with zoom and pan.

The project is designed to act as the main engine for web projects that can visualize historic events.

Code re-calculates points in time on every frame using minutes as timescale. The engine does not depent on expanding divs or any other HTML elements which is why it can zoom past browser limits and span 14B years of history.

## How to use:

Module supports both ESM and UMD - please check demos.

Install ESM Module:

```
npm i @madsbrydegaard/timelines
```

ESM Setup:

```
<div id="timeline"></div>
<script type="module">
    import { TimelineContainer } from "@madsbrydegaard/timelines";

	const timeline = TimelineContainer("#timeline", {
        start: "100bc",
        end: "100ad"
    });
</script>
```

Vanilla setup:

```
<div id="timeline"></div>
<script src="path/to/timelines.umd.js"></script>
<script>
    const timeline = TimelineContainer("#timeline", {
        start: "100bc",
        end: "100ad"
    });
</script>
```

Add timeline events

```
<div id="timeline"></div>
<script type="module">
    import { TimelineContainer } from "@madsbrydegaard/timelines";

	const timeline = TimelineContainer("#timeline", {
        start: "100bc",
        end: "now"
    });

    const timelineEvents = [
        {
            start: [1974],
            end: 'now',
            title: "My Life",
            description:
                "I was born in the last century and spend most of my life programming computers",
        },
    ];
    timeline.add({
        events: timelineEvents.map((item) => ({
            ...item,
            type: "timeline",
        })),
    });
</script>
```

Capturing events

```
<div id="timeline"></div>
<script type="module">
    import { TimelineContainer } from "@madsbrydegaard/timelines";

    const timelineContainer = document.querySelector("#timeline");
	const timeline = TimelineContainer(timelineContainer, {
        start: "100bc",
        end: "now"
    });

    const timelineEvents = [
        "pinch.tl.container",
        "wheel.tl.container",
        "drag.tl.container",
        "click.tl.event"
    ];

    timelineEvents.forEach((eventName) => {
        timelineContainer.addEventListener(eventName, (timelineEvent) => {
            console.log(eventname, timelineEvent);
        });
    });

    const timelineEvents = [
        {
            start: [1974],
            end: 'now',
            title: "My Life",
            description:
                "I was born in the last century and spend most of my life programming computers",
        },
    ];
    timeline.add({
        events: timelineEvents.map((item) => ({
            ...item,
            type: "timeline",
        })),
    });
</script>
```

React & Typescript setup:

```
import { TimelineContainer, ITimelineContainer, ITimelineOptions, ITimelineEvent } from "@madsbrydegaard/timelines"
import { useEffect, useRef, createRef } from 'react';

function App() {
    const container = createRef<HTMLDivElement>();
    const timeline = useRef<ITimelineContainer>();
    const events = [
        "pinch.tl.container",
        "wheel.tl.container",
        "drag.tl.container",
        "click.tl.event"
    ];

    useEffect(()=>{
        if (container.current) {
            // Initialize a timeline
			timeline.current = TimelineContainer(container.current, {
				start: "100bc",
				end: "2030ac",
			} as ITimelineOptions) as ITimelineContainer;

            // Listening for interaction event(s)
            events.forEach((eventName) => {
                container.current.addEventListener(eventName, (evt: CustomEvent) => {
                    if (evt.detail) {
                        // See details on event that has been clicked
                        console.log(evt.detail)
                    }
                });
            });

            // Load timeline events into timeline
            timeline.current.add(async () => {
				return await gofetch("path/to/some.json") as ITimelineEvent;
            }
        }
    }, [])

    return (
        <div className="App">
            <div ref={myRef}></div>
        </div>
    );
}

export default App;
```

## Documentation:

```
// Constructor
TimelineContainer(element: HTMLElement | string, options: object)
```

**First argument** is the page container for the timeline.
Eg. '#timelineContainer' | document.querySelector("#timelineContainer");

Zooming and panning is automatically activated on the whole container so that large page areas can be part of timeline.

The timeline works with 2 different date sets.

- Overall date range of allowed zooming and panning. Zooming and Panning is not allowed outside these dates.
- Specific date range for initialization. These acts as the boundaries when the timeline initalizes and creates a 'view' on the overall timeline

**Second argument** is a configuration object.
Default configuration looks like this:

```
{
    // Defines number of 'time' labels in the timeline
    labelCount: 5,
    // How fast zooming happens
    zoomSpeed: 0.04,
    // How fast panning happens
    dragSpeed: 0.001,
    // When timeline should start on init. (See below for valid input)
    start: "-100y",
    // When timeline should end on init. (See below for valid input)
    end: "now",
    // When overall timeline boundary should start. (See below for valid input)
    timelineStart: "-1B",
    // When overall timeline boundary should end. (See below for valid input)
    timelineEnd: "1M",
    // How far out zoom is allowed
    minZoom: 1,
    // How far in zoom is allowed
    maxZoom: 1e11,
    // Where to vertically place the timeline in the container. 'bottom' | 'top'
    position: "bottom",
    // Height of timeline events
    eventHeight: 5,
    // Spacing between timeline events
    eventSpacing: 3,
    // Whether zoom and pan is automatically initialized when clicking a timeline event
    autoZoom: false,
    // Margin on each side when using auto zoom
    zoomMargin: 0.1,
    // Whether events are automatically selected on mouse click
    autoSelect: false,
    // Default color for each timeline event
    defaultColor: [140, 140, 140],
    // Duration in ms when auto zoom is enabled
    zoomDuration: 200,
    // Auto zoom easing. "easeOutCubic" | "easeOutExpo" | "easeLinear"
	easing: "easeOutCubic",
    // How many previews to display
	numberOfHighscorePreviews: 5,
    // Delay befort displaying previews
	highscorePreviewDelay: 500,
    // Preview width
	highscorePreviewWidth: 100,
    // Default classnames for generated HTML Elements
    classNames: {
        timeline: "tl",
        timelineEvent: "tl__event",
        timelinePreview: "tl__preview",
        timelineEventTitle: "tl__event__title",
        timelineLabels: "tl__labels",
        timelineDividers: "tl__dividers",
        timelineEvents: "tl__events",
        timelinePreviews: "tl__previews",
        timelineIo: "tl__io",
        timelineLabel: "tl__label",
        timelineDivider: "tl__divider",
    }
}
```

**Allowed values for dates**:  
Engine has its own Date string parser which supports the following specials:

- XXX -> any positive or negative number translates to now plus/minus number of minutes.
- 'YYYY-MM-DDTHH:mm:ss.sssZ' -> ISO 8601 string
- 'now' -> Translates to current time = new Date()
- 'XXXy' -> any positive or negative number with a trailing 'y'. Translates relative to now. Eg. '-1000y' = Minus 1000 years from now.
- 'XXXbc' -> any positive or negative number with a trailing 'bc'. Translates into that specific year - BC. Eg. '100bc' = Year -100
- 'XXXad' -> any positive or negative number with a trailing 'ad'. Translates into that specific year - AD. Eg. '100ad' = Year 100
- 'XXXK' -> any positive or negative number with a trailing 'K'. Translates into year \* 1000. Eg. '100K' = Year 100.000
- 'XXXM' -> any positive or negative number with a trailing 'M'. Translates into year \* 1.000.000. Eg. '100M' = Year 100.000.000
- 'XXXB' -> any positive or negative number with a trailing 'B'. Translates into year \* 1.000.000.000. Eg. '100B' = Year 100.000.000.000

**Events**
Engine dispatches events on interactions. Use addEventListener to capture them

```
timelineContainer.addEventListener(eventName, (timelineEvent) => {
    // Handle timelineEvent...
});
```

Timeline Event object

```
{
    // Name of event. See list below.
    name: string;
    // Configurations object. See structure above.
    options: ITimelineOptions;
    // Current timeline event if IO event is related to any timeline event. See structure below.
    timelineEvent: ITimelineEventWithDetails;
    // Where is viewStart now. formatted.
    viewStartDate: string;
    // Where is viewEnd now. formatted.
    viewEndDate: string;
    // View duration now. In minutes.
    viewDuration: number;
    // Current timeline / view ratio (z-axix offset)
    ratio: number;
    // Current timeline / view pivot (x-axix offset)
    pivot: number;
},
```

Complete IO event list:

- update.tl.container -> When engine updates (re-draws)
- pinch.tl.container
- wheel.tl.container
- drag.tl.container
- touchstart.tl.container
- touchend.tl.container
- touchmove.tl.container
- mousemove.tl.container
- mousedown.tl.container
- mouseup.tl.container
- resize.tl.container
- click.tl.event
- hover.tl.event
- selected.tl.event

**TimelineEvent**

```
{
    // Title of event
	title: string;
    // Optional Render function for event HTML in timeline. Must return HTML Div Element.
	renderEventNode?: (timelineEvent: ITimelineEventWithDetails) => HTMLDivElement;
    // Optional Render function for event preview HTML in timeline. Must return HTML Div Element.
	renderPreviewNode?: (timelineEvent: ITimelineEventWithDetails) => HTMLDivElement;
    // Type of event. Supports "timeline" | "background"
    type?: string;
    // Color of event element. array of numbers stranslates to #XXXXXXXX hex code
	color?: number[];
    // Color of event element when selected. array of numbers stranslates to #XXXXXXXX hex code
	highlightedColor?: number[];
    // Start of timeline event.
    start?: number[] | string | number | Date;
    // End of timeline event.
	end?: number[] | string | number | Date;
    // Optional duration of timeline event. Used when 'end' is not defined.
	duration?: number | string;
    // Child events
	events?: ITimelineEvent[];
}
```

**TimelineContainer**

```
{
    // Add events to container
	add: (...timelineEvents: ITimelineEvent[]) => void;
    // auto zoom specific event
	zoom: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onzoomend?: (timelineEvent: ITimelineEvent) => void) => void;
    // focus specific event
	focus: (timelineEvent: ITimelineEvent, useAnimation?: boolean, onfocused?: (timelineEvent: ITimelineEvent) => void) => void;
    // reset container to initial config
	reset: () => void;
    // select specific event
	select: (timelineEventIdentifier?: string) => void;
}
```
