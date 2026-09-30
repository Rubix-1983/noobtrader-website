import{r as u,dL as L,dM as U,dN as V,dO as ne,dP as X,dQ as oe,j as i,ao as re,w as N,bg as F,C as W,dR as G}from"./index-Bkka_zRW.js";const z=e=>{const n=Number(e);return Number.isFinite(n)?n:0},ie=(e,n)=>z(n)>0?Math.round(z(e)/z(n)*1e3)/10:0,fe=ie,d=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),xe=(e,n=0)=>z(e).toLocaleString("en-US",{minimumFractionDigits:n,maximumFractionDigits:n}),K=Symbol("nt-safe-html"),Q=(e,n={})=>({...n,[K]:!0,html:e}),Y=e=>!!e&&typeof e=="object"&&e[K]===!0,be=e=>{const n=z(e);return Q(`<span class="${n>=0?"up":"down"}">${n>=0?"+":""}${n.toFixed(2)}%</span>`,{num:!0})},j=(...e)=>e.map(l=>String(l??"").toLowerCase().replace(/[^a-z0-9]+/g,"-")).join("-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,56)||"x",ye=(...e)=>`m-${j(...e)}`,J=(e=[],n=[])=>`<dl class="dl">${(e||[]).filter(Boolean).map(([l,c])=>{const s=Y(c)?c.html:d(c??"");return`<dt>${d(l)}</dt><dd>${s}</dd>`}).join("")}</dl>`+(n||[]).filter(Boolean).map(l=>`<p class="mn">${d(l)}</p>`).join(""),Z=(e,n,l)=>`<div class="modal"><label class="mbd" for="${d(e)}" aria-hidden="true"></label><div class="mcard" role="dialog" aria-label="${d(n)}"><label class="mx" for="${d(e)}" role="button" aria-label="Close">&#215;</label><p class="mt">${d(n)}</p><div class="mbody">${l}</div></div></div>`,q=(e,n)=>`<input class="mtog" type="checkbox" id="${d(e)}" aria-label="${d(`Open the detail for ${n}`)}">`,ve=(e,n,l="",c="",s=null)=>{const p=`<span class="l">${d(e)}</span><span class="v">${d(n)}</span>`+(l?`<span class="s">${d(l)}</span>`:""),m=c?` ${d(c)}`:"";return!s||!s.id?`<div class="stat${m}">${p}</div>`:`<div class="mw">${q(s.id,e)}<label class="stat clik${m}" for="${d(s.id)}">${p}</label>`+Z(s.id,s.title||e,J(s.pairs,s.notes))+"</div>"},we=e=>`<div class="grid">${e.join("")}</div>`,ke=({cols:e=[],rows:n=[],empty:l="Nothing here yet."})=>{if(!n.length)return`<div class="note">${d(l)}</div>`;const c=e.map(p=>`<th${p.num?' class="num"':""}>${d(p.label)}</th>`).join(""),s=n.map(p=>{const m=Array.isArray(p)?p:p.cells||[],r=Array.isArray(p)?null:p.modal,x=m.map((o,_)=>{var C;const v=!!((C=e[_])!=null&&C.num),S=o&&typeof o=="object"?o:{v:o},$=[v||S.num?"num":"",S.cls||""].filter(Boolean).join(" ");let w=Y(S)?S.html:d(S.v??"");return r&&r.id&&(w=`<label class="rl" for="${d(r.id)}">${w}</label>`,_===0&&(w=q(r.id,r.title||"this row")+w+Z(r.id,r.title||"Row detail",J(r.pairs,r.notes)))),`<td${$?` class="${d($)}"`:""}>${w}</td>`}).join("");return`<tr${r&&r.id?' class="clik"':""}>${x}</tr>`}).join("");return`<div class="tblwrap"><table><thead><tr>${c}</tr></thead><tbody>${s}</tbody></table></div>`},_e=(e,n,l,c="")=>`<section class="panel" id="${j(e)}"><h2>${d(n)}</h2>${c?`<p class="secnote">${d(c)}</p>`:""}${l}</section>`,Se=(e,n)=>Q(`<span class="pill ${d(n)}">${d(e)}</span>`),se=`
:root{--bg:#0a0e1a;--card:#111a2c;--card2:#0d1424;--line:rgba(255,255,255,.09);--ink:#eaf0fa;--dim:#94a0b8;--faint:#5f6b84;--cyan:#20C4FB;--blue:#1464FD;--violet:#8B4EF9;--up:#00C853;--down:#FF4D5E}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.55 -apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%}
.wrap{max-width:980px;margin:0 auto;padding:0 16px}
.mast{padding:28px 0 18px;background:radial-gradient(1100px 300px at 18% -80px,rgba(20,100,253,.28),transparent 70%),radial-gradient(900px 260px at 85% -60px,rgba(139,78,249,.20),transparent 70%)}
.brandline{display:flex;align-items:center;gap:9px}
.wordmark{font-weight:800;font-size:15px;letter-spacing:.2px}
h1{margin:14px 0 4px;font-size:26px;letter-spacing:-.5px}
.sub{margin:0;color:var(--dim);font-size:13px}
.stamp{margin:6px 0 0;color:var(--faint);font-size:12px}
.hint{color:var(--cyan)}
.tabs{position:sticky;top:0;z-index:20;background:rgba(10,14,26,.94);border-bottom:1px solid var(--line);backdrop-filter:blur(10px)}
.tabsrow{display:flex;gap:2px;overflow-x:auto;padding:8px 16px}
.tabs a{flex-shrink:0;color:var(--dim);text-decoration:none;font-weight:700;font-size:12px;padding:8px 12px;border-radius:999px}
.tabs a:hover,.tabs a:focus{color:#fff;background:rgba(32,196,251,.14);outline:none}
.tabs a.on{color:#fff;background:linear-gradient(135deg,#8B4EF9,#1464FD)}
section{margin-top:40px;scroll-margin-top:58px}
/* REAL TABS, NO SCRIPT (founder 2026-08-16). The report is forwarded by
   email and must stay inert, so panel switching is pure CSS: one radio per
   section, panels revealed by :checked. Print shows every panel.

   The HIDE rule is gated on :has() too, and that is the whole point. The
   reveal rules below can only be written with :has() (the panel is not a
   sibling of the radio), and an engine that does not know :has() drops them
   at parse time. If the hide rule were unconditional, that engine would keep
   every panel at display:none and the reader would get a masthead, a tab
   strip, a footer and NO REPORT — silently. Gating both halves on the same
   feature makes them fail together: no :has(), no tabs, and the document
   degrades to the long scroll it used to be. Chrome/Android WebView < 105,
   Firefox < 121 and Safari < 15.4 are exactly the old school WebViews and
   mail previews this file has to survive.

   Not @supports: engines older than @supports selector() itself treat the
   condition as unknown and skip the block, i.e. the oldest devices — the very
   ones at risk — would still get a blank page. */
.tabsel{position:absolute;opacity:0;pointer-events:none;width:0;height:0}
.tabs label{flex-shrink:0;color:var(--dim);font-weight:700;font-size:12px;padding:8px 12px;border-radius:999px;cursor:pointer;user-select:none}
.tabs label:hover{color:#fff;background:rgba(32,196,251,.14)}
body:has(.tabsel:checked) .panel{display:none}
@media print{.panel{display:block !important}}
h2{margin:0 0 4px;font-size:12px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;color:var(--cyan)}
h3{margin:20px 0 0;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--dim)}
.secnote{margin:0 0 10px;color:var(--faint);font-size:12px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:12px}
.stat{position:relative;display:block;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:12px 14px;min-width:0}
.stat .l,.stat .v,.stat .s{display:block}
.stat .l{font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--dim)}
.stat .v{font-size:22px;font-weight:800;letter-spacing:-.4px;margin-top:3px;font-variant-numeric:tabular-nums}
.stat .s{font-size:11px;color:var(--faint);margin-top:2px}
.stat.up .v{color:var(--up)}.stat.down .v{color:var(--down)}.stat.brand .v{color:var(--cyan)}.stat.violet .v{color:var(--violet)}
.tblwrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px;margin-top:12px}
table{width:100%;border-collapse:collapse;font-size:12.5px;min-width:460px}
th{text-align:left;padding:9px 12px;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--dim);border-bottom:1px solid var(--line);white-space:nowrap;background:var(--card2)}
td{position:relative;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.05);white-space:nowrap}
tr:last-child td{border-bottom:none}
th.num,td.num{text-align:right;font-variant-numeric:tabular-nums}
td.tot{font-weight:800;border-top:2px solid rgba(32,196,251,.5)}
.up{color:var(--up)}.down{color:var(--down)}
.pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:700}
.pill.ok{background:rgba(0,200,83,.14);color:var(--up)}
.pill.mut{background:rgba(255,255,255,.07);color:var(--dim)}
.pill.bad{background:rgba(255,77,94,.14);color:var(--down)}
.note{color:var(--faint);font-size:12px;margin-top:10px}
svg{display:block;max-width:100%;height:auto}
.foot{margin-top:48px;padding-top:14px;border-top:1px solid var(--line);color:var(--faint);font-size:11px;line-height:1.6}
/* DETAIL POPUPS, NO SCRIPT. Reveal is the sibling combinator, never :has():
   the checkbox is always the element immediately before its overlay. */
.mw{position:relative;display:flex;flex-direction:column;min-width:0}
.mw>.stat{flex:1}
.mtog{position:absolute;top:0;left:0;width:1px;height:1px;margin:0;padding:0;border:0;opacity:0;pointer-events:none}
/* user-select off on the triggers: on a phone a tap that lingers a few
   milliseconds selects the cell's text instead of opening the popup. The tab
   labels already carry the same guard.
   But the guard is a TOUCH fix, and applied everywhere it also stopped an
   admin drag-selecting a portfolio value out of a table to paste into a
   message — every clickable cell and every tile went uncopyable, which they
   were not before the popups landed. So the selection half is scoped to
   pointerless devices; the callout/tap-delay half stays everywhere because it
   costs nothing on a mouse. The X and the backdrop carry no data worth
   copying, so they stay unselectable throughout. */
.stat.clik,.rl,.mx,.mbd{-webkit-touch-callout:none;touch-action:manipulation}
.mx,.mbd{-webkit-user-select:none;user-select:none}
@media (hover:none){.stat.clik,.rl{-webkit-user-select:none;user-select:none}}
.stat.clik{cursor:pointer;padding-right:32px}
.stat.clik::after{content:"i";position:absolute;top:10px;right:10px;width:16px;height:16px;border-radius:999px;border:1px solid rgba(255,255,255,.2);color:var(--faint);font-size:9px;font-weight:800;line-height:14px;text-align:center}
/* min-height so an EMPTY cell (a solo entrant's class, a blank reason) is
   still part of the row's click target rather than a dead patch in the middle
   of it. Shorter than a line box, so no row grows. */
.rl{display:block;min-height:1.25em;cursor:pointer}
tr.clik td:first-child{border-left:2px solid rgba(32,196,251,.32)}
tr.clik:hover td{background:rgba(32,196,251,.06)}
.mtog:focus-visible~.stat,.mtog:focus-visible~.rl{outline:2px solid var(--cyan);outline-offset:2px}
.modal{display:none;position:fixed;inset:0;z-index:60;align-items:center;justify-content:center;padding:16px}
.mtog:checked~.modal{display:flex}
.mbd{position:absolute;top:0;right:0;bottom:0;left:0;background:rgba(4,7,14,.74);cursor:pointer}
.mcard{position:relative;z-index:1;display:flex;flex-direction:column;width:100%;max-width:560px;max-height:80vh;background:var(--card);border:1px solid rgba(32,196,251,.35);border-radius:16px;box-shadow:0 26px 70px rgba(0,0,0,.6);padding:16px 18px;text-align:left;white-space:normal}
.mx{position:absolute;top:10px;right:12px;width:30px;height:30px;border-radius:999px;background:rgba(255,255,255,.07);color:var(--dim);font-size:17px;font-weight:800;line-height:29px;text-align:center;cursor:pointer}
.mx:hover,.mx:focus{color:#fff;background:rgba(32,196,251,.22);outline:none}
.mt{margin:0 42px 0 0;font-size:15px;font-weight:800;letter-spacing:-.2px}
.mbody{min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch;margin-top:8px;padding-right:4px}
.dl{margin:0}
.dl dt{margin-top:10px;font-size:10px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--dim)}
.dl dd{margin:2px 0 0;font-size:13px;color:var(--ink);font-variant-numeric:tabular-nums;overflow-wrap:anywhere}
.mn{margin:12px 0 0;padding-top:10px;border-top:1px solid var(--line);color:var(--dim);font-size:12px;line-height:1.6}
.mn+.mn{margin-top:8px;padding-top:0;border-top:none}
@media print{.tabs{position:static}}
/* PRINT: overlays never open on paper. Every popup restates something the
   printed page already shows (a row's own cells, or the meaning of a labelled
   number sitting beside it), and the row overlays live INSIDE a <td> — making
   them static would inflate one cell per row and tear the tables apart. So
   print stays exactly the document it was: every panel, every table, whole. */
@media print{.modal,.mtog:checked~.modal{display:none !important}.stat.clik{padding-right:14px}.stat.clik::after{display:none}tr.clik td:first-child{border-left:none}}
`,le='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><defs><linearGradient id="ntg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8B4EF9"/><stop offset=".5" stop-color="#1464FD"/><stop offset="1" stop-color="#20C4FB"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ntg)"/><path d="M6 14.5 12 8l6 6.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',$e=({docTitle:e,heading:n,subtitle:l="",stamp:c="",tabs:s=[],body:p=""})=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${d(e)}</title>
<style>${se}
${s.map(m=>`#sel-${j(m.id)}:checked ~ label[for="sel-${j(m.id)}"]{color:#fff;background:linear-gradient(135deg,#8B4EF9,#1464FD)}`).join(`
`)}
${s.map(m=>`body:has(#sel-${j(m.id)}:checked) #${j(m.id)}{display:block}`).join(`
`)}</style>
</head>
<body>
<header class="mast"><div class="wrap">
<div class="brandline">${le}<span class="wordmark">NoobTrader</span></div>
<h1>${d(n)}</h1>
${l?`<p class="sub">${d(l)}</p>`:""}
${c?`<p class="stamp">${d(c)}</p>`:""}
<p class="stamp hint">Tap any tile or any table row to open the detail behind the number.</p>
</div></header>
<nav class="tabs" aria-label="Sections (choose one)"><div class="wrap tabsrow">
${s.map((m,r)=>`<input class="tabsel" type="radio" name="nttab" id="sel-${j(m.id)}"${r===0?" checked":""}>`).join("")}
${s.map(m=>`<label for="sel-${j(m.id)}">${d(m.label)}</label>`).join("")}
</div></nav>
<main class="wrap">
${p}
<footer class="foot">Internal operator report. Players appear by the display handle they chose; no email address, user id or account name from sign-in is read.
NT and NOOB are virtual items with no real-world value.</footer>
</main>
</body>
</html>`,T=e=>String(e).padStart(2,"0"),je=(e=new Date)=>`${e.getFullYear()}-${T(e.getMonth()+1)}-${T(e.getDate())}-${T(e.getHours())}${T(e.getMinutes())}`,de=new Set(X),B=()=>({items:[],loading:!1,loadingMore:!1,loaded:!1,errorCode:null,moreErrorCode:null,hasMore:!1,next:null,counts:null}),ce=(e,n)=>{const l=new Set(e.map(c=>c.id));return[...e,...n.filter(c=>!l.has(c.id))]};function pe({enabled:e=!0,pageSize:n=U}={}){const[l,c]=u.useState({status:"all",search:""}),[s,p]=u.useState(()=>({...B(),loading:e})),m=u.useRef(s);m.current=s;const r=u.useRef(l);r.current=l;const x=u.useRef(0),o=u.useRef(!1),_=u.useRef(!0);u.useEffect(()=>(_.current=!0,()=>{_.current=!1}),[]);const v=u.useCallback(async(g,{keep:a})=>{const f=++x.current;o.current=!1;const b=a?m.current.items.length:0,y=Math.min(ne,Math.max(n,b));p(E=>a?{...E,loading:!0,loadingMore:!1,errorCode:null,moreErrorCode:null}:{...B(),loading:!0});const k=await L({status:g.status,search:g.search,limit:y});return!_.current||f!==x.current||p(E=>k.success?{...B(),loaded:!0,items:k.data.items,hasMore:k.data.hasMore,next:k.data.next,counts:k.data.counts}:{...E,loading:!1,errorCode:k.code||"network"}),k},[n]);u.useEffect(()=>{e&&v(l,{keep:!1})},[e,l,v]);const S=u.useCallback(async()=>e?v(r.current,{keep:!0}):null,[e,v]),$=u.useCallback(g=>{const a=de.has(g)?g:"all";c(f=>f.status===a?f:{...f,status:a})},[]),w=u.useCallback(g=>{const a=String(g??"").trim().slice(0,V);c(f=>f.search===a?f:{...f,search:a})},[]),C=u.useCallback(async()=>{const g=m.current;if(o.current||g.loading||!g.hasMore||!g.next)return null;o.current=!0;const a=x.current,f=r.current;p(y=>({...y,loadingMore:!0,moreErrorCode:null}));const b=await L({status:f.status,search:f.search,cursor:g.next,limit:n});return!_.current||a!==x.current||(o.current=!1,p(y=>b.success?{...y,loadingMore:!1,items:ce(y.items,b.data.items),hasMore:b.data.hasMore&&b.data.items.length>0,next:b.data.next}:{...y,loadingMore:!1,moreErrorCode:b.code||"network"})),b},[n]);return{items:s.items,loading:e&&s.loading,loadingMore:s.loadingMore,loaded:s.loaded,errorCode:s.errorCode,moreErrorCode:s.moreErrorCode,hasMore:s.hasMore,counts:s.counts,status:l.status,search:l.search,setStatus:$,setSearch:w,reload:S,loadMore:C}}const me={draft:"Draft",upcoming:"Upcoming",live:"Live",finalising:"Finalising",ended:"Ended",cancelled:"Cancelled"},ue={live:"live",upcoming:"upcoming",ended:"ended"},he=()=>{var e;return typeof document<"u"&&((e=document.documentElement)==null?void 0:e.dir)==="rtl"},Ce=({t:e,i18n:n,lang:l,onOpen:c,refreshToken:s=0,previewCount:p=0,onSeeAll:m})=>{const r=(t,h)=>(n==null?void 0:n[t])||h,x=Number(p)>0,o=pe({pageSize:x?Number(p):U}),_=u.useId(),[v,S]=u.useState(""),$=u.useRef(null),{setSearch:w,reload:C}=o,g=u.useRef(s);u.useEffect(()=>{g.current!==s&&(g.current=s,C())},[s,C]),u.useEffect(()=>(clearTimeout($.current),$.current=setTimeout(()=>w(v),oe),()=>clearTimeout($.current)),[v,w]);const a={ink:e.ink||e.text,dim:e.inkDim||e.textDim||e.textSec,line:e.line||e.border,alt:e.surfaceAlt||e.surface||e.card,accent:e.accent||e.brand,accentDim:e.accentDim||e.brandDim||"transparent",accentInk:e.accentInkDim||e.accent||e.brand},f=t=>r(`ccup_admin_all_phase_${t}`,me[t]||t),b=t=>({live:[e.upDim,e.upInkDim],finalising:[e.warnDim,e.warnInkDim],upcoming:[a.accentDim,a.accentInk],draft:[a.alt,a.dim],ended:[a.alt,a.dim],cancelled:[e.downDim,e.downInkDim]})[t]||[a.alt,a.dim],y={minHeight:44,padding:"0 14px",borderRadius:10,cursor:"pointer",fontFamily:"inherit",border:`1px solid ${a.line}`,background:"transparent",color:a.ink,fontSize:13,fontWeight:700},k=t=>i.jsx("button",{type:"button",onClick:t,style:{...y,marginTop:8},children:r("ccup_retry","Try again")}),E=o.status!=="all"||o.search!=="",D=o.counts?o.counts[o.status]:null,ee=o.loading&&o.items.length===0,M=x?o.items.slice(0,Number(p)):o.items,O={color:a.dim,flexShrink:0,...he()?{transform:"scaleX(-1)"}:{}},R=(t,h)=>i.jsx("span",{style:{fontSize:11,fontWeight:700,borderRadius:999,padding:"2px 8px",background:h[0]||a.alt,color:h[1]||a.dim},children:t},t),A=(t,h,I=!1)=>i.jsxs("span",{style:{whiteSpace:"nowrap"},children:[i.jsxs("span",{style:{color:a.dim},children:[t," "]}),i.jsx("span",{style:{fontWeight:700,fontVariantNumeric:"tabular-nums",direction:"ltr",unicodeBidi:"isolate",color:I?e.downInkDim:a.ink},children:h})]}),P=t=>{const[h,I]=b(t.phase),te=t.organiser_name?N(r("ccup_admin_all_by","by {name}"),{name:t.organiser_name}):r("ccup_admin_all_organiser_gone","organiser's account deleted"),H=[t.on_hold&&R(r("ccup_admin_flag_hold","On hold"),[e.warnDim,e.warnInkDim]),t.hidden&&R(r("ccup_admin_flag_hidden","Hidden"),[e.downDim,e.downInkDim]),t.archived&&R(r("ccup_admin_all_archived","Archived"),[a.alt,a.dim])].filter(Boolean),ae=t.max_players?`${t.players??0} / ${t.max_players}`:String(t.players??0);return i.jsxs(i.Fragment,{children:[i.jsxs("span",{style:{display:"flex",alignItems:"flex-start",gap:8},children:[i.jsx("span",{style:{flex:1,minWidth:0,fontSize:14,fontWeight:700,color:a.ink,overflowWrap:"anywhere"},children:t.name}),i.jsx("span",{"data-phase":t.phase,style:{flexShrink:0,fontSize:10.5,fontWeight:800,letterSpacing:.4,textTransform:"uppercase",borderRadius:999,padding:"3px 9px",background:h||a.alt,color:I||a.dim},children:f(t.phase)})]}),i.jsxs("span",{style:{display:"block",fontSize:12,color:a.dim,marginTop:3,lineHeight:1.45,overflowWrap:"anywhere"},children:[t.kind==="official"?r("ccup_admin_all_kind_official","Official"):r("ccup_admin_all_kind_community","Made by a player")," · ",te]}),i.jsx("span",{style:{display:"block",fontSize:12,color:a.dim,marginTop:2,lineHeight:1.45},children:N(r("ccup_admin_all_dates","{start} to {end}"),{start:G(t.starts_at,l),end:G(t.ends_at,l)})}),i.jsxs("span",{style:{display:"flex",flexWrap:"wrap",gap:"4px 14px",fontSize:12,marginTop:6},children:[A(r("ccup_admin_all_players","Players"),ae),A(r("ccup_admin_all_trades","Trades"),String(t.trades??0)),A(r("ccup_admin_all_reports","Reports"),String(t.reports??0),Number(t.reports)>0)]}),H.length>0&&i.jsx("span",{style:{display:"flex",flexWrap:"wrap",gap:6,marginTop:6},children:H})]})};return i.jsxs("section",{"aria-labelledby":_,style:{border:`1px solid ${a.line}`,borderRadius:14,padding:14,marginBottom:18},children:[i.jsx("div",{id:_,style:{fontSize:13,fontWeight:700,color:a.ink,marginBottom:4},children:r("ccup_admin_all_title","All competitions")}),i.jsx("div",{style:{fontSize:12,color:a.dim,marginBottom:10,lineHeight:1.45},children:r("ccup_admin_all_sub","Every competition, made by a player or by our team, newest first. Tap one to open it.")}),!x&&i.jsxs(i.Fragment,{children:[i.jsx("div",{role:"group","aria-label":r("ccup_admin_all_filter_label","Show"),style:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8},children:X.map(t=>{const h=o.status===t,I=o.counts?o.counts[t]:null;return i.jsxs("button",{type:"button","aria-pressed":h,onClick:()=>o.setStatus(t),style:{...y,minHeight:44,borderRadius:999,padding:"0 14px",border:`1px solid ${h?a.accent:a.line}`,background:h?a.accentDim:"transparent",color:h?a.accentInk:a.ink,display:"inline-flex",alignItems:"center",gap:6},children:[t==="all"?r("ccup_admin_all_filter_all","All"):f(ue[t]),typeof I=="number"&&i.jsx("span",{style:{fontVariantNumeric:"tabular-nums",color:h?a.accentInk:a.dim,fontWeight:600},children:I})]},t)})}),i.jsxs("form",{role:"search",onSubmit:t=>{t.preventDefault(),clearTimeout($.current),w(v)},style:{position:"relative",marginBottom:10},children:[i.jsx(re,{size:16,"aria-hidden":"true",style:{position:"absolute",insetInlineStart:12,top:14,color:a.dim,pointerEvents:"none"}}),i.jsx("input",{type:"search",value:v,onChange:t=>S(t.target.value),maxLength:V,placeholder:r("ccup_admin_all_search","Search by name"),"aria-label":r("ccup_admin_all_search","Search by name"),style:{width:"100%",boxSizing:"border-box",minHeight:44,borderRadius:10,fontSize:14,padding:"10px 12px",paddingInlineStart:36,fontFamily:"inherit",border:`1px solid ${a.line}`,background:a.alt,color:a.ink}})]})]}),o.loaded&&D!==null&&D!==void 0&&M.length>0&&i.jsx("div",{style:{fontSize:11.5,color:a.dim,marginBottom:6},children:N(r("ccup_admin_all_showing","Showing {shown} of {total}"),{shown:M.length,total:D})}),o.errorCode&&o.items.length>0&&i.jsxs("div",{role:"alert",style:{marginBottom:10,padding:10,borderRadius:10,fontSize:13,background:e.downDim,color:e.downInkDim},children:[F(n,o.errorCode),i.jsx("div",{children:k(o.reload)})]}),ee?i.jsxs("div",{children:[i.jsx("div",{role:"status",style:{fontSize:13,color:a.dim,marginBottom:8},children:r("ccup_admin_all_loading","Loading competitions…")}),[0,1,2].map(t=>i.jsx("div",{"aria-hidden":"true","data-skeleton":"",style:{height:86,borderRadius:10,background:a.alt,marginBottom:8,opacity:.8-t*.2}},t))]}):o.errorCode&&o.items.length===0?i.jsxs("div",{role:"alert",style:{fontSize:13,color:e.downInkDim},children:[F(n,o.errorCode),i.jsx("div",{children:k(o.reload)})]}):o.items.length===0?i.jsx("div",{style:{fontSize:13,color:a.dim,padding:"6px 0"},children:E?r("ccup_admin_all_no_match","No competitions match. Try another filter or name."):r("ccup_admin_all_empty","No competitions yet.")}):i.jsx("ul",{style:{listStyle:"none",margin:0,padding:0},children:M.map(t=>{const h=typeof c=="function"&&t.phase!=="draft";return i.jsx("li",{style:{borderTop:`1px solid ${a.line}`},children:h?i.jsxs("button",{type:"button",onClick:()=>c(t.id),style:{display:"flex",alignItems:"center",gap:8,width:"100%",minHeight:44,padding:"10px 0",border:"none",background:"transparent",cursor:"pointer",textAlign:"start",fontFamily:"inherit",color:"inherit"},children:[i.jsx("span",{style:{flex:1,minWidth:0,display:"block"},children:P(t)}),i.jsx(W,{size:18,"aria-hidden":"true",style:O})]}):i.jsx("div",{style:{padding:"10px 0"},children:P(t)})},t.id)})}),o.moreErrorCode&&i.jsx("div",{role:"alert",style:{marginTop:8,fontSize:13,color:e.downInkDim},children:F(n,o.moreErrorCode)}),x&&o.hasMore&&M.length>0&&typeof m=="function"&&i.jsxs("button",{type:"button",onClick:m,style:{...y,width:"100%",marginTop:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6},children:[r("see_all","See all"),i.jsx(W,{size:16,"aria-hidden":"true",style:O})]}),!x&&o.hasMore&&o.items.length>0&&i.jsx("button",{type:"button",onClick:o.loadMore,disabled:o.loadingMore,"aria-busy":o.loadingMore||void 0,style:{...y,width:"100%",marginTop:10,opacity:o.loadingMore?.6:1,cursor:o.loadingMore?"default":"pointer"},children:o.loadingMore?r("ccup_admin_all_loading","Loading competitions…"):r("ccup_admin_all_more","Show more")})]})};export{Ce as A,xe as a,we as b,be as c,Se as d,d as e,je as f,Q as g,$e as h,ve as i,ye as m,fe as p,_e as s,ke as t};
