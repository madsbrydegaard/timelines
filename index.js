var ge=Object.defineProperty,fe=Object.defineProperties;var pe=Object.getOwnPropertyDescriptors;var Q=Object.getOwnPropertySymbols;var ye=Object.prototype.hasOwnProperty,Te=Object.prototype.propertyIsEnumerable;var U=(T,f,c)=>f in T?ge(T,f,{enumerable:!0,configurable:!0,writable:!0,value:c}):T[f]=c,V=(T,f)=>{for(var c in f||(f={}))ye.call(f,c)&&U(T,c,f[c]);if(Q)for(var c of Q(f))Te.call(f,c)&&U(T,c,f[c]);return T},Y=(T,f)=>fe(T,pe(f));var we=(T,f)=>{let c,E,C,q,h,g,p,v,D,N,z=[],Z,k,ee=e=>{if(!e)throw new Error("Event argument is empty. Please provide Timeline event as first arg");J(k,e),x()},te=(e,i)=>{if(!e)throw new Error("Element argument is empty. DOM element | selector as first arg");if(typeof e=="string"){let l=document.querySelector(e);if(!l)throw new Error(`Selector could not be found [${h}]`);h=l}e instanceof HTMLElement&&(h=e),g=V({labelCount:5,zoomSpeed:.025,dragSpeed:.001,timelineStart:"-270000",timelineEnd:"1000y",start:"-1000y",end:"100y",minZoom:1,maxZoom:1e11,position:"bottom",expandRatio:80,eventHeight:5},i),k=K({title:"View",type:"container",start:g.start,end:g.end}),C=j(g.timelineStart),q=j(g.timelineEnd);let r=k.start,t=k.end;r<C&&(C=r),t>q&&(q=t);let n=t-r;c=F()/n,E=(C-r)/n,Z=k,ce(),le(h),x()},ne=()=>{if(z.length){let[e]=z.slice(-1);return e}},F=()=>q-C,re=()=>h.offsetWidth||0,M=()=>C-y()*E,X=()=>M()+y(),y=()=>F()/c,ie=()=>g.zoomSpeed*c,R=e=>(e-M())/y(),$=e=>(e-C)/F(),oe=(e,i)=>{let r=c-i;return e===1&&r<=g.minZoom||e===-1&&r>=g.maxZoom?!1:(c=r,!0)},O=e=>{let i=E+e;i>=0&&(i=0),i+c<=1&&(i=1-c),E=i},B=(e,i)=>{let r=e*ie(),t=i*r;oe(e,r)&&O(t),x()},se=e=>{O(e),x()},ae=e=>{if(!e)return;let i=0,r=e.start-e.duration*.05,n=e.end+e.duration*.05-r,l=F()/n,L=Math.sign(c-l);if(L>0){let s=(M()+y()/2-r)/n,o=M()+y()*s;i=$(o)}else{let a=r+n/2,s=R(a),o=r+n*s;i=$(o)}e!=ne()&&z.push(e);let b=()=>{clearInterval(m),x()},u=()=>{x()},m=setInterval(()=>{B(L,i),L<0&&c>l&&b(),L>0&&c<l&&b()},1)},le=e=>{window.addEventListener("resize",()=>{x()},{passive:!0}),e.addEventListener("wheel",d=>{if(d.defaultPrevented)return;var b=Math.sign(d.deltaY);let s=(((d.target.attributes.starttime?R(d.target.attributes.starttime):0)*e.getBoundingClientRect().width+d.offsetX)/re()-E)/c;B(b,s)},{passive:!0});let i,r,t=!1,n=!0;e.addEventListener("mousedown",d=>{t=!0,i=d.pageX,r=d.pageY},{passive:!0}),e.addEventListener("mousemove",d=>{if(!t||!n)return;n=!1;let b=(d.pageX-i)*g.dragSpeed;b&&se(b),i=d.pageX,r=d.pageY,setTimeout(()=>n=!0,10)},{passive:!0}),e.addEventListener("mouseup",()=>{t=!1},{passive:!0});let l=(d,b)=>{let u=document.createDocumentFragment(),m=document.createElement("div");m.className="detailsScrollableContainer",m.style.overflow="auto",m.style.height="100%",m.style.position="absolute";let a=document.createElement("div");if(a.style.padding="10px",m.appendChild(a),u.appendChild(m),console.log(d),d.wikipedia){fetch(d.wikipedia).then(o=>o.json()).then(o=>{let I=document.createElement("H1");if(I.innerHTML=o.query.pages[0].title,a.appendChild(I),o.query.pages[0].thumbnail){let P=document.createElement("p"),A=document.createElement("img");A.src=o.query.pages[0].thumbnail.source,A.style.width="100%",P.appendChild(A),a.appendChild(P)}else o.query.pages[0].images&&o.query.pages[0].images.length;let S=document.createElement("p");S.innerHTML=o.query.pages[0].extract,a.appendChild(S),b(u)});return}let s=document.createElement("H3");s.innerHTML="No detail information found...",u.appendChild(s),b(u)},L=d=>{let b=document.createDocumentFragment(),u=document.createElement("div");u.style.overflow="auto",[...z].reverse().forEach(m=>{let a=document.createElement("a");a.innerHTML=m.title,a.href="#",a.style.cursor="pointer",a.addEventListener("click",s=>{s.preventDefault(),a.dispatchEvent(new CustomEvent("event-click",{detail:m,bubbles:!0,cancelable:!0}))}),u.appendChild(a),u.appendChild(document.createElement("br"))}),b.appendChild(u),d(b)}},G=e=>{if(!e||e.start>=X()||e.end<=M())return;let i=document.createDocumentFragment(),r=()=>{i.append(...e.children.reduce((u,m)=>{let a=G(Y(V({},m),{level:e.level+(m.level-1)}));return a&&u.push(a),u},new Array))},t=u=>{let m=e.level*1.5,a=u?0:R(e.start),s=u?100:e.duration/y()*100,o=document.createElement("div"),I=e.color.map(S=>S-Math.pow(10,1));o.style.bottom=`${m*g.eventHeight}px`,o.style.minHeight=`${g.eventHeight}px`,o.style.borderRadius="5px",o.style.boxSizing="border-box",o.style.cursor="pointer",o.style.border=`1px solid rgba(${I.join(",")})`,o.style.backgroundColor=`rgb(${e.color.join(",")})`,o.style.zIndex=e.depth.toString(),o.addEventListener("click",S=>{o.dispatchEvent(new CustomEvent("event-click",{detail:e,bubbles:!0,cancelable:!0}))}),o.style.left=a*100+"%",o.style.width=s+"%",o.style.position="absolute",o.style.minWidth="5px",o.title=e.title,o.className="timelineEventGenerated",o.attributes.starttime=e.start,o.attributes.expanded=s>g.expandRatio,i.appendChild(o)},n=u=>{let m=u?0:R(e.start),a=u?100:e.duration/y()*100,s=document.createElement("div");s.style.left=m*100+"%",s.style.width=a+"%",s.style.position="absolute",s.style.minWidth="5px",s.style.overflow="hidden",s.style.bottom="0px",s.style.minHeight="100%",s.style.backgroundColor=`rgb(${e.color.join(",")})`,s.title=e.title,s.className="timelineEventGenerated",i.appendChild(s);let o=document.createElement("div");o.title=e.title,o.innerText=e.title,o.className="timelineEventGeneratedTitle",o.style.whiteSpace="nowrap",o.style.pointerEvents="none",o.style.userSelect="none",s.appendChild(o)},l=e.start<M()&&e.end>X(),L=e.duration>y(),d=e.start<X()&&e.end>M(),b=!!e.children.length;switch(e.type){case"container":r();break;case"timeline":{t(l);break}case"background":{n(l);break}}return i},ce=()=>{h.style.position="relative",h.style.overflow="hidden",h.style.minHeight="3rem";let e=h.querySelector(".timelineHeaderContainer");N=e||document.createElement("div"),e||h.appendChild(N),N.className="timelineHeaderContainer",N.style.width="100%",N.style.height="20px",N.style.backgroundColor="white";let i=h.querySelector(".timelineLabelContainer");switch(p=i||document.createElement("div"),i||h.appendChild(p),p.className="timelineLabelContainer",p.style.width="100%",p.style.height="50px",p.style.textAlign="center",p.style.position="absolute",p.style.pointerEvents="none",p.style.userSelect="none",g.position){case"top":p.style.top="20px";break;default:p.style.bottom="0"}let r=h.querySelector(".timelineDividerContainer");v=r||document.createElement("div"),r||h.appendChild(v),v.className="timelineDividerContainer",v.style.width="100%",v.style.height="calc(100% - 20px)",v.style.position="absolute",v.style.zIndex="-2",v.style.bottom="0";let t=h.querySelector(".timelineEventsContainer");D=t||document.createElement("div"),t||h.appendChild(D),D.className="timelineEventsContainer",D.style.position="absolute",D.style.bottom="50px",D.style.height="calc(100% - 70px)",D.style.width="100%"},de=e=>{let i=new Date(e*6e4);return y()<5760?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"}).format(i):y()<60480?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric"}).format(i):y()<788923.1502?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short"}).format(i):i.getFullYear().toString()},x=()=>{if(!h)return;let e=Math.floor(c),i=Math.pow(2,Math.floor(Math.log2(e))),r=1/(g.labelCount+1),t=M()-C,l=F()*r/i,d=Math.floor(t/l)*l,b=document.createDocumentFragment(),u=document.createDocumentFragment();for(let a=0;a<g.labelCount+2;a++){let s=(a+1)*l+C+d-l,o=s+l/2,S=R(s)*100,A=R(o)*100,w=document.createElement("div");w.className="timelineLabel",w.style.left=S+"%",w.style.top="50%",w.style.transform="translate(calc(-50%), calc(-50%))",w.style.textAlign="center",w.style.position="absolute",w.style.zIndex="-1",w.style.width=r*100+"%",w.innerHTML=de(s),b.appendChild(w);let H=document.createElement("div");H.className="timelineDivider",H.style.left=A+"%",H.style.textAlign="center",H.style.position="absolute",H.style.height="100%",H.style.zIndex="-10",H.innerHTML="",u.appendChild(H)}p.innerHTML="",p.appendChild(b),v.innerHTML="",v.appendChild(u);let m=G(Z);D.innerHTML="",m&&D.appendChild(m),h.dispatchEvent(new CustomEvent("update",{detail:be(),bubbles:!0,cancelable:!0,composed:!1}))},j=e=>{if(e===void 0)return;let i=t=>{let n=new Date;if(n.setDate(t[2]?t[2]:1),n.setMonth(t[1]?t[1]-1:0),n.setHours(t[3]?t[3]:0),n.setMinutes(t[4]?t[4]:0),n.setSeconds(0),!t[0])return n.getTime()/6e4;if(t[0]&&t[0]>-27e4&&t[0]<27e4)return n.setFullYear(t[0]),n.getTime()/6e4;let l=525948.766*t[0];return n.setFullYear(0),l+n.getTime()/6e4},r=t=>{switch(t){case"now":return new Date;default:let n=Number(t.replace(/y$/,""));return isNaN(n)?new Date(t):new Date(Date.now()+31556926*1e3*n)}};if(Array.isArray(e)){let t=e;if(t.length===0)throw new Error("argument Array cannot be empty");if(!t.every(l=>typeof l=="number"))throw new Error("input Array must contain only numbers");return i(t)}if(typeof e=="object"&&e.constructor.name==="Date")return e.getTime()/6e4;if(typeof e=="string")return r(e).getTime()/6e4;if(typeof e=="number")return new Date(e).getTime()/6e4},ue=e=>e.every(i=>typeof i=="number"),W=e=>e.start?e.children.length?Math.min(e.start,e.children[0].start):e.start:e.children.length?e.children[0].start:void 0,_=e=>e.end?e.end:e.duration&&!isNaN(Number(e.duration))?e.start+Number(e.duration):e.children.length&&e.children[e.children.length-1].end||e.start+1,me=(e,i)=>{let r=0;for(let t in i.levelMatrix)if(r=Number(t),e.start>i.levelMatrix[t].time){for(let n=0;n<e.height;n++)i.levelMatrix[(r+n).toString()]={height:e.height,time:e.end};return r}r++;for(let t=0;t<e.height;t++)i.levelMatrix[(r+t).toString()]={height:e.height,time:e.end};return r},J=(e,...i)=>{let r=(n,l)=>n.duration/l.duration*n.children.length||1,t=i.map(n=>K(n,e)).filter(n=>!!n);t&&t.length&&e&&(e.children.push(...t),e.children.sort((n,l)=>n.start-l.start),e.start=W(e),e.end=_(e),e.duration=e.end-e.start,e.levelMatrix={1:{height:0,time:Number.MIN_SAFE_INTEGER}},e.children.forEach((n,l)=>{n.score=["container","timeline"].includes(n.type)?r(n,e):0,n.level=["container","timeline"].includes(n.type)?me(n,e):0})),e.height=e.children.length?Math.max.apply(1,e.children.map(n=>n.level)):1},K=(e,i)=>{if(!e){console.warn("Event object is empty");return}let r=Y(V({type:"timeline",duration:0,level:1,step:0,score:0,height:1,children:[],depth:i?i.depth+1:0},e),{color:e.color?ue(e.color)?e.color:[140,140,140,e.type==="background"?.1:1]:[140,140,140,e.type==="background"?.1:1],start:j(e.start),end:j(e.end)});if(e.events&&e.events.length&&J(r,...e.events),r.start=W(r),!r.start){console.warn("Missing start property on event - skipping",e);return}return r.end=_(r),r.duration=r.end-r.start,r},he=e=>{let i=[],r=e.querySelectorAll(".timelineEvent");return r&&r.forEach(t=>{try{i.push(Y(V({},t.attributes),{events:he(t)}))}catch(n){console.error(n,"timelineEvent")}}),i},be=()=>({options:g,viewStartDate:M(),viewEndDate:X(),viewDuration:y(),ratio:c,pivot:E});return te(T,f),{focus:ae,load:ee,current:Z,element:h}};export{we as Timeline};
