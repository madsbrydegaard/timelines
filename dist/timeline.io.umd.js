(()=>{var fe=Object.defineProperty,he=Object.defineProperties;var ye=Object.getOwnPropertyDescriptors;var K=Object.getOwnPropertySymbols;var ve=Object.prototype.hasOwnProperty,pe=Object.prototype.propertyIsEnumerable;var Q=(h,b,l)=>b in h?fe(h,b,{enumerable:!0,configurable:!0,writable:!0,value:l}):h[b]=l,k=(h,b)=>{for(var l in b||(b={}))ve.call(b,l)&&Q(h,l,b[l]);if(K)for(var l of K(b))pe.call(b,l)&&Q(h,l,b[l]);return h},A=(h,b)=>he(h,ye(b));var U=(h,b,l)=>new Promise((v,p)=>{var x=d=>{try{a(l.next(d))}catch(f){p(f)}},c=d=>{try{a(l.throw(d))}catch(f){p(f)}},a=d=>d.done?v(d.value):Promise.resolve(d.value).then(x,c);a((l=l.apply(h,b)).next())});var W=(h,b)=>{let l,v,p,x,c,a,d,f,M,P,S,ee=(e,n)=>{c.addEventListener(e,n,!0)},te=e=>U(void 0,null,function*(){if(!e)throw new Error("Argument is empty. Please provide a loader function as first arg");V(yield e())}),V=e=>{if(!e)throw new Error("Event argument is empty. Please provide Timeline event as first arg");G(S,e),R()},X=e=>e.start<w()&&e.end>z(),ne=(e,n)=>{if(!e)throw new Error("Element argument is empty. DOM element | selector as first arg");if(typeof e=="string"){let s=document.querySelector(e);if(!s)throw new Error(`Selector could not be found [${c}]`);c=s}e instanceof HTMLElement&&(c=e),a=k({labelCount:5,zoomSpeed:.025,dragSpeed:.001,timelineStart:"-270000",timelineEnd:"1000y",start:"-1000y",end:"100y",minZoom:1,maxZoom:1e11,position:"bottom",eventHeight:5,classNames:{timeline:"tl",timelineEvent:"tl__event",timelineEventTitle:"tl__event__title",timelineLabels:"tl__labels",timelineDividers:"tl__dividers",timelineEvents:"tl__events",timelineLabel:"tl__label",timelineDivider:"tl__divider"}},n),S=J({title:"View",type:"container",start:a.start,end:a.end}),p=_(a.timelineStart),x=_(a.timelineEnd);let r=S.start,t=S.end;r<p&&(p=r),t>x&&(x=t);let i=t-r;l=N()/i,v=(p-r)/i,P=S,le(),ae(c),R()},N=()=>x-p,re=()=>c.offsetWidth||0,w=()=>p-T()*v,z=()=>w()+T(),T=()=>N()/l,ie=()=>a.zoomSpeed*l,H=e=>(e-w())/T(),$=e=>(e-p)/N(),se=(e,n)=>{let r=l-n;return e===1&&r<=a.minZoom||e===-1&&r>=a.maxZoom?!1:(l=r,!0)},Y=e=>{let n=v+e;n>=0&&(n=0),n+l<=1&&(n=1-l),v=n},Z=(e,n)=>{let r=e*ie(),t=n*r;se(e,r)&&Y(t),R()},j=e=>{Y(e*a.dragSpeed),R()},oe=e=>{if(!e)return;let n=0,r=e.duration*.05,t=e.start-r,s=e.end+r-t,u=N()/s,g=Math.sign(l-u);if(g>0){let D=(w()+T()/2-t)/s,E=w()+T()*D;n=$(E)}else{let y=t+s/2,D=H(y),E=t+s*D;n=$(E)}let o=()=>{clearInterval(C);let y=v-(t-w())/T(),D=Math.sign(y-v),E=()=>{clearInterval(F),c.dispatchEvent(new CustomEvent("focus.tl.event",{detail:e,bubbles:!0,cancelable:!0}))},F=setInterval(()=>{j(D*10),D<0&&v<y&&E(),D>0&&v>y&&E()},1)},C=setInterval(()=>{Z(g,n),g<0&&l>u&&o(),g>0&&l<u&&o()},1)},ae=e=>{window.addEventListener("resize",()=>{R()},{passive:!0}),e.addEventListener("wheel",s=>{if(s.defaultPrevented)return;var u=Math.sign(s.deltaY);let C=(((s.target.attributes.starttime?H(s.target.attributes.starttime):0)*e.getBoundingClientRect().width+s.offsetX)/re()-v)/l;Z(u,C)},{passive:!0});let n,r,t=!1,i=!0;e.addEventListener("mousedown",s=>{t=!0,n=s.pageX,r=s.pageY},{passive:!0}),e.addEventListener("mousemove",s=>{if(!t||!i)return;i=!1;let u=s.pageX-n;u&&j(u),n=s.pageX,r=s.pageY,setTimeout(()=>i=!0,10)},{passive:!0}),e.addEventListener("mouseup",()=>{t=!1},{passive:!0})},q=e=>{if(!e||e.start>=z()||e.end<=w())return;let n=document.createDocumentFragment(),r=()=>{n.append(...e.children.reduce((s,u)=>{let g=q(A(k({},u),{level:e.level+(u.level-1)}));return g&&s.push(g),s},new Array))},t=s=>{let u=e.level*1.5,g=s?0:H(e.start),m=s?100:e.duration/T()*100,o=document.createElement("div"),C=e.color.map(y=>y-Math.pow(10,1));o.style.bottom=`${u*a.eventHeight}px`,o.style.minHeight=`${a.eventHeight}px`,o.style.borderRadius="5px",o.style.boxSizing="border-box",o.style.cursor="pointer",o.style.border=`1px solid rgba(${C.join(",")})`,o.style.backgroundColor=`rgb(${e.color.join(",")})`,o.style.zIndex=e.depth.toString(),o.addEventListener("click",y=>{c.dispatchEvent(new CustomEvent("click.tl.event",{detail:e,bubbles:!0,cancelable:!0}))}),o.style.left=g*100+"%",o.style.width=m+"%",o.style.position="absolute",o.style.minWidth="5px",o.title=e.title,o.classList.add(a.classNames.timelineEvent),o.attributes.starttime=s?w():e.start,n.appendChild(o)},i=s=>{let u=s?0:H(e.start),g=s?100:e.duration/T()*100,m=document.createElement("div");m.style.left=u*100+"%",m.style.width=g+"%",m.style.position="absolute",m.style.minWidth="5px",m.style.overflow="hidden",m.style.bottom="0px",m.style.minHeight="100%",m.style.backgroundColor=`rgb(${e.color.join(",")})`,m.title=e.title,m.classList.add(a.classNames.timelineEvent),m.attributes.starttime=s?w():e.start,n.appendChild(m);let o=document.createElement("div");o.title=e.title,o.innerText=e.title,o.style.whiteSpace="nowrap",o.style.pointerEvents="none",o.style.userSelect="none",o.classList.add(a.classNames.timelineEventTitle),m.appendChild(o)};switch(e.type){case"container":r();break;case"timeline":{t(X(e));break}case"background":{i(X(e));break}}return n},le=()=>{c.style.position="relative",c.style.overflow="hidden",c.style.minHeight="3rem";let e=c.querySelector(`.${a.classNames.timelineLabels}`);switch(d=e||document.createElement("div"),e||c.appendChild(d),d.classList.add(a.classNames.timelineLabels),d.style.width="100%",d.style.height="50px",d.style.textAlign="center",d.style.position="absolute",d.style.pointerEvents="none",d.style.userSelect="none",a.position){case"top":d.style.top="0";break;default:d.style.bottom="0"}let n=c.querySelector(`.${a.classNames.timelineDividers}`);f=n||document.createElement("div"),n||c.appendChild(f),f.classList.add(a.classNames.timelineDividers),f.style.width="100%",f.style.height="100%",f.style.position="absolute",f.style.zIndex="-2",f.style.bottom="0";let r=c.querySelector(`.${a.classNames.timelineEvents}`);M=r||document.createElement("div"),r||c.appendChild(M),M.classList.add(a.classNames.timelineEvents),M.style.position="absolute",M.style.bottom="50px",M.style.height="calc(100% - 50px)",M.style.width="100%"},ce=e=>{let n=new Date(e*6e4);return T()<5760?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"}).format(n):T()<60480?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric"}).format(n):T()<788923.1502?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short"}).format(n):n.getFullYear().toString()},R=()=>{if(!c)return;let e=Math.floor(l),n=Math.pow(2,Math.floor(Math.log2(e))),r=1/(a.labelCount+1),t=w()-p,s=N()*r/n,g=Math.floor(t/s)*s,m=document.createDocumentFragment(),o=document.createDocumentFragment();for(let y=0;y<a.labelCount+2;y++){let D=(y+1)*s+p+g-s,E=D+s/2,be=H(D)*100,ge=H(E)*100,L=document.createElement("div");L.classList.add(a.classNames.timelineLabel),L.style.left=be+"%",L.style.top="50%",L.style.transform="translate(calc(-50%), calc(-50%))",L.style.textAlign="center",L.style.position="absolute",L.style.zIndex="-1",L.style.width=r*100+"%",L.innerHTML=ce(D),m.appendChild(L);let I=document.createElement("div");I.classList.add(a.classNames.timelineDivider),I.style.left=ge+"%",I.style.textAlign="center",I.style.position="absolute",I.style.height="100%",I.style.zIndex="-10",I.innerHTML="",o.appendChild(I)}d.innerHTML="",d.appendChild(m),f.innerHTML="",f.appendChild(o);let C=q(P);M.innerHTML="",C&&M.appendChild(C),c.dispatchEvent(new CustomEvent("update.tl",{detail:{options:a,viewStartDate:w(),viewEndDate:z(),viewDuration:T(),ratio:l,pivot:v},bubbles:!0,cancelable:!0,composed:!1}))},_=e=>{if(e===void 0)return;let n=t=>{let i=new Date;if(i.setDate(t[2]?t[2]:1),i.setMonth(t[1]?t[1]-1:0),i.setHours(t[3]?t[3]:0),i.setMinutes(t[4]?t[4]:0),i.setSeconds(0),!t[0])return i.getTime()/6e4;if(t[0]&&t[0]>-27e4&&t[0]<27e4)return i.setFullYear(t[0]),i.getTime()/6e4;let s=525948.766*t[0];return i.setFullYear(0),s+i.getTime()/6e4},r=t=>{switch(t){case"now":return new Date;default:let i=Number(t.replace(/y$/,""));return isNaN(i)?new Date(t):new Date(Date.now()+31556926*1e3*i)}};if(Array.isArray(e)){let t=e;if(t.length===0)throw new Error("argument Array cannot be empty");if(!t.every(s=>typeof s=="number"))throw new Error("input Array must contain only numbers");return n(t)}if(typeof e=="object"&&e.constructor.name==="Date")return e.getTime()/6e4;if(typeof e=="string")return r(e).getTime()/6e4;if(typeof e=="number")return new Date(e).getTime()/6e4},de=e=>e.every(n=>typeof n=="number"),O=e=>e.start?e.children.length?Math.min(e.start,e.children[0].start):e.start:e.children.length?e.children[0].start:void 0,B=e=>e.end?e.end:e.duration&&!isNaN(Number(e.duration))?e.start+Number(e.duration):e.children.length&&e.children[e.children.length-1].end||e.start+1,me=(e,n)=>{let r=0;for(let t in n.levelMatrix)if(r=Number(t),e.start>n.levelMatrix[t].time){for(let i=0;i<e.height;i++)n.levelMatrix[(r+i).toString()]={height:e.height,time:e.end};return r}r++;for(let t=0;t<e.height;t++)n.levelMatrix[(r+t).toString()]={height:e.height,time:e.end};return r},G=(e,...n)=>{let r=(i,s)=>i.duration/s.duration*i.children.length||1,t=n.map(i=>J(i,e)).filter(i=>!!i);t&&t.length&&e&&(e.children.push(...t),e.children.sort((i,s)=>i.start-s.start),e.start=O(e),e.end=B(e),e.duration=e.end-e.start,e.levelMatrix={1:{height:0,time:Number.MIN_SAFE_INTEGER}},e.children.forEach((i,s)=>{i.score=["container","timeline"].includes(i.type)?r(i,e):0,i.level=["container","timeline"].includes(i.type)?me(i,e):0})),e.height=e.children.length?Math.max.apply(1,e.children.map(i=>i.level)):1},J=(e,n)=>{if(!e){console.warn("Event object is empty");return}let r=A(k({type:"timeline",duration:0,level:1,step:0,score:0,height:1,children:[],depth:n?n.depth+1:0},e),{color:e.color?de(e.color)?e.color:[140,140,140,e.type==="background"?.1:1]:[140,140,140,e.type==="background"?.1:1],start:_(e.start),end:_(e.end)});if(e.events&&e.events.length&&G(r,...e.events),r.start=O(r),!r.start){console.warn("Missing start property on event - skipping",e);return}return r.end=B(r),r.duration=r.end-r.start,r},ue=e=>{let n=[],r=e.querySelectorAll(".timelineEvent");return r&&r.forEach(t=>{try{n.push(A(k({},t.attributes),{events:ue(t)}))}catch(i){console.error(i,"timelineEvent")}}),n};return ne(h,b),{focus:oe,load:te,add:V,on:ee}};window.Timeline=W;})();
