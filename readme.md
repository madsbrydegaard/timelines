# Timeline.io
Vanilla js timeline with zoom and pan.  

Designed to be part of projects that visualize earth´s history.  

Code re-calculates time on every frame using milliseconds as lowest timescale. It is not dependent on expanding divs or any other HTML elements which makes it able to zoom past any browser limits.

Timeline.io currently uses javascript Date object which is limited by ECMA-262 (that is, April 20, 271821 BCE ~ September 13, 275760 CE). Hence it can currently span ±8,640,000,000,000,000 milliseconds with zero (0) being unix time 0 (Jan 1 1970).