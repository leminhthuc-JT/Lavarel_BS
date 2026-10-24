import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function fixture(reduce = false) {
    class Element {
        constructor() { this.listeners = {}; this.attrs = {}; this.dataset = {}; this.hidden = false; this.classes = new Set(); this.classList = {add:(...values)=>values.forEach(v=>this.classes.add(v)),remove:(...values)=>values.forEach(v=>this.classes.delete(v))}; }
        addEventListener(name, callback) { this.listeners[name] = callback; }
        setAttribute(name, value) { this.attrs[name] = value; }
        removeAttribute(name) { delete this.attrs[name]; }
        focus() { this.focused = true; }
        matches() { return !!this.keyboardFocus; }
    }
    const root = new Element(), toggle = new Element(), count = new Element(), status = new Element(), icon = new Element();
    const slides = Array.from({length:4}, (_,i)=>{const el = new Element(); el.hidden = i !== 0; el.dataset.name = `Product ${i}`; el.image = {decode:async()=>{el.decoded=true;}}; el.querySelector=()=>el.image; return el;});
    slides[0].classes.add('is-active');
    const buttons = slides.map(()=>new Element());
    root.querySelectorAll = selector=>selector==='[data-slide]' ? slides : buttons;
    root.querySelector = selector=>({'[data-hero-autoplay]':toggle,'[data-hero-count]':count,'[data-hero-status]':status,'[data-hero-play-icon]':icon})[selector];
    root.contains = el=>buttons.includes(el)||el===toggle;
    const document = {hidden:false,listeners:{},querySelector:()=>root,addEventListener(name,cb){this.listeners[name]=cb;}};
    const media = {matches:reduce,addEventListener(name,callback){this.change=callback;}};
    const window = {listeners:{},matchMedia:()=>media,addEventListener(name,callback){this.listeners[name]=callback;}};
    let nextId=0, observer;
    const timers = new Map();
    class Observer { constructor(callback){observer=callback;} observe(){} }
    window.IntersectionObserver = Observer;
    vm.runInNewContext(fs.readFileSync('public/js/hero-editorial.js','utf8'),{document,window,IntersectionObserver:Observer,setTimeout:(fn,delay)=>{const id=++nextId;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id)});
    return {root,toggle,count,status,icon,slides,buttons,document,window,media,timers,observer,
        async run(delay){const found=[...timers].find(([,timer])=>timer.delay===delay);assert.ok(found,`Timer ${delay} exists`);timers.delete(found[0]);found[1].fn();await Promise.resolve();await Promise.resolve();}};
}
let checks=0;
function check(condition,label){assert.ok(condition,label);checks++;console.log('PASS',label);}
const tick=async()=>{await Promise.resolve();await Promise.resolve();};
const f=fixture();
check([...f.timers.values()].some(t=>t.delay===6000),'Autoplay schedules after six seconds');
await f.run(6000);
check(f.root.dataset.activeSlide==='1'&&f.slides[1].decoded,'Autoplay decodes and advances');
check(!f.slides[0].hidden&&!f.slides[1].hidden&&f.slides[0].classes.has('is-leaving')&&f.slides[1].classes.has('is-entering'),'Old and new layers coexist for smooth handover');
check(f.slides[0].attrs['aria-hidden']==='true','Outgoing content hidden from accessibility tree');
await f.run(1000);
check(f.slides[0].hidden&&!f.slides[1].hidden&&!f.slides[1].classes.has('is-entering'),'Transition cleans up after one second');
check(!f.root.listeners.pointerenter,'Resting pointer inside hero does not freeze autoplay');
f.root.listeners.pointerdown();check(f.timers.size===0,'Pointer press pauses during interaction');
f.root.listeners.focusin({target:f.buttons[0]});
f.root.listeners.pointerup();check(f.timers.size===1,'Pointer focus resumes autoplay after release');
f.buttons[0].keyboardFocus=true;
f.root.listeners.focusin({target:f.buttons[0]});check(f.timers.size===0,'Keyboard focus pauses autoplay');
f.root.listeners.focusout({relatedTarget:null});check(f.timers.size===1,'Leaving focus resumes timer');
f.document.hidden=true;f.document.listeners.visibilitychange();check(f.timers.size===0,'Hidden tab pauses autoplay');
f.document.hidden=false;f.document.listeners.visibilitychange();check(f.timers.size===1,'Visible tab schedules afresh');
f.observer([{isIntersecting:false}]);check(f.timers.size===0,'Offscreen hero pauses autoplay');
f.observer([{isIntersecting:true}]);check(f.timers.size===1,'Visible hero resumes autoplay');
f.buttons[3].listeners.click();await tick();check(f.root.dataset.activeSlide==='3','Thumbnail jumps directly to selected slide');
check(f.status.textContent.includes('Product 3')&&f.count.textContent==='04 / 04','Manual selection announced and counter updated');
await f.run(1000);check(f.timers.size===1&&f.toggle.attrs['aria-label']==='Dừng tự động chuyển slide','Thumbnail selection automatically resumes playback');
await f.run(6000);check(f.root.dataset.activeSlide==='0','Autoplay continues after manual selection and wraps around');
await f.run(1000);
f.buttons[3].listeners.click();await tick();check(f.root.dataset.direction==='previous','Backward selection uses reverse direction');
f.buttons[0].listeners.click();f.buttons[1].listeners.click();await f.run(1000);await tick();check(f.root.dataset.activeSlide==='1','Rapid interactions queue the most recent request');
await f.run(1000);check(f.slides.filter(s=>!s.hidden).length===1,'Rapid interactions leave exactly one visible slide');
f.toggle.listeners.click();check(f.timers.size===0,'Explicit pause stops autoplay');
f.buttons[2].listeners.click();await tick();await f.run(1000);
check(f.timers.size===0,'Thumbnail selection respects explicit pause');
f.toggle.listeners.click();check(f.timers.size===1,'Explicit play restarts autoplay');
f.root.listeners.keydown();check(f.timers.size===0,'Keyboard interaction pauses playback');
f.root.listeners.pointerdown();f.root.listeners.pointerup();check(f.timers.size===1,'Returning to pointer interaction releases keyboard pause');
f.window.listeners.pagehide();check(f.timers.size===0,'Pagehide clears autoplay');
const r=fixture(true);
check(r.timers.size===0&&r.toggle.disabled,'Reduced motion disables autoplay');
r.buttons[2].listeners.click();await tick();check(r.root.dataset.activeSlide==='2'&&r.slides.filter(s=>!s.hidden).length===1&&r.timers.size===0,'Reduced motion switches immediately with no animation timer');
let prevented=false;r.buttons[2].listeners.keydown({key:'Home',preventDefault(){prevented=true;}});await tick();
check(prevented&&r.buttons[0].focused&&r.root.dataset.activeSlide==='0','Keyboard Home navigates thumbnails');
const css=fs.readFileSync('public/css/hero-editorial.css','utf8');
check(css.includes('@media (prefers-reduced-motion: reduce)')&&css.includes('animation: none !important'),'CSS suppresses motion for reduced-motion users');
console.log(`${checks} carousel checks passed.`);
