import { h, render } from 'preact'
import {ApplicationContainer, loadNewInput, resizeApp} from './views/application-container'
import {ThemeProvider} from './views/themes/theme'

// in-mem cache, avoid performance issue on getBoundingClientRect()
export let speedscopeWindow: HTMLDivElement | null = null
export let windowWidthCache: number = 0
export let windowHeightCache: number = 0

export function dispose() {
  speedscopeWindow = null;
  windowWidthCache = 0;
  windowHeightCache = 0;
}

// this is useful for external caller, then try update speedscope internal window size
export function resizeSpeedscopeWindow(width: number, height: number) {
   if(speedscopeWindow) {
      windowWidthCache = width;
      windowHeightCache = height;
      speedscopeWindow.style.width = width + "px";
      speedscopeWindow.style.height = height + "px";
      resizeApp(true)
      // console.log('speedscope resized!', windowWidthCache, windowHeightCache)
   }
}

// speedscope is based on abs size, which should use a sandbox to avoid relative resize loop (100%: 0 -> value -> 0 -> value ...)
export function getSpeedscopeWindow(parent: HTMLElement | null = null): HTMLDivElement {
  if(!speedscopeWindow){
    const speedscopeDiv = document.createElement('div');
    speedscopeDiv.id = 'speedscope';
    speedscopeDiv.className = 'speedscopeWindow';
    if(parent) {
      if(speedscopeDiv.parentElement !== parent) {
        speedscopeDiv.remove();
        parent.appendChild(speedscopeDiv)
      }
      const bounds = parent.getBoundingClientRect();
      // console.log('speedscope parent:', parent)
      // console.log('speedscope parent size:', bounds)
      const dpiRatio = window.devicePixelRatio
      const windowWidth = bounds.width > 50? bounds.width : 1500 * dpiRatio
      const windowHeight = bounds.height > 50? bounds.height : 700 * dpiRatio
      // console.log('speedscope window size:', windowWidth, windowHeight)
      windowWidthCache = windowWidth;
      windowHeightCache = windowHeight;
      speedscopeDiv.style.width = windowWidth + "px";
      speedscopeDiv.style.height = windowHeight + "px";
    } else { 
      // fullscreen
      speedscopeDiv.style.width = "100vw";
      speedscopeDiv.style.height = "100vh";
      document.body.appendChild(speedscopeDiv);
    }
    // allow widget be selectable
    speedscopeDiv.tabIndex = -1;
    speedscopeDiv.addEventListener("speedscope-focus", () => {
        speedscopeDiv.focus({ preventScroll: true});
    })
    speedscopeWindow = speedscopeDiv
  }

  return speedscopeWindow
};

export function inSpeedscopeWindow() {
  const ae = document.activeElement as HTMLElement | null;
  const fromWindowName = ae?.className.toString()

  if(!fromWindowName) return false;
  return fromWindowName.includes("speedscope");
}

export function initApplication(parent: HTMLElement | null = null) {
  // clean up window cache
  if(parent) render(null, parent)
  speedscopeWindow = null
  getSpeedscopeWindow(parent) // init window
  const wd = getSpeedscopeWindow(parent) // get window from cache
  const app = (
    <ThemeProvider>
      <ApplicationContainer />
    </ThemeProvider>
  )

  render(app, wd)
}

// helper api for standalone html
export function setProfileFromInput(inputText: string) {
  loadNewInput(inputText)
}