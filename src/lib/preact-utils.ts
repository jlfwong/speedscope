import {useEffect} from 'preact/hooks'

// A preact hook to bind an event to the window and automatically cleanup the
// event binding on component unmount.
export function useWindowListener<K extends keyof WindowEventMap>(
  event: K,
  listener: {
    (ev: WindowEventMap[K]): void
  },
  cacheArgs: any[],
) {
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    window.addEventListener(event, listener)
    return () => {
      window.removeEventListener(event, listener)
    }
  }, cacheArgs)
}
