interface ITimelineOptions {
	labelCount: number;
	zoomSpeed: number;
	dragSpeed: number;
	start?: number[] | string | number | Date;
	end?: number[] | string | number | Date;
	timelineStart: number[] | string | number | Date;
	timelineEnd: number[] | string | number | Date;
	minZoom: number;
	maxZoom: number;
	position: string;
	expandRatio: number;
	eventHeight: number;
}
interface IMatrix {
	[key: number]: {
		height: number,
		time: number
	}
}
interface ITimeline {
	start: number;
	end: number;
	duration: number;
	title: string;
	children: ITimeline[];
	level: number;
	step: number;
	depth: number;
	height: number;
	score: number;
	type: string;
	color: number[];
	wikipedia?: string;
	description?: string;
	levelMatrix?: IMatrix;
}
export interface ITimelineEvent {
	title: string;
	start?: number[] | string | number | Date;
	end?: number[] | string | number | Date;
	duration?: number;
	events?: ITimelineEvent[];
	type?: string;
	color?: number[];
	wikipedia?: string;
	description?: string;
}
enum Direction {
	In = -1,Out = 1
}

export const Timeline = (elementIdentifier: HTMLElement | string, settings: object | undefined) => {
	let ratio: number
	let pivot: number
	let timelineStart: number
	let timelineEnd: number
	let element: HTMLElement
	let options: ITimelineOptions
	let labelContainer: HTMLDivElement
	let dividerContainer: HTMLDivElement
	let eventsContainer: HTMLDivElement
	let headerContainer: HTMLDivElement
	let history: ITimeline[] = []
	let currentTimeline: ITimeline
	let rootTimeline: ITimeline

	const load = (timelineEvent: ITimelineEvent) => {
		if(!timelineEvent) throw new Error(`Event argument is empty. Please provide Timeline event as first arg`);

		// Parse & sort all events
		addEvents(rootTimeline, timelineEvent);
		
		// Draw
		update();
	}
	const init = (elementIdentifier: HTMLElement | string, settings: object | undefined) => {
		// Handle DOM Element
		if(!elementIdentifier) throw new Error(`Element argument is empty. DOM element | selector as first arg`);
		if (typeof elementIdentifier === "string") {
			const elem = document.querySelector(elementIdentifier) as HTMLElement;
			if (!elem) throw new Error(`Selector could not be found [${element}]`);
			element = elem;
		} 
		if(elementIdentifier instanceof HTMLElement) {
			element = elementIdentifier;
		}

		// Handle options
		options = {
			...{
				labelCount: 5,
				zoomSpeed: 0.025,
				dragSpeed: 0.001,
				timelineStart: "-270000",
				timelineEnd: "1000y",
				start: "-1000y",
				end: "100y",
				minZoom: 1,
				maxZoom: 1e11,
				position: "bottom",
				expandRatio: 80,
				eventHeight: 5,
			},
			...settings,
		};
		
		rootTimeline = parseEvent({
			title: 'View', 
			type: 'container',
			start: options.start, 
			end: options.end,
		});
		
		// Set timeline boundaries
		timelineStart = parseToMinutes(options.timelineStart);
		timelineEnd = parseToMinutes(options.timelineEnd);

		//Calculate view position on timeline
		// const viewStart = options.viewStart 
		// 	? parseToMinutes(options.viewStart) 
		// 	: (currentTimeline.start - (currentTimeline.duration * .05)); // Create 10% spacing - 5% on each side of the timeline
		// const viewEnd = options.viewEnd 
		// 	? parseToMinutes(options.viewEnd) 
		// 	: (currentTimeline.end + (currentTimeline.duration * .05)); // Create 10% spacing - 5% on each side of the timeline

		const viewStart = rootTimeline.start;
		const viewEnd = rootTimeline.end;

		if(viewStart < timelineStart) timelineStart = viewStart
		if(viewEnd > timelineEnd) timelineEnd = viewEnd
		const viewDuration = (viewEnd - viewStart);
		
		ratio = timelineDuration() / viewDuration;
		pivot = (timelineStart - viewStart) / viewDuration; 

		// Set initial timeline
		currentTimeline = rootTimeline;

		// Handle DOM elements setup
		setupContainerHTML();

		// Register Mouse and Resize event handlers
		registerListeners(element);

		// Draw
		update();
	}
	const focusedTimeline = (): ITimeline | undefined => {
		if(history.length){
			const [focusedTimeline] = history.slice(-1);
			return focusedTimeline;
		}
		return undefined;
	}
	const timelineDuration = (): number => {
		return timelineEnd - timelineStart;
	}
	const viewWidth = (): number => {
		return element.offsetWidth || 0;
	}
	const viewStart = (): number => {
		return timelineStart - viewDuration() * pivot;
	}
	const viewEnd = (): number => {
		return viewStart() + viewDuration();
	}
	const viewDuration = (): number => {
		return timelineDuration() / ratio;
	}
	const scaledZoomSpeed = (): number => {
		return options.zoomSpeed * ratio;
	}
	const getViewRatio = (minutes: number): number => {
		return (minutes - viewStart()) / viewDuration();
	}
	const getTimelineRatio = (minutes: number): number => {
		return (minutes - timelineStart) / timelineDuration();
	}
	const setRatio = (direction: Direction, deltaRatio: number): boolean => {
		let newRatio = ratio - deltaRatio;

		// If zoom OUT - test if zoom is allowed
		if (direction === Direction.Out && newRatio <= options.minZoom) {
			return false;
		}

		// If zoom IN - test if zoom is allowed
		if (direction === Direction.In && newRatio >= options.maxZoom) {
			return false;
		}

		ratio = newRatio;
		return true;
	}
	const setPivot = (deltaPivot: number): void => {
		let newPivot = pivot + deltaPivot;

		if (newPivot >= 0) {
			// pivot larger than allowed (too much to the right)
			newPivot = 0;
		}

		if (newPivot + ratio <= 1) {
			// pivot smaller than allowed (too much to the left)
			newPivot = 1 - ratio;
		}

		pivot = newPivot;
	}
	const zoom = (direction: Direction, mouseX2timeline: number): void => {
		// Make zoomSpeed relative to zoomLevel
		const deltaRatio = direction * scaledZoomSpeed();
		const deltaPivot = mouseX2timeline * deltaRatio;

		if(setRatio(direction, deltaRatio))
			setPivot(deltaPivot);

		update();
	}
	const move = (deltaPivot: number): void => {
		setPivot(deltaPivot);
		update();
	}
	const focus = (timelineEvent: ITimeline) : void => {
		if(!timelineEvent) return;
		let mouseX2Timeline = 0;
		//let targetPivot = 0;
		
		const targetStart = (timelineEvent.start - (timelineEvent.duration * .05)); // Create 10% spacing - 5% on each side of the timeline
		const targetEnd = (timelineEvent.end + (timelineEvent.duration * .05)); // Create 10% spacing - 5% on each side of the timeline
		const targetDuration = (targetEnd - targetStart);
		const targetRatio = timelineDuration() / targetDuration;
		const zDirection = Math.sign(ratio-targetRatio);
		let back = zDirection>0;
		
		if(back){
			const offsetCenter = viewStart() + (viewDuration() / 2);
			const offsetCenter2Target = (offsetCenter - targetStart) / targetDuration;
			const offsetCenterCorrected = viewStart() + (viewDuration()*offsetCenter2Target);
			const offsetCenter2Timeline = getTimelineRatio(offsetCenterCorrected);
			mouseX2Timeline = offsetCenter2Timeline
		} else {
			const targetCenter = targetStart + (targetDuration / 2);
			const targetCenter2View = getViewRatio(targetCenter);
			const targetCenterCorrected = targetStart + (targetDuration*targetCenter2View);
			const targetCenter2Timeline = getTimelineRatio(targetCenterCorrected);
			mouseX2Timeline = targetCenter2Timeline
		}
		
		if(timelineEvent != focusedTimeline()){
			history.push(timelineEvent);
		}

		const stopZoom = () => {
			clearInterval(ratioTimer);
			//currentTimeline = timelineEvent.parent || currentTimeline;
			update();
		}

		const stopMove = () => {
			update();
		}

		const ratioTimer = setInterval(()=>{
			zoom(zDirection, mouseX2Timeline);
			if(zDirection<0 && ratio>targetRatio) stopZoom() // In
			if(zDirection>0 && ratio<targetRatio) stopZoom() // Out
		}, 1);

		// const pivotTimer = setInterval(()=>{
		// 	const deltaRatio = zDirection * scaledZoomSpeed();
		// 	const deltaPivot = deltaRatio * options.dragSpeed;
		// 	setPivot(deltaPivot);
		// 	update();
		// 	console.log(xDirection, pivot, targetPivot)
		// 	if(xDirection<0 && pivot>targetPivot) stopMove() // Left
		// 	if(xDirection>0 && pivot<targetPivot) stopMove() // Right
		// }, 1);
	}
	const registerListeners = (element: HTMLElement): void => {
		// Add resize handler
		window.addEventListener("resize", () => {
			update();
		}, { passive: true });


		// Add zoom event handler
		element.addEventListener("wheel", (event) => {
			if(event.defaultPrevented) return;
			// Decide whether zoom is IN (-) or OUT (+)
			var direction = Math.sign(event.deltaY) as Direction;
			// console.log('wheel', direction, event)
			// Adjust width of timeline for zooming effect
			const leftRatio = (event.target as HTMLElement).attributes["starttime"]
				? getViewRatio((event.target as HTMLElement).attributes["starttime"])
				: 0

			const offsetX = leftRatio * element.getBoundingClientRect().width + event.offsetX;
			const mouseX2view = offsetX / viewWidth();
			const mouseX2timeline = (mouseX2view - pivot) / ratio;
			zoom(direction, mouseX2timeline);
		}, { passive: true });

		// Add drag event handler
		let dragStartX: number, dragStartY: number;
		let inDrag = false;
		let enableCall = true;
		element.addEventListener("mousedown", (e) => {
			inDrag = true;
			dragStartX = e.pageX;
			dragStartY = e.pageY;
		}, { passive: true });

		// Add move handler
		element.addEventListener("mousemove", (event) => {
			if (!inDrag || !enableCall) {
				return;
			}
			enableCall = false;
			const deltaScrollLeft = (event.pageX - dragStartX) * options.dragSpeed;
			//const deltaScrollTop = (e.pageY - dragStartY) * options.dragSpeed;
			if(deltaScrollLeft) move(deltaScrollLeft);
			dragStartX = event.pageX;
			dragStartY = event.pageY;
			setTimeout(() => enableCall = true, 10); // Throttle mousemove for performance reasons
		}, { passive: true });

		// Add mouse up handler
		element.addEventListener("mouseup", () => {
			inDrag = false;
		}, { passive: true });

		// const x: CSSStyleDeclaration = {
		// 	zIndex: '5',
		// 	position: 'absolute',
		// 	right: '0',
		// 	top: '0',
		// 	height: '100%',
		// 	width: '50%',
		// 	backgroundColor: 'white',
		// }

		const detailsLoader = (detail: ITimeline, callback: (details: DocumentFragment) => void): void => {
			const detailsContainer = document.createDocumentFragment();
			const detailsScrollableContainer = document.createElement("div");
			detailsScrollableContainer.className = 'detailsScrollableContainer'
			detailsScrollableContainer.style.overflow = "auto";
			detailsScrollableContainer.style.height = "100%";
			detailsScrollableContainer.style.position = "absolute";
			
			const detailsBody = document.createElement("div");
			detailsBody.style.padding = "10px";
			detailsScrollableContainer.appendChild(detailsBody);
			detailsContainer.appendChild(detailsScrollableContainer)

			console.log(detail)

			// if(detail.description){
			// 	const headline = document.createElement("H1");
			// 	headline.innerHTML = detail.title;
			// 	detailsContainer.appendChild(headline);
			// 	const body = document.createElement("p");
			// 	body.innerHTML = detail.description;
			// 	detailsContainer.appendChild(body);
			// 	callback(detailsContainer);
			// 	return;
			// }
			if(detail.wikipedia){
				fetch(detail.wikipedia)
					.then((response)=>response.json())
					.then(result => {
						const headline = document.createElement("H1");
						headline.innerHTML = result.query.pages[0].title;
						detailsBody.appendChild(headline);
						
						if(result.query.pages[0].thumbnail){
							const thumbnail = document.createElement("p");
							const thumbnailImg = document.createElement("img");
							thumbnailImg.src = result.query.pages[0].thumbnail.source;
							thumbnailImg.style.width = "100%";
							thumbnail.appendChild(thumbnailImg);
							detailsBody.appendChild(thumbnail);
						} else if(result.query.pages[0].images && result.query.pages[0].images.length){
							// const thumbnail = document.createElement("p");
							// const thumbnailImg = document.createElement("img");
							// thumbnailImg.src = result.query.pages[0].images[0].source;
							// thumbnailImg.style.width = "100%";
							// thumbnail.appendChild(thumbnailImg);
							// detailsBody.appendChild(thumbnail);
						}

						const extract = document.createElement("p");
						extract.innerHTML = result.query.pages[0].extract;
						detailsBody.appendChild(extract);

						callback(detailsContainer);
					});
				
				return;
			}

			const headline = document.createElement("H3");
			headline.innerHTML = "No detail information found...";
			detailsContainer.appendChild(headline);
			callback(detailsContainer);
		}

		const navigateLoader = (callback: (details: DocumentFragment) => void): void => {
			const container = document.createDocumentFragment();
			const scrollable = document.createElement("div");
			scrollable.style.overflow = 'auto';
			[...history].reverse().forEach((timeline) => {
				const historyItem = document.createElement("a");
				historyItem.innerHTML = timeline.title;
				historyItem.href = '#';
				historyItem.style.cursor = 'pointer';
				historyItem.addEventListener("click", (e) => {
					e.preventDefault();
					historyItem.dispatchEvent(new CustomEvent("event-click", {
						detail: timeline,
						bubbles: true,
						cancelable: true,
					}));
				});
				scrollable.appendChild(historyItem);
				scrollable.appendChild(document.createElement("br"));
			})
			container.appendChild(scrollable)
			callback(container);
		}

		// Initialize details container
		// element.addEventListener('detail-click', (e: CustomEvent<ITimeline>) => {
		// 	const detailsContainer = document.createElement("div");
		// 	detailsContainer.className = "timelineDetailsContainer";
		// 	detailsContainer.style.zIndex = '5';
		// 	detailsContainer.style.position = 'absolute';
		// 	detailsContainer.style.right = '0';
		// 	detailsContainer.style.top = '0';
		// 	detailsContainer.style.height = "100%";
		// 	detailsContainer.style.width = "50%";
		// 	//detailsContainer.style.padding = "10px";
		// 	detailsContainer.style.backgroundColor = 'white';
		// 	detailsContainer.addEventListener("wheel", (e) => {
		// 		e.stopImmediatePropagation();
		// 	})
		// 	detailsContainer.addEventListener("mousedown", (e) => {
		// 		e.stopImmediatePropagation();
		// 	})
		// 	element.append(detailsContainer);
			
		// 	const detailsCloseContainer = document.createElement("div");
		// 	detailsCloseContainer.className = "timelineDetailsClose";
		// 	detailsCloseContainer.style.position = 'absolute';
		// 	detailsCloseContainer.style.right = '20px';
		// 	detailsCloseContainer.style.top = '10px';
		// 	detailsCloseContainer.style.padding = '3px';
		// 	detailsCloseContainer.style.cursor = 'pointer';
		// 	//detailsCloseContainer.style.border = 'solid 1px black';
		// 	detailsCloseContainer.style.borderRadius = '5px';
		// 	detailsCloseContainer.style.zIndex = '1';
		// 	detailsCloseContainer.innerHTML = ">";
		// 	detailsCloseContainer.addEventListener("click", (e) => {
		// 		detailsCloseContainer.dispatchEvent(new CustomEvent("detail-close-click", {
		// 			bubbles: true
		// 		}));
		// 		element.removeChild(detailsContainer);
		// 	});
		// 	detailsContainer.append(detailsCloseContainer)

		// 	const detailsBodyContainer = document.createElement("div");
		// 	detailsBodyContainer.className = "timelineDetailsBody";
		// 	detailsBodyContainer.innerHTML = "<h3>Loading...</h3>";
		// 	detailsContainer.append(detailsBodyContainer);

		// 	detailsLoader(e.detail, (detailFragment) => {
		// 		detailsBodyContainer.innerHTML = '';
		// 		detailsBodyContainer.appendChild(detailFragment);
		// 	})
		// });	

		// Initialize navigate container
		// element.addEventListener('navigate-click', () => {
		// 	const navigateContainer = document.createElement("div");
		// 	navigateContainer.className = "timelineNavigateContainer";
		// 	navigateContainer.style.zIndex = '5';
		// 	navigateContainer.style.position = 'absolute';
		// 	navigateContainer.style.left = '0';
		// 	navigateContainer.style.top = '0';
		// 	navigateContainer.style.height = "100%";
		// 	navigateContainer.style.width = "30%";
		// 	navigateContainer.style.padding = "10px";
		// 	navigateContainer.style.backgroundColor = 'white';
		// 	navigateContainer.addEventListener("wheel", (e) => {
		// 		e.preventDefault();
		// 	})
		// 	element.append(navigateContainer);
			
		// 	const navigateCloseContainer = document.createElement("div");
		// 	navigateCloseContainer.className = "timelineNavigateCloseContainer";
		// 	navigateCloseContainer.style.position = 'absolute';
		// 	navigateCloseContainer.style.right = '10px';
		// 	navigateCloseContainer.style.top = '10px';
		// 	navigateCloseContainer.style.padding = '3px';
		// 	navigateCloseContainer.style.cursor = 'pointer';
		// 	navigateCloseContainer.style.border = 'solid 1px black';
		// 	navigateCloseContainer.style.borderRadius = '5px';
		// 	navigateCloseContainer.innerHTML = "<";
		// 	navigateCloseContainer.addEventListener("click", (e) => {
		// 		navigateCloseContainer.dispatchEvent(new CustomEvent("navigate-close-click", {
		// 			bubbles: true
		// 		}));
		// 		element.removeChild(navigateContainer);
		// 	});
		// 	navigateContainer.append(navigateCloseContainer)

		// 	const navigateBodyHeadlineContainer = document.createElement("div");
		// 	navigateBodyHeadlineContainer.className = "timelineNavigateBodyHeadlineContainer";
		// 	navigateBodyHeadlineContainer.innerHTML = "History";
		// 	navigateContainer.append(navigateBodyHeadlineContainer);

		// 	const navigateBodyContainer = document.createElement("div");
		// 	navigateBodyContainer.className = "timelineNavigateBodyContainer";
		// 	navigateBodyContainer.addEventListener("event-click", (e) => {
		// 		element.removeChild(navigateContainer);
		// 	});
		// 	navigateContainer.append(navigateBodyContainer);
			
		// 	navigateLoader((detailFragment) => {
		// 		navigateBodyContainer.appendChild(detailFragment);
		// 	})
		// });	
	}
	const setupEventsHTML = (timelineEvent: ITimeline): DocumentFragment => {
		if(!timelineEvent) return;
		if(timelineEvent.start >= viewEnd()) return;
		if(timelineEvent.end <= viewStart()) return;
		
		const eventsFragment = document.createDocumentFragment();

		const appendChildrenEventsHTML = () => {
			eventsFragment.append(...timelineEvent.children.reduce((result, evt)=>{
				const child = setupEventsHTML({
					...evt,
					level: timelineEvent.level + (evt.level - 1)
				});
				if(child)result.push(child);
				return result;
			}, new Array<DocumentFragment>()));
		}

		const appendTimelineEventHTML = (fullWidth: boolean) => {
			const levelFactor = timelineEvent.level * 1.5;
			const leftRatio = fullWidth ? 0 : getViewRatio(timelineEvent.start);
			const widthRatio = fullWidth ? 100 : (timelineEvent.duration / viewDuration()) * 100;

			const eventHTML = document.createElement("div");
			const borderColor = timelineEvent.color.map((color)=>(color - Math.pow(10,1)))
			eventHTML.style.bottom = `${levelFactor*options.eventHeight}px`;
			eventHTML.style.minHeight = `${options.eventHeight}px`;
			eventHTML.style.borderRadius = '5px'
			eventHTML.style.boxSizing = 'border-box'
			eventHTML.style.cursor = 'pointer'
			eventHTML.style.border = `1px solid rgba(${borderColor.join(',')})`
			eventHTML.style.backgroundColor = `rgb(${timelineEvent.color.join(',')})`
			eventHTML.style.zIndex = timelineEvent.depth.toString();
			eventHTML.addEventListener("click", (e) => {
				eventHTML.dispatchEvent(new CustomEvent("event-click", {
					detail: timelineEvent,
					bubbles: true,
					cancelable: true,
				}));
			});
			eventHTML.style.left = (leftRatio * 100) + '%'
			eventHTML.style.width = widthRatio + '%'
			eventHTML.style.position = 'absolute';
			eventHTML.style.minWidth = '5px';
			eventHTML.title = timelineEvent.title;
			eventHTML.className = "timelineEventGenerated";
			eventHTML.attributes["starttime"] = timelineEvent.start;
			eventHTML.attributes["expanded"] = widthRatio > options.expandRatio;
			eventsFragment.appendChild(eventHTML);
		}

		const appendBackgroundEventHTML = (fullWidth: boolean) => {
			const leftRatio = fullWidth ? 0 : getViewRatio(timelineEvent.start);
			const widthRatio = fullWidth ? 100 : (timelineEvent.duration / viewDuration()) * 100;

			const eventHTML = document.createElement("div");

			eventHTML.style.left = (leftRatio * 100) + '%'
			eventHTML.style.width = widthRatio + '%'
			eventHTML.style.position = 'absolute';
			eventHTML.style.minWidth = '5px';
			eventHTML.style.overflow = 'hidden';
			eventHTML.style.bottom = `0px`;
			eventHTML.style.minHeight = `100%`;
			eventHTML.style.backgroundColor = `rgb(${timelineEvent.color.join(',')})`
			eventHTML.title = timelineEvent.title;
			eventHTML.className = "timelineEventGenerated";
			// if(!fullWidth)
			// 	eventHTML.attributes["starttime"] = timelineEvent.start;
			eventsFragment.appendChild(eventHTML);

			const titleHTML = document.createElement("div");
			titleHTML.title = timelineEvent.title;
			titleHTML.innerText = timelineEvent.title;
			titleHTML.className = "timelineEventGeneratedTitle";
			titleHTML.style.whiteSpace = 'nowrap';
			titleHTML.style.pointerEvents = 'none';
			titleHTML.style.userSelect = 'none';
			eventHTML.appendChild(titleHTML);
		}

		const isViewInside = timelineEvent.start < viewStart() && timelineEvent.end > viewEnd();
		const isLargerThanView = timelineEvent.duration > viewDuration();
		const isInView = timelineEvent.start < viewEnd() && timelineEvent.end > viewStart()
		const hasChildren = !!timelineEvent.children.length;
		switch(timelineEvent.type){
			case 'container':
				appendChildrenEventsHTML();
				break;
			case 'timeline': {
				appendTimelineEventHTML(isViewInside);
				break;
			}
			case 'background': {
				appendBackgroundEventHTML(isViewInside)
				break;
			}
		}

		return eventsFragment
	}
	const setupContainerHTML = (): void => {
		// Register parent as position = "relative" for absolute positioning to work
		element.style.position = "relative";
		element.style.overflow = "hidden";
		element.style.minHeight = "3rem";

		// Initialize header
		const existingHeaderContainer = element.querySelector('.timelineHeaderContainer') as HTMLDivElement;
		headerContainer = existingHeaderContainer || document.createElement("div");
		if(!existingHeaderContainer) element.appendChild(headerContainer);

		headerContainer.className = "timelineHeaderContainer";
		headerContainer.style.width = "100%";
		headerContainer.style.height = "20px";
		headerContainer.style.backgroundColor = 'white';
		
		// Initialize labels
		const existingLabelContainer = element.querySelector('.timelineLabelContainer') as HTMLDivElement;
		labelContainer = existingLabelContainer || document.createElement("div");
		if(!existingLabelContainer) element.appendChild(labelContainer);

		labelContainer.className = "timelineLabelContainer";
		labelContainer.style.width = "100%";
		labelContainer.style.height = "50px";
		labelContainer.style.textAlign = "center";
		labelContainer.style.position = "absolute";
		labelContainer.style.pointerEvents = 'none';
		labelContainer.style.userSelect = 'none';
		switch(options.position){
			case "top":
				labelContainer.style.top = "20px";
				break;
			// case "center":
			// 	this.labelContainer.style.top = "50%";
			// 	this.labelContainer.style.transform = "translate(0, calc(-50%))";
			// 	break;
			default:
				labelContainer.style.bottom = "0";
		}

		// Initialize dividers
		const existingDividerContainer = element.querySelector('.timelineDividerContainer') as HTMLDivElement;
		dividerContainer = existingDividerContainer || document.createElement("div");
		if(!existingDividerContainer) element.appendChild(dividerContainer);

		dividerContainer.className = "timelineDividerContainer";
		dividerContainer.style.width = "100%";
		dividerContainer.style.height = "calc(100% - 20px)";
		dividerContainer.style.position = "absolute";
		dividerContainer.style.zIndex = "-2";
		dividerContainer.style.bottom = '0';

		// Initialize events container
		const existingEventsContainer = element.querySelector('.timelineEventsContainer') as HTMLDivElement;
		eventsContainer = existingEventsContainer || document.createElement("div");
		if(!existingEventsContainer) element.appendChild(eventsContainer);
		eventsContainer.className = "timelineEventsContainer";
		eventsContainer.style.position = 'absolute';
		eventsContainer.style.bottom = '50px';
		eventsContainer.style.height = "calc(100% - 70px)";
		eventsContainer.style.width = "100%";
	}
	const format = (minutes: number): string => {
		const moment = new Date(minutes * 6e4);
		if (viewDuration() < 1440 * 4) {
			// minutes in an day = 1440
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
				hour: "numeric",
				minute: "numeric",
			}).format(moment);
		}
		if (viewDuration() < 10080 * 6) {
			// minutes in a week = 10080
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			}).format(moment);
		}
		if (viewDuration() < 43829.0639 * 18) {
			// minutes in a month = 43829.0639
			return Intl.DateTimeFormat(undefined, {
				year: "numeric",
				month: "short",
			}).format(moment);
		}
		// minutes in a year = 525948.766
		return moment.getFullYear().toString();
	}
	const update = (): void => {
		if (!element) return;
		const currentLevel = Math.floor(ratio);
		// https://math.stackexchange.com/questions/3381728/find-closest-power-of-2-to-a-specific-number
		const iterator = Math.pow(2, Math.floor(Math.log2(currentLevel)));
		const granularity = 1 / (options.labelCount + 1);
		const timelineViewDifference = viewStart() - timelineStart;
		const timestampDistance = timelineDuration() * granularity;
		const currentTimestampDistanceByLevel = timestampDistance / iterator;

		//console.log(ratio, pivot)

		// Find integer value of timestamp difference
		const integerDifFraction = Math.floor(timelineViewDifference / currentTimestampDistanceByLevel);
		const currentDif = integerDifFraction * currentTimestampDistanceByLevel;

		const labels = document.createDocumentFragment();
		const dividers = document.createDocumentFragment();
		for (let i = 0; i < options.labelCount + 2; i++) {
			const labelTime =
				(i + 1) * currentTimestampDistanceByLevel + timelineStart + currentDif - currentTimestampDistanceByLevel;
			const dividerTime = labelTime + (currentTimestampDistanceByLevel / 2);

			// Set label position
			const labelViewRatio = getViewRatio(labelTime);
			const labelViewLeftPosition = labelViewRatio * 100;

			// Set divider position
			const dividerViewRatio = getViewRatio(dividerTime);
			const dividerViewLeftPosition = dividerViewRatio * 100;

			const label = document.createElement("div");
			label.className = "timelineLabel";
			label.style.left = labelViewLeftPosition + "%";
			label.style.top = "50%";
			label.style.transform = "translate(calc(-50%), calc(-50%))";
			label.style.textAlign = "center";
			label.style.position = "absolute";
			label.style.zIndex = "-1";
			label.style.width = granularity * 100 + "%";
			label.innerHTML = format(labelTime);
			labels.appendChild(label);

			const divider = document.createElement("div");
			divider.className = "timelineDivider";
			divider.style.left = dividerViewLeftPosition + "%";
			divider.style.textAlign = "center";
			divider.style.position = "absolute";
			divider.style.height = "100%";
			divider.style.zIndex = "-10";
			divider.innerHTML = "";
			dividers.appendChild(divider);
		}
		labelContainer.innerHTML = "";
		labelContainer.appendChild(labels);

		dividerContainer.innerHTML = "";
		dividerContainer.appendChild(dividers);
		
		// Automatically close timelines when zooming out
		// if(currentTimeline.start > viewStart() && currentTimeline.end < viewEnd() && currentTimeline.parent){
		// 	currentTimeline = currentTimeline.parent;
		// }

		//
		const eventsHtml = setupEventsHTML(currentTimeline);
		eventsContainer.innerHTML = "";
		if(eventsHtml)
			eventsContainer.appendChild(eventsHtml);

		// Dispatch DOM event
		element.dispatchEvent(new CustomEvent("update", {
			detail: toJSON(),
			bubbles: true,
			cancelable: true,
			composed: false,
		}));
	}
	const parseToMinutes = (input: number[] | string | number | Date | undefined): number => {
		if(input === undefined) return undefined;

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
		// It should be noted that the maximum Date is not of the same value as the maximum safe integer (Number.MAX_SAFE_INTEGER is 9,007,199,254,740,991).
		// Instead, it is defined in ECMA-262 that a maximum of ±100,000,000 (one hundred million) days relative
		// to January 1, 1970 UTC (that is, April 20, 271821 BCE ~ September 13, 275760 CE)
		// can be represented by the standard Date object (equivalent to ±8,640,000,000,000,000 milliseconds).

		const parseDateArray = (input: number[]): number => {
			const date = new Date();
			date.setDate(input[2] ? input[2] : 1);
			date.setMonth(input[1] ? (input[1] - 1) : 0);
			date.setHours(input[3] ? input[3] : 0);
			date.setMinutes(input[4] ? input[4] : 0);
			date.setSeconds(0);

			if(!input[0]){
				return date.getTime() / 6e4;
			}
			
			if(input[0]&&input[0]>-270000&&input[0]<270000){
				date.setFullYear(input[0]);
				return date.getTime() / 6e4;
			}

			// 525948.766 = minutes in a year
			const dateYearInMinutes = 525948.766 * input[0];
			date.setFullYear(0);
			return dateYearInMinutes + (date.getTime() / 6e4);
		}

		const parseDateString = (input: string): Date => {
			switch (input) {
				case "now":
					return new Date(); 
				default:
					// 31556926 = Seconds in a year
					// 525948.766 = minutes in a year
					const years = Number(input.replace(/y$/, ''))
					if(!isNaN(years)){
						return new Date(Date.now() + (31556926 * 1e3 * years)); 
					}
					// const year0 = new Date('0001-01-01');
					// const yearsBC = Number(input.replace(/bc$/, ''))
					// if(!isNaN(yearsBC)){
					// 	return new Date(year0.getTime() - 31556926 * 1e3 * yearsBC); 
					// }
					// const yearsAD = Number(input.replace(/ad$/, ''))
					// if(!isNaN(yearsAD)){
					// 	return new Date(year0.getTime() + 31556926 * 1e3 * yearsAD); 
					// }
					return new Date(input);
			}
		}

		if(Array.isArray(input)){
			let inputArray = input as number[];
			if (inputArray.length === 0) throw new Error("argument Array cannot be empty");
			const isNumberArray =
			inputArray.every((value) => {
				return typeof value === 'number';
			});
			if (!isNumberArray) throw new Error("input Array must contain only numbers");
			return parseDateArray(inputArray);
		}

		if(typeof input === "object" && input.constructor.name === "Date"){
			return input.getTime() / 6e4;
		}

		if(typeof input === "string"){
			return parseDateString(input).getTime() / 6e4;
		}

		if(typeof input === "number"){
			return new Date(input).getTime() / 6e4;
		}

		return undefined;
	}
	const isNumberArray = (array: any[]) => {
		return array.every(element => {
			return typeof element === 'number';
		});
	}
	const calcStart = (tl: ITimeline) : number | undefined => {
		return tl.start 
		? tl.children.length 
			? Math.min(tl.start, tl.children[0].start)
			: tl.start
		: tl.children.length ? tl.children[0].start : undefined;
	}
	const calcEnd = (tl: ITimeline) : number => {
		return tl.end 
		? tl.end
		: tl.duration && !isNaN(Number(tl.duration)) 
			? tl.start + Number(tl.duration) 
			: tl.children.length 
				? tl.children[tl.children.length-1].end || tl.start + 1
				: tl.start + 1;
	}
	const calcLevel = (timelineEvent: ITimeline, parent: ITimeline): number => {
		let level = 0
		for(const eventLevel in parent.levelMatrix){
			level = Number(eventLevel);
			if(timelineEvent.start > parent.levelMatrix[eventLevel].time){
				for(let i = 0; i < timelineEvent.height; i++){
					parent.levelMatrix[(level+i).toString()] = {
						height: timelineEvent.height,
						time: timelineEvent.end
					}
				}
				return level;
			}
		}
		level++
		for(let i = 0; i < timelineEvent.height; i++){
			parent.levelMatrix[(level+i).toString()] = {
				height: timelineEvent.height,
				time: timelineEvent.end
			}
		}
		return level;
	}
	const addEvents = (parent: ITimeline, ...children: ITimelineEvent[]): void => {
		const calcScore = (timelineEvent: ITimeline, parent: ITimeline): number => {
			const durationRatio = timelineEvent.duration / parent.duration;
			const score = durationRatio * timelineEvent.children.length || 1;
			return score;
		}

		const parsedChildren = children.map(tl => parseEvent(tl, parent)).filter(tl => !!tl)
		if(parsedChildren && parsedChildren.length && parent){
			parent.children.push(...parsedChildren);
			parent.children.sort((a,b)=>a.start - b.start);
			parent.start = calcStart(parent);
			parent.end = calcEnd(parent);
			parent.duration = parent.end - parent.start;

			parent.levelMatrix = {1:{height: 0, time: Number.MIN_SAFE_INTEGER}}
			parent.children.forEach((timelineEvent, i) => {
				// Add score to result in order to sort by importance
				timelineEvent.score = ['container', 'timeline'].includes(timelineEvent.type) 
					? calcScore(timelineEvent, parent) 
					: 0
				timelineEvent.level = ['container', 'timeline'].includes(timelineEvent.type) 
					? calcLevel(timelineEvent, parent) 
					: 0
			});
		}

		parent.height = parent.children.length
			? Math.max.apply(1, parent.children.map((child) => child.level))
			: 1;
	}
	const parseEvent = (timelineEvent: ITimelineEvent, parent?: ITimeline): ITimeline | undefined => {
		if(!timelineEvent){
			console.warn('Event object is empty'); 
			return undefined;
		}

		const parsedTimelineEvent: ITimeline = {
			type: "timeline",
			duration: 0, level: 1, step: 0, score: 0, height: 1, children: [],
			depth: parent ? parent.depth + 1 : 0,
			...timelineEvent,
			color: timelineEvent.color 
			? isNumberArray(timelineEvent.color) 
				? timelineEvent.color
				: [140,140,140,timelineEvent.type === 'background' ? .1 : 1]
			: [140,140,140,timelineEvent.type === 'background' ? .1 : 1],
			start: parseToMinutes(timelineEvent.start),
			end: parseToMinutes(timelineEvent.end),
		}

		if(timelineEvent.events && timelineEvent.events.length){
			addEvents(parsedTimelineEvent, ...timelineEvent.events);
		}

		// Calculate start date - if children exists take lowest date
		parsedTimelineEvent.start = calcStart(parsedTimelineEvent);

		// Filter missing requirements
		if(!parsedTimelineEvent.start) { 
			console.warn('Missing start property on event - skipping', timelineEvent)
			return undefined;
		}

		// Calculate end date
		parsedTimelineEvent.end = calcEnd(parsedTimelineEvent);
		parsedTimelineEvent.duration = (parsedTimelineEvent.end - parsedTimelineEvent.start);
		
		// Return
		return parsedTimelineEvent;
	}
	const parseTimelineHTML = (input: HTMLElement): any[] => {
		// Initialize events
		let result = []
		const timelineEvents = input.querySelectorAll<HTMLElement>('.timelineEvent');
		if(timelineEvents) {
			timelineEvents
				.forEach((timelineEvent) => {
					try{
						result.push({
							...timelineEvent.attributes,
							events: parseTimelineHTML(timelineEvent)
						})
					} catch(error){
						console.error(error, 'timelineEvent');
					}
				})
		}
		return result;
	}
	const toJSON = () => {
		return {
			options,
			viewStartDate: viewStart(),
			viewEndDate: viewEnd(),
			viewDuration: viewDuration(),
			ratio,
			pivot,
		}
	}

	init(elementIdentifier, settings);

	return {
		focus,
		load,
		current: currentTimeline,
		element,
	}
};