import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

let checks = 0;
const check = (value, message) => { assert.ok(value, message); checks++; };
const script = fs.readFileSync('public/js/about.js', 'utf8');
function fixture({reduce = false, observer = true, page = true} = {}) {
    class Element {
        constructor() { this.attrs = {}; this.listeners = {}; this.classes = new Set(); this.classList = {add: (...names) => names.forEach(n => this.classes.add(n)), toggle: (name, enabled) => enabled ? this.classes.add(name) : this.classes.delete(name), contains: name => this.classes.has(name)}; }
        addEventListener(name, handler) { this.listeners[name] = handler; }
        setAttribute(name, value) { this.attrs[name] = value; }
        getAttribute(name) { return this.attrs[name]; }
    }
    const process = new Element(), toggle = new Element(); toggle.parentElement = {hidden: true};
    const scenes = Array.from({length: 4}, () => { const scene = new Element(); scene.step = new Element(); scene.closest = () => scene.step; scene.attrs['aria-pressed'] = 'false'; scene.video = {paused:true,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;}}; scene.querySelector = () => scene.video; return scene; });
    process.querySelectorAll = () => scenes;
    process.querySelector = () => toggle;
    const media = {matches: reduce, addEventListener: (name, cb) => { media.change = cb; }};
    const events = {};
    const document = {hidden: false, querySelector: () => page ? process : null, addEventListener: (name, cb) => events[name] = cb};
    let observerCallback, targets = [];
    class Observer { constructor(callback) { observerCallback = callback; } observe(target) { targets.push(target); } }
    let header;
    const context = {document, window: {matchMedia: () => media}, setupHeader: key => header = key};
    if (observer) { context.IntersectionObserver = Observer; context.window.IntersectionObserver = Observer; }
    vm.runInNewContext(script, context); events.DOMContentLoaded();
    return {process, toggle, scenes, media, document, events, targets, observerCallback, header};
}
const f = fixture();
check(f.header === 'about', 'Existing navbar setup retained');
check(f.targets.length === 4, 'Each scene observed independently');
check(f.process.classes.has('reveal-ready'), 'Progressive reveal only enabled after observer setup');
check(!f.toggle.parentElement.hidden, 'Pause control available');
f.observerCallback([{target: f.scenes[0].step, isIntersecting: true}]);
check(f.scenes[0].step.classes.has('is-revealed'), 'Visible scene revealed');
check(!f.scenes[0].video.paused && f.scenes[0].video.muted, 'Visible video plays muted');
check(f.scenes[1].video.paused, 'Offscreen video stays paused');
check(!f.scenes[1].step.classes.has('is-revealed'), 'Unseen scene stays independent');
f.observerCallback([{target: f.scenes[0].step, isIntersecting: false}]);
check(!f.scenes[0].step.classes.has('is-in-view') && f.scenes[0].video.paused, 'Video pauses offscreen');
f.observerCallback([{target:f.scenes[0].step,isIntersecting:true}]);
check(f.scenes[0].step.classes.has('is-revealed'), 'Scrolling back does not hide content');
f.scenes[0].listeners.click(); check(f.scenes[0].attrs['aria-pressed'] === 'true', 'Select scene');
f.scenes[1].listeners.click(); check(f.scenes[1].attrs['aria-pressed'] === 'true' && f.scenes[0].attrs['aria-pressed'] === 'false', 'Only one selected');
f.scenes[1].listeners.click(); check(f.scenes.every(scene => scene.attrs['aria-pressed'] === 'false'), 'Deselect scene');
f.toggle.listeners.click(); check(f.process.classes.has('motion-paused') && f.toggle.attrs['aria-pressed'] === 'true', 'Pause animations');
check(f.scenes.every(scene=>scene.video.paused), 'Pause button pauses all videos');
f.toggle.listeners.click(); check(!f.process.classes.has('motion-paused'), 'Resume animations');
check(!f.scenes[0].video.paused && f.scenes[1].video.paused, 'Resume only visible video');
f.document.hidden = true; f.events.visibilitychange(); check(f.process.classes.has('motion-paused'), 'Pause hidden document');
check(f.scenes.every(scene=>scene.video.paused), 'Hidden tab pauses all videos');
f.document.hidden = false; f.events.visibilitychange(); check(!f.process.classes.has('motion-paused'), 'Resume visible document');
f.media.matches = true; f.media.change(); check(f.process.classes.has('motion-paused') && f.toggle.parentElement.hidden, 'Runtime reduced-motion');
check(f.scenes.every(scene=>scene.video.paused), 'Reduced motion stops all videos');
check(f.scenes.every(scene => scene.step.classes.has('is-revealed')), 'Reduced-motion shows all copy');
const reduced = fixture({reduce: true}); check(reduced.process.classes.has('motion-paused'), 'Initial reduced-motion');
const fallback = fixture({observer: false}); check(fallback.scenes.every(scene => scene.step.classes.has('is-revealed')), 'No-observer fallback');
check(!fallback.process.classes.has('reveal-ready'), 'Fallback never hides content');
check(fixture({page: false}).header === 'about', 'Safe when process absent');
const path = 'resources/views/client/about.blade.php';
const current = fs.readFileSync(path, 'utf8');
const before = execFileSync('git', ['show', 'HEAD:' + path], {encoding: 'utf8'});
const region = value => value.split('    <!-- ARTISANAL PROCESS -->')[1].split('    <!-- CALL TO ACTION -->')[0];
const extractCopy = value => [...region(value).matchAll(/<(?:h2|h4|p)(?: [^>]*)?>([\s\S]*?)<\/(?:h2|h4|p)>/g)].map(match => match[1]);
assert.deepEqual(extractCopy(current), extractCopy(before)); checks++;
const outside = value => value.replace(/    <!-- ARTISANAL PROCESS -->[\s\S]*?(?=    <!-- CALL TO ACTION -->)/, '').replace(/    <link rel="stylesheet" href="{{ asset\('css\/baking-process.css'\) }}">\r?\n/, '').replace(/\r\n/g, '\n');
check(outside(current) === outside(before), 'All other page sections and shop photograph markup unchanged');
check((current.match(/class="cat-scene /g) || []).length === 4, 'Exactly four scenes');
check((current.match(/class="baking-video"/g) || []).length === 4, 'Four real videos replace sprites');
check((current.match(/muted loop playsinline preload="none"/g)||[]).length===4, 'Videos loop muted inline without preloading');
check(fs.readFileSync('frontend/page/about/about.js', 'utf8') === script, 'JS mirrors match');
const css = fs.readFileSync('public/css/baking-process.css', 'utf8');
check(css === fs.readFileSync('frontend/page/about/baking-process.css', 'utf8'), 'CSS mirrors match');
check(css.includes('prefers-reduced-motion: reduce') && css.includes('transition: none'), 'CSS reduced-motion fallback');
check(css.includes('repeat(4, minmax(0, 1fr))') && css.includes('repeat(2, minmax(0, 1fr))') && css.includes('max-width: 420px'), '4/2/1 responsive composition defined');
let bytes = 0;
for (const name of ['ingredients', 'dough', 'oven', 'decoration']) {
    const asset = fs.readFileSync(`public/assets/baking-process/videos/${name}.mp4`);
    bytes += asset.length;
    check(asset.equals(fs.readFileSync(`frontend/assets/baking-process/videos/${name}.mp4`)), `Asset mirror: ${name}`);
    check(asset.toString('ascii',4,8)==='ftyp', `MP4: ${name}`);
    const poster=fs.readFileSync(`public/assets/baking-process/videos/${name}.webp`);
    check(poster.toString('ascii',8,12)==='WEBP' && poster.equals(fs.readFileSync(`frontend/assets/baking-process/videos/${name}.webp`)), `Poster: ${name}`);
}
check(bytes < 3 * 1024 * 1024, 'All four videos under 3MiB');
console.log(`PASS: ${checks} checks; selection, pause/resume, viewport observer, reduced motion, unchanged original content, mirrors, and ${(bytes/1024).toFixed(0)}KiB asset budget. Browser rendering verified separately.`);
