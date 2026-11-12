'use strict';
const E=HouseEngine,KEY='merge-house-v1',$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let state,saveOK=true;try{state=E.restore(localStorage.getItem(KEY))}catch(e){state=E.fresh();saveOK=false}
let toolMode=null,undoSnap=null,selected=-1,fx={},ptr=null,lastAct=Date.now(),busy=false,ctx,toastT;
const P=()=>state.play,nm=id=>E.nameOf(id),cellSel=i=>'[data-cell="'+i+'"]';
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){saveOK=false}}
function toast(m){if(!m)return;const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200)}
// iOS mutes Web Audio with the ring/silent switch. Mark the page as media playback:
// iOS 17+: navigator.audioSession.type='playback'; older: keep a silent <audio> looping so the session is "media".
let mediaKeep=null;
function unlockMediaAudio(){try{if(navigator.audioSession)navigator.audioSession.type='playback'}catch(e){}
 try{if(!mediaKeep){mediaKeep=document.createElement('audio');mediaKeep.setAttribute('playsinline','');mediaKeep.setAttribute('webkit-playsinline','');mediaKeep.loop=true;mediaKeep.preload='auto';mediaKeep.src='./assets/silence.wav';mediaKeep.volume=0.01}
  const pr=mediaKeep.play();if(pr&&pr.catch)pr.catch(()=>{})}catch(e){}
 try{if(ctx==null)ctx=new(window.AudioContext||window.webkitAudioContext)();ctx.resume()}catch(e){}}
['pointerdown','touchend','click'].forEach(t=>document.addEventListener(t,unlockMediaAudio,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&mediaKeep){const pr=mediaKeep.play();if(pr&&pr.catch)pr.catch(()=>{})}else if(document.hidden&&mediaKeep)mediaKeep.pause()});
function sound(kind='tap',level=0){if(state.muted)return;try{if(ctx==null)ctx=new(window.AudioContext||window.webkitAudioContext)();ctx.resume();const k=2**(level/6);
 const seq={tap:[392],spawn:[523],merge:[523*k,659*k],collect:[784,988,1175],goal:[659,784,988,1319,1568,2093],bonus:[880,1109,1319,1760],stamp:[523,784,1047],win:[523,659,784,1047,1319],lose:[330,262],err:[220]}[kind]||[392];
 seq.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+i*.08;o.type=kind==='err'||kind==='lose'?'triangle':'sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(ctx.destination);o.start(t);o.stop(t+.26)})}catch(e){}}
function modal(html){$('#dialog-body').innerHTML=html;$('#modal').hidden=false;hideHand()}
function closeModal(){$('#modal').hidden=true;render()}
const centerOf=el=>{const r=el.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]};
function burst(rect,l=1){if(!rect)return;const x=rect.left+rect.width/2,y=rect.top+rect.height/2,n=6+l*2;const rg=document.createElement('div');rg.className='ring';rg.style.left=x+'px';rg.style.top=y+'px';document.body.appendChild(rg);setTimeout(()=>rg.remove(),500);for(let k=0;k<n;k++){const s=document.createElement('div'),a=k/n*6.283+Math.random()*.5,d=24+Math.random()*22+l*4;s.className='spark';s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d+'px');if(k%3===0)s.style.background='#fff';document.body.appendChild(s);setTimeout(()=>s.remove(),600)}}
function confetti(){const cs=['#f2b632','#e2534a','#4a86d9','#5ab46e','#a46ad9','#fff'];for(let k=0;k<70;k++){const c=document.createElement('div');c.className='confetti';c.style.left=Math.random()*100+'vw';c.style.background=cs[k%cs.length];c.style.animationDuration=(1.6+Math.random()*1.6)+'s';c.style.animationDelay=Math.random()*.5+'s';c.style.setProperty('--dx',(Math.random()*120-60)+'px');c.style.setProperty('--r',(Math.random()*720)+'deg');document.body.appendChild(c);setTimeout(()=>c.remove(),4000)}}
function floatText(x,y,t){const d=document.createElement('div');d.className='float';d.textContent=t;d.style.left=x+'px';d.style.top=y+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),950)}

// ---------- render ----------
function render(){
 const p=P(),d=E.levelDef(p.n);
 BOXCH=d.gens;const th=themeOf(d);$('#lvl').innerHTML=E.HOUSES[d.house]+'<small>第 '+(d.part+1)+' / '+E.PARTS+' 关</small>';
 $('#coins').textContent=state.coins;
 $('#app').style.background=themeBg(th);ambience(th);$('#app').classList.toggle('dark',!!THEMES[th].night);
 $('#housebox').innerHTML=houseSVG(d.part,d.house,-1,false,th,decorOf(d.house))+'<span>下一步：'+d.name+'</span>';
 $('#lvname').textContent='建造：'+d.name;$('#tri').textContent='剩 ≥'+E.threeStarLeft(p)+' 步得 ★★★';renderTools();
 $('#goals').innerHTML=Object.keys(p.total).map(id=>{const need=p.total[id],left=p.goals[id],done=left<=0;return '<button type="button" class="goal'+(done?' done':'')+'" data-goal="'+id+'" title="'+nm(id)+'（'+(E.lvl(id)+1)+'级）">'+icon(id)+'<span class="glv t'+E.lvl(id)+'">'+(E.lvl(id)+1)+'</span><b>'+(need-left)+'/'+need+'</b>'+(done?'<span class="ck">✓</span>':'')+'</button>'}).join('');
 $('#steps').className=p.steps<=5&&p.status==='play'?'low':'';
 $('#steps').innerHTML='<span class="n">'+p.steps+'</span><small>剩余<br>步数</small><span class="sp"></span><button id="replay" class="ib" aria-label="重玩本关"><b>↻</b>重玩</button><button id="undo" class="ib" '+(undoSnap&&p.status==='play'?'':'disabled')+' aria-label="撤回一步"><b>↶</b>撤回</button>';
 renderBoard();renderSel();save();fit();updateHand()}
const TOOLART={hammer:'<svg viewBox="0 0 64 64"><path d="M30 26L12 56" stroke="#3d2a1c" stroke-width="9" stroke-linecap="round"/><path d="M30 26L12 56" stroke="url(#wd)" stroke-width="5" stroke-linecap="round"/><path d="M18 14L40 4L54 30L32 40Z" fill="url(#mt)" stroke="#3d2a1c" stroke-width="2.2" stroke-linejoin="round"/></svg>',
 pick:'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#fff" stroke="#3d2a1c" stroke-width="2.2"/><circle cx="32" cy="32" r="16" fill="#e2534a" stroke="#3d2a1c" stroke-width="2"/><circle cx="32" cy="32" r="8" fill="#fff" stroke="#3d2a1c" stroke-width="2"/><path d="M32 32L56 8M50 8h6v6" stroke="#3d2a1c" stroke-width="3" fill="none" stroke-linecap="round"/></svg>'};
function renderTools(){const p=P();$('#tools').innerHTML=Object.keys(E.TOOLS).map(k=>{const T=E.TOOLS[k],have=state.items[k]||0,used=!!p.tools[k];
 return '<button class="tool'+(used?' used':'')+(toolMode===k?' on':'')+'" data-tool="'+k+'">'+(k==='star'?icon('star0'):TOOLART[k])+'<span>'+T.name+'<small>'+(used?'本关已用':have?'点击使用':'◉'+T.price+' 购买')+'</small></span><span class="cnt'+(have?'':' buy')+'">'+(have?have:'◉')+'</span></button>'}).join('')}
function decorOf(h){return [12,24,36].filter(t=>houseStars(h)>=t).length}
function useTool(k){const p=P(),T=E.TOOLS[k];if(busy||p.status!=='play')return;if(p.tools[k]){toast('每关每种道具只能用一次');return}
 if(toolMode===k){toolMode=null;render();return}
 if(!(state.items[k]>0)){if(state.coins<T.price){sound('err');toast('金币不够：过关和宝箱都能拿到金币');return}state.coins-=T.price;state.items[k]=(state.items[k]||0)+1;toast('花 ◉'+T.price+' 买了一个'+T.name)}
 if(k==='hammer'){toolMode='hammer';selected=-1;render();toast('点一个木箱或蜘蛛网，把它敲开');return}
 if(k==='star'){const r=E.placeStar(p);if(!r.ok){toast(r.message);return}state.items.star--;undoSnap=null;fx[r.index]='spawn';sound('bonus');render();burst(rectOf(r.index),4);return}
 if(k==='pick'){const d=E.levelDef(p.n);modal('<button class="close" id="x">×</button><h2>指定开箱</h2><p>下一次点材料箱，必出你选的这种材料：</p><div class="chainrow">'+d.gens.map(c=>'<button class="tbtn" data-pick="'+c+'" style="width:auto;margin:4px">'+icon(c+'0').replace('<svg','<svg style="width:40px;height:40px"')+'<br>'+E.CH[c].items[0]+'</button>').join('')+'</div>');
  $('#x').onclick=closeModal;$$('[data-pick]').forEach(b=>b.onclick=()=>{const r=E.setPick(P(),b.dataset.pick);if(r.ok){state.items.pick--;undoSnap=null;sound('bonus');closeModal();toast('下一次开箱必出「'+E.CH[b.dataset.pick].items[0]+'」')}})}}
function hammerAt(i){const p=P(),rect=rectOf(i),r=E.useHammer(p,i);if(!r.ok){sound('err');toast(r.message);return}
 state.items.hammer--;toolMode=null;undoSnap=null;fx[i]='pop';sound('merge',3);burst(rect,5);render();
 after({bonus:r.bonus?[{i,kind:r.bonus}]:[],collected:r.collected},rect)}
function renderBoard(){
 const p=P(),sel=selected>=0?p.board[selected]:null;
 $('#board').innerHTML=p.board.map((c,i)=>{
  if(!c)return '<button class="cell empty'+(fx[i]?' '+fx[i]:'')+'" data-cell="'+i+'" aria-label="空格"></button>';
  let cls='cell',inner,label;
  if(c.s===2){cls+=' crate';inner=icon('crate');label='木箱'}
  else{inner=icon(c.i);label=nm(c.i);if(E.isGen(c.i))cls+=' gen';else cls+=' t'+E.lvl(c.i),inner+='<span class="lv">'+(E.lvl(c.i)+1)+'</span>';if(c.s===1){cls+=' sealed';inner+=WEB;label+='（被蛛网罩住）'}}
  if(i===selected)cls+=' sel';else if(sel&&!sel.s&&c.s<2&&c.i===sel.i&&!E.isGen(c.i))cls+=' match';
  if(toolMode==='hammer'&&c.s)cls+=' aim';
  if(fx[i])cls+=' '+fx[i];
  return '<button class="'+cls+'" data-cell="'+i+'" aria-label="'+label+'">'+inner+'</button>'}).join('');fx={}}
function renderSel(){
 const c=selected>=0?P().board[selected]:null,b=$('#selbar');
 if(!c){b.innerHTML='<span class="t">点材料箱出材料 · 拖动相同材料合成</span>';return}
 if(c.s===2){b.innerHTML='<span class="t"><b>木箱</b>：在它旁边合成一次就会打开</span>';return}
 if(E.isGen(c.i)){b.innerHTML='<span class="t"><b>材料箱</b>：点一下随机出一个材料，更容易出你还缺的（1 步）</span>';return}
 if(c.i==='star0'){b.innerHTML='<span class="t"><b>万能星</b>：拖到任意材料上，直接让它升一级</span>';return}
 if(c.s===1){b.innerHTML='<span class="t"><b>'+nm(c.i)+'</b>被蜘蛛网罩住：把相同材料合到它身上</span><button class="tbtn" data-act="chain">合成路线</button>';return}
 b.innerHTML='<span class="t"><b>'+nm(c.i)+'</b> · '+(E.lvl(c.i)+1)+'级</span><button class="tbtn" data-act="chain">合成路线</button><button class="tbtn" data-act="remove">丢掉（1步）</button>'}

// ---------- seasonal ambience over the whole screen ----------
const AMB=[
 {kind:'seed',n:14,move:'rise',col:['#ffffff']},            // dandelion fluff at dawn
 {kind:'petal',n:18,move:'fall',col:['#f7a8c4','#ffd1e0','#fff3a0']},
 {kind:'shine',n:16,move:'float',col:['#fff6b0','#ffe27a']},
 {kind:'shine',n:20,move:'float',col:['#ffffff','#fff6b0']}, // summer beach sun glints
 {kind:'leaf',n:12,move:'fall',col:['#7fb85a','#5f9a42']},
 {kind:'rain',n:34,move:'rain',col:['#8fb6d8']},
 {kind:'leaf',n:24,move:'fall',col:['#f2b632','#e08a3a','#d4642a','#f6cf5a']},
 {kind:'fly',n:14,move:'float',col:['#ffd27a']},
 {kind:'snow',n:30,move:'fall',col:['#ffffff']},
 {kind:'mist',n:6,move:'drift',col:['#ffffff']},
 {kind:'petal',n:22,move:'fall',col:['#f4a6c0','#ffd1e0','#fbe4ec']},
 {kind:'fly',n:20,move:'float',col:['#ffe27a','#fff1a8']},
 {kind:'seed',n:22,move:'drift2',col:['#e8c27a']},
 {kind:'fly',n:22,move:'float',col:['#d6ff8a','#fff1a8']}];
let ambT=-1;
function ambience(t){if(ambT===t)return;ambT=t;let box=document.getElementById('amb');if(!box){box=document.createElement('div');box.id='amb';document.body.appendChild(box)}
 const a=AMB[t%AMB.length];let h='';
 for(let k=0;k<a.n;k++){const col=a.col[k%a.col.length],x=Math.random()*100,dur=a.move==='rain'?.7+Math.random()*.5:a.move==='drift'?18+Math.random()*12:6+Math.random()*7,del=-Math.random()*dur,sz=a.kind==='mist'?120+Math.random()*120:a.kind==='rain'?1:(a.kind==='leaf'||a.kind==='petal')?11+Math.random()*9:6+Math.random()*8;
  let shape='';
  if(a.kind==='leaf')shape='<svg viewBox="0 0 20 20"><path d="M2 18Q2 4 18 2Q16 16 2 18Z" fill="'+col+'"/><path d="M2 18L13 7" stroke="#0003"/></svg>';
  else if(a.kind==='petal')shape='<svg viewBox="0 0 20 20"><path d="M10 1Q18 8 10 19Q2 8 10 1Z" fill="'+col+'"/></svg>';
  else if(a.kind==='snow')shape='<svg viewBox="0 0 20 20"><g stroke="'+col+'" stroke-width="2" stroke-linecap="round"><path d="M10 2V18M3 6L17 14M3 14L17 6"/></g></svg>';
  h+='<i class="amb '+a.kind+' '+a.move+'" style="left:'+x+'%;width:'+sz+'px;height:'+(a.kind==='rain'?14:a.kind==='mist'?sz/3:sz)+'px;animation-duration:'+dur+'s;animation-delay:'+del+'s;--c:'+col+';--sw:'+(Math.random()*60-30)+'px">'+shape+'</i>'}
 box.innerHTML=h}
// ---------- fit to available space; square cells and a stable action tray ----------
function fit(){
 const vv=window.visualViewport;
 // Pinch zoom must not relayout the game underneath the player's fingers.
 if(vv&&Math.abs(vv.scale-1)>.01)return;
 const vh=Math.round(vv?vv.height:window.innerHeight),vw=document.documentElement.clientWidth;
 document.documentElement.style.setProperty('--app-h',vh+'px');
 // Two columns need enough width for both the controls and touch-sized cells.
 const land=vw>=560&&vw>vh&&vh<560;
 document.body.classList.toggle('land',land);
 document.body.classList.toggle('compact',land||vh<740);
 const wrap=$('#boardwrap'),b=$('#board');
 if(!wrap||!b)return;
 const css=getComputedStyle(wrap),gap=wrap.clientWidth<360?3:4,pad=7;
 const width=wrap.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
 // Set the minimum before measuring so very short windows can scroll instead of clipping cells.
 wrap.style.minHeight=(8*34+7*gap+2*pad+parseFloat(css.paddingTop)+parseFloat(css.paddingBottom))+'px';
 const height=wrap.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
 const size=Math.max(1,Math.floor(Math.min((width-2*pad-6*gap)/7,(height-2*pad-7*gap)/8)));
 b.style.setProperty('--cell-size',size+'px');b.style.setProperty('--cell-gap',gap+'px');
}
let fitT;
function refit(){if(fitT)return;fitT=requestAnimationFrame(()=>{fitT=0;fit();updateHand()})}
addEventListener('resize',refit);
addEventListener('orientationchange',refit);
if(window.visualViewport)visualViewport.addEventListener('resize',refit);
if(window.ResizeObserver){const layoutObserver=new ResizeObserver(refit);['#app','header','#top','#ctrl','#selbar'].forEach(s=>layoutObserver.observe($(s)))}
$('#app').addEventListener('scroll',updateHand,{passive:true});
// ---------- helper hand ----------
const tutorial=()=>screen==='game'&&P().n===0&&P().used<5;
function updateHand(){if(screen!=='game'||busy||!$('#modal').hidden||P().status!=='play'){hideHand();return}if(tutorial()||(P().n<2&&Date.now()-lastAct>6000))showHand();else hideHand()}
function showHand(){const h=E.hint(P()),hand=$('#hand');$$('.cell.hint').forEach(e=>e.classList.remove('hint'));
 let a,b;if(h.kind==='pair'){a=$(cellSel(h.a));b=$(cellSel(h.b));if(selected===h.a){a=b;b=null}}else if(h.kind==='gen'||h.kind==='remove')a=$(cellSel(h.i));
 if(!a){hideHand();return}a.classList.add('hint');if(b)b.classList.add('hint');
 const[x1,y1]=centerOf(a);hand.style.setProperty('--x1',x1+'px');hand.style.setProperty('--y1',y1+'px');
 if(b){const[x2,y2]=centerOf(b);hand.style.setProperty('--x2',x2+'px');hand.style.setProperty('--y2',y2+'px');hand.className='drag'}else hand.className='tap'}
function hideHand(){$('#hand').className='';$$('.cell.hint').forEach(e=>e.classList.remove('hint'))}

// ---------- actions ----------
const snap=()=>JSON.stringify(P());
function keep(before,r){if(r.ok&&P().status==='play')undoSnap=before;else if(r.ok)undoSnap=null}
function undo(){if(!undoSnap||busy||P().status!=='play')return;state.play=JSON.parse(undoSnap);undoSnap=null;selected=-1;sound('tap');toast('已撤回一步');render()}
function goalFx(x,y,id){const g=document.createElement('div');g.className='goalfx';g.style.left=x+'px';g.style.top=y+'px';g.innerHTML='<i class="rays"></i><i class="flash"></i><div class="gicon">'+icon(id)+'</div><b>'+nm(id)+'！</b>';document.body.appendChild(g);
 for(let k=0;k<18;k++){const s=document.createElement('div'),a=k/18*6.283,d=50+Math.random()*40;s.className='spark big';s.style.left=x+'px';s.style.top=y+'px';s.style.setProperty('--dx',Math.cos(a)*d+'px');s.style.setProperty('--dy',Math.sin(a)*d+'px');s.style.background=['#ffd34a','#fff','#ff9a4a'][k%3];document.body.appendChild(s);setTimeout(()=>s.remove(),700)}
return g}
function after(r,fromRect){
 (r.bonus||[]).forEach(b=>{const rc=rectOf(b.i);if(!rc)return;burst(rc,5);sound('bonus');const t={steps:'隐藏款！+3 步',coins:'隐藏款！+20 金币',star:'隐藏款！万能星'}[b.kind];floatText(rc.left+rc.width/2,rc.top,t);if(!state.seenBonus){state.seenBonus=1;toast(b.kind==='star'?'开出隐藏款「万能星」！拖到任意材料上能直接升一级':'木箱里藏着隐藏款，开箱时留意惊喜！')}});
 if(r.collected){sound('goal');const id=r.collected,chip=$('[data-goal="'+id+'"]'),finished=P().goals[id]===0;
  if(chip&&fromRect){const x=fromRect.left+fromRect.width/2,y=fromRect.top+fromRect.height/2,g=goalFx(x,y,id);
   setTimeout(()=>{g.remove();const f=document.createElement('div');f.className='fly';f.innerHTML=icon(id);f.style.left=x+'px';f.style.top=y+'px';f.style.transform='scale(1.5)';document.body.appendChild(f);
    const[x2,y2]=centerOf(chip);requestAnimationFrame(()=>requestAnimationFrame(()=>f.style.transform='translate('+(x2-x)+'px,'+(y2-y)+'px) scale(.8)'));
    setTimeout(()=>{f.remove();const c=$('[data-goal="'+id+'"]');if(!c)return;c.classList.add(finished?'stamp':'bump');const[cx,cy]=centerOf(c);burst(c.getBoundingClientRect(),finished?5:2);floatText(cx,cy-24,finished?'完成！':'+1');if(finished)sound('stamp')},600)},650)}}
 const st=P().status;if(st==='won'){busy=true;setTimeout(winModal,r.collected?1700:900)}else if(st==='lost'){busy=true;setTimeout(loseModal,500)}}
function rectOf(i){const el=$(cellSel(i));return el?el.getBoundingClientRect():undefined}
function doProduce(i){const before=snap(),r=E.produce(P(),i);keep(before,r);if(!r.ok){sound('err');toast(r.message);return}const rect=rectOf(r.index);fx[r.index]='spawn';sound('spawn');selected=-1;render();after(r,rect)}
function performMove(a,b){
 const rect=rectOf(b),before=snap(),r=E.move(P(),a,b);keep(before,r);selected=-1;
 if(!r.ok){if(r.message){sound('err');toast(r.message)}render();return}
 if(r.merged){fx[b]='pop';burst(rect,E.lvl(r.id));r.revealed.forEach(n=>fx[n]='reveal');sound('merge',E.lvl(r.id));
  if(!r.collected){const[x,y]=[rect.left+rect.width/2,rect.top];setTimeout(()=>floatText(x,y,nm(r.id)),30)}
  if(r.unsealed&&!state.seenVine){state.seenVine=1;toast('蜘蛛网清掉了！被罩住的材料，用相同材料合成就能救出来')}
  else if(r.revealed.length&&!state.seenCrate){state.seenCrate=1;toast('木箱打开了！在木箱旁边合成就能掀开它')}}
 else sound('tap');render();after(r,rect)}
function tapCell(i){
 if(busy)return;if(toolMode==='hammer'){hammerAt(i);return}const p=P(),c=p.board[i],S=selected>=0?p.board[selected]:null;
 if(!c){if(S&&!S.s)performMove(selected,i);else{selected=-1;render()}return}
 if(E.isGen(c.i)&&!c.s){doProduce(i);return}
 if(selected===i){selected=-1;render();return}
 if(S&&!S.s&&S.i===c.i){performMove(selected,i);return}
 selected=i;sound('tap');render()}
function chainModal(id){const c=E.isGen(id)?E.genChain(id):E.chainOf(id);modal('<button class="close" id="x">×</button><h2>'+E.CH[c].gen.replace(/箱|筐|袋|桶/,'')+'的合成路线</h2><div class="chainrow">'+E.CH[c].items.map((n,l)=>'<div>'+icon(c+l)+'<br>'+n+'</div>').join('<em>›</em>')+'</div><p>两个相同的材料合成下一级。</p>');$('#x').onclick=closeModal}
function winModal(){
 const decBefore=decorOf(P().n/E.PARTS|0),chBefore=E.chestsReady(state);const p=P(),res=E.win(state),d=res.def,houseDone=res.houseDone,hname=E.HOUSES[d.house],last=res.firstAll;E.next(state);undoSnap=null;save();sound('win');confetti();
 if(last){finale(res);return}
 modal(houseSVG(d.part+1,d.house,d.part,true,themeOf(d),decorOf(d.house))+'<div class="stars">'+'★★★'.split('').map((s,k)=>k<res.stars?'<i>★</i>':'☆').join('')+'</div><h2>'+(houseDone?'🎉 「'+hname+'」落成！':d.name+' · 完成')+'</h2><p>'+(houseDone?'从一片空地到亮起灯火，你亲手盖好了整栋房子。<br>'+(res.allDone?'全部 '+E.HOUSES.length+' 栋房子都已落成！':'回到首页，挑下一栋来盖吧。'):'用了 '+p.used+' 步，合成 '+p.merges+' 次')+'</p><p><b>◉ +'+res.reward+'</b>'+(decorOf(d.house)>decBefore?'<br>🎁 解锁新装饰：<b>'+DECORNAME[d.house][decorOf(d.house)-1]+'</b>':'')+(E.chestsReady(state)>chBefore?'<br>🧰 星星宝箱可以开了！（回首页）':'')+(p.bonusCoins?'（含隐藏款 '+p.bonusCoins+'）':'')+'</p><button class="big" id="go">'+(houseDone?'回到首页':'下一关：'+E.levelDef(state.play.n).name)+'</button>'+(houseDone?'':'<button class="big blue" id="tolv">返回选关</button>'));
 $('#tolv')&&($('#tolv').onclick=()=>{busy=false;selected=-1;$('#modal').hidden=true;showLevels(d.house)});
 $('#go').onclick=()=>{busy=false;selected=-1;if(houseDone){$('#modal').hidden=true;showHome()}else closeModal()}}
const DONE_THEME=E.HOUSE_INFO.map(h=>h.doneTheme|0);
const THEMEMAP=E.HOUSE_INFO.map(h=>Array.isArray(h.themes)&&h.themes.length===12?h.themes:[0,1,2,3,4,5,6,7,8,9,10,11]);
function themeOf(d){return THEMEMAP[d.house][d.part]}
function chainsOfHouse(h){const s=new Set();E.BUILDS[h].forEach(l=>Object.keys(l.goals).forEach(id=>s.add(E.chainOf(id))));return [...s]}
function chainRow(c){return '<div class="chainrow">'+E.CH[c].items.map((n,l)=>'<div>'+icon(c+l)+'<br>'+n+'</div>').join('<em>›</em>')+'</div>'}
function newHouseModal(){const d=E.levelDef(P().n);if(!state.seenHouse.includes(d.house))state.seenHouse.push(d.house);BOXCH=d.gens;modal(houseSVG(0,d.house,-1,true,themeOf(d))+'<h2>第 '+(d.house+1)+' 栋：'+E.HOUSES[d.house]+'</h2><p>这一栋要用的材料（每种 6 级）：</p>'+chainsOfHouse(d.house).map(chainRow).join('')+'<button class="big" id="go">开始建造</button>');$('#go').onclick=()=>{save();closeModal()}}
function finale(res){const total=Object.values(state.stars).reduce((a,b)=>a+b,0);sound('win');confetti();setTimeout(confetti,900);
 modal('<div class="finale">'+E.HOUSES.map((_,h)=>h).map(h=>houseSVG(12,h,-1,true,DONE_THEME[h],decorOf(h))).join('')+'</div><h2>🏆 全部建造完成！</h2><p>全部 '+E.HOUSES.length+' 栋房子都亮起了灯。</p><div class="stars"><i>★</i></div><p><b>总共获得 '+total+' / '+(E.TOTAL*3)+' 颗星</b></p><p>想拿满星，随时可以在选关页重玩任何一关。</p><button class="big" id="go">回到首页</button>');
 $('#go').onclick=()=>{busy=false;selected=-1;$('#modal').hidden=true;showHome()}}
function replayModal(){if(busy)return;const d=E.levelDef(P().n);
 modal('<h2>重玩这一关？</h2><p>「'+d.name+'」会回到开局状态，步数重新计算，当前进度不保留。</p><button class="big" id="y">↻ 重新开始本关</button><button class="big blue" id="n">继续玩</button>');
 $('#y').onclick=()=>{E.retry(state);undoSnap=null;selected=-1;busy=false;closeModal();toast('已重新开始「'+d.name+'」')};$('#n').onclick=closeModal}
function loseModal(){
 const p=P(),pr=E.extraPrice(p),left=Object.entries(p.goals).filter(([,v])=>v>0).map(([id,v])=>nm(id)+' ×'+v).join('、');sound('lose');
 modal('<h2>步数用完了</h2><p>还差：'+left+'</p><p>差一点点！可以加 5 步继续，或者重新挑战这一关。</p><button class="big" id="more" '+(state.coins<pr?'disabled':'')+'>+5 步 · ◉'+pr+'</button><button class="big blue" id="again">重新开始本关</button><button class="big blue" id="tolv">返回选关</button>');
 $('#tolv').onclick=()=>{E.retry(state);undoSnap=null;busy=false;selected=-1;$('#modal').hidden=true;showLevels(Math.floor(P().n/E.PARTS))};
 $('#more').onclick=()=>{const r=E.buySteps(state);undoSnap=null;if(r.ok){busy=false;closeModal();toast('加了 5 步，加油！')}else toast(r.message)};
 $('#again').onclick=()=>{E.retry(state);undoSnap=null;busy=false;selected=-1;closeModal()}}
function introModal(){modal(houseSVG(0,0,-1,true,0)+'<h2>从一片空地开始</h2><p>一共 <b>'+E.HOUSES.length+' 栋房子、'+E.TOTAL+' 关</b>：'+E.HOUSES.join('、')+'，每栋都用不同的材料，可以按任意顺序盖。</p><p>每一关都要<b>合成出指定的建材</b>：打地基、砌墙、装门窗、盖屋顶……<br>建材一凑齐就自动完成，房子会长出新的一部分。</p><div class="chainrow">'+[0,1,2].map(l=>'<div>'+icon('stone'+l)+'<br>'+nm('stone'+l)+'</div>').join('<em>›</em>')+'</div><p>两个相同材料合成下一级。注意<b>步数有限</b>，每次合成、移动、出材料都算一步。</p><button class="big" id="go">开始建造</button>');$('#go').onclick=()=>{state.intro=true;save();$('#modal').hidden=true;showHome()}}
function settingsModal(){modal('<button class="close" id="x">×</button><h2>设置</h2><p>'+(saveOK?'进度自动保存在当前浏览器。':'浏览器不允许保存进度。')+'</p><button class="big blue" id="snd">音效：'+(state.muted?'关':'开')+'</button><button class="big blue" id="rt">重新开始本关</button><button class="big blue" id="hp">玩法说明</button><button class="big blue" id="rs">清空全部进度</button>');
 $('#x').onclick=closeModal;$('#snd').onclick=()=>{state.muted=!state.muted;save();$('#snd').textContent='音效：'+(state.muted?'关':'开')};
 $('#rt').onclick=()=>{E.retry(state);undoSnap=null;selected=-1;busy=false;closeModal()};$('#hp').onclick=introModal;
 $('#rs').onclick=()=>{modal('<h2>清空全部进度？</h2><p>会回到第 1 关，房子和金币都会清空。</p><button class="big" id="y">确认清空</button><button class="big blue" id="n">取消</button>');$('#y').onclick=()=>{state=E.fresh();state.intro=true;undoSnap=null;selected=-1;busy=false;save();$('#modal').hidden=true;showHome()};$('#n').onclick=closeModal}}

// ---------- input ----------
const board=$('#board');
board.addEventListener('pointerdown',e=>{if(e.button>0||!e.isPrimary||ptr||busy)return;const el=e.target.closest('[data-cell]');if(!el)return;const i=+el.dataset.cell,c=P().board[i];ptr={id:e.pointerId,i,x:e.clientX,y:e.clientY,drag:false,can:!!c&&!c.s&&!E.isGen(c.i)};try{board.setPointerCapture(e.pointerId)}catch(_){}});
board.addEventListener('pointermove',e=>{if(!ptr||e.pointerId!==ptr.id||!ptr.can)return;if(!ptr.drag&&Math.hypot(e.clientX-ptr.x,e.clientY-ptr.y)>8){ptr.drag=true;const source=$(cellSel(ptr.i));if(source)source.classList.add('drag-src');$('#ghost').innerHTML=icon(P().board[ptr.i].i);$('#ghost').style.display='block';hideHand()}
 if(ptr.drag){$('#ghost').style.left=e.clientX+'px';$('#ghost').style.top=e.clientY+'px'}});
board.addEventListener('pointerup',e=>{if(!ptr||e.pointerId!==ptr.id)return;const p=ptr;ptr=null;$('#ghost').style.display='none';
 if(p.drag){const hit=document.elementFromPoint(e.clientX,e.clientY),t=hit&&hit.closest('[data-cell]');if(t&&+t.dataset.cell!==p.i)performMove(p.i,+t.dataset.cell);else render()}else tapCell(p.i)});
function cancelPointer(e){if(!ptr||e.pointerId!==ptr.id)return;ptr=null;$('#ghost').style.display='none';render()}
board.addEventListener('pointercancel',cancelPointer);board.addEventListener('lostpointercapture',cancelPointer);
// iOS / in-app WebViews (百家号, 微信…): claim touches on the board so the host's swipe-back gesture
// and the long-press text menu never start. Dragging itself runs on pointer events, which still fire.
const claimTouch=e=>{if(e.cancelable)e.preventDefault()};
board.addEventListener('touchstart',claimTouch,{passive:false});
board.addEventListener('touchmove',claimTouch,{passive:false});
// once a drag has started, keep claiming the finger even after it leaves the board
document.addEventListener('touchmove',e=>{if(ptr&&e.cancelable)e.preventDefault()},{passive:false});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('selectstart',e=>e.preventDefault());
document.addEventListener('dragstart',e=>e.preventDefault());
board.addEventListener('click',e=>{if(e.detail===0){const c=e.target.closest('[data-cell]');if(c)tapCell(+c.dataset.cell)}});
$('#selbar').addEventListener('click',e=>{const action=e.target.closest('[data-act]'),a=action&&action.dataset.act,c=P().board[selected];if(!a||!c)return;
 if(a==='chain'&&c.i!=='star0')chainModal(c.i);else if(a==='remove'){const before=snap(),r=E.remove(P(),selected);keep(before,r);if(r.ok){selected=-1;sound('tap');render();after(r)}}});
$('#goals').addEventListener('click',e=>{const g=e.target.closest('[data-goal]');if(g)chainModal(g.dataset.goal)});
$('#housebox').onclick=()=>{const d=E.levelDef(P().n);modal('<button class="close" id="x">×</button>'+houseSVG(d.part,d.house,-1,true,themeOf(d))+'<h2>'+E.HOUSES[d.house]+' · '+d.part+'/'+E.PARTS+'</h2><p>半透明闪烁的部分，就是这一关要盖的「'+d.name+'」。</p>');$('#x').onclick=closeModal};
$('#settings').onclick=settingsModal;$('#tools').addEventListener('click',e=>{const t=e.target.closest('[data-tool]');if(t)useTool(t.dataset.tool)});$('#steps').addEventListener('click',e=>{if(e.target.closest('#undo'))undo();else if(e.target.closest('#replay'))replayModal()});
document.addEventListener('pointerdown',()=>{lastAct=Date.now();if(!tutorial())hideHand()},true);

setInterval(()=>{if(!$('#hand').className)updateHand()},1000);
// ---------- screens: house list -> level list -> game ----------
let screen='home';
function stars(n){const v=state.stars[n]||0;return '<span class="st">'+[0,1,2].map(k=>k<v?'<i>★</i>':'☆').join('')+'</span>'}
function houseStars(h){let t=0;for(let k=0;k<E.PARTS;k++)t+=state.stars[h*E.PARTS+k]||0;return t}
const CHESTART='<svg viewBox="0 0 64 64"><path d="M8 30Q8 14 32 14Q56 14 56 30Z" fill="url(#wd)" stroke="#3d2a1c" stroke-width="2.2"/><rect x="8" y="30" width="48" height="24" rx="2" fill="url(#wd)" stroke="#3d2a1c" stroke-width="2.2"/><path d="M8 30H56M16 15V54M48 15V54" stroke="url(#gd)" stroke-width="4"/><rect x="27" y="26" width="10" height="12" rx="2" fill="url(#gd)" stroke="#3d2a1c" stroke-width="1.5"/><path d="M32 4l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z" fill="#ffe27a" stroke="#c08a10"/></svg>';
function chestBar(){const t=E.totalStars(state),ready=E.chestsReady(state),into=t-state.chests*E.CHEST_EVERY,prog=ready?E.CHEST_EVERY:Math.max(0,t%E.CHEST_EVERY);
 return '<div class="chestbar">'+CHESTART+'<div class="info">'+(ready?'<b>有 '+ready+' 个星星宝箱可以开！</b>':'星星宝箱：再拿 <b>'+(E.CHEST_EVERY-prog)+' 颗星</b> 开一个')+'<div class="bar2"><i style="width:'+Math.round(prog/E.CHEST_EVERY*100)+'%"></i></div></div><button id="chest" '+(ready?'':'disabled')+'>开箱</button></div>'}
function openChest(){const r=E.openChest(state);if(!r.ok)return;save();sound('win');confetti();const pz=r.prize;
 const art=pz.kind==='coins'?'<div style="font-size:46px">🪙</div>':'<div style="width:80px;height:80px;margin:auto">'+(pz.kind==='star'?icon('star0'):TOOLART[pz.kind])+'</div>';
 modal(CHESTART.replace('<svg','<svg style="width:90px;height:90px"')+'<h2>星星宝箱</h2>'+art+'<p><b>'+(pz.kind==='coins'?'获得 ◉ '+pz.n+' 金币':'获得 '+E.TOOLS[pz.kind].name+' ×'+pz.n)+'</b></p><button class="big" id="go">收下</button>');$('#go').onclick=()=>{$('#modal').hidden=true;showHome()}}
const LOCKART='<svg class="house" viewBox="0 -10 240 190" aria-hidden="true"><defs><linearGradient id="soonsky" x2="0" y2="1"><stop stop-color="#b9c4cf"/><stop offset="1" stop-color="#e3e6e9"/></linearGradient></defs><rect x="0" y="-10" width="240" height="190" fill="url(#soonsky)"/><path d="M0 140Q60 124 120 136T240 132V180H0Z" fill="#c9ced3"/><path d="M60 150V92L120 46L180 92V150Z" fill="#9aa3ad"/><path d="M48 96L120 38L192 96" fill="none" stroke="#8a939d" stroke-width="8" stroke-linejoin="round"/><rect x="104" y="112" width="32" height="38" rx="4" fill="#8a939d"/><g transform="translate(120 92)"><circle r="30" fill="#ffffffcc"/><path d="M-9 -2V-10A9 9 0 0 1 9 -10V-2" fill="none" stroke="#5a6470" stroke-width="5"/><rect x="-14" y="-3" width="28" height="22" rx="4" fill="#5a6470"/><circle cy="7" r="3.5" fill="#fff"/></g></svg>';
function soonCard(h,no){return '<button class="hcard soon" data-soon="'+h.name+'" aria-disabled="true">'+LOCKART+'<span class="tag lock">敬请期待</span><h3>'+no+'. '+h.name+'</h3><div class="teaser">'+(h.teaser||'新的小屋正在建造中')+'</div><div class="prog"><span>即将开放</span><b>🔒</b></div></button>'}
function showHome(){screen='home';hideHand();$('#levels').hidden=true;const el=$('#home');el.hidden=false;
 const total=Object.values(state.stars).reduce((a,b)=>a+b,0);
 el.innerHTML='<div class="shead"><h1>合成小屋<small>选一栋房子开始盖 · 共 '+E.HOUSES.length+' 栋 '+E.TOTAL+' 关</small></h1><span class="chip">'+state.coins+'</span><button class="hset" aria-label="设置" style="font-size:20px;color:#fff">⚙</button></div><div class="htitle">每栋房子都用不同的材料，可以按任意顺序盖。已获得 <b>★ '+total+' / '+E.TOTAL*3+'</b></div>'+chestBar()+'<div class="hgrid">'+
  E.HOUSES.map((nm,h)=>{const u=state.unlocked[h],done=u>=E.PARTS,th=done?DONE_THEME[h]:THEMEMAP[h][Math.min(u,11)];
   return '<button class="hcard" data-house="'+h+'">'+houseSVG(u,h,-1,false,th,decorOf(h))+(done?'<span class="tag">已落成</span>':u>0?'<span class="tag go">盖到 '+u+'/12</span>':'')+'<h3>'+(h+1)+'. '+nm+'</h3><div class="mats">'+chainsOfHouse(h).map(c=>icon(c+'1')).join('')+'</div><div class="prog"><span>'+u+' / 12 关</span><b>★ '+houseStars(h)+'/36</b></div><div class="pbar"><i style="width:'+Math.round(u/12*100)+'%"></i></div></button>'}).join('')+E.SOON.map((h,k)=>soonCard(h,E.HOUSES.length+k+1)).join('')+'</div>';
 el.querySelectorAll('[data-soon]').forEach(b=>b.onclick=()=>{sound('err');toast('「'+b.dataset.soon+'」正在建造中，敬请期待')});
 el.querySelectorAll('[data-house]').forEach(b=>b.onclick=()=>{sound('tap');showLevels(+b.dataset.house)});el.querySelector('#chest').onclick=openChest;el.querySelector('.hset').onclick=settingsModal}
const DECORNAME=E.HOUSE_INFO.map(h=>Array.isArray(h.decor)?h.decor:['装饰一','装饰二','装饰三']);
function showLevels(h){screen='levels';hideHand();$('#home').hidden=true;const el=$('#levels');el.hidden=false;const u=state.unlocked[h];
 el.innerHTML='<div class="shead"><button id="lback" class="nb" aria-label="回到首页"><b>⌂</b>首页</button><h1>'+E.HOUSES[h]+'<small>'+Math.min(u,12)+' / 12 关 · ★ '+houseStars(h)+' / 36</small></h1></div><div class="lhero">'+houseSVG(u,h,-1,true,u>=12?DONE_THEME[h]:THEMEMAP[h][Math.min(u,11)],decorOf(h))+'</div><div class="decorrow">'+[12,24,36].map((t,k)=>'<div class="'+(houseStars(h)>=t?'on':'')+'">'+(houseStars(h)>=t?'✓ ':'★'+t+' ')+DECORNAME[h][k]+'</div>').join('')+'</div><div class="lgrid">'+
  E.BUILDS[h].map((lv,k)=>{const n=h*E.PARTS+k,lock=k>u,cur=k===u,main=Object.keys(lv.goals)[0];
   return '<button class="ltile'+(lock?' lock':cur?' cur':'')+'" data-level="'+n+'" '+(lock?'aria-disabled="true"':'')+'><div class="num">'+(k+1)+'</div>'+icon(main)+'<div class="nm">'+lv.name+'</div>'+(lock?'<span class="lk">🔒</span>':stars(n))+'</button>'}).join('')+'</div>';
 el.querySelector('#lback').onclick=()=>{sound('tap');showHome()};
 el.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{const n=+b.dataset.level;if(!E.canPlay(state,n)){sound('err');toast('先通过前一关才能解锁');return}sound('tap');play(n)})}
function play(n){toolMode=null;E.start(state,n);undoSnap=null;selected=-1;busy=false;screen='game';$('#home').hidden=true;$('#levels').hidden=true;save();render();
 const h=Math.floor(n/E.PARTS);if(h>0&&n%E.PARTS===0&&!state.seenHouse.includes(h))newHouseModal()}
$('#back').onclick=()=>{if(busy)return;sound('tap');showLevels(Math.floor(P().n/E.PARTS))};
$('#home-btn').onclick=()=>{if(busy)return;sound('tap');showHome()};
// ---------- start screen (real buttons on top of the cover art) ----------
function layoutStart(){const st=document.getElementById('start');if(!st||st.hidden)return;const box=st.querySelector('.st-box');
 const vv=window.visualViewport,vw=document.documentElement.clientWidth||window.innerWidth,vh=Math.round(vv?vv.height:window.innerHeight);
 // 9:16 box, as large as fits; the lower button (bottom at 89% of the box) stays at least 90px above the screen bottom
 let H=Math.min(vh,vw*16/9,(vh-90)/0.89);H=Math.max(H,320);const W=H*9/16;
 const top=Math.max(0,Math.min((vh-H)/2,vh-90-0.89*H));
 box.style.width=Math.round(W)+'px';box.style.height=Math.round(H)+'px';box.style.top=Math.round(top)+'px';box.style.fontSize=(W/360*16).toFixed(2)+'px'}
function continueLevel(){const n=state.level|0;return E.canPlay(state,n)?n:0}
function renderStart(){const n=continueLevel(),started=state.intro&&(Object.keys(state.stars).length>0||n>0||(state.play&&state.play.used>0));
 document.getElementById('st-play-sub').textContent=started?'继续：'+E.HOUSES[Math.floor(n/E.PARTS)]+' 第 '+(n%E.PARTS+1)+' 关':'';
 document.getElementById('st-play').classList.toggle('has-sub',started);
 document.getElementById('st-stats').textContent=E.HOUSES.length+' 种小屋 · '+E.TOTAL+' 关挑战'+(E.SOON.length?' · 更多小屋即将开放':'')}
function showStart(){const st=document.getElementById('start');st.hidden=false;screen='start';hideHand();renderStart();layoutStart()}
function hideStart(){document.getElementById('start').hidden=true}
document.getElementById('st-play').onclick=()=>{sound('tap');hideStart();const n=continueLevel();
 if(!state.intro){introModal();$('#go').onclick=()=>{state.intro=true;save();$('#modal').hidden=true;play(n)}}else play(n)};
document.getElementById('st-levels').onclick=()=>{sound('tap');hideStart();if(!state.intro)introModal();else showHome()};
addEventListener('resize',layoutStart);addEventListener('orientationchange',()=>setTimeout(layoutStart,250));if(window.visualViewport)visualViewport.addEventListener('resize',layoutStart);
render();showStart();
window.__game={get state(){return state},E};
