# Timeline.io
Timeline engine for creating timelines with zoom and pan.  

## Why Timeline.io

The project is created as the main engine in web projects that visualize earth´s and human history.  

Engine code re-calculates points in time on every frame using milliseconds as timescale. It does not depent on expanding divs or any other HTML elements which makes it able to zoom past most browser limits.

Timeline.io currently uses javascript Date object which is limited by ECMA-262 (that is, April 20, 271821 BCE ~ September 13, 275760 CE). Hence it can currently span ±8,640,000,000,000,000 milliseconds with zero (0) being unix time 0 (Jan 1 1970).

## Installing / Getting started
ES6:
```
npm install timeline.io 
```
UMD:
