import { ColorScheme, colorSchemeAtom } from './app-state/color-scheme';
import {
    searchQueryAtom,
    viewModeAtom,
    displayMinimapAtom,
    displayTableAtom,
    moreInformationFrameAtom,
    selectedFrameNameAtom,
    reverseFlamegraphAtom,
    selectedSearchIndexAtom,
    copiedUrlAtom
} from './app-state/index';
import { ViewMode } from './lib/view-mode';
import { setProfileFromInput } from './widgetUtils';

export type SpeedscopeAPI = {
    getSearchQuery: () => string;
    getViewMode: () => ViewMode;
    getDisplayMiniMap: () => boolean;
    getDisplayTable: () => boolean;
    getReverseFlamegraph: () => boolean;
    getSelectedFrameName: () =>  string | null;
    getMoreInformationFrame: () => string;
    getColorScheme: () => ColorScheme;
    getSelectedSearchIndex: () => number;
    getCopiedUrl: () => string;

    setSearchQuery: (q: string) => void;
    setViewMode: (m: ViewMode) => void;
    setDisplayMiniMap: (b: boolean) => void;
    setDisplayTable: (b: boolean) => void;
    setReverseFlamegraph: (b: boolean) => void;
    setSelectedFrameName: (q: string) => void;
    setMoreInformationFrame: (q: string) => void;
    setInitSearchIndex: (i: number) => void;
    reload: (f: string, unit: string) => void;

    subscribe(fn: () => void): (f: () => void) => void;
    dispose: () => void;
};

export function generateWidgetAPI(): SpeedscopeAPI {

    const getSearchQuery = searchQueryAtom.get;
    const getViewMode = viewModeAtom.get;
    const getDisplayMiniMap = displayMinimapAtom.get;
    const getDisplayTable = displayTableAtom.get;
    const getReverseFlamegraph = reverseFlamegraphAtom.get;
    const getSelectedFrameName = selectedFrameNameAtom.get;
    const getMoreInformationFrame = moreInformationFrameAtom.get;
    const getColorScheme = colorSchemeAtom.get;
    const getSelectedSearchIndex = selectedSearchIndexAtom.get;
    const getCopiedUrl = copiedUrlAtom.get;

    const setSearchQuery = (q: string) => searchQueryAtom.set(q)
    const setViewMode = (m: ViewMode) => viewModeAtom.set(m)
    const setDisplayMiniMap = (b: boolean) => displayMinimapAtom.set(b)
    const setDisplayTable = (b: boolean) => displayTableAtom.set(b)
    const setReverseFlamegraph = (b: boolean) => reverseFlamegraphAtom.set(b)
    const setSelectedFrameName = (q: string) => selectedFrameNameAtom.set(q)
    const setMoreInformationFrame = (q: string) => moreInformationFrameAtom.set(q)
    const setInitSearchIndex = (i: number) => selectedSearchIndexAtom.set(i)
    const reload = (f: string, unit: string) => setInput(f)


    let unsubscribeAll: (() => void) | null = null;
    const subscribe = (f: () => void) => {
        const atoms = [
            searchQueryAtom,
            viewModeAtom,
            moreInformationFrameAtom,
            colorSchemeAtom,
            selectedFrameNameAtom,
            reverseFlamegraphAtom,
            selectedSearchIndexAtom,
            copiedUrlAtom
        ];
        atoms.forEach(a => a.subscribe(f))

        unsubscribeAll = () => {
            atoms.forEach((a) => a.unsubscribe(f))
        };
        return () => atoms.forEach(a => a.unsubscribe(f));
    }
    const dispose = () => {
        if (unsubscribeAll) {
            unsubscribeAll();
            unsubscribeAll = null;
        }
    };

    return {
        getSearchQuery,
        getViewMode,
        getDisplayMiniMap,
        getDisplayTable,
        getReverseFlamegraph,
        getSelectedFrameName,
        getMoreInformationFrame,
        getColorScheme,
        getSelectedSearchIndex,
        getCopiedUrl,
        setSearchQuery,
        setViewMode,
        setDisplayMiniMap,
        setDisplayTable,
        setSelectedFrameName,
        setMoreInformationFrame,
        setReverseFlamegraph,
        setInitSearchIndex,
        reload,
        subscribe,
        dispose
    }
}

function setInput(f: string) {
    setProfileFromInput(f);
}
