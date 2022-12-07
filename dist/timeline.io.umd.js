(()=>{var E=Object.defineProperty,x=Object.defineProperties;var I=Object.getOwnPropertyDescriptors;var M=Object.getOwnPropertySymbols;var N=Object.prototype.hasOwnProperty,R=Object.prototype.propertyIsEnumerable;var H=(g,e,t)=>e in g?E(g,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):g[e]=t,T=(g,e)=>{for(var t in e||(e={}))N.call(e,t)&&H(g,t,e[t]);if(M)for(var t of M(e))R.call(e,t)&&H(g,t,e[t]);return g},D=(g,e)=>x(g,I(e));var w=class{constructor(e,t,o,d){if(!e)throw new Error("Events argument is empty. Please add Array of events | DOM element | selector as first arg");if(typeof e=="string"){let c=document.querySelector(e);if(!c)throw new Error(`Selector could not be found [${e}]`);this.element=c}e instanceof HTMLElement&&(this.element=e),this.options=T({labelCount:5,zoomSpeed:.025,dragSpeed:.001,startDate:"-100y",endDate:"10y",timelineStartDate:"-1000y",timelineEndDate:"1000y",minZoom:1,maxZoom:1e11,position:"bottom",expandRatio:80,eventHeight:5},o),this.timelineStart=this.parseDate(this.options.timelineStartDate),this.timelineEnd=this.parseDate(this.options.timelineEndDate);let u=this.parseDate(this.options.startDate),i=this.parseDate(this.options.endDate);u.getTime()<this.timelineStart.getTime()&&(this.timelineStart=u),i.getTime()>this.timelineEnd.getTime()&&(this.timelineEnd=i);let l=i.getTime()-u.getTime();this.ratio=this.timelineDuration/l,this.pivot=(this.timelineStart.getTime()-u.getTime())/l;let s=[...Array.isArray(t)?t:[],...this.parseTimelineHTML(this.element)];this.events=[...this.parseEvents(s)],console.log(this.events),this.setupContainerHTML(),this.registerListeners(this.element),this.callback=d,this.update()}get timelineDuration(){return this.timelineEnd.getTime()-this.timelineStart.getTime()}get viewWidth(){var e;return((e=this.element)==null?void 0:e.offsetWidth)||0}get start(){return this.timelineStart.getTime()-this.duration*this.pivot}get end(){return this.start+this.duration}get duration(){return this.timelineDuration/this.ratio}get startDate(){return new Date(this.start)}get endDate(){return new Date(this.end)}getLeftRatio(e){return(e-this.startDate.getTime())/this.duration}setRatio(e,t){let o=this.ratio-t;return e===1&&o<=this.options.minZoom||e===-1&&o>=this.options.maxZoom?!1:(this.ratio=o,!0)}setPivot(e){let t=this.pivot+e;t>=0&&(t=0),t+this.ratio<=1&&(t=1-this.ratio),this.pivot=t}zoom(e,t){let o=this.options.zoomSpeed*this.ratio,d=e*o,l=((t||0)/this.viewWidth-this.pivot)/this.ratio*d;this.setRatio(e,d)&&this.setPivot(l),this.update()}move(e){this.setPivot(e),this.update()}registerListeners(e){let t=this,o=function(){t.update()};window.removeEventListener("resize",o),window.addEventListener("resize",o,{passive:!0});let d=function(h){var r=Math.sign(h.deltaY);let a=(h.target.attributes.starttime?t.getLeftRatio(h.target.attributes.starttime):0)*t.element.getBoundingClientRect().width+h.offsetX;t.zoom(r,a)};e.removeEventListener("wheel",d),e.addEventListener("wheel",d,{passive:!0});let u,i,l=!1,s=!0,c=function(h){l=!0,u=h.pageX,i=h.pageY};e.removeEventListener("mousedown",c),e.addEventListener("mousedown",c,{passive:!0});let m=function(h){if(!l||!s)return;s=!1;let r=(h.pageX-u)*t.options.dragSpeed;t.move(r),u=h.pageX,i=h.pageY,setTimeout(()=>s=!0,10)};e.removeEventListener("mousemove",m),e.addEventListener("mousemove",m,{passive:!0});let b=function(){l=!1};e.removeEventListener("mouseup",b),document.addEventListener("mouseup",b,{passive:!0})}setupEventsHTML(e,t=null){let o=document.createDocumentFragment(),d=i=>{let l=i.startdate.getTime(),s=i.enddate.getTime(),c=this.getLeftRatio(l);if(l>this.endDate.getTime()||s<this.startDate.getTime())return null;let m=document.createElement("div"),h=Number(i.duration)*6e4/this.duration*100;return m.style.left=c*100+"%",m.style.width=h+"%",m.style.position="absolute",m.style.minWidth="5px",m.style.overflow="hidden",m.title=i.title,m.className="timelineEventGenerated",m.attributes.starttime=l,m.attributes.expanded=h>this.options.expandRatio,m},u=i=>{let l=document.createElement("div");return l.title=i.title,l.innerText=i.title,l.className="timelineEventGeneratedTitle",l.style.whiteSpace="nowrap",l};return e.filter(i=>i.type==="background").forEach((i,l)=>{try{let s=d(i);if(s){let c=i.color.map(m=>m-Math.pow(10,i.depth));switch(this.options.position){case"top":s.style.bottom="0px";break;default:s.style.bottom="50px"}s.style.minHeight="calc(100% - 50px)",s.style.backgroundColor=`rgba(${c[0]},${c[1]},${c[2]}, .05)`,s.append(u(i)),o.appendChild(s)}}catch(s){console.error(s,"backgroundEvent",i)}}),e.filter(i=>i.type==="timeline").forEach((i,l)=>{try{let s=d(i);if(s){let c=i.height+(i.height-1)*.5,m=(i.level-1+(t?t.level:1)-1)*1.5,b=!!s.attributes.expanded,h=i.color.map(r=>r-Math.pow(10,i.depth));switch(b&&i.events.length&&o.append(this.setupEventsHTML(i.events,i)),this.options.position){case"top":s.style.minHeight=`${c*this.options.eventHeight}px`,s.style.bottom=`${m*this.options.eventHeight}px`;break;default:s.style.bottom=`${m*this.options.eventHeight+50}px`,s.style.minHeight=`${c*this.options.eventHeight}px`}s.style.borderRadius="5px",s.style.boxShadow="inset #666 0px 0px 1px 0.5px",s.style.backgroundColor=`rgb(${h[0]},${h[1]},${h[2]})`,s.style.zIndex=i.depth.toString(),o.appendChild(s)}}catch(s){console.error(s,"timelineEvent",i)}}),o}setupContainerHTML(){this.element.style.position="relative",this.element.style.overflow="hidden",this.element.style.minHeight="3rem";let e=this.element.querySelector(".timelineLabelContainer");switch(this.labelContainer=e||document.createElement("div"),e||this.element.appendChild(this.labelContainer),this.labelContainer.className="timelineLabelContainer",this.labelContainer.style.width="100%",this.labelContainer.style.height="3rem",this.labelContainer.style.textAlign="center",this.labelContainer.style.position="absolute",this.options.position){case"top":this.labelContainer.style.top="0";break;default:this.labelContainer.style.bottom="0"}let t=this.element.querySelector(".timelineDividerContainer");this.dividerContainer=t||document.createElement("div"),t||this.element.appendChild(this.dividerContainer),this.dividerContainer.className="timelineDividerContainer",this.dividerContainer.style.width="100%",this.dividerContainer.style.height="100%",this.dividerContainer.style.position="absolute",this.dividerContainer.style.zIndex="-2";let o=this.element.querySelector(".timelineEventsContainer");this.eventsContainer=o||document.createElement("div"),o||this.element.appendChild(this.eventsContainer),this.eventsContainer.className="timelineEventsContainer",this.eventsContainer.style.position="absolute",this.eventsContainer.style.bottom="0",this.eventsContainer.style.height="100%",this.eventsContainer.style.width="100%"}format(e){let t=new Date(e);return this.duration<1440*6e5*4?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"}).format(t):this.duration<10080*6e5*6?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric"}).format(t):this.duration<43829.0639*6e5*18?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short"}).format(t):t.getFullYear().toString()}update(){if(!this.element)return;let e=Math.floor(this.ratio),t=Math.pow(2,Math.floor(Math.log2(e))),o=1/(this.options.labelCount+1),d=this.start-this.timelineStart.getTime(),i=this.timelineDuration*o/t,s=Math.floor(d/i)*i,c=document.createDocumentFragment(),m=document.createDocumentFragment();for(let r=0;r<this.options.labelCount+2;r++){let n=(r+1)*i+this.timelineStart.getTime()+s-i,a=n+i/2,y=this.getLeftRatio(n)*100,L=this.getLeftRatio(a)*100,p=document.createElement("div");p.className="timelineLabel",p.style.left=y+"%",p.style.top="50%",p.style.transform="translate(calc(-50%), calc(-50%))",p.style.textAlign="center",p.style.position="absolute",p.style.zIndex="-1",p.style.width=o*100+"%",p.innerHTML=this.format(n),c.appendChild(p);let f=document.createElement("div");f.className="timelineDivider",f.style.left=L+"%",f.style.textAlign="center",f.style.position="absolute",f.style.height="100%",f.style.zIndex="-10",f.innerHTML="",m.appendChild(f)}this.labelContainer.innerHTML="",this.labelContainer.appendChild(c),this.dividerContainer.innerHTML="",this.dividerContainer.appendChild(m);let b=this.setupEventsHTML(this.events);this.eventsContainer.innerHTML="",this.eventsContainer.appendChild(b);let h=new CustomEvent("update",{detail:this.toJSON(),bubbles:!0,cancelable:!0,composed:!1});this.element.dispatchEvent(h),this.callback&&this.callback(this)}parseDate(e){if(e===void 0)return new Date;if(Array.isArray(e)){let t=e;if(t.length===0)throw new Error("argument Array cannot be empty");if(!t.every(d=>typeof d=="number"))throw new Error("input Array must contain only numbers");return this.parseDateArray(t)}if(typeof e=="object"&&e.constructor.name==="Date")return e;if(typeof e=="string")return this.parseDateString(e);if(typeof e=="number")return new Date(e)}parseDateArray(e){let t=new Date;return t.setFullYear(e[0]||t.getFullYear()),t.setDate(e[2]?e[2]:1),t.setMonth(e[1]?e[1]-1:0),t.setHours(e[3]?e[3]:0),t.setMinutes(e[4]?e[4]:0),t.setSeconds(0),t}parseDateString(e){switch(e){case"now":return new Date;case"max":return new Date(864e13);case"min":return new Date(-864e13);default:let t=Number(e.replace(/y$/,""));if(!isNaN(t))return new Date(Date.now()+31556926*1e3*t);let o=new Date("0001-01-01"),d=Number(e.replace(/bc$/,""));if(!isNaN(d))return new Date(o.getTime()-31556926*1e3*d);let u=Number(e.replace(/ad$/,""));return isNaN(u)?new Date(e):new Date(o.getTime()+31556926*1e3*u)}}parseEvents(e,t=null){if(!Array.isArray(e))return console.warn("Events object is not an array",e),[];let o=r=>r.every(n=>typeof n=="number"),u=e.reduce((r,n)=>{n.depth=t?t.depth+1:0;let a=n.events?[...this.parseEvents(n.events,n)]:[];if(!n.startdate&&!a.length)return console.warn("Missing startdate on event",n,e),r;let v=n.startdate?a.length?this.parseDate(Math.min(this.parseDate(n.startdate).getTime(),this.parseDate(a[0].startdate).getTime())):this.parseDate(n.startdate):a[0].startdate,y=n.enddate?this.parseDate(n.enddate):n.duration&&!isNaN(Number(n.duration))?new Date(v.getTime()+Number(n.duration)*6e4):a.length?a[a.length-1].enddate:v,C=v.getTime(),p=(y.getTime()-C)/6e4,f=n.color?o(n.color)?n.color:[240,240,240]:[240,240,240];return r.push(D(T({duration:p,type:"timeline"},n),{color:f,startdate:v,enddate:y,events:a,height:a.length?Math.max.apply(1,a.map(S=>S.level)):1})),r},[]).sort((r,n)=>r.startdate.getTime()-n.startdate.getTime()),i={1:{height:0,time:Number.MIN_SAFE_INTEGER}},l=r=>{let n=0;for(let a in i)if(n=Number(a),r.startdate.getTime()>i[a].time){for(let v=0;v<r.height;v++)i[(n+v).toString()]={height:r.height,time:r.enddate.getTime()};return n}n++;for(let a=0;a<r.height;a++)i[(n+a).toString()]={height:r.height,time:r.enddate.getTime()};return n},s={1:{height:0,time:Number.MIN_SAFE_INTEGER}},c=r=>{let n=0;for(let a in s)if(n=Number(a),r.startdate.getTime()>s[a].time)return s[n.toString()]={height:r.height,time:r.enddate.getTime()},n;return n++,s[n.toString()]={height:r.height,time:r.enddate.getTime()},n},m=u.map((r,n)=>D(T({},r),{level:r.type==="timeline"?l(r):0,step:r.type==="timeline"?c(r):0})),b=r=>{let n=1;return n=r.duration/this.timelineDuration*r.height,n};return m.map((r,n)=>D(T({},r),{score:b(r)}))}parseTimelineHTML(e){let t=[],o=e.querySelectorAll(".timelineEvent");return o&&o.forEach(d=>{try{t.push(D(T({},d.attributes),{events:this.parseTimelineHTML(d)}))}catch(u){console.error(u,"timelineEvent")}}),t}toJSON(){return{options:this.options,startDate:this.startDate,endDate:this.endDate,duration:this.duration,ratio:this.ratio,pivot:this.pivot}}};window.Timeline=w;})();
