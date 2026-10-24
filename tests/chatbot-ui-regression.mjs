import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Minimal DOM fixture exercises the shipped widget's events and safe rendering, without a browser or DB write.
class Element {
    constructor(tag = 'div') { this.tag = tag; this.children = []; this.listeners = {}; this.attributes = {}; this.hidden = false; this.disabled = false; this.value = ''; this.scrollHeight = 100; }
    addEventListener(name, handler) { this.listeners[name] = handler; }
    setAttribute(name, value) { this.attributes[name] = value; }
    append(...nodes) { for (const node of nodes) { node.parent = this; this.children.push(node); } }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); }
    replaceWith(node) { const at = this.parent.children.indexOf(this); this.parent.children[at] = node; node.parent = this.parent; }
    replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
    focus() { this.focused = true; }
    get firstElementChild() { return this.children[0]; }
    set textContent(value) { this.text = String(value); }
    get textContent() { return this.text || ''; }
    set innerHTML(value) { throw new Error('Unsafe HTML rendering attempted'); }
}
const root = new Element(), panel = new Element(), launcher = new Element(), log = new Element(), form = new Element('form');
const input = new Element('input'), submit = new Element('button'), reset = new Element('button'), close = new Element('button');
const prompts = ['Tư vấn bánh dưới 300k','Có bánh dâu không?','Khuyến mãi hôm nay','Kiểm tra đơn hàng'].map(text => {const el = new Element('button'); el.textContent = text; return el;});
panel.hidden = true;
root.dataset = {token:'TEST-CSRF', messageUrl:'/chatbot/message', resetUrl:'/chatbot/reset'};
root.querySelector = selector => ({'#chatPanel':panel, '.strawberry-chat__launcher':launcher, '[role="log"]':log, form, '[data-chat-reset]':reset, '[data-chat-close]':close})[selector];
root.querySelectorAll = () => prompts;
form.elements = {message:input}; form.querySelector = () => submit;
const calls = [], responses = [];
const fetch = async (url, options) => { calls.push({url, options}); return responses.shift() || {ok:true,json:async()=>({success:true,message:'OK',products:[]})}; };
vm.runInNewContext(fs.readFileSync('public/js/chatbot.js','utf8'), {
    document:{getElementById:()=>root,createElement:tag=>new Element(tag)}, location:{origin:'http://localhost:8000'},
    URL, AbortController, setTimeout, clearTimeout, fetch, console,
});
let checks = 0;
const check = (condition, label) => { assert.ok(condition, label); checks++; console.log('PASS',label); };
const flush = () => new Promise(resolve=>setImmediate(resolve));
check(log.children.length === 1 && panel.hidden, 'Greeting present, widget initially closed');
launcher.listeners.click();
check(!panel.hidden && launcher.attributes['aria-expanded'] === 'true' && input.focused, 'Open with accessible expanded state and focus');
responses.push({ok:true,json:async()=>({success:true,message:'Bánh thật từ server',products:[
    {name:'<img src=x onerror=alert(1)>',url:'/details/REAL-A',image:'javascript:alert(1)',sizes:[{name:'16 cm',price:250000}]},
    {name:'Malicious link',url:'https://evil.example/details/FALSE',sizes:[]},
]})});
await prompts[0].listeners.click();
check(calls[0].url === '/chatbot/message' && calls[0].options.headers['X-CSRF-TOKEN'] === 'TEST-CSRF' && calls[0].options.credentials === 'same-origin', 'POST uses CSRF and same-origin session');
check(JSON.parse(calls[0].options.body).message === 'Tư vấn bánh dưới 300k', 'Quick prompt sends exact message');
const cards = log.children.find(node=>node.className === 'strawberry-chat__products');
check(cards.children.length === 1, 'Untrusted external product link rejected');
const card = cards.children[0];
check(card.children[0].className === 'strawberry-chat__placeholder', 'Unsafe image scheme rejected');
check(card.children[1].children[0].textContent.startsWith('<img'), 'Model/product strings remain text, never HTML');
check(card.children[1].children[1].children[1].textContent === '250.000đ', 'Real price formatted in Vietnamese');
check(!submit.disabled && !reset.disabled, 'Busy controls restored after success');
responses.push({ok:false,json:async()=>({success:false,message:'Bạn gửi hơi nhanh. Vui lòng đợi một phút rồi thử lại.'})});
input.value='Xin tư vấn'; form.listeners.submit({preventDefault(){}}); await flush();
check(log.children.at(-1).textContent === 'Bạn gửi hơi nhanh. Vui lòng đợi một phút rồi thử lại.' && log.children.at(-1).className.endsWith('--error'), 'Server errors shown without crashing');
responses.push({ok:true,json:async()=>{throw new SyntaxError('invalid');}});
await prompts[1].listeners.click();
const unavailable = 'Ú òa! 🍰 Có vẻ trợ lý nhỏ của tiệm đang nghỉ tay một xíu. Bạn quay lại trò chuyện với mình sau nhé! 💕';
check(log.children.at(-1).textContent === unavailable, 'Invalid response uses friendly unavailable message');
for (const message of ['Missing API key: SECRET', 'Gemini API error: model internal-model', 'AI chưa được cấu hình']) {
    responses.push({ok:false,json:async()=>({success:false,message})});
    await prompts[1].listeners.click();
    check(log.children.at(-1).textContent === unavailable && log.children.at(-1).className.endsWith('--error'), 'Technical server error masked, failure preserved');
}
await reset.listeners.click();
check(log.children.length === 1 && calls.at(-1).url === '/chatbot/reset', 'New conversation calls server and clears UI');
root.listeners.keydown({key:'Escape'});
check(panel.hidden && launcher.focused, 'Escape closes and restores focus');
console.log(`${checks} UI checks passed.`);
