const fs = require('fs');
const p = require('path');
const outputD = '../dist/standalone/'
const htmlp = p.resolve(__dirname, '../standaloneTemplate.html');
const jsP = p.resolve(__dirname, `${outputD}widget.js`);
const cssP = p.resolve(__dirname, `${outputD}widget.css`);
const output = p.resolve(__dirname, `${outputD}standalone.html`);
const outputF = p.resolve(__dirname, `${outputD}standalone-head.html`);
const outputE = p.resolve(__dirname, `${outputD}standalone-body.html`);

const htmlT = fs.readFileSync(htmlp, 'utf-8');
const js = fs.readFileSync(jsP, 'utf-8');
const css = fs.readFileSync(cssP, 'utf-8');

const standaloneText = htmlT.replace('[replaceMe]',`<style>${css}</style>\n<script type="module">\n${js}\n`);

fs.writeFileSync(output, standaloneText)

const all = fs.readFileSync(output, 'utf-8');
const mid = Math.floor(all.length/2);
const first = all.slice(0, mid) + "\n-->";
const end = "<!--\n" + all.slice(mid);

fs.writeFileSync(outputF, first)
fs.writeFileSync(outputE, end)

fs.unlinkSync(output);
fs.unlinkSync(jsP);
fs.unlinkSync(cssP);

console.log(`${outputF} generated!`)
console.log(`${outputE} generated!`)
