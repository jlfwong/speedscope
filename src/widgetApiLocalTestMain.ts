import './speedscopeWidget'
import {SpeedScopeWidget} from './speedscopeWidget'
import {ViewMode} from './lib/view-mode'
import diffJson from './diff.json'


function ready(fn: () => void) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, {once: true})
  } else fn()
}

export const emptyJson = `{
  "version": "0.1.2",
  "$schema": "https://www.speedscope.app/file-format-schema.json",
  "shared" : {
     "frames" : [{"name":"root"}]
  },
  "profiles" : [

]
}`

export const testFolded = `total;app;com.example.main;@com.example.main.run_16_1;com.example.$profiler 24681262
a;b;c 24681262
@aa;@b;@c;@async.$node.foo.apply_123_321.bar$t 2468122
aaa;x 24681262
superLongNameHere1111111111111111111111111111111111111111111111111111111111111111111111 2000000
@a;@b;@c;@d;@e;@f;@g;h;i;j;k;l;m;n;o;p;q;r;s;t;u;v;w;x;y;z;1;2;3;4;5;6;7;8;9;0;!;@;#;$;%;aa;cc;asd;zxc;@asd;@qwesad;@zzxc;asdasd;end 24681262`

export const testRevFolded = `revTotal;app;com.example.$profiler;com.example.main;@com.example.main.run_16_1 24681262`

export const testDiffFlamegraph = JSON.stringify(diffJson)
export const testTimeOrder = `00:01;total;app;com.example.main;@com.example.main.run_16_1;com.example.$profiler 100
00:02;total;app;com.example.main;@com.example.main.run_16_1;com.example.$profiler 120
00:03;total;app;com.example.main;@com.example.main.run_16_1;com.example.$profiler 220
00:04;total;app;com.example.main;@com.example.main.run_16_1;com.example.$profiler 50
`

export let curQuery = ''
export let curSelectedFrame = ''
export let curMode = '0'
export let reverse = false
export let curData = '1'

ready(() => {
  console.log('speedscope api started....')
  const widget = document.getElementById('widget') as HTMLElement
  console.log('speedscope widget:', widget)
  const sp = new SpeedScopeWidget;
  widget.appendChild(sp);
  sp.setInput(testFolded, 'm', '', '', false);

  function fakeRealTimeInput(newData: string = testFolded) {
    sp.setInput(newData + `\n${new Date()} 100`, curSelectedFrame, curQuery, curMode, reverse)
  }

  const init = () => {
    const api = window.speedscopeAPI

    // bind to widgetTestTemplate.html
    // <input id="q" type="text" placeholder="search query" />
    // <button id="search">search</button>
    // <button id="minimap">minimap</button>
    // <button id="table">table</button>
    const $ = <T extends Element>(sel: string) => document.querySelector(sel) as T
    $('#search')?.addEventListener('click', () => {
      const q = ($('#q') as HTMLInputElement).value || ''
      api.setSearchQuery(q)
    })
    $('#frame')?.addEventListener('click', () => {
      const f = ($('#f') as HTMLInputElement).value || ''
      sp.setInput(testFolded, f)
    })
    $('#reload')?.addEventListener('click', () => {
      fakeRealTimeInput()
    })
    $('#reloadError')?.addEventListener('click', () => {
      sp.setInput('fake error')
    })
    $('#reloadEmpty')?.addEventListener('click', () => {
      sp.setInput(emptyJson)
    })
    $('#reloadDiff')?.addEventListener('click', () => {
      sp.setInput(testDiffFlamegraph)
    })
    $('#minimap')?.addEventListener('click', () => {
      api.setDisplayMiniMap(!api.getDisplayMiniMap())
    })
    $('#table')?.addEventListener('click', () => {
      api.setDisplayTable(!api.getDisplayTable())
    })

    // debug snapshot
    const unsub = api.subscribe(() => {
      const cur = {
        query: api.getSearchQuery(),
        viewMode: api.getViewMode(),
        minimap: api.getDisplayMiniMap(),
        table: api.getDisplayTable(),
        selectedFrame: api.getSelectedFrameName?.(),
        moreInformationFrame: api.getMoreInformationFrame(),
        reverse: api.getReverseFlamegraph()
      }
      switch (cur.viewMode) {
        case ViewMode.SANDWICH_VIEW:
          curMode = '2'
          break;
        case ViewMode.LEFT_HEAVY_FLAME_GRAPH:
          curMode = '1'
          if (curData != '1') {
            fakeRealTimeInput()
            curData = '1'
          }
          break;
        case ViewMode.CHRONO_FLAME_CHART:
          curMode = '0'
          if (curData != '0') {
            fakeRealTimeInput(testTimeOrder)
            curData = '0'
          }
          break;
        default:
          curMode = '1'
          break;
      }
      curQuery = cur.query
      cur.selectedFrame ? curSelectedFrame = cur.selectedFrame : curSelectedFrame = ''

      if (cur.reverse != reverse) {
        reverse = cur.reverse
        const data = cur.reverse ? testRevFolded : testFolded
        fakeRealTimeInput(data)
      }
      console.log('current speedscope args:', cur)
    })

    console.log('speedscope api is ready! you could test it in browser console: window.speedscopeAPI.setSearchQuery("a")')
  }

  let inited = false
  document.addEventListener('speedscope:ready', () => {
    if (!inited) {
      console.log('try init....')
      init();
      inited = true
    }
  }, {once: true})
})
