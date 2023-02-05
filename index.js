var le=Object.defineProperty,ce=Object.defineProperties;var me=Object.getOwnPropertyDescriptors;var B=Object.getOwnPropertySymbols;var ue=Object.prototype.hasOwnProperty,de=Object.prototype.propertyIsEnumerable;var W=(T,p,f)=>p in T?le(T,p,{enumerable:!0,configurable:!0,writable:!0,value:f}):T[p]=f,V=(T,p)=>{for(var f in p||(p={}))ue.call(p,f)&&W(T,f,p[f]);if(B)for(var f of B(p))de.call(p,f)&&W(T,f,p[f]);return T},O=(T,p)=>ce(T,me(p));var ge=(T,p,f)=>{let b,A,Y,C,$,m,u,g,w,D,H,I=[],J=(t,s,l)=>{if(!t)throw new Error("Element argument is empty. DOM element | selector as first arg");if(typeof t=="string"){let c=document.querySelector(t);if(!c)throw new Error(`Selector could not be found [${m}]`);m=c}t instanceof HTMLElement&&(m=t),u=V({labelCount:5,zoomSpeed:.025,dragSpeed:.001,timelineStart:"-1000y",timelineEnd:"100y",minZoom:1,maxZoom:1e11,position:"bottom",expandRatio:80,eventHeight:5},l),I.push(_(s));let e=K();C=X(u.timelineStart),$=X(u.timelineEnd);let n=u.viewStart?X(u.viewStart):e.start-e.duration*.05,i=u.viewEnd?X(u.viewEnd):e.end+e.duration*.05;n<C&&(C=n),i>$&&($=i);let r=i-n;b=z()/r,A=(C-n)/r,ne(),ee(m),k()},K=()=>{let[t]=I.slice(-1);return t},z=()=>$-C,q=()=>m.offsetWidth||0,N=()=>C-M()*A,Z=()=>N()+M(),M=()=>z()/b,S=t=>(t-N())/M(),Q=(t,s)=>{let l=b-s;return t===1&&l<=u.minZoom||t===-1&&l>=u.maxZoom?!1:(b=l,!0)},P=t=>{let s=A+t;s>=0&&(s=0),s+b<=1&&(s=1-b),A=s},j=(t,s)=>{let l=u.zoomSpeed*b,e=t*l,r=((s||0)/q()-A)/b*e;Q(t,e)&&P(r),k()},U=t=>{P(t),k()},G=(t,s)=>{if(!t)return;let l=400,e=0,n=t.start-t.duration*.05,r=t.end+t.duration*.05-n,c=z()/r;if(s){let x=N()+M()/2,o=S(x)*M(),a=N()+o;Y=S(a)*q()}else{let x=n+r/2,o=S(x)*r,a=n+o;Y=S(a)*q()}let d=Math.sign(b-c);s&&I.pop();let y=x=>{clearInterval(v),!s&&t.children.length>0&&I.push(t),k()},v=setInterval(()=>{if(j(d,Y),d<0&&b>c){y(1);return}if(d>0&&b<c){y(2);return}e++>l&&y(3)},1)},ee=t=>{window.addEventListener("resize",()=>{k()},{passive:!0}),t.addEventListener("wheel",i=>{var r=Math.sign(i.deltaY);let d=(i.target.attributes.starttime?S(i.target.attributes.starttime):0)*t.getBoundingClientRect().width+i.offsetX;j(r,d)},{passive:!0});let s,l,e=!1,n=!0;t.addEventListener("mousedown",i=>{e=!0,s=i.pageX,l=i.pageY},{passive:!0}),t.addEventListener("mousemove",i=>{if(!e||!n)return;n=!1;let r=(i.pageX-s)*u.dragSpeed;r&&U(r),s=i.pageX,l=i.pageY,setTimeout(()=>n=!0,10)},{passive:!0}),t.addEventListener("mouseup",()=>{e=!1},{passive:!0})},te=t=>{let s=document.createDocumentFragment(),l=n=>{if(n.start>=Z()||n.end<=N())return;let i=S(n.start),r=document.createElement("div"),c=n.duration/M()*100;return r.style.left=i*100+"%",r.style.width=c+"%",r.style.position="absolute",r.style.minWidth="5px",r.style.overflow="hidden",r.title=n.title,r.className="timelineEventGenerated",r.attributes.starttime=n.start,r.attributes.expanded=c>u.expandRatio,r},e=n=>{let i=document.createElement("div");return i.title=n.title,i.innerText=n.title,i.className="timelineEventGeneratedTitle",i.style.whiteSpace="nowrap",i.style.pointerEvents="none",i.style.userSelect="none",i};return t.children.filter(n=>n.type==="background").forEach((n,i)=>{try{let r=l(n);if(r){let c=n.color.map(d=>d-Math.pow(10,n.depth));r.style.bottom="0px",r.style.minHeight="100%",r.style.backgroundColor=`rgba(${c[0]},${c[1]},${c[2]}, .05)`,r.addEventListener("click",d=>{r.dispatchEvent(new CustomEvent("background-event-click",{detail:n,bubbles:!0}))}),r.append(e(n)),s.appendChild(r)}}catch(r){console.error(r,"backgroundEvent",n)}}),t.children.filter(n=>n.type==="timeline").forEach((n,i)=>{try{let r=l(n);if(r){let c=n.height+(n.height-1)*.5,d=(n.level+t.level-1)*1.5,y=n.color.map(v=>v-Math.pow(10,n.depth));r.style.bottom=`${d*u.eventHeight}px`,r.style.minHeight=`${c*u.eventHeight}px`,r.style.borderRadius="5px",r.style.boxSizing="border-box",r.style.border="1px solid rgba(100,100,100,.5)",r.style.backgroundColor=`rgb(${y[0]},${y[1]},${y[2]})`,r.style.zIndex=n.depth.toString(),r.addEventListener("click",v=>{r.dispatchEvent(new CustomEvent("event-click",{detail:n,bubbles:!0}))}),s.appendChild(r)}}catch(r){console.error(r,"timelineEvent",n)}}),s},ne=()=>{m.style.position="relative",m.style.overflow="hidden",m.style.minHeight="3rem";let t=m.querySelector(".timelineHeaderContainer");H=t||document.createElement("div"),t||m.appendChild(H),H.className="timelineHeaderContainer",H.style.width="100%",H.style.height="20px",H.style.backgroundColor="white";let s=m.querySelector(".timelineLabelContainer");switch(g=s||document.createElement("div"),s||m.appendChild(g),g.className="timelineLabelContainer",g.style.width="100%",g.style.height="50px",g.style.textAlign="center",g.style.position="absolute",g.style.pointerEvents="none",g.style.userSelect="none",u.position){case"top":g.style.top="20px";break;default:g.style.bottom="0"}let l=m.querySelector(".timelineDividerContainer");w=l||document.createElement("div"),l||m.appendChild(w),w.className="timelineDividerContainer",w.style.width="100%",w.style.height="calc(100% - 20px)",w.style.position="absolute",w.style.zIndex="-2",w.style.bottom="0";let e=m.querySelector(".timelineEventsContainer");D=e||document.createElement("div"),e||m.appendChild(D),D.className="timelineEventsContainer",D.style.position="absolute",D.style.bottom="50px",D.style.height="calc(100% - 70px)",D.style.width="100%"},re=t=>{let s=new Date(t*6e4);return M()<5760?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"numeric"}).format(s):M()<60480?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short",day:"numeric"}).format(s):M()<788923.1502?Intl.DateTimeFormat(void 0,{year:"numeric",month:"short"}).format(s):s.getFullYear().toString()},k=()=>{if(!m)return;let t=Math.floor(b),s=Math.pow(2,Math.floor(Math.log2(t))),l=1/(u.labelCount+1),e=N()-C,i=z()*l/s,c=Math.floor(e/i)*i,d=document.createDocumentFragment(),y=document.createDocumentFragment();for(let a=0;a<u.labelCount+2;a++){let h=(a+1)*i+C+c-i,F=h+i/2,se=S(h)*100,ae=S(F)*100,L=document.createElement("div");L.className="timelineLabel",L.style.left=se+"%",L.style.top="50%",L.style.transform="translate(calc(-50%), calc(-50%))",L.style.textAlign="center",L.style.position="absolute",L.style.zIndex="-1",L.style.width=l*100+"%",L.innerHTML=re(h),d.appendChild(L);let E=document.createElement("div");E.className="timelineDivider",E.style.left=ae+"%",E.style.textAlign="center",E.style.position="absolute",E.style.height="100%",E.style.zIndex="-10",E.innerHTML="",y.appendChild(E)}g.innerHTML="",g.appendChild(d),w.innerHTML="",w.appendChild(y);let[v]=I.slice(-1),x=te(v);D.innerHTML="",D.appendChild(x);let R=document.createDocumentFragment(),o=document.createElement("div");if(o.className="timelineHeader",o.style.textAlign="center",o.innerHTML=v.title,R.appendChild(o),I.length>1){let a=document.createElement("div");a.className="timelineBack",a.style.position="absolute",a.style.top="0px",a.style.left="5px",a.style.cursor="pointer",a.innerHTML="<",a.addEventListener("click",h=>{a.dispatchEvent(new CustomEvent("back-click",{bubbles:!0}));let[F]=I.slice(-2);G(F,!0)}),R.appendChild(a)}H.innerHTML="",H.appendChild(R),m.dispatchEvent(new CustomEvent("update",{detail:oe(),bubbles:!0,cancelable:!0,composed:!1}))},X=t=>{if(t===void 0)return;let s=e=>{let n=new Date;if(n.setDate(e[2]?e[2]:1),n.setMonth(e[1]?e[1]-1:0),n.setHours(e[3]?e[3]:0),n.setMinutes(e[4]?e[4]:0),n.setSeconds(0),!e[0])return n.getTime()/6e4;if(e[0]&&e[0]>-27e4&&e[0]<27e4)return n.setFullYear(e[0]),n.getTime()/6e4;let i=525948.766*e[0];return n.setFullYear(0),i+n.getTime()/6e4},l=e=>{switch(e){case"now":return new Date;default:let n=Number(e.replace(/y$/,""));return isNaN(n)?new Date(e):new Date(Date.now()+31556926*1e3*n)}};if(Array.isArray(t)){let e=t;if(e.length===0)throw new Error("argument Array cannot be empty");if(!e.every(i=>typeof i=="number"))throw new Error("input Array must contain only numbers");return s(e)}if(typeof t=="object"&&t.constructor.name==="Date")return t.getTime()/6e4;if(typeof t=="string")return l(t).getTime()/6e4;if(typeof t=="number")return new Date(t).getTime()/6e4},_=(t,s)=>{if(!t){console.warn("Event object is empty");return}let l=o=>o.every(a=>typeof a=="number"),e=O(V({type:"timeline",duration:0,color:[240,240,240],expanded:!1,level:0,step:0,score:0,height:0,children:[],depth:s?s.depth+1:0},t),{start:X(t.start),end:X(t.end)}),n=t.events?t.events.reduce((o,a)=>{let h=_(a,e);return h&&o.push(h),o},[]):[];e.children=n.sort((o,a)=>o.start-a.start);let i=e.start?e.children.length?Math.min(e.start,e.children[0].start):e.start:e.children.length?e.children[0].start:void 0;if(!i){console.warn("Missing start property on event - skipping",t);return}let r=e.end?e.end:e.duration&&!isNaN(Number(e.duration))?i+Number(e.duration):e.children.length&&e.children[e.children.length-1].end||i+1,c=t.color?l(t.color)?t.color:[240,240,240]:[240,240,240],d={1:{height:0,time:Number.MIN_SAFE_INTEGER}},y=o=>{let a=0;for(let h in d)if(a=Number(h),o.start>d[h].time){for(let F=0;F<o.height;F++)d[(a+F).toString()]={height:o.height,time:o.end};return a}a++;for(let h=0;h<o.height;h++)d[(a+h).toString()]={height:o.height,time:o.end};return a},v={1:{height:0,time:Number.MIN_SAFE_INTEGER}},x=o=>{let a=0;for(let h in v)if(a=Number(h),o.start>v[h].time)return v[a.toString()]={height:o.height,time:o.end},a;return a++,v[a.toString()]={height:o.height,time:o.end},a},R=o=>{let a=1;return a=(o.duration||1)/z()*e.children.length,a};return e.children.forEach((o,a)=>{o.score=R(o),o.level=o.type==="timeline"?y(o):0,o.step=o.type==="timeline"?x(o):0}),e.type=t.type||"timeline",e.duration=r-i,e.color=c,e.start=i,e.end=r,e.height=n.length?Math.max.apply(1,n.map(o=>o.level)):1,e},ie=t=>{let s=[],l=t.querySelectorAll(".timelineEvent");return l&&l.forEach(e=>{try{s.push(O(V({},e.attributes),{events:ie(e)}))}catch(n){console.error(n,"timelineEvent")}}),s},oe=()=>({options:u,viewStartDate:N(),viewEndDate:Z(),viewDuration:M(),ratio:b,pivot:A});return J(T,p,f),{focus:G}};export{ge as Timeline};
