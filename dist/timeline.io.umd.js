(()=>{var ge=Object.defineProperty,he=Object.defineProperties;var ye=Object.getOwnPropertyDescriptors;var K=Object.getOwnPropertySymbols;var pe=Object.prototype.hasOwnProperty,ve=Object.prototype.propertyIsEnumerable;var Q=(h,b,a)=>b in h?ge(h,b,{enumerable:!0,configurable:!0,writable:!0,value:a}):h[b]=a,k=(h,b)=>{for(var a in b||(b={}))pe.call(b,a)&&Q(h,a,b[a]);if(K)for(var a of K(b))ve.call(b,a)&&Q(h,a,b[a]);return h},z=(h,b)=>he(h,ye(b));var U=(h,b,a)=>new Promise((p,v)=>{var H=c=>{try{u(a.next(c))}catch(g){v(g)}},l=c=>{try{u(a.throw(c))}catch(g){v(g)}},u=c=>c.done?p(c.value):Promise.resolve(c.value).then(H,l);u((a=a.apply(h,b)).next())});var W=(h,b)=>{let a,p,v,H,l,u,c,g,C,V,E,ee=(e,n)=>{l.addEventListener(e,n,!0)},te=e=>U(void 0,null,function*(){if(!e)throw new Error("Argument is empty. Please provide a loader function as first arg");X(yield e())}),X=e=>{if(!e)throw new Error("Event argument is empty. Please provide Timeline event as first arg");_(E,e),N()},Y=e=>e.start<w()&&e.end>P(),ne=(e,n)=>{if(!e)throw new Error("Element argument is empty. DOM element | selector as first arg");if(typeof e=="string"){let o=document.querySelector(e);if(!o)throw new Error(`Selector could not be found [${l}]`);l=o}e instanceof HTMLElement&&(l=e),u=k({labelCount:5,zoomSpeed:.025,dragSpeed:.001,timelineStart:"-270000",timelineEnd:"1000y",start:"-1000y",end:"100y",minZoom:1,maxZoom:1e11,position:"bottom",expandRatio:80,eventHeight:5},n),E=J({title:"View",type:"container",start:u.start,end:u.end}),v=F(u.timelineStart),H=F(u.timelineEnd);let r=E.start,t=E.end;r<v&&(v=r),t>H&&(H=t);let i=t-r;a=R()/i,p=(v-r)/i,V=E,le(),ae(l),N()},R=()=>H-v,re=()=>l.offsetWidth||0,w=()=>v-T()*p,P=()=>w()+T(),T=()=>R()/a,ie=()=>u.zoomSpeed*a,S=e=>(e-w())/T(),Z=e=>(e-v)/R(),oe=(e,n)=>{let r=a-n;return e===1&&r<=u.minZoom||e===-1&&r>=u.maxZoom?!1:(a=r,!0)},j=e=>{let n=p+e;n>=0&&(n=0),n+a<=1&&(n=1-a),p=n},$=(e,n)=>{let r=e*ie(),t=n*r;oe(e,r)&&j(t),N()},q=e=>{j(e*u.dragSpeed),N()},se=e=>{if(!e)return;let n=0,r=e.duration*.05,t=e.start-r,o=e.end+r-t,m=R()/o,f=Math.sign(a-m);if(f>0){let D=(w()+T()/2-t)/o,x=w()+T()*D;n=Z(x)}else{let y=t+o/2,D=S(y),x=t+o*D;n=Z(x)}let s=()=>{clearInterval(L);let y=p-(t-w())/T(),D=Math.sign(y-p),x=()=>{clearInterval(A),l.dispatchEvent(new CustomEvent("focus.tl.event",{detail:e,bubbles:!0,cancelable:!0}))},A=setInterval(()=>{q(D*10),D<0&&p<y&&x(),D>0&&p>y&&x()},1)},L=setInterval(()=>{$(f,n),f<0&&a>m&&s(),f>0&&a<m&&s()},1)},ae=e=>{window.addEventListener("resize",()=>{N()},{passive:!0}),e.addEventListener("wheel",o=>{if(o.defaultPrevented)return;var m=Math.sign(o.deltaY);let L=(((o.target.attributes.starttime?S(o.target.attributes.starttime):0)*e.getBoundingClientRect().width+o.offsetX)/re()-p)/a;$(m,L)},{passive:!0});let n,r,t=!1,i=!0;e.addEventListener("mousedown",o=>{t=!0,n=o.pageX,r=o.pageY},{passive:!0}),e.addEventListener("mousemove",o=>{if(!t||!i)return;i=!1;let m=o.pageX-n;m&&q(m),n=o.pageX,r=o.pageY,setTimeout(()=>i=!0,10)},{passive:!0}),e.addEventListener("mouseup",()=>{t=!1},{passive:!0})},O=e=>{if(!e||e.start>=P()||e.end<=w())return;let n=document.createDocumentFragment(),r=()=>{n.append(...e.children.reduce((o,m)=>{let f=O(z(k({},m),{level:e.level+(m.level-1)}));return f&&o.push(f),o},new Array))},t=o=>{let m=e.level*1.5,f=o?0:S(e.start),d=o?100:e.duration/T()*100,s=document.createElement("div"),L=e.color.map(y=>y-Math.pow(10,1));s.style.bottom=`${m*u.eventHeight}px`,s.style.minHeight=`${u.eventHeight}px`,s.style.borderRadius="5px",s.style.boxSizing="border-box",s.style.cursor="pointer",s.style.border=`1px solid rgba(${L.join(",")})`,s.style.backgroundColor=`rgb(${e.color.join(",")})`,s.style.zIndex=e.depth.toString(),s.addEventListener("click",y=>{l.dispatchEvent(new CustomEvent("click.tl.event",{detail:e,bubbles:!0,cancelable:!0}))}),s.style.left=f*100+"%",s.style.width=d+"%",s.style.position="absolute",s.style.minWidth="5px",s.title=e.title,s.className="timelineEventGenerated",s.attributes.starttime=o?w():e.start,n.appendChild(s)},i=o=>{let m=o?0:S(e.start),f=o?100:e.duration/T()*100,d=document.createElement("div");d.style.left=m*100+"%",d.style.width=f+"%",d.style.position="absolute",d.style.minWidth="5px",d.style.overflow="hidden",d.style.bottom="0px",d.style.minHeight="100%",d.style.backgroundColor=`rgb(${e.color.join(",")})`,d.title=e.title,d.className="timelineEventGenerated",d.attributes.starttime=o?w():e.start,n.appendChild(d);let s=document.createElement("div");s.title=e.title,s.innerText=e.title,s.className="timelineEventGeneratedTitle",s.style.whiteSpace="nowrap",s.style.pointerEvents="none",s.style.userSelect="none",d.appendChild(s)};switch(e.type){case"container":r();break;case"timeline":{t(Y(e));break}case"background":{i(Y(e));break}}return n},le=()=>{l.style.position="relative",l.style.overflow="hidden",l.style.minHeight="3rem";let e=l.querySelector(".timelineLabelContainer");switch(c=e||document.createElement("div"),e||l.appendChild(c),c.className="timelineLabelContainer",c.style.width="100%",c.style.height="50px",c.style.textAlign="center",c.style.position="absolute",c.style.pointerEvents="none",c.style.userSelect="none",u.position){case"top":c.style.top="0";break;default:c.style.bottom="0"}let n=l.querySelector(".timelineDividerContainer");g=n||document.createElement("div"),n||l.appendChild(g),g.className="timelineDividerContainer",g.style.width="100%",g.style.height="100%",g.style.position="absolute",g.style.zIndex="-2",g.style.bottom="0";let r=l.querySelector(".timelineEventsContainer");C=r||document.createElement("div"),r||l.appendChild(C),C.className="timelineEventsContainer",C.style.position="absolute",C.style.bottom="50px",C.style.height="calc(100% - 50px)",C.style.width="100%"},ce=e=>{let n=new Date(e*6e4);return T()<5760?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"}).format(n):T()<60480?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric"}).format(n):T()<788923.1502?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short"}).format(n):n.getFullYear().toString()},N=()=>{if(!l)return;let e=Math.floor(a),n=Math.pow(2,Math.floor(Math.log2(e))),r=1/(u.labelCount+1),t=w()-v,o=R()*r/n,f=Math.floor(t/o)*o,d=document.createDocumentFragment(),s=document.createDocumentFragment();for(let y=0;y<u.labelCount+2;y++){let D=(y+1)*o+v+f-o,x=D+o/2,be=S(D)*100,fe=S(x)*100,M=document.createElement("div");M.className="timelineLabel",M.style.left=be+"%",M.style.top="50%",M.style.transform="translate(calc(-50%), calc(-50%))",M.style.textAlign="center",M.style.position="absolute",M.style.zIndex="-1",M.style.width=r*100+"%",M.innerHTML=ce(D),d.appendChild(M);let I=document.createElement("div");I.className="timelineDivider",I.style.left=fe+"%",I.style.textAlign="center",I.style.position="absolute",I.style.height="100%",I.style.zIndex="-10",I.innerHTML="",s.appendChild(I)}c.innerHTML="",c.appendChild(d),g.innerHTML="",g.appendChild(s);let L=O(V);C.innerHTML="",L&&C.appendChild(L),l.dispatchEvent(new CustomEvent("update.tl",{detail:{options:u,viewStartDate:w(),viewEndDate:P(),viewDuration:T(),ratio:a,pivot:p},bubbles:!0,cancelable:!0,composed:!1}))},F=e=>{if(e===void 0)return;let n=t=>{let i=new Date;if(i.setDate(t[2]?t[2]:1),i.setMonth(t[1]?t[1]-1:0),i.setHours(t[3]?t[3]:0),i.setMinutes(t[4]?t[4]:0),i.setSeconds(0),!t[0])return i.getTime()/6e4;if(t[0]&&t[0]>-27e4&&t[0]<27e4)return i.setFullYear(t[0]),i.getTime()/6e4;let o=525948.766*t[0];return i.setFullYear(0),o+i.getTime()/6e4},r=t=>{switch(t){case"now":return new Date;default:let i=Number(t.replace(/y$/,""));return isNaN(i)?new Date(t):new Date(Date.now()+31556926*1e3*i)}};if(Array.isArray(e)){let t=e;if(t.length===0)throw new Error("argument Array cannot be empty");if(!t.every(o=>typeof o=="number"))throw new Error("input Array must contain only numbers");return n(t)}if(typeof e=="object"&&e.constructor.name==="Date")return e.getTime()/6e4;if(typeof e=="string")return r(e).getTime()/6e4;if(typeof e=="number")return new Date(e).getTime()/6e4},de=e=>e.every(n=>typeof n=="number"),G=e=>e.start?e.children.length?Math.min(e.start,e.children[0].start):e.start:e.children.length?e.children[0].start:void 0,B=e=>e.end?e.end:e.duration&&!isNaN(Number(e.duration))?e.start+Number(e.duration):e.children.length&&e.children[e.children.length-1].end||e.start+1,ue=(e,n)=>{let r=0;for(let t in n.levelMatrix)if(r=Number(t),e.start>n.levelMatrix[t].time){for(let i=0;i<e.height;i++)n.levelMatrix[(r+i).toString()]={height:e.height,time:e.end};return r}r++;for(let t=0;t<e.height;t++)n.levelMatrix[(r+t).toString()]={height:e.height,time:e.end};return r},_=(e,...n)=>{let r=(i,o)=>i.duration/o.duration*i.children.length||1,t=n.map(i=>J(i,e)).filter(i=>!!i);t&&t.length&&e&&(e.children.push(...t),e.children.sort((i,o)=>i.start-o.start),e.start=G(e),e.end=B(e),e.duration=e.end-e.start,e.levelMatrix={1:{height:0,time:Number.MIN_SAFE_INTEGER}},e.children.forEach((i,o)=>{i.score=["container","timeline"].includes(i.type)?r(i,e):0,i.level=["container","timeline"].includes(i.type)?ue(i,e):0})),e.height=e.children.length?Math.max.apply(1,e.children.map(i=>i.level)):1},J=(e,n)=>{if(!e){console.warn("Event object is empty");return}let r=z(k({type:"timeline",duration:0,level:1,step:0,score:0,height:1,children:[],depth:n?n.depth+1:0},e),{color:e.color?de(e.color)?e.color:[140,140,140,e.type==="background"?.1:1]:[140,140,140,e.type==="background"?.1:1],start:F(e.start),end:F(e.end)});if(e.events&&e.events.length&&_(r,...e.events),r.start=G(r),!r.start){console.warn("Missing start property on event - skipping",e);return}return r.end=B(r),r.duration=r.end-r.start,r},me=e=>{let n=[],r=e.querySelectorAll(".timelineEvent");return r&&r.forEach(t=>{try{n.push(z(k({},t.attributes),{events:me(t)}))}catch(i){console.error(i,"timelineEvent")}}),n};return ne(h,b),{focus:se,load:te,add:X,on:ee}};window.Timeline=W;})();
