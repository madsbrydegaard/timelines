# Timeline.io
Vanilla js timeline with zoom and pan.  

Designed to be part of projects that visualize earth´s history.  

Code re-calculates time on every frame using minutes as lowest timescale. Hence it can currently span ±8,640,000,000,000,000 minutes with zero (0) being unix time 0 (Jan 1 1970).

Code is also not dependent on expanding divs which makes it able to zoom past any browser limits and hence prepared to span billions of years.

However labels currently uses javascript Date object which is limited by ECMA-262 (that is, April 20, 271821 BCE ~ September 13, 275760 CE).