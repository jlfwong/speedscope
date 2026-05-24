const fs = require('fs');
const p = require('path');
const htmlp = p.resolve(__dirname, '../standaloneTestTemplate.html');
const jsP = p.resolve(__dirname, '../dist/widgetUtils.js');
const cssP = p.resolve(__dirname, '../dist/widgetUtils.css');
const output = p.resolve(__dirname, '../dist/standaloneTest.html');

const htmlT = fs.readFileSync(htmlp, 'utf-8');
const js = fs.readFileSync(jsP, 'utf-8');
const css = fs.readFileSync(cssP, 'utf-8');

const standaloneText = htmlT.replace('[replaceMe]',`<style>${css}</style>\n<script type="module">\n${js}\n`);

fs.writeFileSync(output, standaloneText)

console.log('./dist/standaloneTest.html generated!')
