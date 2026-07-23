'use strict';
(() => {
  const VERSION='2.3.1', P='[TikTok Studio Scheduler]';
  if(globalThis.__TTS_231__) return; globalThis.__TTS_231__=true;
  const S={version:VERSION,status:'idle',message:'Ready.',total:0,processed:0,results:[],error:null};
  let running=false,cancelled=false;
  const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const visible=e=>e instanceof Element&&e.isConnected&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().width>1&&e.getBoundingClientRect().height>1;
  const clone=()=>JSON.parse(JSON.stringify(S));
  const set=patch=>{Object.assign(S,patch);chrome.runtime.sendMessage({type:'TTS_STATE_UPDATE',state:clone()}).catch(()=>{});};
  const active=()=>{if(cancelled){const e=new Error('Automation stopped by the user.');e.code='CANCELLED';throw e;}};
  async function wait(fn,desc='condition',timeout=10000){const start=Date.now();while(Date.now()-start<timeout){active();const v=fn();if(v)return v;await sleep(120);}throw new Error(`Timed out while waiting for: ${desc}.`);}
  async function click(el,desc='element'){
    active();if(!el||!visible(el)||el.disabled)throw new Error(`${desc} is not available.`);
    el.scrollIntoView({block:'center',inline:'center'});await sleep(80);
    const r=el.getBoundingClientRect(),o={bubbles:true,cancelable:true,composed:true,view:window,clientX:r.left+r.width/2,clientY:r.top+r.height/2,button:0};
    if(typeof PointerEvent==='function')el.dispatchEvent(new PointerEvent('pointerdown',{...o,pointerId:1,pointerType:'mouse',isPrimary:true,buttons:1}));
    el.dispatchEvent(new MouseEvent('mousedown',{...o,buttons:1}));
    if(typeof PointerEvent==='function')el.dispatchEvent(new PointerEvent('pointerup',{...o,pointerId:1,pointerType:'mouse',isPrimary:true,buttons:0}));
    el.dispatchEvent(new MouseEvent('mouseup',{...o,buttons:0}));el.dispatchEvent(new MouseEvent('click',{...o,buttons:0}));console.log(P,desc);
  }
  const ceil5=d=>{d=new Date(d);const sec=d.getSeconds()||d.getMilliseconds();d.setSeconds(0,0);const m=d.getMinutes()%5;if(m)d.setMinutes(d.getMinutes()+5-m);else if(sec)d.setMinutes(d.getMinutes()+5);return d;};
  const add=(d,m)=>new Date(d.getTime()+m*60000);
  const display=d=>d.toLocaleString('en-US',{year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
  const time=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  const rows=()=>[...document.querySelectorAll('tr.task-draggable-row')].filter(visible);
  const pub=()=>document.querySelector('button[data-e2e="post_video_button"]');
  const expected=()=>{const m=(pub()?.textContent||'').match(/\((\d+)\)/);return m?+m[1]:null;};
  async function stableRows(){return wait(()=>{const r=rows(),n=expected();return r.length&&(n==null||n===r.length)?r:null;},'video rows matching Publish (N)',15000);}
  const cells=row=>[...row.querySelectorAll(':scope > td')];
  const captionCell=row=>cells(row)[3]||cells(row).find(c=>c.querySelector('[data-e2e="caption_container"],.caption-text-content'));
  const scheduleCell=row=>cells(row)[4]||cells(row).find(c=>c.querySelector('button.input-button[aria-haspopup="dialog"]'));
  const scheduleTrigger=row=>scheduleCell(row)?.querySelector('button.input-button[aria-haspopup="dialog"]');
  function toastTexts(){return [...document.querySelectorAll('[class*="TUXToast"],[role="alert"],[role="status"]')].filter(visible).map(e=>norm(e.textContent));}
  async function setDraft(editor,text){editor.focus();const s=getSelection(),r=document.createRange();r.selectNodeContents(editor);s.removeAllRanges();s.addRange(r);document.execCommand('insertText',false,text);editor.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:text}));await sleep(350);}
  function captionConfirm(row){const c=row.querySelector('[data-e2e="caption_container"],div.caption-container');let n=c?.nextElementSibling;for(let i=0;n&&i<3;i++,n=n.nextElementSibling){const b=n.matches?.('button.TUXButton--primary')?n:n.querySelector?.('button.TUXButton--primary');if(b&&visible(b))return b;}return [...row.querySelectorAll('button.TUXButton--primary')].find(b=>visible(b)&&!norm(b.textContent));}
  async function updateCaption(row,text,index){
    const cell=captionCell(row);if(!cell)throw new Error(`Row ${index}: caption cell not found.`);
    const staticNode=cell.querySelector('.caption-text-content,.caption-editor-text')||cell;if(norm(staticNode.textContent)===norm(text))return;
    await click(staticNode,`open caption editor for row ${index}`);
    const ed=await wait(()=>{const e=row.querySelector('.public-DraftEditor-content[contenteditable="true"]');return visible(e)?e:null;},`Draft.js editor for row ${index}`,6000);
    await setDraft(ed,text);const b=await wait(()=>captionConfirm(row),`caption confirmation control for row ${index}`,5000);await click(b,`confirm caption for row ${index}`);
    await wait(()=>norm(cell.textContent).includes(norm(text))||!visible(ed),`caption save for row ${index}`,7000);
  }
  const picker=()=>[...document.querySelectorAll('div.TUXPopover-popover--open[role="dialog"],[role="dialog"]')].filter(visible).find(d=>d.querySelector('.tiktok-timer-time-scroll-container'));
  const months={gennaio:0,febbraio:1,marzo:2,aprile:3,maggio:4,giugno:5,luglio:6,agosto:7,settembre:8,ottobre:9,novembre:10,dicembre:11,january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
  function header(d){const c=d.querySelector('.calendar-wrapper'),t=c?.querySelector('.month-header-wrapper .title-wrapper')?.textContent.trim();if(!t)return null;const m=norm(t).match(/^([a-z]+)\s*\/\s*(\d{4})$/);return m?{calendar:c,month:months[m[1]],year:+m[2],text:t}:null;}
  async function gotoMonth(d,y,m){for(let i=0;i<36;i++){const h=header(d);if(!h)throw new Error('Calendar header not found.');const delta=(y-h.year)*12+(m-h.month);if(!delta)return;const arrows=[...h.calendar.querySelectorAll('.month-header-wrapper .arrow')].filter(visible),a=delta>0?arrows[1]:arrows[0];if(!a)throw new Error('Calendar navigation arrow not found.');const before=h.text;a.click();await wait(()=>header(d)?.text!==before,'calendar month change',2500);}throw new Error('The target month is too far away.');}
  function daySpan(d,day){const h=header(d),dim=new Date(h.year,h.month+1,0).getDate(),cs=[...h.calendar.querySelectorAll('.days-wrapper .day-span-container')],nums=cs.map(c=>parseInt(c.querySelector('span.day')?.textContent,10));let start=-1;for(let i=0;i+dim<=nums.length;i++){if(nums[i]!==1)continue;let ok=true;for(let k=0;k<dim;k++)if(nums[i+k]!==k+1){ok=false;break;}if(ok){start=i;break;}}if(start<0)throw new Error('Unable to determine the current month in the calendar grid.');return cs[start+day-1]?.querySelector('span.day');}
  async function selectDate(d,target){await gotoMonth(d,target.getFullYear(),target.getMonth());const s=daySpan(d,target.getDate());if(!s||!s.classList.contains('valid'))throw new Error(`Date ${display(target)} cannot be selected.`);s.click();await wait(()=>s.classList.contains('selected'),`select day ${target.getDate()}`,3000);}
  function wheelCols(d){const a=[...d.querySelectorAll('.tiktok-timer-time-scroll-container')].filter(visible);if(a.length<2)throw new Error('Hour/minute columns not found.');return a;}
  async function selectWheel(c,v,label){const t=String(v).padStart(2,'0'),item=[...c.querySelectorAll('.tiktok-timer-option-item')].find(e=>e.textContent.trim()===t);if(!item)throw new Error(`${label} ${t} is not available.`);await click(item,`${label} ${t}`);await sleep(550);}
  async function selectTime(d,target){const [h,m]=wheelCols(d);await selectWheel(h,target.getHours(),'hour');await selectWheel(m,target.getMinutes(),'minute');}
  function confirmButton(d){return [...d.querySelectorAll('button,[role="button"]')].filter(visible).find(b=>['in programma','schedule'].includes(norm(b.textContent)));}
  async function schedule(row,target,index){
    for(let attempt=0;attempt<5;attempt++){
      const tr=scheduleTrigger(row);if(!tr)throw new Error(`Row ${index}: schedule trigger not found.`);await click(tr,`open picker for row ${index}`);const d=await wait(()=>picker(),`open picker for row ${index}`,6000);
      await selectDate(d,target);await selectTime(d,target);await sleep(600);const b=confirmButton(d);if(!b)throw new Error(`Row ${index}: TikTok Schedule button not found.`);const before=toastTexts();await click(b,`Schedule row ${index}`);
      try{await wait(()=>{const fresh=toastTexts().filter(x=>!before.includes(x));if(fresh.some(x=>/inferiore a 15 minuti|at least 15 minutes/.test(x)))return 'soon';const txt=scheduleCell(row)?.textContent||'';if(!visible(d)&&txt.includes(time(target)))return 'ok';return null;},'schedule confirmation',9000);return target;}catch(e){if(/15 minuti|too soon/i.test(e.message)||toastTexts().some(x=>/inferiore a 15 minuti|at least 15 minutes/.test(x))){target=ceil5(add(target,5));continue;}throw e;}
    }throw new Error(`Row ${index}: time was rejected after 5 attempts.`);
  }
  async function run(config){cancelled=false;running=true;set({status:'scanning',message:'Checking video rows…',total:0,processed:0,results:[],error:null});try{
    const rs=await stableRows();set({status:'running',message:`Found ${rs.length} clips.`,total:rs.length});let first=config.startMode==='custom'?new Date(+config.startAtMs):null;if(first&&(+first-Date.now()<16*60000))throw new Error('The selected date and time are too close.');let prev=null;
    for(let i=0;i<rs.length;i++){active();const n=i+1;if(config.caption){set({message:`Row ${n}/${rs.length}: updating caption…`});await updateCaption(rs[i],config.caption,n);}else{set({message:`Row ${n}/${rs.length}: keeping the existing caption…`});}const target=prev?add(prev,config.intervalMinutes):(first||ceil5(new Date(Date.now()+20*60000)));set({message:`Row ${n}/${rs.length}: scheduling for ${display(target)}…`});prev=await schedule(rs[i],target,n);S.results.push({index:n,success:true,caption:config.caption,displayTime:display(prev),isoTime:prev.toISOString()});set({processed:n,results:[...S.results]});}
    set({status:'ready',message:`${rs.length} clips prepared. Review the page before publishing.`});
  }catch(e){const m=e.message||String(e);set({status:e.code==='CANCELLED'?'stopped':'error',message:m,error:m});console.error(P,e);}finally{running=false;}}
  async function publish(){if(S.status!=='ready'||!S.results.length)throw new Error('Preparation is not complete.');const b=pub();if(!b||!visible(b))throw new Error('The global Publish (N) button is not available.');set({status:'publishing',message:'Sending the click to Publish (N)…'});await click(b,'Publish (N)');set({status:'published',message:'Click on Publish (N) sent.'});}
  chrome.runtime.onMessage.addListener((m,_s,reply)=>{if(!m?.type)return false;if(m.type==='TTS_PING'){reply({ok:true,version:VERSION});return false;}if(m.type==='TTS_GET_STATE'){reply({ok:true,state:clone()});return false;}if(m.type==='TTS_STOP'){cancelled=true;set({status:'stopped',message:'Stop requested.'});reply({ok:true,state:clone()});return false;}if(m.type==='TTS_START'){if(running){reply({ok:false,error:'An automation is already running.'});return false;}const c=m.config||{};if(typeof c.caption!=='string'||!Number.isInteger(c.intervalMinutes)||c.intervalMinutes%5){reply({ok:false,error:'Invalid configuration.'});return false;}run(c);reply({ok:true});return false;}if(m.type==='TTS_PUBLISH'){publish().then(()=>reply({ok:true,state:clone()})).catch(e=>reply({ok:false,error:e.message,state:clone()}));return true;}return false;});
  console.log(P,`Content script ${VERSION} initialized.`);
})();
