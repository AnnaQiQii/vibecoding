(function(root){
'use strict';
const COLS=7,ROWS=8,N=COLS*ROWS;
// ---- data comes from js/data.js (window.GAME_DATA) ----
const GD=root.GAME_DATA;if(!GD||!GD.materials||!GD.houses)throw new Error('缺少 js/data.js 或格式不对');
const CH=Object.assign({},GD.materials,{star:{items:['万能星']}});
const MAT=Object.keys(CH).filter(c=>c!=='star');
const HOUSE_INFO=GD.houses.filter(h=>h.status==='open'),SOON=GD.houses.filter(h=>h.status!=='open');
HOUSE_INFO.forEach(h=>{if(!Array.isArray(h.levels)||h.levels.length!==12)throw new Error('房子「'+h.name+'」需要正好 12 关')});
const BUILDS=HOUSE_INFO.map(h=>h.levels),LEVELS=BUILDS[0];
const PARTS=12,TOTAL=BUILDS.length*PARTS;
const HOUSES=HOUSE_INFO.map(h=>h.name);

const chainOf=id=>id.replace(/\d$/,''),lvl=id=>+id.slice(-1),maxL=c=>CH[c].items.length-1;
const isGen=id=>id[0]==='G';const genChain=id=>id.slice(1);
const nameOf=id=>id==='Gall'?'材料箱':isGen(id)?CH[genChain(id)].gen:CH[chainOf(id)].items[lvl(id)];
function valid(id){if(typeof id!=='string')return false;if(id==='Gall'||id==='star0')return true;const m=/^([a-z]+)(\d)$/.exec(id);return !!m&&!!CH[m[1]]&&m[1]!=='star'&&+m[2]<=maxL(m[1])}
const rc=i=>[Math.floor(i/COLS),i%COLS];
function neighbors(i){const[r,c]=rc(i),o=[];if(r>0)o.push(i-COLS);if(r<ROWS-1)o.push(i+COLS);if(c>0)o.push(i-1);if(c<COLS-1)o.push(i+1);return o}
function nearestEmpty(b,from){let best=-1,bd=1e9;const[r0,c0]=rc(from);for(let i=0;i<N;i++)if(!b[i]){const[r,c]=rc(i),d=(r-r0)**2+(c-c0)**2;if(d<bd){bd=d;best=i}}return best}
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const weight=goals=>Object.entries(goals).reduce((s,[id,n])=>s+n*2**lvl(id),0);

// level definition for any level index (endless: later houses reuse parts with higher goals)
// every house has its own materials and its own twelve build steps; the game ends after the last house
function levelDef(n){
 n=Math.max(0,Math.min(TOTAL-1,n));const p=n%PARTS,house=Math.floor(n/PARTS),base=BUILDS[house][p],goals=Object.assign({},base.goals);
 const gens=[...new Set(Object.keys(goals).map(chainOf))];
 const d={n,part:p,house,name:base.name,goals,gens,weight:weight(goals),density:Math.min(1,n/30)};
 const pr=parFor(d);d.par=pr.real;d.worst=pr.worst;
 d.steps=pr.real+(n===0?4:p===0?3:n<5?3:n<9?2:p<3?2:1);return d}
const parCache={};
// 'real' = steps the reference solver needs on the exact box sequence the player will see (seed 0)
function parFor(d){if(parCache[d.n])return parCache[d.n];let worst=0,real=0;const runs=[];
 for(let seed=0;seed<=5;seed++){const r=rng(seed*101+d.n),p=buildPlay(d);p.steps=9999;let g=0;
  while(p.status==='play'&&g++<2000){const h=hint(p);if(h.kind==='pair')move(p,h.a,h.b,r);else if(h.kind==='gen')produce(p,h.i,seed?r:undefined);else if(h.kind==='remove')remove(p,h.i);else break}
  runs.push(p.used-(p.steps-9999+p.used));worst=Math.max(worst,p.used)}
 runs.sort((a,b)=>a-b);real=runs[3];
 return parCache[d.n]={real,worst}}

function newPlay(n){const d=levelDef(n),p=buildPlay(d);p.steps=p.max=d.steps;p.par=d.par;return p}
function buildPlay(d){const n=d.n,r=rng(n*7919+13),b=Array(N).fill(null),chains=d.gens,D=d.density;
 b[(ROWS-1)*COLS+3]={i:'Gall',s:0};
 const crate=()=>{const c={i:item(),s:2},x=r();if(x<.13){const y=r();c.x=y<.4?'steps':y<.75?'star':'coins'}return c};
 const maxGoal=Math.max(...Object.keys(d.goals).map(lvl));
 const item=()=>{const c=chains[Math.floor(r()*chains.length)],x=r();let L=x<.7?0:1;L=Math.min(L,maxL(c),Math.max(0,maxGoal-1));while(L>0&&d.goals[c+L])L--;return c+L};
 for(let i=0;i<N;i++){if(b[i])continue;const row=Math.floor(i/COLS),x=r();
  if(row<=1)b[i]=x<.65?crate():{i:item(),s:1};
  else if(row<=4)b[i]=x<.28+.12*D?{i:item(),s:1}:x<.4+.2*D?crate():x<.82?{i:item(),s:0}:null;
  else b[i]=x<.5-.1*D?{i:item(),s:0}:x<.6+.05*D?{i:item(),s:1}:null}
 return {n,board:b,goals:Object.assign({},d.goals),total:Object.assign({},d.goals),steps:0,max:0,par:0,used:0,bought:0,status:'play',merges:0,bonusCoins:0,tools:{}}}

function fresh(){return {v:3,level:0,coins:100,stars:{},muted:false,intro:false,unlocked:[0,0,0,0,0,0],seenHouse:[],finaleShown:false,items:{hammer:0,pick:0,star:0},chests:0,play:newPlay(0)}}
function restore(raw){try{const o=typeof raw==='string'?JSON.parse(raw):raw;if(!o||o.v!==3)return fresh();const s=fresh();
 s.level=Math.max(0,Math.min(TOTAL-1,o.level|0));s.finished=!!o.finished;s.finaleShown=!!o.finaleShown;
 // each house unlocks on its own; older saves (one long run of levels) are converted
 if(Array.isArray(o.unlocked)&&o.unlocked.length)s.unlocked=BUILDS.map((_,k)=>Math.max(0,Math.min(PARTS,(o.unlocked[k]|0))));
 else{const h=Math.floor(s.level/PARTS);s.unlocked=BUILDS.map((_,k)=>k<h?PARTS:k===h?s.level%PARTS:0);if(o.finished)s.unlocked=BUILDS.map(()=>PARTS)}
 if(o.items&&typeof o.items==='object')for(const k of ['hammer','pick','star'])s.items[k]=Math.max(0,Math.min(99,o.items[k]|0));s.chests=Math.max(0,o.chests|0);
 s.seenHouse=Array.isArray(o.seenHouse)?o.seenHouse.filter(v=>v>=0&&v<BUILDS.length):[];s.coins=Math.max(0,o.coins|0);s.muted=!!o.muted;s.intro=!!o.intro;s.seenVine=o.seenVine?1:0;s.seenBonus=o.seenBonus?1:0;s.seenCrate=o.seenCrate?1:0;
 if(o.stars&&typeof o.stars==='object')for(const k in o.stars)s.stars[k]=Math.min(3,Math.max(0,o.stars[k]|0));
 const p=o.play;if(p&&p.n===s.level&&Array.isArray(p.board)&&p.board.length===N&&p.goals&&p.status==='play'){
  s.play={n:p.n,board:p.board.map(c=>c&&valid(c.i)&&[0,1,2].includes(c.s)?(c.s===2&&['steps','star','coins'].includes(c.x)?{i:c.i,s:2,x:c.x}:{i:c.i,s:c.s}):null),bonusCoins:Math.max(0,p.bonusCoins|0),tools:p.tools&&typeof p.tools==='object'?{hammer:!!p.tools.hammer,pick:!!p.tools.pick,star:!!p.tools.star}:{},forceChain:CH[p.forceChain]?p.forceChain:undefined,goals:{},total:{},steps:Math.max(0,p.steps|0),max:Math.max(1,p.max|0),par:p.par|0,pc:p.pc|0,used:p.used|0,bought:p.bought|0,status:'play',merges:p.merges|0};
  for(const k in p.goals)if(valid(k)&&!isGen(k)){s.play.goals[k]=Math.max(0,p.goals[k]|0);s.play.total[k]=Math.max(s.play.goals[k],(p.total&&p.total[k])|0)}
  if(!Object.keys(s.play.goals).length)s.play=newPlay(s.level)}else s.play=newPlay(s.level);
 return s}catch(e){return fresh()}}

function spend(p){p.steps--;p.used++;if(Object.values(p.goals).every(v=>v<=0))p.status='won';else if(p.steps<=0)p.status='lost'}
function collect(p,i){const c=p.board[i];if(c&&!c.s&&p.goals[c.i]>0){p.goals[c.i]--;p.board[i]=null;return c.i}return null}
// how much of each material chain the player still lacks (in level-1 units); the box favours big deficits
function needs(p){const out={};for(const[id,v]of Object.entries(p.goals)){if(v<=0)continue;const c=chainOf(id);out[c]=out[c]||{need:0,have:0,top:0};out[c].need+=v*2**lvl(id);out[c].top=Math.max(out[c].top,lvl(id))}
 for(const x of p.board){if(!x||isGen(x.i)||x.i==='star0')continue;const c=chainOf(x.i),o=out[c];if(!o||lvl(x.i)>=o.top)continue;o.have+=2**lvl(x.i)*(x.s===0?1:x.s===1?.6:.3)}return out}
function pickChain(p,rnd){const nd=needs(p),cs=Object.keys(nd);if(!cs.length)return chainOf(Object.keys(p.total)[0]);
 const w=cs.map(c=>Math.max(0,nd[c].need-nd[c].have)+.15*nd[c].need),tot=w.reduce((a,b)=>a+b,0);let x=rnd()*tot;for(let k=0;k<cs.length;k++){x-=w[k];if(x<=0)return cs[k]}return cs[cs.length-1]}
function produce(p,i,rnd){rnd=rnd||rng(p.n*9973+(p.pc||0)*131+7);
 if(p.status!=='play')return {ok:false};const c=p.board[i];if(!c||!isGen(c.i))return {ok:false};
 const j=nearestEmpty(p.board,i);if(j<0)return {ok:false,message:'棋盘满了：先合成腾出空位'};
 const forced=c.i==='Gall'&&p.forceChain;delete p.forceChain;const ch=forced?forced:c.i==='Gall'?pickChain(p,rnd):genChain(c.i),id=ch+(rnd()<.15?1:0);p.pc=(p.pc||0)+1;p.board[j]={i:id,s:0};const got=collect(p,j);spend(p);return {ok:true,index:j,id,collected:got}}
function move(p,a,b,rnd=Math.random){
 if(p.status!=='play')return {ok:false};
 if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>=N||b>=N||a===b)return {ok:false};
 const A=p.board[a],B=p.board[b];if(!A)return {ok:false};
 if(A.s)return {ok:false,message:A.s===2?'在木箱旁边合成一次就能打开它':'被蜘蛛网罩住了：把相同物品合到它身上'};
 if(!B){p.board[b]=A;p.board[a]=null;spend(p);return {ok:true,index:b}}
 if(B.s===2)return {ok:false,message:'木箱打不开：在它旁边合成一次'};
 const star=(A.i==='star0')!==(B.i==='star0'),T=A.i==='star0'?B:A;
 if(star&&isGen(T.i))return {ok:false,message:'万能星要放到材料上'};
 if(star&&B.i==='star0'&&B.s)return {ok:false};
 if(star||B.i===A.i&&!isGen(A.i)){const base=star?T.i:A.i,c=chainOf(base),L=lvl(base);if(L>=maxL(c))return {ok:false,message:'已经是最高级了'};
  const nid=c+(L+1),unsealed=B.s===1;p.board[b]={i:nid,s:0};p.board[a]=null;p.merges++;
  const revealed=[],bonus=[];for(const n of neighbors(b)){const x=p.board[n];if(!x||x.s!==2)continue;
   if(x.x==='steps'){p.steps+=3;p.board[n]=null;bonus.push({i:n,kind:'steps'})}else if(x.x==='coins'){p.bonusCoins+=20;p.board[n]=null;bonus.push({i:n,kind:'coins'})}
   else if(x.x==='star'){p.board[n]={i:'star0',s:0};bonus.push({i:n,kind:'star'})}else{x.s=1;revealed.push(n)}}
  const got=collect(p,b);spend(p);return {ok:true,merged:true,index:b,id:nid,unsealed,revealed,bonus,star,collected:got}}
 if(B.s===1)return {ok:false,message:'只有相同的「'+nameOf(B.i)+'」才能解开它'};
 p.board[a]=B;p.board[b]=A;spend(p);return {ok:true,index:b,swapped:true}}
function remove(p,i){if(p.status!=='play')return {ok:false};const c=p.board[i];if(!c||c.s||isGen(c.i))return {ok:false};p.board[i]=null;spend(p);return {ok:true}}
function starsFor(p){if(p.bought)return 1;const par=p.par||p.max;return p.used<=par?3:p.used<=par*1.08+2?2:1}
function win(s){const p=s.play;if(p.status!=='won')return null;const st=starsFor(p),reward=20+st*10+(p.bonusCoins||0),d=levelDef(p.n);s.coins+=reward;s.stars[p.n]=Math.max(s.stars[p.n]||0,st);
 const wasDone=s.unlocked[d.house]>=PARTS;s.unlocked[d.house]=Math.max(s.unlocked[d.house],d.part+1);
 const houseDone=d.part===PARTS-1,allDone=s.unlocked.every(v=>v>=PARTS),firstAll=allDone&&!s.finaleShown;if(firstAll)s.finaleShown=true;
 return {stars:st,reward,def:d,houseDone,firstHouse:houseDone&&!wasDone,allDone,firstAll}}
// ---------- tools (bought with coins, free of steps, once per level each) ----------
const TOOLS={hammer:{name:'锤子',price:120},pick:{name:'指定开箱',price:100},star:{name:'万能星',price:150}};
function crateBonus(p,n){const x=p.board[n];if(x.x==='steps'){p.steps+=3;p.board[n]=null;return 'steps'}if(x.x==='coins'){p.bonusCoins+=20;p.board[n]=null;return 'coins'}if(x.x==='star'){p.board[n]={i:'star0',s:0};return 'star'}return null}
function useHammer(p,i){if(p.status!=='play')return {ok:false};if(p.tools.hammer)return {ok:false,message:'这一关已经用过锤子了'};const c=p.board[i];
 if(!c||!c.s)return {ok:false,message:'锤子要敲在木箱或蜘蛛网上'};let bonus=null;if(c.s===2&&c.x)bonus=crateBonus(p,i);else{p.board[i]={i:c.i,s:0}}
 p.tools.hammer=true;const got=bonus?null:collect(p,i);if(Object.values(p.goals).every(v=>v<=0))p.status='won';return {ok:true,bonus,collected:got}}
function setPick(p,c){if(p.status!=='play')return {ok:false};if(p.tools.pick)return {ok:false,message:'这一关已经用过指定开箱了'};if(!CH[c])return {ok:false};p.forceChain=c;p.tools.pick=true;return {ok:true}}
function placeStar(p){if(p.status!=='play')return {ok:false};if(p.tools.star)return {ok:false,message:'这一关已经用过万能星了'};const box=p.board.findIndex(x=>x&&x.i==='Gall'),j=nearestEmpty(p.board,box<0?N-4:box);
 if(j<0)return {ok:false,message:'棋盘满了，先腾一个空位'};p.board[j]={i:'star0',s:0};p.tools.star=true;return {ok:true,index:j}}
const CHEST_EVERY=15;
const totalStars=s=>Object.values(s.stars).reduce((a,b)=>a+b,0);
const chestsReady=s=>Math.max(0,Math.floor(totalStars(s)/CHEST_EVERY)-s.chests);
function openChest(s,rnd=Math.random){if(chestsReady(s)<1)return {ok:false};s.chests++;const r=rnd();let prize;
 if(r<.4){const c=80+Math.floor(rnd()*5)*20;s.coins+=c;prize={kind:'coins',n:c}}else{const k=['hammer','pick','star'][Math.floor(rnd()*3)],n=rnd()<.25?2:1;s.items[k]=(s.items[k]||0)+n;prize={kind:k,n}}
 return {ok:true,prize}}
const threeStarLeft=p=>Math.max(0,p.max-(p.par||p.max));
const canPlay=(s,n)=>n>=0&&n<TOTAL&&n%PARTS<=s.unlocked[Math.floor(n/PARTS)];
function start(s,n){if(!canPlay(s,n))return false;if(!(s.play&&s.play.n===n&&s.play.status==='play')){s.play=newPlay(n)}s.level=n;return true}
function next(s){const n=s.play.n;if(n%PARTS<PARTS-1)start(s,n+1)}
function restart(s){s.level=0;s.play=newPlay(0)}
function retry(s){s.play=newPlay(s.play.n)}
const extraPrice=p=>40+30*p.bought;
function buySteps(s){const p=s.play;if(p.status!=='lost')return {ok:false};const pr=extraPrice(p);if(s.coins<pr)return {ok:false,message:'金币不够'};s.coins-=pr;p.steps+=5;p.max+=0;p.bought++;p.status='play';return {ok:true}}

// suggestion for the idle helper hand
function findPair(p,c,L){for(let l=L-1;l>=0;l--){const id=c+l,free=[],seal=[];p.board.forEach((x,i)=>{if(x&&x.i===id){if(!x.s)free.push(i);else if(x.s===1)seal.push(i)}});if(free.length&&seal.length)return [free[0],seal[0]];if(free.length>=2)return [free[0],free[1]]}return null}
function hint(p){
 const goals=Object.entries(p.goals).filter(([,v])=>v>0).sort((a,b)=>lvl(b[0])-lvl(a[0]));
 for(const[id]of goals){const pr=findPair(p,chainOf(id),lvl(id));if(pr)return {kind:'pair',a:pr[0],b:pr[1]}}
 const empty=p.board.includes(null);
 const g=p.board.findIndex(x=>x&&x.i==='Gall');if(g>=0&&empty&&goals.length)return {kind:'gen',i:g};
 for(const c of MAT){const pr=findPair(p,c,maxL(c)+1);if(pr)return {kind:'pair',a:pr[0],b:pr[1]}}
 const junk=p.board.findIndex(x=>x&&!x.s&&!isGen(x.i)&&x.i!=='star0');return junk>=0?{kind:'remove',i:junk}:{kind:'none'}}
function goalProgress(p){let t=0,d=0;for(const k in p.total){t+=p.total[k]*2**lvl(k);d+=(p.total[k]-p.goals[k])*2**lvl(k)}return t?d/t:1}

const api={HOUSE_INFO,SOON,DATA_VERSION:GD.dataVersion||1,TOOLS,useHammer,setPick,placeStar,CHEST_EVERY,totalStars,chestsReady,openChest,threeStarLeft,COLS,ROWS,N,CH,LEVELS,BUILDS,PARTS,TOTAL,HOUSES,restart,start,canPlay,chainOf,lvl,maxL,isGen,genChain,nameOf,valid,levelDef,newPlay,fresh,restore,produce,move,remove,win,next,retry,buySteps,extraPrice,starsFor,hint,goalProgress};
if(typeof module!=='undefined')module.exports=api;root.HouseEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);
