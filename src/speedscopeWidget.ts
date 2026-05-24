import { appApi, loadNewInput } from "./views/application-container";
import { generateWidgetAPI, SpeedscopeAPI } from "./widgetApi";
import { dispose, initApplication, resizeSpeedscopeWindow, speedscopeWindow } from "./widgetUtils";

declare global {
    interface Window {
        speedscopeAPI: ReturnType<typeof generateWidgetAPI>
    }
}

export class SpeedScopeWidget extends HTMLElement {
    // allow <speedscope-widget folded={data}> for small inputs (setAttribute will copy folded as plain String in DOM)
    static get observedAttributes() { return ["folded", "frameName", "searchQuery", "viewMode", "reverse"]; }

    private started: boolean = false;
    private ro: ResizeObserver | null = null;
    private api: SpeedscopeAPI | null = null;

    constructor() {
        super();
        console.log('speedscope-widget started...');
        this.api = generateWidgetAPI();
        window.speedscopeAPI = this.api;
        window.dispatchEvent(new Event("speedscope:apiReady"));
        console.log('speedscope-widget api is ready!');
    }

    private resetSpeedscopeWindow() {
        if (speedscopeWindow && this.contains(speedscopeWindow)) {
            this.removeChild(speedscopeWindow);
            dispose()
          }
    }

    private detachSpeedscopeWindow() {
        const nodes = this.querySelectorAll(".speedscopeWindow");
        nodes.forEach(node => this.removeChild(node));
    }

    private errorMsg(e: string) {
        // notify external api
        this.dispatchEvent(new CustomEvent("speedscope:error", {
            bubbles: true,
            detail: { error: e }
        }));
    }

    public setInput(folded: string, frameName: string = '', searchQuery: string = '', viewMode: string = '', reverse: boolean = false, searchIndex: number = 0) {
        if(!this.started) {
            try {
                // clean empty windows before start
                this.resetSpeedscopeWindow()
                this.detachSpeedscopeWindow()
                // start application
                initApplication(this);
                appApi.current?.setInitStates(frameName, searchQuery, viewMode, reverse, searchIndex)
                // send first data
                loadNewInput(folded);
                this.started = true
                const foldedBytes = new TextEncoder().encode(folded).length;
                console.debug(`speedscope-widget main app initalized! size=${this.prettyPrintBytes(foldedBytes)}`);
            } catch (e) {
                // it's possible we created some empty windows and get a exception when app start
                this.detachSpeedscopeWindow()
                const msg = 'start new flamegraph app failed!'
                console.error(msg, e);
                this.errorMsg(msg + ' ' + String(e))
            }
        } else {
            try {
                // reattach speedscopeWindow if the window disconnected
                if(this.started && speedscopeWindow && !this.contains(speedscopeWindow)) {
                    this.appendChild(speedscopeWindow)
                    console.debug('speedscope-widget app reattached!')
                }
                appApi.current?.setInitStates(frameName, searchQuery, viewMode, reverse, searchIndex)
                loadNewInput(folded)
                console.debug('speedscope-widget flamegraph updated!')
            } catch (e) {
                const msg = 'update new input failed!'
                console.error(msg, e);
                this.errorMsg(msg + ' ' + String(e));
            }
        }
    }

    prettyPrintBytes(bytes: number): string {
        if(bytes < 1024) return `${bytes} B`
        if(bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    public startNewApp(folded: string, frameName: string = '', searchQuery: string = '', viewMode: string = '', reverse: boolean = false, searchIndex: number = 0) {
        if (!folded || folded.length < 1) return;
        if (this.getBoundingClientRect().height < 1) {
            //console.log('speedscope-widget height is empty!', this.getBoundingClientRect())
            return;
        }

        this.setInput(folded, frameName, searchQuery, viewMode, reverse, searchIndex)
    }

    connectedCallback() {
        console.debug('speedscope-widget connected!')
        if (getComputedStyle(this).display === "inline") this.style.display = "block";

        const folded = this.getAttribute("folded") || "";
        const frameName = this.getAttribute("frameName") || "";
        const searchQuery = this.getAttribute("searchQuery") || "";
        const viewMode = this.getAttribute("viewMode") || "";
        
        const newBounds = this.getBoundingClientRect()
        if(newBounds.height > 0 && newBounds.width > 0) {
            this.style.minHeight = "500px";
            this.style.minWidth = "500px";
            this.setInput(folded, frameName, searchQuery, viewMode);
        }

        // sensor for external React element (the closest parent) resize
        this.ro = new ResizeObserver(() => {
            const newBounds = this.getBoundingClientRect()
            // console.log('speedscope-widget parent resized!', newBounds)
            // transfer relative React flex number to abs px, which required by speedscope widget sandbox window
            if(newBounds.height > 0 && newBounds.width > 0) {
                if(!this.started) this.setInput(folded, frameName, searchQuery, viewMode);
                resizeSpeedscopeWindow(newBounds.width, newBounds.height)
            }
        });

        this.ro.observe(this);

        // inform external api
        requestAnimationFrame(() => {
            this.dispatchEvent(new CustomEvent("speedscope:ready", {
                composed:true,
                bubbles: true,
                detail: { element: this }
            }))
        });
    }

    disconnectedCallback() {
        // we use singleton pattern to run this widget, so shouldn't dispose when UI disconnected
        this.ro?.disconnect();
        this.ro = null;
        console.debug("speedscope-widget disconnected! Awaiting next connection...")
    }

    attributeChangedCallback(name: string, oldInput: string | null, newInput: string | null) {
        if (oldInput == newInput) return;
        console.debug("speedscope-widget attribute changed! Updating...")
        const folded = this.getAttribute("folded") || this.textContent?.trim() || "";
        const frameName = this.getAttribute("frameName") || "";
        const searchQuery = this.getAttribute("searchQuery") || "";
        const viewMode = this.getAttribute("viewMode") || "";
        this.setInput(folded, frameName, searchQuery, viewMode);
    }
}

customElements.define("speedscope-widget", SpeedScopeWidget)
export {};
