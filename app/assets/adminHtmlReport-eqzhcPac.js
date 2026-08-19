const h=t=>{const e=Number(t);return Number.isFinite(e)?e:0},F=(t,e)=>h(e)>0?Math.round(h(t)/h(e)*1e3)/10:0,B=F,a=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),N=(t,e=0)=>h(t).toLocaleString("en-US",{minimumFractionDigits:e,maximumFractionDigits:e}),u=Symbol("nt-safe-html"),v=(t,e={})=>({...e,[u]:!0,html:t}),w=t=>!!t&&typeof t=="object"&&t[u]===!0,D=t=>{const e=h(t);return v(`<span class="${e>=0?"up":"down"}">${e>=0?"+":""}${e.toFixed(2)}%</span>`,{num:!0})},p=(...t)=>t.map(o=>String(o??"").toLowerCase().replace(/[^a-z0-9]+/g,"-")).join("-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,56)||"x",E=(...t)=>`m-${p(...t)}`,y=(t=[],e=[])=>`<dl class="dl">${(t||[]).filter(Boolean).map(([o,n])=>{const i=w(n)?n.html:a(n??"");return`<dt>${a(o)}</dt><dd>${i}</dd>`}).join("")}</dl>`+(e||[]).filter(Boolean).map(o=>`<p class="mn">${a(o)}</p>`).join(""),k=(t,e,o)=>`<div class="modal"><label class="mbd" for="${a(t)}" aria-hidden="true"></label><div class="mcard" role="dialog" aria-label="${a(e)}"><label class="mx" for="${a(t)}" role="button" aria-label="Close">&#215;</label><p class="mt">${a(e)}</p><div class="mbody">${o}</div></div></div>`,$=(t,e)=>`<input class="mtog" type="checkbox" id="${a(t)}" aria-label="${a(`Open the detail for ${e}`)}">`,A=(t,e,o="",n="",i=null)=>{const s=`<span class="l">${a(t)}</span><span class="v">${a(e)}</span>`+(o?`<span class="s">${a(o)}</span>`:""),r=n?` ${a(n)}`:"";return!i||!i.id?`<div class="stat${r}">${s}</div>`:`<div class="mw">${$(i.id,t)}<label class="stat clik${r}" for="${a(i.id)}">${s}</label>`+k(i.id,i.title||t,y(i.pairs,i.notes))+"</div>"},C=t=>`<div class="grid">${t.join("")}</div>`,I=({cols:t=[],rows:e=[],empty:o="Nothing here yet."})=>{if(!e.length)return`<div class="note">${a(o)}</div>`;const n=t.map(s=>`<th${s.num?' class="num"':""}>${a(s.label)}</th>`).join(""),i=e.map(s=>{const r=Array.isArray(s)?s:s.cells||[],l=Array.isArray(s)?null:s.modal,z=r.map((g,b)=>{var f;const S=!!((f=t[b])!=null&&f.num),d=g&&typeof g=="object"?g:{v:g},x=[S||d.num?"num":"",d.cls||""].filter(Boolean).join(" ");let c=w(d)?d.html:a(d.v??"");return l&&l.id&&(c=`<label class="rl" for="${a(l.id)}">${c}</label>`,b===0&&(c=$(l.id,l.title||"this row")+c+k(l.id,l.title||"Row detail",y(l.pairs,l.notes)))),`<td${x?` class="${a(x)}"`:""}>${c}</td>`}).join("");return`<tr${l&&l.id?' class="clik"':""}>${z}</tr>`}).join("");return`<div class="tblwrap"><table><thead><tr>${n}</tr></thead><tbody>${i}</tbody></table></div>`},O=(t,e,o,n="")=>`<section class="panel" id="${p(t)}"><h2>${a(e)}</h2>${n?`<p class="secnote">${a(n)}</p>`:""}${o}</section>`,P=(t,e)=>v(`<span class="pill ${a(e)}">${a(t)}</span>`),j=`
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
`,T='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><defs><linearGradient id="ntg" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8B4EF9"/><stop offset=".5" stop-color="#1464FD"/><stop offset="1" stop-color="#20C4FB"/></linearGradient></defs><rect width="24" height="24" rx="6" fill="url(#ntg)"/><path d="M6 14.5 12 8l6 6.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',R=({docTitle:t,heading:e,subtitle:o="",stamp:n="",tabs:i=[],body:s=""})=>`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${a(t)}</title>
<style>${j}
${i.map(r=>`#sel-${p(r.id)}:checked ~ label[for="sel-${p(r.id)}"]{color:#fff;background:linear-gradient(135deg,#8B4EF9,#1464FD)}`).join(`
`)}
${i.map(r=>`body:has(#sel-${p(r.id)}:checked) #${p(r.id)}{display:block}`).join(`
`)}</style>
</head>
<body>
<header class="mast"><div class="wrap">
<div class="brandline">${T}<span class="wordmark">NoobTrader</span></div>
<h1>${a(e)}</h1>
${o?`<p class="sub">${a(o)}</p>`:""}
${n?`<p class="stamp">${a(n)}</p>`:""}
<p class="stamp hint">Tap any tile or any table row to open the detail behind the number.</p>
</div></header>
<nav class="tabs" aria-label="Sections (choose one)"><div class="wrap tabsrow">
${i.map((r,l)=>`<input class="tabsel" type="radio" name="nttab" id="sel-${p(r.id)}"${l===0?" checked":""}>`).join("")}
${i.map(r=>`<label for="sel-${p(r.id)}">${a(r.label)}</label>`).join("")}
</div></nav>
<main class="wrap">
${s}
<footer class="foot">Internal operator report. Players appear by the display handle they chose; no email address, user id or account name from sign-in is read.
NT and NOOB are virtual items with no real-world value.</footer>
</main>
</body>
</html>`,m=t=>String(t).padStart(2,"0"),H=(t=new Date)=>`${t.getFullYear()}-${m(t.getMonth()+1)}-${m(t.getDate())}-${m(t.getHours())}${m(t.getMinutes())}`;export{C as a,N as b,D as c,P as d,v as e,H as f,R as g,A as h,E as m,B as p,O as s,I as t};
