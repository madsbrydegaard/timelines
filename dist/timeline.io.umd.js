(()=>{var M=Object.defineProperty,S=Object.defineProperties;var E=Object.getOwnPropertyDescriptors;var T=Object.getOwnPropertySymbols;var H=Object.prototype.hasOwnProperty,x=Object.prototype.propertyIsEnumerable;var C=(u,e,t)=>e in u?M(u,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):u[e]=t,f=(u,e)=>{for(var t in e||(e={}))H.call(e,t)&&C(u,t,e[t]);if(T)for(var t of T(e))x.call(e,t)&&C(u,t,e[t]);return u},g=(u,e)=>S(u,E(e));var y=class{constructor(e,t,n,i){if(!e)throw new Error("Events argument is empty. Please add Array of events | DOM element | selector as first arg");if(typeof e=="string"){let s=document.querySelector(e);if(!s)throw new Error(`Selector could not be found [${e}]`);this.element=s}e instanceof HTMLElement&&(this.element=e);let d=[...Array.isArray(t)?t:[],...this.parseTimelineHTML(this.element)];this.events=[...this.parseEvents(d)],this.options=f({labelCount:5,zoomSpeed:.025,dragSpeed:.001,startDate:"-100y",endDate:"10y",timelineStartDate:"-1000y",timelineEndDate:"1000y",minZoom:1,maxZoom:1e11,position:"bottom",expandRatio:30,eventHeight:5},n),this.timelineStart=this.parseDate(this.options.timelineStartDate),this.timelineEnd=this.parseDate(this.options.timelineEndDate);let o=this.parseDate(this.options.startDate),l=this.parseDate(this.options.endDate);o.getTime()<this.timelineStart.getTime()&&(this.timelineStart=o),l.getTime()>this.timelineEnd.getTime()&&(this.timelineEnd=l);let r=l.getTime()-o.getTime();this.ratio=this.timelineDuration/r,this.pivot=(this.timelineStart.getTime()-o.getTime())/r,console.log(this.events),this.setupContainerHTML(),this.registerListeners(this.element),this.callback=i,this.update()}get timelineDuration(){return this.timelineEnd.getTime()-this.timelineStart.getTime()}get viewWidth(){var e;return((e=this.element)==null?void 0:e.offsetWidth)||0}get start(){return this.timelineStart.getTime()-this.duration*this.pivot}get end(){return this.start+this.duration}get duration(){return this.timelineDuration/this.ratio}get startDate(){return new Date(this.start)}get endDate(){return new Date(this.end)}setRatio(e,t){let n=this.ratio-t;return e===1&&n<=this.options.minZoom||e===-1&&n>=this.options.maxZoom?!1:(this.ratio=n,!0)}setPivot(e){let t=this.pivot+e;t>=0&&(t=0),t+this.ratio<=1&&(t=1-this.ratio),this.pivot=t}zoom(e,t){let n=this.options.zoomSpeed*this.ratio,i=e*n,l=((t||0)/this.viewWidth-this.pivot)/this.ratio*i;this.setRatio(e,i)&&this.setPivot(l),this.update()}move(e){this.setPivot(e),this.update()}registerListeners(e){let t=this;window.addEventListener("resize",function(){t.update()},{passive:!0}),e.addEventListener("wheel",function(l){l.preventDefault();var r=Math.sign(l.deltaY);t.zoom(r,l.offsetX)},{passive:!1});let n,i,d=!1,o=!0;e.addEventListener("mousedown",function(l){d=!0,n=l.pageX,i=l.pageY},{passive:!1}),e.addEventListener("mousemove",function(l){if(!d||!o)return;o=!1;let r=(l.pageX-n)*t.options.dragSpeed;t.move(r),n=l.pageX,i=l.pageY,setTimeout(()=>o=!0,10)},{passive:!1}),document.addEventListener("mouseup",function(){d=!1},{passive:!1})}setupEventsHTML(e,t){let n=document.createDocumentFragment();e.forEach((i,d)=>{try{let o=this.options.eventHeight,l=this.options.eventHeight,r=i.startdate.getTime(),s=i.enddate.getTime(),m=(r-this.startDate.getTime())/this.duration;if(r>this.endDate.getTime()||s<this.startDate.getTime())return;let a=document.createElement("div"),c=Number(i.duration)*6e4/this.duration*100,D=c>this.options.expandRatio,b=240-Math.pow(10,i.nestingLevel);D&&i.events.length?(this.setupEventsHTML(i.events,t),o=i.maxLevel+1+.5*(i.maxLevel+2),l=i.level,a.style.left=m*100-1+"%",a.style.width=c+2+"%"):(o=i.maxLevel+1,l=i.level+.5*(i.level+1),a.style.left=m*100+"%",a.style.width=c+"%"),a.style.minHeight=`${o*this.options.eventHeight}px`,a.style.bottom=`${l*this.options.eventHeight}px`,a.style.position="absolute",a.style.minWidth="5px",a.style.borderRadius="5px",a.style.border="solid 1px black",a.style.backgroundColor=`rgb(${b},${b},${b})`,a.style.zIndex=i.nestingLevel.toString(),a.title=i.title,a.className="timelineEventGenerated",n.appendChild(a)}catch(o){console.error(o,"timelineEvent",i)}}),t.appendChild(n)}setupContainerHTML(){this.element.style.position="relative",this.element.style.overflow="hidden",this.element.style.minHeight="3rem",this.element.style.zIndex="0";let e=this.element.querySelector(".timelineLabelContainer");switch(this.labelContainer=e||document.createElement("div"),e||this.element.appendChild(this.labelContainer),this.labelContainer.className="timelineLabelContainer",this.labelContainer.style.width="100%",this.labelContainer.style.height="3rem",this.labelContainer.style.textAlign="center",this.labelContainer.style.position="absolute",this.labelContainer.style.zIndex="-9",this.options.position){case"top":this.labelContainer.style.top="0";break;case"center":this.labelContainer.style.top="50%",this.labelContainer.style.transform="translate(0, calc(-50%))";break;default:this.labelContainer.style.bottom="0"}let t=this.element.querySelector(".timelineDividerContainer");this.dividerContainer=t||document.createElement("div"),t||this.element.appendChild(this.dividerContainer),this.dividerContainer.className="timelineDividerContainer",this.dividerContainer.style.width="100%",this.dividerContainer.style.height="100%",this.dividerContainer.style.position="absolute",this.dividerContainer.style.zIndex="-10";let n=this.element.querySelector(".timelineEventsContainer");this.eventsContainer=n||document.createElement("div"),n||this.element.appendChild(this.eventsContainer),this.eventsContainer.className="timelineEventsContainer",this.eventsContainer.style.position="absolute",this.eventsContainer.style.bottom="4rem",this.eventsContainer.style.width="100%",this.eventsContainer.style.zIndex="-1"}format(e){let t=new Date(e);return this.duration<1440*6e5*4?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"}).format(t):this.duration<10080*6e5*6?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric"}).format(t):this.duration<43829.0639*6e5*18?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short"}).format(t):t.getFullYear().toString()}update(){if(!this.element)return;let e=Math.floor(this.ratio),t=Math.pow(2,Math.floor(Math.log2(e))),n=1/(this.options.labelCount+1),i=this.start-this.timelineStart.getTime(),o=this.timelineDuration*n/t,r=Math.floor(i/o)*o,s=document.createDocumentFragment(),m=document.createDocumentFragment();for(let v=0;v<this.options.labelCount+2;v++){let c=(v+1)*o+this.timelineStart.getTime()+r-o,D=c+o/2,w=this.toJSON().getLeftRatio(c)*100,L=this.toJSON().getLeftRatio(D)*100,h=document.createElement("div");h.className="timelineLabel",h.style.left=w+"%",h.style.top="50%",h.style.transform="translate(calc(-50%), calc(-50%))",h.style.textAlign="center",h.style.position="absolute",h.style.zIndex="-1",h.style.width=n*100+"%",h.innerHTML=this.format(c),s.appendChild(h);let p=document.createElement("div");p.className="timelineDivider",p.style.left=L+"%",p.style.textAlign="center",p.style.position="absolute",p.style.height="100%",p.style.zIndex="-10",p.innerHTML="",m.appendChild(p)}this.labelContainer.innerHTML="",this.labelContainer.appendChild(s),this.dividerContainer.innerHTML="",this.dividerContainer.appendChild(m),this.eventsContainer.innerHTML="",this.setupEventsHTML(this.events,this.eventsContainer);let a=new CustomEvent("update",{detail:this.toJSON(),bubbles:!0,cancelable:!0,composed:!1});this.element.dispatchEvent(a),this.callback&&this.callback(this)}parseDate(e){if(e===void 0)return new Date;if(Array.isArray(e)){let t=e;if(t.length===0)throw new Error("argument Array cannot be empty");if(!t.every(i=>typeof i=="number"))throw new Error("input Array must contain only numbers");return this.parseDateArray(t)}if(typeof e=="object"&&e.constructor.name==="Date")return e;if(typeof e=="string")return this.parseDateString(e);if(typeof e=="number")return new Date(e)}parseDateArray(e){let t=new Date;return t.setFullYear(e[0]||t.getFullYear()),t.setDate(e[2]?e[2]:1),t.setMonth(e[1]?e[1]-1:0),t.setHours(e[3]?e[3]:0),t.setMinutes(e[4]?e[4]:0),t.setSeconds(0),t}parseDateString(e){switch(e){case"now":return new Date;case"max":return new Date(864e13);case"min":return new Date(-864e13);default:let t=Number(e.replace(/y$/,""));if(!isNaN(t))return new Date(Date.now()+31556926*1e3*t);let n=new Date("0001-01-01"),i=Number(e.replace(/bc$/,""));if(!isNaN(i))return new Date(n.getTime()-31556926*1e3*i);let d=Number(e.replace(/ad$/,""));return isNaN(d)?new Date(e):new Date(n.getTime()+31556926*1e3*d)}}parseEvents(e,t=0){if(!Array.isArray(e))return console.warn("Events object is not an array",e),[];let n={0:Number.MIN_SAFE_INTEGER},i=(r,s)=>{let m=0;for(let a in n)if(r>n[a])return m=Number(a),n[m.toString()]=s,m;return m++,n[m.toString()]=s,m};return e.reduce((r,s)=>{let m=s.events?[...this.parseEvents(s.events,t+1)]:[];if(!s.startdate&&!m.length)return console.warn("Missing startdate on event",s,e),r;let a=s.startdate?this.parseDate(s.startdate):m[0].startdate,v=s.enddate?this.parseDate(s.enddate):s.duration&&!isNaN(Number(s.duration))?new Date(a.getTime()+Number(s.duration)*6e4):m.length?m[m.length-1].enddate:a,c=a.getTime(),b=(v.getTime()-c)/6e4;return r.push(g(f({duration:b},s),{startdate:a,enddate:v,events:m,nestingLevel:t})),r},[]).sort((r,s)=>r.startdate.getTime()-s.startdate.getTime()).map(r=>g(f({},r),{level:i(r.startdate.getTime(),r.enddate.getTime())})).map(r=>g(f({},r),{maxLevel:r.events.length?Math.max.apply(0,r.events.map(s=>s.level)):0}))}parseTimelineHTML(e){let t=[],n=e.querySelectorAll(".timelineEvent");return n&&n.forEach(i=>{try{t.push(g(f({},i.attributes),{events:this.parseTimelineHTML(i)}))}catch(d){console.error(d,"timelineEvent")}}),t}addCSS(e){document.head.appendChild(document.createElement("style")).innerHTML=e}toJSON(){return{options:this.options,startDate:this.startDate,endDate:this.endDate,duration:this.duration,ratio:this.ratio,pivot:this.pivot,getLeftRatio:e=>(e-this.startDate.getTime())/this.duration}}};window.Timeline=y;})();
