(()=>{var Ve=Object.defineProperty,je=Object.defineProperties;var Ze=Object.getOwnPropertyDescriptors;var De=Object.getOwnPropertySymbols;var Ge=Object.prototype.hasOwnProperty,Ke=Object.prototype.propertyIsEnumerable;var Te=(C,M,c)=>M in C?Ve(C,M,{enumerable:!0,configurable:!0,writable:!0,value:c}):C[M]=c,ee=(C,M)=>{for(var c in M||(M={}))Ge.call(M,c)&&Te(C,c,M[c]);if(De)for(var c of De(M))Ke.call(M,c)&&Te(C,c,M[c]);return C},oe=(C,M)=>je(C,Ze(M));var pe=(C,M)=>{let c,L,H,j,p,o,y,S,N,I,R,_,x,F,$,ae,U=!1,Z=!1,me=0,te=1,Me=1440,ye=10080,V=525948.766,we=V/12*18,Ne=ye*6,Ie=Me*4,de=e=>"timelineEventDetails"in e,Ce=(...e)=>{if(!e)throw new Error("Event argument is empty. Please provide Timeline event(s) as input");ge(_,...e),o.autoFocusOnTimelineAdd?ne(_,!1):A()},ue=e=>e.timelineEventDetails.startMinutes<k()&&e.timelineEventDetails.endMinutes>K(),Se=(e,n)=>{if(!e)throw new Error("Element argument is empty. DOM element | selector as first arg");if(typeof e=="string"){let m=document.querySelector(e);if(!m)throw new Error(`Selector could not be found [${p}]`);p=m}e instanceof HTMLElement&&(p=e),o=ee({labelCount:5,zoomSpeed:.04,dragSpeed:.001,timelineStart:"-1B",timelineEnd:"1M",start:"-100y",end:"now",minZoom:1,maxZoom:1e11,position:"bottom",eventHeight:5,eventSpacing:3,autoZoom:!1,zoomMargin:.1,autoSelect:!1,autoFocusOnTimelineAdd:!1,autoDeselectOutside:!1,includeBackgroundOnAutoFocus:!1,defaultColor:"#aaa",defaultHighlightedColor:"#444",defaultBackgroundColor:"#eeee",defaultBackgroundHightligtedColor:"#eee7",zoomDuration:200,easing:"easeOutCubic",numberOfHighscorePreviews:5,highscorePreviewDelay:500,highscorePreviewWidth:100,classNames:{timeline:"tl",timelineEvent:"tl__event",timelinePreview:"tl__preview",timelineEventTitle:"tl__event__title",timelineLabels:"tl__labels",timelineDividers:"tl__dividers",timelineEvents:"tl__events",timelinePreviews:"tl__previews",timelineIo:"tl__io",timelineLabel:"tl__label",timelineDivider:"tl__divider"}},n),_=Ee({title:"View",type:"container",start:o.start,end:o.end}),H=Q(o.timelineStart),j=Q(o.timelineEnd);let s=_.timelineEventDetails.startMinutes,i=_.timelineEventDetails.endMinutes;s<H&&(H=s),i>j&&(j=i);let l=i-s;c=G()/l,L=(H-s)/l,Be(),_e(p),ne(_,!1)},G=()=>j-H,ie=()=>p.getBoundingClientRect().width||0,k=()=>H-B()*L,K=()=>k()+B(),B=()=>G()/c,Le=()=>o.zoomSpeed*c,O=e=>(e-k())/B(),xe=(e,n)=>{let s=c-n;return e===1&&s<=o.minZoom||e===-1&&s>=o.maxZoom?!1:(c=s,!0)},ce=e=>{let n=L+e;n>=0&&(n=0),n+c<=1&&(n=1-c),L=n},Fe=(e,n)=>{let s=e*Le(),i=n*s;xe(e,s)&&ce(i),A()},He=e=>{ce(e*o.dragSpeed*te),A()},ne=(e,n=!0,s)=>{if(!e)throw"first argument 'timelineEvent' of method 'zoom' must be an object";if(!de(e))throw"first argument 'timelineEvent' of method 'zoom' must be an object of type ITimelineEventWithDetails";x=e,q(),J(e,n,s)},Ae=()=>{Z=!1,U=!1,x=_,J(x)},z=(e,n)=>{let s,i=n||_;if(i.timelineEventDetails.id===e)return i;for(let l of i.timelineEventDetails.childrenByStartMinute)if(l.title===e||l.timelineEventDetails.id===e){s=l;break}else if(s=z(e,l),s)break;return s},q=e=>{try{if(!e)F=[];else if(typeof e=="string")if(e==="next"){let n=z(F[0]);if(!n)throw"No event selected";if(!n.timelineEventDetails.next)throw"No next event available";F=[n.timelineEventDetails.next],g("selected.tl.event",z(F[0]))}else if(e==="previous"){let n=z(F[0]);if(!n)throw"No event selected";if(!n.timelineEventDetails.previous)throw"No previous event available";F=[n.timelineEventDetails.previous],g("selected.tl.event",z(F[0]))}else{let n=z(e);if(!n)throw`Cannot find ${e} by title nor timelineEventDetails.id`;F=[n.timelineEventDetails.id],g("selected.tl.event",n)}A()}catch(n){Ue(n)}},J=(e,n=!0,s)=>{if(!e)throw"first argument 'timelineEvent' of method 'zoom' must be an object";if(!de(e))throw"first argument 'timelineEvent' of method 'zoom' must be an object of type ITimelineEventWithDetails";let i=o.includeBackgroundOnAutoFocus?e.timelineEventDetails.startMinutes:e.timelineEventDetails.startMinutesForTimelineChildren,l=o.includeBackgroundOnAutoFocus?e.timelineEventDetails.endMinutes:e.timelineEventDetails.endMinutesForTimelineChildren;Pe(i,l,n,()=>{g("zoom.tl.event",e),s&&s(e)})},Pe=(e,n,s=!0,i)=>{if(!e)throw"first argument 'startMinutes' of method 'zoomto' must be a number";if(!n)throw"second argument 'endMinutes' of method 'zoomto' must be a number";let l=(n-e)*o.zoomMargin,m=e-l,v=n+l-m,b=G()/v,f=(H-m)/v;s?(()=>{let h=0,t=o.zoomDuration,r={easeOutExpo:(P,W,X,Y)=>P==Y?W+X:X*(-Math.pow(2,-10*P/Y)+1)+W,easeOutCubic:(P,W,X,Y)=>X*((P=P/Y-1)*P*P+1)+W,easeLinear:(P,W,X,Y)=>X*P/Y+W},a=c,d=L,D=b-c,u=f-L,T=typeof o.easing=="string"?r[o.easing]:o.easing,le=setInterval(()=>{++h>t&&(clearInterval(le),i&&i()),c=T(h,a,D,t),L=T(h,d,u,t),A()},1)})():(c=b,L=f,A(),i&&i())},_e=e=>{let n=[],s,i,l=!1,m=(t,r)=>{if(l){let a=t-s,d=r-i;w(a,d),s=t,i=r}v(t,r)},w=(t,r)=>{t&&He(t),g("drag.tl.container")},v=(t,r)=>{let d=document.elementsFromPoint(t,r).find(u=>u.hasAttribute("eventid"));if(!d){e.style.cursor="",e.title="";return}let D=$.find(u=>u.timelineEventDetails.id===d.getAttribute("eventid"));D?(g("hover.tl.event",D),e.style.cursor="pointer",e.title=D.title):(e.style.cursor="",e.title="")},b=(t,r)=>{let d=(t/ie()-L)/c;Fe(r,d),g("pinch.tl.container")},f=t=>{o.autoSelect&&t.detail.timelineEvent&&q(t.detail.timelineEvent.timelineEventDetails.id)},E=t=>{o.autoZoom&&t.detail.timelineEvent&&J(t.detail.timelineEvent)},h=(t,r)=>{let d=document.elementsFromPoint(t,r).find(T=>T.hasAttribute("eventid"));if(!d){o.autoDeselectOutside&&!Z&&!U&&q();return}let D=d.getAttribute("eventid"),u=$.find(T=>T.timelineEventDetails.id===D);u&&g("click.tl.event",u)};window.addEventListener("resize",t=>{A(),g("resize.tl.container")}),e.addEventListener("wheel",t=>{if(t.defaultPrevented)return;t.preventDefault();var r=Math.sign(t.deltaY);let d=(t.target.attributes.starttime?O(t.target.attributes.starttime):0)*ie()+t.offsetX;b(d,r),g("wheel.tl.container")}),e.addEventListener("touchstart",t=>{t.preventDefault(),n=[],n.push(...t.targetTouches),g("touchstart.tl.container")}),e.addEventListener("touchend",t=>{h(n[0].clientX,n[0].clientY),l=!1,g("touchend.tl.container")},{passive:!0}),e.addEventListener("touchmove",t=>{if(t.targetTouches.length===2&&t.changedTouches.length===2){let a=n.findIndex(D=>D.identifier===t.targetTouches[0].identifier),d=n.findIndex(D=>D.identifier===t.targetTouches[1].identifier);if(a>=0&&d>=0){let D=Math.abs(n[a].clientX-n[d].clientX),u=Math.abs(t.targetTouches[0].clientX-t.targetTouches[1].clientX),T=D-u,le=Math.min(t.targetTouches[0].clientX,t.targetTouches[1].clientX)+u/2;var r=Math.sign(T);b(le,r)}}if(t.targetTouches.length===1&&t.changedTouches.length===1){let a=n.findIndex(d=>d.identifier===t.targetTouches[0].identifier);a>=0&&t.targetTouches[0].clientX-n[a].clientX!==0&&(l=!0,te=3,s=n[a].clientX,i=n[a].clientY,m(t.targetTouches[0].clientX,t.targetTouches[0].clientY))}n=[],n.push(...t.targetTouches),g("touchmove.tl.container")},{passive:!0}),e.addEventListener("mousedown",t=>{s=t.clientX,i=t.clientY,l=!0,te=1,g("mousedown.tl.container")},{passive:!0}),e.addEventListener("mousemove",t=>{m(t.clientX,t.clientY),g("mousemove.tl.container")},{passive:!0}),e.addEventListener("mouseup",t=>{l=!1,g("mouseup.tl.container")},{passive:!0}),e.addEventListener("click",t=>h(t.clientX,t.clientY)),e.addEventListener("click.tl.event",f),e.addEventListener("selected.tl.event",E),e.addEventListener("update.tl.container",We)},ke=()=>{let e=document.createDocumentFragment(),n=document.createElementNS("http://www.w3.org/2000/svg","svg");n.style.height="100%",n.style.width="100%",n.style.position="absolute",e.append(n);let s=$.filter(i=>!!i.timelineEventDetails.previewNode).filter(i=>!i.preventNextPreviewRender).sort((i,l)=>l.timelineEventDetails.score-i.timelineEventDetails.score).slice(0,o.numberOfHighscorePreviews).sort((i,l)=>i.timelineEventDetails.startMinutes-l.timelineEventDetails.startMinutes);for(let[i,l]of s.entries()){let m=1/s.length,w=o.highscorePreviewWidth/ie(),v=m*i+m/2-w/2,b=Math.random()/3+.08;(()=>{l.timelineEventDetails.previewNode.style.left=v*100+"%",l.timelineEventDetails.previewNode.style.top=b*100+"%";let E=O(l.timelineEventDetails.startMinutes+l.timelineEventDetails.durationMinutes/2);ue(l)&&(E=.5),E>1&&(E=O(l.timelineEventDetails.startMinutes+(K()-l.timelineEventDetails.startMinutes)/2)),E<0&&(E=O((k()+l.timelineEventDetails.endMinutes)/2));let h=document.createElementNS("http://www.w3.org/2000/svg","line");h.setAttribute("x1",`calc(${(v+w/2)*100}%)`),h.setAttribute("y1",`calc(${b*100}% + 50px)`),h.setAttribute("x2",E*100+"%"),h.setAttribute("y2",l.timelineEventDetails.eventNode.offsetTop+"px"),h.setAttribute("style",`stroke:${l.color};stroke-width:2`),n.appendChild(h),e.append(l.timelineEventDetails.previewNode)})()}return $.forEach(i=>{i.preventNextPreviewRender=!1}),e},se=e=>{let n=document.createDocumentFragment();for(let s of e.timelineEventDetails.childrenByStartMinute){if(!s||!s.timelineEventDetails||s.timelineEventDetails.startMinutes>=K()||s.timelineEventDetails.endMinutes<=k())continue;let i=ue(s),l=i?0:O(s.timelineEventDetails.startMinutes),m=i?100:s.timelineEventDetails.durationMinutes/B()*100,w=!!F.length&&!!F.find(f=>f===s.timelineEventDetails.id),v=(s.timelineEventDetails.level-1)*o.eventHeight+s.timelineEventDetails.level*o.eventSpacing,b=(e.timelineEventDetails.step-1)*o.eventSpacing;switch(s.type){default:{n.append(se(s));continue}case"container":{let f=s.timelineEventDetails.height*o.eventHeight+s.timelineEventDetails.height*o.eventSpacing+s.timelineEventDetails.step*o.eventSpacing;s.timelineEventDetails.eventNode.style.bottom=`${f+v+b}px`,n.append(s.timelineEventDetails.eventNode),n.append(se(s));continue}case"timeline":{let f=(e.timelineEventDetails.level-1)*o.eventHeight+(e.timelineEventDetails.level-1)*o.eventSpacing;s.timelineEventDetails.eventNode.style.bottom=`${f+v+b}px`,s.timelineEventDetails.eventNode.style.backgroundColor=w?s.highlightedColor:s.color;break}case"background":break}s.timelineEventDetails.eventNode.style.left=l*100+"%",s.timelineEventDetails.eventNode.style.width=m+"%",s.timelineEventDetails.eventNode.attributes.starttime=i?k():s.timelineEventDetails.startMinutes,n.append(s.timelineEventDetails.eventNode),$.push(s)}return n},Be=()=>{switch(p.style.position="relative",p.style.overflow="hidden",p.style.minHeight="3rem",y=document.createElement("div"),p.appendChild(y),y.classList.add(o.classNames.timelineLabels),y.style.width="100%",y.style.height="50px",y.style.textAlign="center",y.style.position="absolute",y.style.pointerEvents="none",y.style.userSelect="none",o.position){case"top":y.style.top="0";break;default:y.style.bottom="0"}S=document.createElement("div"),p.appendChild(S),S.classList.add(o.classNames.timelineDividers),S.style.width="100%",S.style.height="100%",S.style.position="absolute",S.style.zIndex="-2",S.style.bottom="0",N=document.createElement("div"),p.appendChild(N),N.classList.add(o.classNames.timelineEvents),N.style.position="absolute",N.style.bottom="50px",N.style.height="calc(100% - 50px)",N.style.width="100%",N.style.overflowY="auto",N.style.overflowX="hidden",I=document.createElement("div"),p.appendChild(I),I.classList.add(o.classNames.timelinePreviews),I.style.position="absolute",I.style.bottom="50px",I.style.height="calc(100% - 50px)",I.style.width="100%",I.style.overflowY="auto",I.style.overflowX="hidden",R=document.createElement("div"),p.appendChild(R),R.classList.add(o.classNames.timelineIo),R.style.position="absolute",R.style.bottom="0",R.style.top="0",R.style.width="100%"},Re=()=>{let e=Math.floor(c),n=Math.pow(2,Math.floor(Math.log2(e))),s=1/(o.labelCount+1),i=k()-H,m=G()*s/n,v=Math.floor(i/m)*m,b=document.createDocumentFragment(),f=document.createDocumentFragment();for(let E=0;E<o.labelCount+2;E++){let h=(E+1)*m+H+v-m,t=h+m/2,a=O(h)*100,D=O(t)*100,u=document.createElement("div");u.classList.add(o.classNames.timelineLabel),u.style.left=a+"%",u.style.top="50%",u.style.transform="translate(calc(-50%), calc(-50%))",u.style.textAlign="center",u.style.position="absolute",u.style.zIndex="-1",u.style.width=s*100+"%",u.innerHTML=re(h),b.appendChild(u);let T=document.createElement("div");T.classList.add(o.classNames.timelineDivider),T.style.left=D+"%",T.style.textAlign="center",T.style.position="absolute",T.style.height="100%",T.style.zIndex="-10",T.innerHTML="",f.appendChild(T)}y.appendChild(b),S.appendChild(f)},Oe=()=>{let e=se(x);e&&N.appendChild(e)},$e=()=>{if(!Z&&!U){let e=ke();e&&I.appendChild(e)}U=!1},re=e=>{let n=Math.floor(e/V),s=n+1970,l=s>-1e4&&s<1e4?s.toString():s.toLocaleString("en-US",{notation:"compact",minimumFractionDigits:1,maximumFractionDigits:1}),m=Math.abs(e-n*V),v=e>27e4*V*-1&&e<27e4*V?new Date(e*6e4):new Date(m*6e4);return B()<Ie?[Intl.DateTimeFormat(void 0,{month:"short",day:"numeric"}).format(v),l,Intl.DateTimeFormat(void 0,{hour:"numeric",minute:"numeric"}).format(v)].join(" "):B()<Ne?[Intl.DateTimeFormat(void 0,{month:"short",day:"numeric"}).format(v),l].join(" "):B()<we?[Intl.DateTimeFormat(void 0,{month:"short"}).format(v),l].join(" "):l},A=()=>{S&&(S.innerHTML=""),y&&(y.innerHTML=""),N&&(N.innerHTML=""),I&&(I.innerHTML=""),$=[],g("update.tl.container")},ze=()=>{!x||(x.events=[],x.timelineEventDetails.childrenByStartMinute=[],x.timelineEventDetails.timelineLevelMatrix={1:{height:0,time:Number.MIN_SAFE_INTEGER}},x.timelineEventDetails.backgroundLevelMatrix={1:{height:0,time:Number.MIN_SAFE_INTEGER}},me=0,g("cleared.tl.container"),A())},We=()=>{Re(),Oe(),o.numberOfHighscorePreviews>0&&(clearTimeout(ae),ae=setTimeout(()=>{$e()},o.highscorePreviewDelay))},Q=e=>{if(e===void 0)return;let n=i=>{let l=new Date;return l.setDate(i[2]?i[2]:1),l.setMonth(i[1]?i[1]-1:0),l.setHours(i[3]?i[3]:0),l.setMinutes(i[4]?i[4]:0),l.setSeconds(0),i[0]?i[0]&&i[0]>-27e4&&i[0]<27e4?(l.setFullYear(i[0]),l.getTime()/6e4):525948.766*i[0]+l.getTime()/6e4:l.getTime()/6e4},s=i=>{switch(i){case"now":return n([]);default:let l=i.match(/y$/)?Number(i.replace(/y$/,"")):NaN;if(!isNaN(l))return n([l+1970]);let m=i.match(/K$/)?Number(i.replace(/K$/,"")):NaN;if(!isNaN(m))return n([m*1e3]);let w=i.match(/M$/)?Number(i.replace(/M$/,"")):NaN;if(!isNaN(w))return n([w*1e6]);let v=i.match(/B$/)?Number(i.replace(/B$/,"")):NaN;if(!isNaN(v))return n([v*1e9]);let b=i.match(/bc$/)?Number(i.replace(/bc$/,"")):NaN;if(!isNaN(b))return n([-b]);let f=i.match(/ad$/)?Number(i.replace(/ad$/,"")):NaN;if(!isNaN(f))return n([f]);let E=Number(i);if(!isNaN(E))return new Date().getTime()/6e4+E*6e4;let h=Date.parse(i);return isNaN(h)?new Date().getTime()/6e4:h/6e4}};if(Array.isArray(e)){let i=e;if(i.length===0)throw new Error("argument Array cannot be empty");if(!i.every(m=>typeof m=="number"))throw new Error("input Array must contain only numbers");return n(i)}if(typeof e=="object"&&e.constructor.name==="Date")return e.getTime()/6e4;if(typeof e=="string")return s(e);if(typeof e=="number")return new Date(e).getTime()/6e4},Xe=e=>{if(e!==void 0){if(typeof e=="string"){let n=e.match(/s$/)?Number(e.replace(/s$/,"")):NaN;if(!isNaN(n))return n/60;let s=e.match(/H$/)?Number(e.replace(/H$/,"")):NaN;if(!isNaN(s))return s*60;let i=e.match(/d$/)?Number(e.replace(/d$/,"")):NaN;if(!isNaN(i))return i*24*60;let l=e.match(/w$/)?Number(e.replace(/w$/,"")):NaN;if(!isNaN(l))return l*7*24*60;let m=Number(e);if(!isNaN(m))return m}if(typeof e=="number")return e}},ve=e=>e.timelineEventDetails.childrenByStartMinute.length?Math.min(e.timelineEventDetails.startMinutes||Number.MAX_SAFE_INTEGER,e.timelineEventDetails.childrenByStartMinute[0].timelineEventDetails.startMinutes):e.timelineEventDetails.startMinutes,he=e=>e.timelineEventDetails.childrenByStartMinute.length?Math.max.apply(1,e.timelineEventDetails.childrenByStartMinute.map(s=>s.timelineEventDetails.endMinutes)):e.timelineEventDetails.endMinutes?e.timelineEventDetails.endMinutes:e.timelineEventDetails.durationMinutes?e.timelineEventDetails.startMinutes+e.timelineEventDetails.durationMinutes:e.timelineEventDetails.startMinutes+1,fe=e=>{let n=e.timelineEventDetails.childrenByStartMinute.filter(i=>["background"].find(l=>l!==i.type)&&(!!i.timelineEventDetails.hasTimelineEvents||!i.timelineEventDetails.childrenByStartMinute.length));return n.length?Math.min(e.timelineEventDetails.startMinutesForTimelineChildren||Number.MAX_SAFE_INTEGER,n[0].timelineEventDetails.startMinutesForTimelineChildren):e.timelineEventDetails.startMinutesForTimelineChildren||e.timelineEventDetails.startMinutes},be=e=>{let n=e.timelineEventDetails.childrenByStartMinute.filter(i=>["background"].find(l=>l!==i.type)&&(!!i.timelineEventDetails.hasTimelineEvents||!i.timelineEventDetails.childrenByStartMinute.length));return n.length?Math.max.apply(1,n.map(i=>i.timelineEventDetails.endMinutesForTimelineChildren)):e.timelineEventDetails.endMinutesForTimelineChildren?e.timelineEventDetails.endMinutesForTimelineChildren:e.timelineEventDetails.durationMinutesForTimelineChildren?e.timelineEventDetails.startMinutesForTimelineChildren+e.timelineEventDetails.durationMinutesForTimelineChildren:e.timelineEventDetails.endMinutes?e.timelineEventDetails.endMinutes:e.timelineEventDetails.startMinutesForTimelineChildren+1},ge=(e,...n)=>{let s=n.map(t=>Ee(t,e)).filter(t=>!!t).sort((t,r)=>t.timelineEventDetails.startMinutes-r.timelineEventDetails.startMinutes),i=t=>{let r=document.createElement("div");return r.style.boxSizing="border-box",r.style.position="absolute",r.style.minWidth="5px",r.classList.add(o.classNames.timelineEvent),r.setAttribute("level",t.timelineEventDetails.level.toString()),r.setAttribute("depth",t.timelineEventDetails.depth.toString()),r.setAttribute("score",t.timelineEventDetails.score.toString()),r.setAttribute("step",t.timelineEventDetails.step.toString()),r},l=t=>{let r=i(t);if(r.style.minHeight=`${o.eventHeight}px`,r.style.cursor="pointer",r.style.borderRadius="5px",r.title=t.title,t.renderEventNode){let a=document.createElement("div");a.append(t.renderEventNode(t)),r.append(a)}r.setAttribute("eventid",t.timelineEventDetails.id),t.timelineEventDetails.eventNode=r},m=t=>{let r=i(t),a=(t.timelineEventDetails.level-1)*25;if(r.style.bottom="0",r.style.top=`${a}px`,r.style.zIndex="-1",r.style.overflow="hidden",r.style.background=`linear-gradient(to right, ${o.defaultBackgroundColor}, 1px, #0000)`,r.title=t.title,t.renderEventNode){let d=document.createElement("div");d.append(t.renderEventNode(t)),d.setAttribute("eventid",t.timelineEventDetails.id),r.append(d)}t.timelineEventDetails.eventNode=r},w=t=>{let r=i(t);if(r.style.height="15px",r.style.borderBottomColor=o.defaultBackgroundColor,r.style.borderBottomWidth="1px",r.style.borderBottomStyle="solid",r.style.width="100%",t.title){let a=document.createElement("div");a.style.position="relative",a.style.bottom="-12px",a.style.fontSize="x-small",a.style.width="fit-content",a.style.backgroundColor="white",a.style.zIndex="1",a.style.padding="0px 3px 0px 3px",a.append(t.title),r.appendChild(a)}t.timelineEventDetails.eventNode=r},v=t=>{if(!t.renderPreviewNode)return;let r=document.createElement("div");r.style.boxSizing="border-box",r.style.position="absolute",r.style.overflow="hidden",r.style.width=o.highscorePreviewWidth+"px",r.title=t.title,r.classList.add(o.classNames.timelinePreview),r.setAttribute("eventid",t.timelineEventDetails.id),r.append(t.renderPreviewNode(t)),t.timelineEventDetails.previewNode=r},b=t=>{let a=t.timelineEventDetails.durationMinutes/e.timelineEventDetails.durationMinutes*(t.timelineEventDetails.childrenByStartMinute.length+1);t.timelineEventDetails.score=a},f=(t,r,a=!0)=>{let d=0,D=0;for(let u in r){if(d=Number(u),a?t.timelineEventDetails.startMinutes>=r[u].time:t.timelineEventDetails.startMinutes>r[u].time){r[u]={height:t.timelineEventDetails.height,time:t.timelineEventDetails.endMinutes},t.timelineEventDetails.level=d;return}D=r[u].height}d+=D,r[d.toString()]={height:t.timelineEventDetails.height,time:t.timelineEventDetails.endMinutes},t.timelineEventDetails.level=d},E=(t,r)=>{t.timelineEventDetails.next=e.timelineEventDetails.childrenByStartMinute.length>r+1?e.timelineEventDetails.childrenByStartMinute[r+1].timelineEventDetails.id:void 0,t.timelineEventDetails.previous=r>0?e.timelineEventDetails.childrenByStartMinute[r-1].timelineEventDetails.id:void 0},h=t=>{t.timelineEventDetails.step=t.step||++me};e.timelineEventDetails.childrenByStartMinute.push(...s),e.timelineEventDetails.hasTimelineEvents=e.timelineEventDetails.childrenByStartMinute.some(t=>t.type==="timeline"),e.timelineEventDetails.startMinutes=ve(e),e.timelineEventDetails.startMinutesForTimelineChildren=fe(e),e.timelineEventDetails.endMinutes=he(e),e.timelineEventDetails.endMinutesForTimelineChildren=be(e),e.timelineEventDetails.durationMinutes=e.timelineEventDetails.endMinutes-e.timelineEventDetails.startMinutes,e.timelineEventDetails.durationMinutesForTimelineChildren=e.timelineEventDetails.endMinutesForTimelineChildren-e.timelineEventDetails.startMinutesForTimelineChildren,e.timelineEventDetails.childrenByStartMinute.forEach((t,r)=>{switch(t.type){case"container":h(t),f(t,e.timelineEventDetails.timelineLevelMatrix),w(t);break;case"timeline":b(t),f(t,e.timelineEventDetails.timelineLevelMatrix,!1),l(t);break;case"background":f(t,x.timelineEventDetails.backgroundLevelMatrix),m(t);break;default:}v(t),E(t,r)}),e.timelineEventDetails.height=Math.max(...Object.entries(e.timelineEventDetails.timelineLevelMatrix).map(([t,r])=>Number(t)))},Ee=(e,n)=>{if(!e){console.warn("Event object is empty");return}let s=e.type||e.start?e.type||"timeline":"wrapper",i=oe(ee({},e),{type:s,color:s==="timeline"?e.color||o.defaultColor:s==="background"?e.color||o.defaultBackgroundColor:void 0,highlightedColor:s==="timeline"?e.highlightedColor||o.defaultHighlightedColor:s==="background"?e.highlightedColor||o.defaultBackgroundHightligtedColor:void 0,timelineEventDetails:{id:crypto.randomUUID(),level:0,step:e.step||(n==null?void 0:n.step)||0,score:0,height:1,childrenByStartMinute:[],childrenByScore:[],depth:n?n.timelineEventDetails.depth+1:0,parentId:n==null?void 0:n.timelineEventDetails.id,startMinutes:Q(e.start),endMinutes:Q(e.end),durationMinutes:Xe(e.duration)||0,timelineLevelMatrix:{1:{height:0,time:Number.MIN_SAFE_INTEGER}},backgroundLevelMatrix:{1:{height:0,time:Number.MIN_SAFE_INTEGER}}}});if(n&&i.type==="timeline"&&n.type==="wrapper"&&(n.type="container"),e.events&&e.events.length&&ge(i,...e.events),i.timelineEventDetails.startMinutes=ve(i),i.timelineEventDetails.startMinutesForTimelineChildren=fe(i),!i.timelineEventDetails.startMinutes){console.warn("Missing start property on event - skipping",e);return}return i.timelineEventDetails.endMinutes=he(i),i.timelineEventDetails.endMinutesForTimelineChildren=be(i),i.timelineEventDetails.durationMinutes=i.timelineEventDetails.endMinutes-i.timelineEventDetails.startMinutes,i.timelineEventDetails.durationMinutesForTimelineChildren=i.timelineEventDetails.endMinutesForTimelineChildren-i.timelineEventDetails.startMinutesForTimelineChildren,i},Ye=e=>{let n=[],s=e.querySelectorAll(".timelineEvent");return s&&s.forEach(i=>{try{n.push(oe(ee({},i.attributes),{events:Ye(i)}))}catch(l){console.error(l,"timelineEvent")}}),n},g=(e,n)=>{p.dispatchEvent(new CustomEvent(e,{detail:{name:e,options:o,timelineEvent:n,viewStartDate:re(k()),viewEndDate:re(K()),viewDuration:B(),ratio:c,pivot:L},bubbles:!1,cancelable:!0,composed:!1}))},Ue=e=>{p.dispatchEvent(new CustomEvent("err.tl.container",{detail:e,bubbles:!1,cancelable:!0,composed:!1}))};return Se(C,M),{focus:ne,zoom:J,add:Ce,reset:Ae,select:q,preventNextPreviewRender:()=>{U=!0},setPreventPreviewRender:e=>{Z=e},clear:ze,update:A}};window.TimelineContainer=pe;})();
