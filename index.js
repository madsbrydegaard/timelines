var ge=Object.defineProperty,fe=Object.defineProperties;var pe=Object.getOwnPropertyDescriptors;var Q=Object.getOwnPropertySymbols;var ye=Object.prototype.hasOwnProperty,ve=Object.prototype.propertyIsEnumerable;var U=(T,f,d)=>f in T?ge(T,f,{enumerable:!0,configurable:!0,writable:!0,value:d}):T[f]=d,A=(T,f)=>{for(var d in f||(f={}))ye.call(f,d)&&U(T,d,f[d]);if(Q)for(var d of Q(f))ve.call(f,d)&&U(T,d,f[d]);return T},Y=(T,f)=>fe(T,pe(f));var we=(T,f)=>{let d,E,D,V,h,g,y,w,M,I,q=[],Z,N,ee=e=>{if(!e)throw new Error("Event argument is empty. Please provide Timeline event as first arg");J(N,e),x()},te=(e,r)=>{if(!e)throw new Error("Element argument is empty. DOM element | selector as first arg");if(typeof e=="string"){let l=document.querySelector(e);if(!l)throw new Error(`Selector could not be found [${h}]`);h=l}e instanceof HTMLElement&&(h=e),g=A({labelCount:5,zoomSpeed:.025,dragSpeed:.001,timelineStart:"-270000",timelineEnd:"1000y",start:"-1000y",end:"100y",minZoom:1,maxZoom:1e11,position:"bottom",expandRatio:80,eventHeight:5},r),N=K({title:"View",type:"container",start:g.start,end:g.end}),D=X(g.timelineStart),V=X(g.timelineEnd);let n=N.start,t=N.end;n<D&&(D=n),t>V&&(V=t);let i=t-n;d=R()/i,E=(D-n)/i,Z=N,ce(),le(h),x()},ne=()=>{if(q.length){let[e]=q.slice(-1);return e}},R=()=>V-D,re=()=>h.offsetWidth||0,L=()=>D-v()*E,z=()=>L()+v(),v=()=>R()/d,ie=()=>g.zoomSpeed*d,S=e=>(e-L())/v(),$=e=>(e-D)/R(),oe=(e,r)=>{let n=d-r;return e===1&&n<=g.minZoom||e===-1&&n>=g.maxZoom?!1:(d=n,!0)},O=e=>{let r=E+e;r>=0&&(r=0),r+d<=1&&(r=1-d),E=r},B=(e,r)=>{let n=e*ie(),t=r*n;oe(e,n)&&O(t),x()},se=e=>{O(e),x()},ae=e=>{if(!e)return;let r=0,n=e.start-e.duration*.05,i=e.end+e.duration*.05-n,l=R()/i,m=Math.sign(d-l);if(m>0){let b=(L()+v()/2-n)/i,p=L()+v()*b;r=$(p)}else{let u=n+i/2,b=S(u),p=n+i*b;r=$(p)}e!=ne()&&q.push(e);let c=()=>{clearInterval(o),x()},a=()=>{x()},o=setInterval(()=>{B(m,r),m<0&&d>l&&c(),m>0&&d<l&&c()},1)},le=e=>{window.addEventListener("resize",()=>{x()},{passive:!0}),e.addEventListener("wheel",s=>{if(s.defaultPrevented)return;var c=Math.sign(s.deltaY);let b=(((s.target.attributes.starttime?S(s.target.attributes.starttime):0)*e.getBoundingClientRect().width+s.offsetX)/re()-E)/d;B(c,b)},{passive:!0});let r,n,t=!1,i=!0;e.addEventListener("mousedown",s=>{t=!0,r=s.pageX,n=s.pageY},{passive:!0}),e.addEventListener("mousemove",s=>{if(!t||!i)return;i=!1;let c=(s.pageX-r)*g.dragSpeed;c&&se(c),r=s.pageX,n=s.pageY,setTimeout(()=>i=!0,10)},{passive:!0}),e.addEventListener("mouseup",()=>{t=!1},{passive:!0});let l=(s,c)=>{let a=document.createDocumentFragment(),o=document.createElement("div");o.className="detailsScrollableContainer",o.style.overflow="auto",o.style.height="100%",o.style.position="absolute";let u=document.createElement("div");if(u.style.padding="10px",o.appendChild(u),a.appendChild(o),console.log(s),s.wikipedia){fetch(s.wikipedia).then(p=>p.json()).then(p=>{let k=document.createElement("H1");if(k.innerHTML=p.query.pages[0].title,u.appendChild(k),p.query.pages[0].thumbnail){let P=document.createElement("p"),F=document.createElement("img");F.src=p.query.pages[0].thumbnail.source,F.style.width="100%",P.appendChild(F),u.appendChild(P)}else p.query.pages[0].images&&p.query.pages[0].images.length;let j=document.createElement("p");j.innerHTML=p.query.pages[0].extract,u.appendChild(j),c(a)});return}let b=document.createElement("H3");b.innerHTML="No detail information found...",a.appendChild(b),c(a)},m=s=>{let c=document.createDocumentFragment(),a=document.createElement("div");a.style.overflow="auto",[...q].reverse().forEach(o=>{let u=document.createElement("a");u.innerHTML=o.title,u.href="#",u.style.cursor="pointer",u.addEventListener("click",b=>{b.preventDefault(),u.dispatchEvent(new CustomEvent("event-click",{detail:o,bubbles:!0,cancelable:!0}))}),a.appendChild(u),a.appendChild(document.createElement("br"))}),c.appendChild(a),s(c)}},G=e=>{if(!e||e.start>=z()||e.end<=L())return;let r=document.createDocumentFragment(),n=()=>{r.append(...e.children.reduce((m,s)=>{let c=G(Y(A({},s),{level:e.level+(s.level-1)}));return c&&m.push(c),m},new Array))},t=m=>{let s=e.level*1.5,c=m?0:S(e.start),a=m?100:e.duration/v()*100,o=document.createElement("div"),u=e.color.map(b=>b-Math.pow(10,1));o.style.bottom=`${s*g.eventHeight}px`,o.style.minHeight=`${g.eventHeight}px`,o.style.borderRadius="5px",o.style.boxSizing="border-box",o.style.cursor="pointer",o.style.border=`1px solid rgba(${u.join(",")})`,o.style.backgroundColor=`rgb(${e.color.join(",")})`,o.style.zIndex=e.depth.toString(),o.addEventListener("click",b=>{o.dispatchEvent(new CustomEvent("event-click",{detail:e,bubbles:!0,cancelable:!0}))}),o.style.left=c*100+"%",o.style.width=a+"%",o.style.position="absolute",o.style.minWidth="5px",o.title=e.title,o.className="timelineEventGenerated",o.attributes.starttime=e.start,o.attributes.expanded=a>g.expandRatio,r.appendChild(o)},i=m=>{let s=m?0:S(e.start),c=m?100:e.duration/v()*100,a=document.createElement("div");a.style.left=s*100+"%",a.style.width=c+"%",a.style.position="absolute",a.style.minWidth="5px",a.style.overflow="hidden",a.style.bottom="0px",a.style.minHeight="100%",a.style.backgroundColor=`rgb(${e.color.join(",")})`,a.title=e.title,a.className="timelineEventGenerated",r.appendChild(a);let o=document.createElement("div");o.title=e.title,o.innerText=e.title,o.className="timelineEventGeneratedTitle",o.style.whiteSpace="nowrap",o.style.pointerEvents="none",o.style.userSelect="none",a.appendChild(o)},l=e.start<L()&&e.end>z();switch(e.type){case"container":n();break;case"timeline":{let m=e.duration>v(),s=e.start<z()&&e.end>L(),c=!!e.children.length;m&&s&&c?n():t(l);break}case"background":{i(l);break}}return r},ce=()=>{h.style.position="relative",h.style.overflow="hidden",h.style.minHeight="3rem";let e=h.querySelector(".timelineHeaderContainer");I=e||document.createElement("div"),e||h.appendChild(I),I.className="timelineHeaderContainer",I.style.width="100%",I.style.height="20px",I.style.backgroundColor="white";let r=h.querySelector(".timelineLabelContainer");switch(y=r||document.createElement("div"),r||h.appendChild(y),y.className="timelineLabelContainer",y.style.width="100%",y.style.height="50px",y.style.textAlign="center",y.style.position="absolute",y.style.pointerEvents="none",y.style.userSelect="none",g.position){case"top":y.style.top="20px";break;default:y.style.bottom="0"}let n=h.querySelector(".timelineDividerContainer");w=n||document.createElement("div"),n||h.appendChild(w),w.className="timelineDividerContainer",w.style.width="100%",w.style.height="calc(100% - 20px)",w.style.position="absolute",w.style.zIndex="-2",w.style.bottom="0";let t=h.querySelector(".timelineEventsContainer");M=t||document.createElement("div"),t||h.appendChild(M),M.className="timelineEventsContainer",M.style.position="absolute",M.style.bottom="50px",M.style.height="calc(100% - 70px)",M.style.width="100%"},de=e=>{let r=new Date(e*6e4);return v()<5760?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"}).format(r):v()<60480?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric"}).format(r):v()<788923.1502?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short"}).format(r):r.getFullYear().toString()},x=()=>{if(!h)return;let e=Math.floor(d),r=Math.pow(2,Math.floor(Math.log2(e))),n=1/(g.labelCount+1),t=L()-D,l=R()*n/r,s=Math.floor(t/l)*l,c=document.createDocumentFragment(),a=document.createDocumentFragment();for(let u=0;u<g.labelCount+2;u++){let b=(u+1)*l+D+s-l,p=b+l/2,j=S(b)*100,F=S(p)*100,C=document.createElement("div");C.className="timelineLabel",C.style.left=j+"%",C.style.top="50%",C.style.transform="translate(calc(-50%), calc(-50%))",C.style.textAlign="center",C.style.position="absolute",C.style.zIndex="-1",C.style.width=n*100+"%",C.innerHTML=de(b),c.appendChild(C);let H=document.createElement("div");H.className="timelineDivider",H.style.left=F+"%",H.style.textAlign="center",H.style.position="absolute",H.style.height="100%",H.style.zIndex="-10",H.innerHTML="",a.appendChild(H)}y.innerHTML="",y.appendChild(c),w.innerHTML="",w.appendChild(a);let o=G(Z);M.innerHTML="",o&&M.appendChild(o),h.dispatchEvent(new CustomEvent("update",{detail:be(),bubbles:!0,cancelable:!0,composed:!1}))},X=e=>{if(e===void 0)return;let r=t=>{let i=new Date;if(i.setDate(t[2]?t[2]:1),i.setMonth(t[1]?t[1]-1:0),i.setHours(t[3]?t[3]:0),i.setMinutes(t[4]?t[4]:0),i.setSeconds(0),!t[0])return i.getTime()/6e4;if(t[0]&&t[0]>-27e4&&t[0]<27e4)return i.setFullYear(t[0]),i.getTime()/6e4;let l=525948.766*t[0];return i.setFullYear(0),l+i.getTime()/6e4},n=t=>{switch(t){case"now":return new Date;default:let i=Number(t.replace(/y$/,""));return isNaN(i)?new Date(t):new Date(Date.now()+31556926*1e3*i)}};if(Array.isArray(e)){let t=e;if(t.length===0)throw new Error("argument Array cannot be empty");if(!t.every(l=>typeof l=="number"))throw new Error("input Array must contain only numbers");return r(t)}if(typeof e=="object"&&e.constructor.name==="Date")return e.getTime()/6e4;if(typeof e=="string")return n(e).getTime()/6e4;if(typeof e=="number")return new Date(e).getTime()/6e4},ue=e=>e.every(r=>typeof r=="number"),W=e=>e.start?e.children.length?Math.min(e.start,e.children[0].start):e.start:e.children.length?e.children[0].start:void 0,_=e=>e.end?e.end:e.duration&&!isNaN(Number(e.duration))?e.start+Number(e.duration):e.children.length&&e.children[e.children.length-1].end||e.start+1,me=(e,r)=>{let n=0;for(let t in r.levelMatrix)if(n=Number(t),e.start>r.levelMatrix[t].time){for(let i=0;i<e.height;i++)r.levelMatrix[(n+i).toString()]={height:e.height,time:e.end};return n}n++;for(let t=0;t<e.height;t++)r.levelMatrix[(n+t).toString()]={height:e.height,time:e.end};return n},J=(e,...r)=>{let n=(i,l)=>{let m=1;return m=(i.duration||1)/l.duration*l.children.length,m},t=r.map(i=>K(i,e)).filter(i=>!!i);t&&t.length&&e&&(e.children.push(...t),e.children.sort((i,l)=>i.start-l.start),e.start=W(e),e.end=_(e),e.duration=e.end-e.start,e.levelMatrix={1:{height:0,time:Number.MIN_SAFE_INTEGER}},e.children.forEach((i,l)=>{i.level=["container","timeline"].includes(i.type)?me(i,e):0})),e.height=e.children.length?Math.max.apply(1,e.children.map(i=>i.level)):1},K=(e,r)=>{if(!e){console.warn("Event object is empty");return}let n=Y(A({type:"timeline",duration:0,level:1,step:0,score:0,height:1,children:[],depth:r?r.depth+1:0},e),{color:e.color?ue(e.color)?e.color:[140,140,140,e.type==="background"?.1:1]:[140,140,140,e.type==="background"?.1:1],start:X(e.start),end:X(e.end)});if(e.events&&e.events.length&&J(n,...e.events),n.start=W(n),!n.start){console.warn("Missing start property on event - skipping",e);return}return n.end=_(n),n.duration=n.end-n.start,n},he=e=>{let r=[],n=e.querySelectorAll(".timelineEvent");return n&&n.forEach(t=>{try{r.push(Y(A({},t.attributes),{events:he(t)}))}catch(i){console.error(i,"timelineEvent")}}),r},be=()=>({options:g,viewStartDate:L(),viewEndDate:z(),viewDuration:v(),ratio:d,pivot:E});return te(T,f),{focus:ae,load:ee,current:Z,element:h}};export{we as Timeline};
