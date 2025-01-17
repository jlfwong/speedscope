import{a as I}from"./chunk-FW4363Y4.js";var k=I((ee,j)=>{j.exports={name:"speedscope",version:"1.22.0",description:"",repository:"jlfwong/speedscope",main:"index.js",bin:{speedscope:"./bin/cli.js"},scripts:{deploy:"./scripts/deploy.sh",prepack:'./scripts/prepack.sh --outdir "$(pwd)/dist/release" --protocol file',prettier:"prettier --write 'src/**/*.ts' 'src/**/*.tsx'",lint:"eslint 'src/**/*.ts' 'src/**/*.tsx'",jest:"./scripts/test-setup.sh && jest --runInBand",coverage:"npm run jest -- --coverage",typecheck:"tsc --noEmit",test:"./scripts/ci.sh",serve:"tsx scripts/dev-server.ts"},files:["bin/cli.js","dist/release/**","!*.map"],browserslist:["last 2 Chrome versions","last 2 Firefox versions"],author:"",license:"MIT",devDependencies:{"@types/jest":"22.2.3","@types/jszip":"3.1.4","@types/node":"14.0.1","@types/pako":"1.0.0","@typescript-eslint/eslint-plugin":"6.16.0","@typescript-eslint/parser":"6.16.0",acorn:"7.2.0",aphrodite:"2.1.0",esbuild:"0.24.2",eslint:"8.0.0","eslint-plugin-prettier":"5.1.2","eslint-plugin-react-hooks":"4.6.0",jest:"24.3.0",jsverify:"0.8.3",jszip:"3.1.5",pako:"1.0.6",preact:"10.4.1",prettier:"3.1.1",protobufjs:"6.8.8","source-map":"0.6.1","ts-jest":"24.3.0",tsx:"4.19.2",typescript:"5.3.3","typescript-json-schema":"0.42.0","uglify-es":"3.2.2","uint8array-json-parser":"0.0.2"},jest:{transform:{"^.+\\.tsx?$":"ts-jest"},setupFilesAfterEnv:["./src/jest-setup.js"],testRegex:"\\.test\\.tsx?$",collectCoverageFrom:["**/*.{ts,tsx}","!**/*.d.{ts,tsx}"],moduleFileExtensions:["ts","tsx","js","jsx","json"]},dependencies:{open:"7.2.0"}}});function d(n){return n[n.length-1]||null}function A(n,e){function t(r,s){let o=e(r),a=e(s);return o<a?-1:o>a?1:0}n.sort(t)}function _(n,e,t){return n.has(e)||n.set(e,t(e)),n.get(e)}function K(n,e,t){return n.has(e)?n.get(e):t(e)}function B(n,e){if(!n.has(e))throw new Error(`Expected key ${e}`);return n.get(e)}var w=class{constructor(){this.map=new Map}getOrInsert(e){let t=e.key,r=this.map.get(t);return r||(this.map.set(t,e),e)}forEach(e){this.map.forEach(e)}[Symbol.iterator](){return this.map.values()}};function*L(n,e){for(let t of n)yield e(t)}function G(n,e){for(let t of n)e(t)}function C(n,e){return new Array(Math.max(e-n.length,0)+1).join("0")+n}function z(n){let e=`${n.toFixed(0)}%`;return n===100?e="100%":n>99?e=">99%":n<.01?e="<0.01%":n<1?e=`${n.toFixed(2)}%`:n<10&&(e=`${n.toFixed(1)}%`),e}function P(n){return n-Math.floor(n)}function D(n){return 2*Math.abs(P(n)-.5)-1}function q(n,e,t,r,s=1){for(console.assert(!isNaN(s)&&!isNaN(r));;){if(e-n<=s)return[n,e];let o=(e+n)/2;t(o)<r?n=o:e=o}}function H(n,e){if(n.length===0)return-1;let t=0,r=n.length-1;for(;r!==t;){let s=Math.floor((t+r)/2);e(n[s])?r=s:t=s+1}return e(n[r])?r:-1}function Z(...n){}function N(n,e){for(let t in n)if(n[t]!==e[t])return!1;for(let t in e)if(n[t]!==e[t])return!1;return!0}function J(n){let e=null;return t=>{let r;return e==null?(r=n(t),e={args:t,result:r},r):(N(e.args,t)||(e.args=t,e.result=n(t)),e.result)}}function Q(n){let e=null;return t=>{let r;return e==null?(r=n(t),e={args:t,result:r},r):(e.args===t||(e.args=t,e.result=n(t)),e.result)}}function O(n){let e=null;return()=>(e==null&&(e={result:n()}),e.result)}var $=O(()=>{let n="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",e=new Map;for(let t=0;t<n.length;t++)e.set(n.charAt(t),t);return e.set("=",-1),e});function X(n){let e=$();if(n.length%4!==0)throw new Error(`Invalid length for base64 encoded string. Expected length % 4 = 0, got length = ${n.length}`);let t=n.length/4,r;n.length>=4&&n.charAt(n.length-1)==="="?n.charAt(n.length-2)==="="?r=t*3-2:r=t*3-1:r=t*3;let s=new Uint8Array(r),o=0;for(let a=0;a<t;a++){let i=n.charAt(a*4+0),m=n.charAt(a*4+1),l=n.charAt(a*4+2),f=n.charAt(a*4+3),u=e.get(i),c=e.get(m),g=e.get(l),v=e.get(f);if(u==null||c==null||g==null||v==null)throw new Error(`Invalid quartet at indices ${a*4} .. ${a*4+3}: ${n.substring(a*4,a*4+3)}`);s[o++]=u<<2|c>>4,l!=="="&&(s[o++]=(c&15)<<4|g>>2),f!=="="&&(s[o++]=(g&7)<<6|v)}if(o!==r)throw new Error(`Expected to decode ${r} bytes, but only decoded ${o})`);return s}var F=class{constructor(){this.unit="none"}format(e){return e.toLocaleString()}},y=class{constructor(e){this.unit=e;e==="nanoseconds"?this.multiplier=1e-9:e==="microseconds"?this.multiplier=1e-6:e==="milliseconds"?this.multiplier=.001:this.multiplier=1}formatUnsigned(e){let t=e*this.multiplier;if(t/60>=1){let r=Math.floor(t/60),s=Math.floor(t-r*60).toString();return`${r}:${C(s,2)}`}return t/1>=1?`${t.toFixed(2)}s`:t/.001>=1?`${(t/.001).toFixed(2)}ms`:t/1e-6>=1?`${(t/1e-6).toFixed(2)}\xB5s`:`${(t/1e-9).toFixed(2)}ns`}format(e){return`${e<0?"-":""}${this.formatUnsigned(Math.abs(e))}`}},E=class{constructor(){this.unit="bytes"}format(e){return e<1024?`${e.toFixed(0)} B`:(e/=1024,e<1024?`${e.toFixed(2)} KB`:(e/=1024,e<1024?`${e.toFixed(2)} MB`:(e/=1024,`${e.toFixed(2)} GB`)))}};var S=class{constructor(){this.selfWeight=0;this.totalWeight=0}getSelfWeight(){return this.selfWeight}getTotalWeight(){return this.totalWeight}addToTotalWeight(e){this.totalWeight+=e}addToSelfWeight(e){this.selfWeight+=e}overwriteWeightWith(e){this.selfWeight=e.selfWeight,this.totalWeight=e.totalWeight}},p=class n extends S{constructor(e){super(),this.key=e.key,this.name=e.name,this.file=e.file,this.line=e.line,this.col=e.col}static{this.root=new n({key:"(speedscope root)",name:"(speedscope root)"})}static getOrInsert(e,t){return e.getOrInsert(new n(t))}},T=class extends S{constructor(t,r){super();this.frame=t;this.parent=r;this.children=[];this.frozen=!1}isRoot(){return this.frame===p.root}isFrozen(){return this.frozen}freeze(){this.frozen=!0}},W=class n{constructor(e=0){this.name="";this.frames=new w;this.appendOrderCalltreeRoot=new T(p.root,null);this.groupedCalltreeRoot=new T(p.root,null);this.samples=[];this.weights=[];this.valueFormatter=new F;this.totalNonIdleWeight=null;this.totalWeight=e}getAppendOrderCalltreeRoot(){return this.appendOrderCalltreeRoot}getGroupedCalltreeRoot(){return this.groupedCalltreeRoot}shallowClone(){let e=new n(this.totalWeight);return Object.assign(e,this),e}formatValue(e){return this.valueFormatter.format(e)}setValueFormatter(e){this.valueFormatter=e}getWeightUnit(){return this.valueFormatter.unit}getName(){return this.name}setName(e){this.name=e}getTotalWeight(){return this.totalWeight}getTotalNonIdleWeight(){return this.totalNonIdleWeight===null&&(this.totalNonIdleWeight=this.groupedCalltreeRoot.children.reduce((e,t)=>e+t.getTotalWeight(),0)),this.totalNonIdleWeight}sortGroupedCallTree(){function e(t){t.children.sort((r,s)=>-(r.getTotalWeight()-s.getTotalWeight())),t.children.forEach(e)}e(this.groupedCalltreeRoot)}forEachCallGrouped(e,t){function r(s,o){s.frame!==p.root&&e(s,o);let a=0;s.children.forEach(function(i){r(i,o+a),a+=i.getTotalWeight()}),s.frame!==p.root&&t(s,o+s.getTotalWeight())}r(this.groupedCalltreeRoot,0)}forEachCall(e,t){let r=[],s=0,o=0;for(let a of this.samples){let i=null;for(i=a;i&&i.frame!=p.root&&r.indexOf(i)===-1;i=i.parent);for(;r.length>0&&d(r)!=i;){let l=r.pop();t(l,s)}let m=[];for(let l=a;l&&l.frame!=p.root&&l!=i;l=l.parent)m.push(l);m.reverse();for(let l of m)e(l,s);r=r.concat(m),s+=this.weights[o++]}for(let a=r.length-1;a>=0;a--)t(r[a],s)}forEachFrame(e){this.frames.forEach(e)}getProfileWithRecursionFlattened(){let e=new x,t=[],r=new Set;function s(i,m){r.has(i.frame)?t.push(null):(r.add(i.frame),t.push(i),e.enterFrame(i.frame,m))}function o(i,m){let l=t.pop();l&&(r.delete(l.frame),e.leaveFrame(l.frame,m))}this.forEachCall(s,o);let a=e.build();return a.name=this.name,a.valueFormatter=this.valueFormatter,this.forEachFrame(i=>{a.frames.getOrInsert(i).overwriteWeightWith(i)}),a}getInvertedProfileForCallersOf(e){let t=p.getOrInsert(this.frames,e),r=new b,s=[];function o(i){if(i.frame===t)s.push(i);else for(let m of i.children)o(m)}o(this.appendOrderCalltreeRoot);for(let i of s){let m=[];for(let l=i;l!=null&&l.frame!==p.root;l=l.parent)m.push(l.frame);r.appendSampleWithWeight(m,i.getTotalWeight())}let a=r.build();return a.name=this.name,a.valueFormatter=this.valueFormatter,a}getProfileForCalleesOf(e){let t=p.getOrInsert(this.frames,e),r=new b;function s(i){let m=[];function l(f){m.push(f.frame),r.appendSampleWithWeight(m,f.getSelfWeight());for(let u of f.children)l(u);m.pop()}l(i)}function o(i){if(i.frame===t)s(i);else for(let m of i.children)o(m)}o(this.appendOrderCalltreeRoot);let a=r.build();return a.name=this.name,a.valueFormatter=this.valueFormatter,a}async demangle(){let e=null;for(let t of this.frames)(t.name.startsWith("__Z")||t.name.startsWith("_R")||t.name.startsWith("_Z"))&&(e||(e=await(await import("./demangle-B53S5JWH.js")).loadDemangling()),t.name=e(t.name))}remapSymbols(e){for(let t of this.frames){let r=e(t);if(r==null)continue;let{name:s,file:o,line:a,col:i}=r;s!=null&&(t.name=s),o!=null&&(t.file=o),a!=null&&(t.line=a),i!=null&&(t.col=i)}}},b=class extends W{constructor(){super(...arguments);this.pendingSample=null}_appendSample(t,r,s){if(isNaN(r))throw new Error("invalid weight");let o=s?this.appendOrderCalltreeRoot:this.groupedCalltreeRoot,a=new Set;for(let i of t){let m=s?d(o.children):o.children.find(l=>l.frame===i);if(m&&!m.isFrozen()&&m.frame==i)o=m;else{let l=o;o=new T(i,o),l.children.push(o)}o.addToTotalWeight(r),a.add(o.frame)}if(o.addToSelfWeight(r),s)for(let i of o.children)i.freeze();if(s){o.frame.addToSelfWeight(r);for(let i of a)i.addToTotalWeight(r);o===d(this.samples)?this.weights[this.weights.length-1]+=r:(this.samples.push(o),this.weights.push(r))}}appendSampleWithWeight(t,r){if(r===0)return;if(r<0)throw new Error("Samples must have positive weights");let s=t.map(o=>p.getOrInsert(this.frames,o));this._appendSample(s,r,!0),this._appendSample(s,r,!1)}appendSampleWithTimestamp(t,r){if(this.pendingSample){if(r<this.pendingSample.centralTimestamp)throw new Error("Timestamps received out of order");let s=(r+this.pendingSample.centralTimestamp)/2;this.appendSampleWithWeight(this.pendingSample.stack,s-this.pendingSample.startTimestamp),this.pendingSample={stack:t,startTimestamp:s,centralTimestamp:r}}else this.pendingSample={stack:t,startTimestamp:r,centralTimestamp:r}}build(){return this.pendingSample&&(this.samples.length>0?this.appendSampleWithWeight(this.pendingSample.stack,this.pendingSample.centralTimestamp-this.pendingSample.startTimestamp):(this.appendSampleWithWeight(this.pendingSample.stack,1),this.setValueFormatter(new F))),this.totalWeight=Math.max(this.totalWeight,this.weights.reduce((t,r)=>t+r,0)),this.sortGroupedCallTree(),this}},x=class extends W{constructor(){super(...arguments);this.appendOrderStack=[this.appendOrderCalltreeRoot];this.groupedOrderStack=[this.groupedCalltreeRoot];this.framesInStack=new Map;this.stack=[];this.lastValue=0}addWeightsToFrames(t){let r=t-this.lastValue;for(let o of this.framesInStack.keys())o.addToTotalWeight(r);let s=d(this.stack);s&&s.addToSelfWeight(r)}addWeightsToNodes(t,r){let s=t-this.lastValue;for(let a of r)a.addToTotalWeight(s);let o=d(r);o&&o.addToSelfWeight(s)}_enterFrame(t,r,s){let o=s?this.appendOrderStack:this.groupedOrderStack;this.addWeightsToNodes(r,o);let a=d(o);if(a){if(s){let l=r-this.lastValue;if(l>0)this.samples.push(a),this.weights.push(r-this.lastValue);else if(l<0)throw new Error(`Samples must be provided in increasing order of cumulative value. Last sample was ${this.lastValue}, this sample was ${r}`)}let i=s?d(a.children):a.children.find(l=>l.frame===t),m;i&&!i.isFrozen()&&i.frame==t?m=i:(m=new T(t,a),a.children.push(m)),o.push(m)}}enterFrame(t,r){let s=p.getOrInsert(this.frames,t);this.addWeightsToFrames(r),this._enterFrame(s,r,!0),this._enterFrame(s,r,!1),this.stack.push(s);let o=this.framesInStack.get(s)||0;this.framesInStack.set(s,o+1),this.lastValue=r,this.totalWeight=Math.max(this.totalWeight,this.lastValue)}_leaveFrame(t,r,s){let o=s?this.appendOrderStack:this.groupedOrderStack;if(this.addWeightsToNodes(r,o),s){let a=this.appendOrderStack.pop();if(a==null)throw new Error(`Trying to leave ${t.key} when stack is empty`);if(this.lastValue==null)throw new Error(`Trying to leave a ${t.key} before any have been entered`);if(a.freeze(),a.frame.key!==t.key)throw new Error(`Tried to leave frame "${t.name}" while frame "${a.frame.name}" was at the top at ${r}`);let i=r-this.lastValue;if(i>0)this.samples.push(a),this.weights.push(r-this.lastValue);else if(i<0)throw new Error(`Samples must be provided in increasing order of cumulative value. Last sample was ${this.lastValue}, this sample was ${r}`)}else this.groupedOrderStack.pop()}leaveFrame(t,r){let s=p.getOrInsert(this.frames,t);this.addWeightsToFrames(r),this._leaveFrame(s,r,!0),this._leaveFrame(s,r,!1),this.stack.pop();let o=this.framesInStack.get(s);o!=null&&(o===1?this.framesInStack.delete(s):this.framesInStack.set(s,o-1),this.lastValue=r,this.totalWeight=Math.max(this.totalWeight,this.lastValue))}build(){if(this.appendOrderStack.length>1||this.groupedOrderStack.length>1)throw new Error("Tried to complete profile construction with a non-empty stack");return this.sortGroupedCallTree(),this}};var h;(t=>{let n;(o=>(o.EVENTED="evented",o.SAMPLED="sampled"))(n=t.ProfileType||={});let e;(o=>(o.OPEN_FRAME="O",o.CLOSE_FRAME="C"))(e=t.EventType||={})})(h||={});function M(n){let e=[],t=new Map;function r(o){let a=t.get(o);if(a==null){let i={name:o.name};o.file!=null&&(i.file=o.file),o.line!=null&&(i.line=o.line),o.col!=null&&(i.col=o.col),a=e.length,t.set(o,a),e.push(i)}return a}let s={exporter:`speedscope@${k().version}`,name:n.name,activeProfileIndex:n.indexToView,$schema:"https://www.speedscope.app/file-format-schema.json",shared:{frames:e},profiles:[]};for(let o of n.profiles)s.profiles.push(U(o,r));return s}function U(n,e){let t={type:h.ProfileType.EVENTED,name:n.getName(),unit:n.getWeightUnit(),startValue:0,endValue:n.getTotalWeight(),events:[]},r=(o,a)=>{t.events.push({type:h.EventType.OPEN_FRAME,frame:e(o.frame),at:a})},s=(o,a)=>{t.events.push({type:h.EventType.CLOSE_FRAME,frame:e(o.frame),at:a})};return n.forEachCall(r,s),t}function R(n,e){function t(o){let{name:a,unit:i}=n;switch(i){case"nanoseconds":case"microseconds":case"milliseconds":case"seconds":o.setValueFormatter(new y(i));break;case"bytes":o.setValueFormatter(new E);break;case"none":o.setValueFormatter(new F);break}o.setName(a)}function r(o){let{startValue:a,endValue:i,events:m}=o,l=new x(i-a);t(l);let f=e.map((u,c)=>({key:c,...u}));for(let u of m)switch(u.type){case h.EventType.OPEN_FRAME:{l.enterFrame(f[u.frame],u.at-a);break}case h.EventType.CLOSE_FRAME:{l.leaveFrame(f[u.frame],u.at-a);break}}return l.build()}function s(o){let{startValue:a,endValue:i,samples:m,weights:l}=o,f=new b(i-a);t(f);let u=e.map((c,g)=>({key:g,...c}));if(m.length!==l.length)throw new Error(`Expected samples.length (${m.length}) to equal weights.length (${l.length})`);for(let c=0;c<m.length;c++){let g=m[c],v=l[c];f.appendSampleWithWeight(g.map(V=>u[V]),v)}return f.build()}switch(n.type){case h.ProfileType.EVENTED:return r(n);case h.ProfileType.SAMPLED:return s(n)}}function ge(n){return{name:n.name||n.profiles[0].name||"profile",indexToView:n.activeProfileIndex||0,profiles:n.profiles.map(e=>R(e,n.shared.frames))}}function Fe(n){let e=M(n),t=new Blob([JSON.stringify(e)],{type:"text/json"}),s=`${(e.name?e.name.split(".")[0]:"profile").replace(/\W+/g,"_")}.speedscope.json`;console.log("Saving",s);let o=document.createElement("a");o.download=s,o.href=window.URL.createObjectURL(t),o.dataset.downloadurl=["text/json",o.download,o.href].join(":"),document.body.appendChild(o),o.click(),document.body.removeChild(o)}export{d as a,A as b,_ as c,K as d,B as e,w as f,L as g,G as h,C as i,z as j,D as k,q as l,H as m,Z as n,N as o,J as p,Q as q,X as r,F as s,y as t,E as u,p as v,b as w,x,k as y,ge as z,Fe as A};
//# sourceMappingURL=chunk-UXCJ7GBH.js.map
