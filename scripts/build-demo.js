const fs = require('fs');
const p = require('path');

const templatePath = p.resolve(__dirname, '../standaloneDemoTemplate.html');
const jsPath = p.resolve(__dirname, '../dist/widgetUtils.js');
const cssPath = p.resolve(__dirname, '../dist/widgetUtils.css');
const outputPath = p.resolve(__dirname, '../dist/speedscope-demo.html');

const template = fs.readFileSync(templatePath, 'utf-8');
const js = fs.readFileSync(jsPath, 'utf-8');
const css = fs.readFileSync(cssPath, 'utf-8');

const html = template.replace(
  '[replaceMe]',
  `<style>${css}</style>\n<script type="module">\n${js}\n`
);

fs.writeFileSync(outputPath, html);
console.log(`✅ ${outputPath} generated!`);
console.log(`   Open it directly in a browser to view the demo.`);
