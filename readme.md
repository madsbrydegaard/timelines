# Timeline.io

Timeline engine for creating robust and flexible timelines with zoom and pan.

The project is designed to act as the main engine in web projects that visualize earth´s and human history.

Code re-calculates points in time on every frame using minutes as timescale. The engine does not depent on expanding divs or any other HTML elements which is why it can zoom past browser limits and span 14B years of history.

Dates and timestamps are re-calculated manually based on minutes since javascript Date object is limited by ECMA-262 (that is, April 20, 271821 BCE ~ September 13, 275760 CE). Hence it can currently span ±8,640,000,000,000,000 milliseconds with zero (0) being unix time 0 (Jan 1 1970).

## How to use:

Module supports both ESM and UMD - please check demos.

Install ESM Module:

```
npm i timeline.io
```

ESM Setup:

```
<div id="timeline"></div>
<script type="module">
    import { Timeline } from "timeline.io";

	const timeline = Timeline("#timeline", {
        start: "100bc",
        end: "100ad"
    });
</script>
```

Vanilla setup:

```
<div id="timeline"></div>
<script src="path/to/timeline.io.umd.js"></script>
<script>
    const timeline = Timeline("#timeline", {
        start: "100bc",
        end: "100ad"
    });
</script>
```

React & Typescript setup:

```
import { Timeline, ITimelineContainer, ITimelineOptions, ITimelineEvent } from 'timeline.io'
import { useEffect, useRef, createRef } from 'react';

function App() {
    const container = createRef<HTMLDivElement>();
    const timeline = useRef<ITimelineContainer>();

    useEffect(()=>{
        if (container.current) {
            // Initialize a timeline
			timeline.current = Timeline(container.current, {
				start: "100bc",
				end: "2030ac",
			} as ITimelineOptions) as ITimelineContainer;

            // Listening for interaction event(s)
            container.current.addEventListener("click.tl.event", (evt: CustomEvent) => {
				if (evt.detail) {
                    // See details on event that has been clicked
					console.log(evt.detail)
				}
			});

            // Load timeline events into timeline
            timeline.current.load(async () => {
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
Timeline(element: HTMLElement | string, options: object)
```

**First argument** is the page container for the timeline.
Eg. '#timelineContainer' | document.querySelector("#timelineContainer");

Code adds 2 absolute positioned divs to the container and vertically places them according to the 'position' parameter on the options object.

Zooming and panning is automatically activated on the whole container so that large page areas can be part of timeline.

The timeline works with 2 different date sets.

- Overall date range of allowed zooming and panning. Zooming and Panning is not allowed outside these dates.
- Specific date range for initialization. These acts as the boundaries when the timeline initalizes and creates a 'view' on the overall timeline

**Second argument** is a configuration object.
Default configuration looks like this:

```
{
    labelCount: 5,                  // Defines number of 'time' labels in the timeline
    zoomSpeed: 0.025,               // How fast zooming happens
    dragSpeed: 0.003,               // How fast panning happens
    startDate: "-100y",             // When timeline should start on init. (See below for valid input)
    endDate: "10y",                 // When timeline should end on init. (See below for valid input)
    timelineStart: "-1000y",        // When overall timeline boundary should start. (See below for valid input)
    timelineEnd: "1000y",           // When overall timeline boundary should end. (See below for valid input)
    minZoom: 1,                     // How far out zoom is allowed
    maxZoom: 1e11,                  // How far in zoom is allowed
    position: "bottom",             // Where to vertically place the timeline in the container. 'bottom' | 'center' | 'top'
    eventHeight: 5,                 // Height of timeline events
    autoFocus: false,               // Whether zoom and pan is automatically initialized when clicking a timeline event
    defaultColor: [140, 140, 140],  // Default color for each timeline event
    classNames: {                   // Default classnames for generated HTML Elements
        timeline: "tl",
        timelineEvent: "tl__event",
        timelineEventTitle: "tl__event__title",
        timelineLabels: "tl__labels",
        timelineDividers: "tl__dividers",
        timelineEvents: "tl__events",
        timelineLabel: "tl__label",
        timelineDivider: "tl__divider",
    }
}
```

**Allowed values for dates**:  
Timeline has its own Date string parser which supports the following specials:

- XXX -> any positive or negative number translates to now plus/minus number of minutes.
- 'YYYY-MM-DDTHH:mm:ss.sssZ' -> ISO 8601 string
- 'now' -> Translates to current time = new Date()
- 'XXXy' -> any positive or negative number with a trailing 'y'. Translates relative to now. Eg. '-1000y' = Minus 1000 years from now.
- 'XXXbc' -> any positive or negative number with a trailing 'bc'. Translates into that specific year - BC. Eg. '100bc' = Year -100
- 'XXXad' -> any positive or negative number with a trailing 'ad'. Translates into that specific year - AD. Eg. '100ad' = Year 100
- 'XXXK' -> any positive or negative number with a trailing 'K'. Translates into year \* 1000. Eg. '100K' = Year 100.000
- 'XXXM' -> any positive or negative number with a trailing 'M'. Translates into year \* 1.000.000. Eg. '100M' = Year 100.000.000
- 'XXXB' -> any positive or negative number with a trailing 'B'. Translates into year \* 1.000.000.000. Eg. '100B' = Year 100.000.000.000

```

```
