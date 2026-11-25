(function(){
"use strict";
var C=window.CORE, CFG=window.CONFIG||{};
var META=[
 {code:"en",name:"English",guide:"Hank",tts:"en-US"},
 {code:"es",name:"Español",guide:"Doña Marta",tts:"es-US"},
 {code:"zh",name:"中文",guide:"王师傅",tts:"zh-CN"},
 {code:"ru",name:"Русский",guide:"Сергей Петрович",tts:"ru-RU"},
 {code:"ko",name:"한국어",guide:"김 강사님",tts:"ko-KR"},
 {code:"bn",name:"বাংলা",guide:"রফিক ভাই",tts:"bn-BD"}
];
var store={get:function(k,d){try{var v=localStorage.getItem("alv_"+k);return v===null?d:JSON.parse(v);}catch(e){return d;}},
           set:function(k,v){try{localStorage.setItem("alv_"+k,JSON.stringify(v));}catch(e){}}};
var LANG=null, P=null;
// Iconos de línea, un solo estilo (trazo 2, currentColor). Sin emojis.
var ICO={
  speaker:["M4 9v6h4l5 4V5L8 9H4z","M16 8a5 5 0 0 1 0 8"],
  flag:["M5 21V4","M5 5h10l-2 4 2 4H5"],
  check:["M4 12l5 5L20 6"],
  cross:["M5 5l14 14","M19 5L5 19"],
  book:["M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z","M4 17h15"],
  star:["M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"],
  starOn:["M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"],
  pin:["M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z","M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"],
  phone:["M6 3h3l2 5-2 1a12 12 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2A17 17 0 0 1 4 5a2 2 0 0 1 2-2z"],
  compass:["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z","M15.5 8.5l-2 5-5 2 2-5z"],
  globe:["M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z","M3 12h18","M12 3c3 3.5 3 14.5 0 18","M12 3c-3 3.5-3 14.5 0 18"],
  repeat:["M4 10a8 8 0 0 1 13-6l3 3","M20 14a8 8 0 0 1-13 6l-3-3","M20 4v4h-4","M4 20v-4h4"],
  back:["M15 18l-6-6 6-6"],
  more:["M5 12h.01","M12 12h.01","M19 12h.01"]
};
function ic(n,cls){
  var a=ICO[n]||[];
  var fill=(n==="starOn")?' fill="currentColor"':"";
  var h='<svg class="ico '+(cls||"")+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  h+=">";
  a.forEach(function(d){h+='<path d="'+d+'"'+((n==="starOn")?' fill="currentColor"':"")+"/>";});
  return h+"</svg>";
}
// ---------- Estados ----------
var STATES=(window.STATES||[{code:"ny",name:"New York",agency:"DMV",core:"core.js",lang:"lang/",ui:"ui/",schools:"schools/ny.js"}]);
var ST=STATES[0];
function stateByCode(c){for(var i=0;i<STATES.length;i++) if(STATES[i].code===c) return STATES[i]; return null;}
function loadScript(src){return new Promise(function(res,rej){var s=document.createElement("script");s.src=src;s.onload=res;s.onerror=function(){rej(new Error("No se pudo cargar "+src));};document.head.appendChild(s);});}
function stpre(){return ST.code==="ny"?"":ST.code+"_";}
function reduced(){try{return !!(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);}catch(e){return false;}}
function buzz(){try{if(navigator.vibrate&&!reduced())navigator.vibrate(24);}catch(e){}}
function $(id){return document.getElementById(id);}
function t(k){var v=P.ui[k];return v===undefined?k:v;}
function fmt(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k];});}
// Sustituye los datos del estado en los textos compartidos ({state}, {agency}, {total}).
function uis(k){var v=P.ui[k]; if(typeof v!=="string") return v; var ex=examCfg();
  return v.replace(/\{state\}/g,stName()).replace(/\{agency\}/g,ST.agency||"DMV").replace(/\{total\}/g,ex.total).replace(/\{pass\}/g,ex.pass);}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function num(n){try{return new Intl.NumberFormat(LANG).format(n);}catch(e){return String(n);}}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var x=a[i];a[i]=a[j];a[j]=x;}return a;}
function manRef(ch){return t("manual")+" "+ch+t("manualEnd");}
var CH_IMG={"4":"senales_calle","5":"interseccion","6":"autopista","7":"cuesta","8":"espejo","9":"alcohol","10":"nieve","11":"peatones","S":"senales_calle"};
function img(k){return "img/"+k+".webp";}
function chImg(ch){var m=(C.chimg&&C.chimg[ch])||CH_IMG[ch]||"portada";return img(m);}

// ---------- Carga de idioma ----------
function loadUi(code){
  if(window.UI&&window.UI[code]) return Promise.resolve(window.UI[code]);
  return loadScript((ST.ui||"ui/")+code+".js").then(function(){return window.UI[code];});
}
function loadGames(code){
  if(window.GAMES&&window.GAMES[code]) return Promise.resolve(window.GAMES[code]);
  return loadScript("games/"+code+".js").then(function(){return window.GAMES[code];})
    .catch(function(){ return window.GAMES&&window.GAMES.en ? window.GAMES.en : null; });
}
function loadKit(code){
  if(window.KIT&&window.KIT[code]) return Promise.resolve(window.KIT[code]);
  return loadScript("kit/"+code+".js").then(function(){return window.KIT[code];}).catch(function(){return null;});
}
function loadCourse(code){
  if(window.CDLCOURSE&&window.CDLCOURSE[code]) return Promise.resolve(window.CDLCOURSE[code]);
  return loadScript("cdl/course/"+code+".js").then(function(){return window.CDLCOURSE[code];})
    .catch(function(){ return window.CDLCOURSE&&window.CDLCOURSE.en ? window.CDLCOURSE.en : null; });
}
function loadCdl(code){
  if(window.CDL&&window.CDL[code]) return Promise.resolve(window.CDL[code]);
  return loadScript("cdl/"+code+".js").then(function(){return window.CDL[code];})
    .catch(function(){ return window.CDL&&window.CDL.en ? window.CDL.en : null; });
}
function loadLang(code){
  if(window.LANGS&&window.LANGS[code]&&window.__langState===ST.code) return Promise.resolve(window.LANGS[code]);
  return loadScript((ST.lang||"lang/")+code+".js").then(function(){window.__langState=ST.code;return window.LANGS[code];})
    .catch(function(){ if(code!=="en") return loadLang("en"); throw new Error("language pack missing: "+code); });
}
// Accesibilidad del selector de idioma: foco atrapado y Escape para cerrar.
var pickerReturn=null;
function pickerTrap(e){
  var box=$("langPick"); if(!box||!box.classList.contains("on")) return;
  if(e.key==="Escape"){ e.preventDefault(); box.classList.remove("on"); if(pickerReturn&&pickerReturn.focus) try{pickerReturn.focus();}catch(x){} return; }
  if(e.key!=="Tab") return;
  var f=box.querySelectorAll("button"); if(!f.length) return;
  var first=f[0], last=f[f.length-1];
  if(e.shiftKey&&document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey&&document.activeElement===last){ e.preventDefault(); first.focus(); }
}
document.addEventListener("keydown",pickerTrap);
function pickerShow(){
  $("lpList").innerHTML=META.map(function(m){return '<button type="button" data-c="'+m.code+'" aria-current="'+(m.code===LANG)+'" lang="'+m.code+'"><img src="'+img("guia_"+m.code)+'" alt="'+esc(m.name)+'"><b>'+esc(m.name)+'</b></button>';}).join("");
  $("lpList").querySelectorAll("button").forEach(function(b){b.onclick=function(){setLang(b.dataset.c);};});
  pickerReturn=document.activeElement;
  $("langPick").classList.add("on");
  var first=$("lpList").querySelector("button"); if(first) first.focus();
}
function setLang(code){
  return Promise.all([loadUi(code),loadLang(code),loadCdl(code),loadGames(code),loadKit(code)]).then(function(r){
    LANG=code; P=r[1]; P.ui=r[0]; P.cdl=r[2]; P.games=r[3]; P.kit=r[4]; store.set("lang",code);
    $("langPick").classList.remove("on");
    document.documentElement.lang=code; document.documentElement.dir=P.dir||"ltr";
    document.documentElement.style.setProperty("--body",P.font);
    renderAll();
  });
}

// ---------- Voz (gratis, del propio teléfono) ----------
var TTS=window.speechSynthesis||null;
function ttsLang(){for(var i=0;i<META.length;i++) if(META[i].code===LANG) return META[i].tts; return "en-US";}
function hasVoice(){
  if(!TTS) return false; var v=TTS.getVoices(); if(!v.length) return false;
  var l=ttsLang().slice(0,2); return v.some(function(x){return (x.lang||"").toLowerCase().indexOf(l)===0;});
}
function speak(txt){
  if(!TTS) return; TTS.cancel(); var u=new SpeechSynthesisUtterance(txt); u.lang=ttsLang(); u.rate=.95;
  var v=TTS.getVoices().filter(function(x){return (x.lang||"").toLowerCase().indexOf(ttsLang().slice(0,2))===0;});
  if(v.length) u.voice=v[0]; TTS.speak(u);
}
function toolsHtml(id){
  var h='<div class="tools">';
  if(hasVoice()) h+='<button type="button" class="linkbtn" data-say>'+ic("speaker")+' '+esc(t("listen"))+'</button>';
  if(CFG.reportEmail) h+='<a class="linkbtn" href="mailto:'+CFG.reportEmail+'?subject='+encodeURIComponent("DriveReady "+LANG+" "+id)+'">'+ic("flag")+' '+({es:"Reportar un error",en:"Report a mistake",zh:"报告错误",ru:"Сообщить об ошибке",ko:"오류 신고",bn:"ভুল জানান"}[LANG]||"")+'</a>';
  return h+'</div>';
}
function bindSay(root,p){var b=root.querySelector("[data-say]"); if(b) b.onclick=function(){speak(textoPregunta(p)+". "+opciones(p).map(function(o,i){return (i+1)+". "+o.txt;}).join(". "));};}

// ---------- Señales dibujadas (formas estándar, sin marcas oficiales) ----------
function svgSenal(k){
  var s='<svg viewBox="0 0 200 200" role="img" aria-label="'+esc(P.signs[k]||k)+'">';
  var tx=function(x,y,size,txt,fill){return '<text x="'+x+'" y="'+y+'" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="'+size+'" fill="'+fill+'" text-anchor="middle">'+txt+'</text>';};
  var dia=function(f){return '<rect x="40" y="40" width="120" height="120" rx="8" transform="rotate(45 100 100)" fill="'+f+'" stroke="#111" stroke-width="5"/>';};
  switch(k){
   case "stop": s+='<polygon points="62,10 138,10 190,62 190,138 138,190 62,190 10,138 10,62" fill="#c8102e" stroke="#fff" stroke-width="7"/>'+tx(100,118,50,"STOP","#fff");break;
   case "yield": s+='<polygon points="10,25 190,25 100,180" fill="#c8102e"/><polygon points="40,42 160,42 100,146" fill="#fff"/>'+tx(100,80,24,"YIELD","#c8102e");break;
   case "donotenter": s+='<circle cx="100" cy="100" r="88" fill="#c8102e" stroke="#fff" stroke-width="6"/><rect x="35" y="88" width="130" height="24" fill="#fff"/>'+tx(100,70,20,"DO NOT","#fff")+tx(100,145,20,"ENTER","#fff");break;
   case "nouturn": s+='<rect x="20" y="20" width="160" height="160" rx="10" fill="#fff" stroke="#111" stroke-width="5"/><path d="M80 150 V85 a25 25 0 0 1 50 0 V115" fill="none" stroke="#111" stroke-width="14"/><polygon points="112,110 148,110 130,140" fill="#111"/><circle cx="100" cy="100" r="62" fill="none" stroke="#c8102e" stroke-width="12"/><line x1="56" y1="56" x2="144" y2="144" stroke="#c8102e" stroke-width="12"/>';break;
   case "oneway": s+='<rect x="10" y="52" width="180" height="96" rx="6" fill="#111"/>'+tx(100,90,24,"ONE WAY","#fff")+'<rect x="34" y="112" width="112" height="12" fill="#fff"/><polygon points="146,100 180,118 146,136" fill="#fff"/>';break;
   case "crossbuck": s+='<g transform="rotate(-35 100 100)"><rect x="8" y="82" width="184" height="36" fill="#fff" stroke="#111" stroke-width="4"/>'+tx(52,108,19,"CROSS","#111")+tx(152,108,19,"ING","#111")+'</g><g transform="rotate(35 100 100)"><rect x="8" y="82" width="184" height="36" fill="#fff" stroke="#111" stroke-width="4"/>'+tx(52,108,19,"RAIL","#111")+tx(150,108,19,"ROAD","#111")+'</g>';break;
   case "rradvance": s+='<circle cx="100" cy="100" r="88" fill="#f2c200" stroke="#111" stroke-width="5"/><line x1="45" y1="45" x2="155" y2="155" stroke="#111" stroke-width="12"/><line x1="155" y1="45" x2="45" y2="155" stroke="#111" stroke-width="12"/>'+tx(62,112,34,"R","#111")+tx(138,112,34,"R","#111");break;
   case "school": s+='<polygon points="100,12 185,80 185,188 15,188 15,80" fill="#c6d400" stroke="#111" stroke-width="5"/><circle cx="78" cy="88" r="10" fill="#111"/><path d="M78 100 v38 M78 112 l-16 14 M78 112 l14 14 M78 138 l-12 26 M78 138 l12 26" stroke="#111" stroke-width="8" stroke-linecap="round"/><circle cx="124" cy="96" r="9" fill="#111"/><path d="M124 106 v32 M124 116 l-13 12 M124 116 l12 12 M124 138 l-10 22 M124 138 l10 22" stroke="#111" stroke-width="7" stroke-linecap="round"/>';break;
   case "curve": s+=dia("#f2c200")+'<path d="M85 150 V110 Q85 80 115 72" fill="none" stroke="#111" stroke-width="12"/><polygon points="108,55 138,68 112,90" fill="#111"/>';break;
   case "laneends": s+=dia("#f2c200")+'<path d="M80 150 V60 M125 150 V112 Q125 95 108 80 V60" fill="none" stroke="#111" stroke-width="10"/><line x1="102" y1="150" x2="102" y2="120" stroke="#111" stroke-width="6" stroke-dasharray="10 8"/>';break;
   case "signal": s+=dia("#f2c200")+'<rect x="82" y="58" width="36" height="84" rx="6" fill="#111"/><circle cx="100" cy="74" r="10" fill="#e33"/><circle cx="100" cy="100" r="10" fill="#f2c200"/><circle cx="100" cy="126" r="10" fill="#2b2"/>';break;
   case "slowmoving": s+='<polygon points="100,20 185,170 15,170" fill="#c8102e"/><polygon points="100,52 158,152 42,152" fill="#ff7a00"/>';break;
   case "roadwork": s+=dia("#ff7a00")+tx(100,96,26,"ROAD","#111")+tx(100,126,26,"WORK","#111");break;
   case "speed55": s+='<rect x="35" y="15" width="130" height="170" rx="10" fill="#fff" stroke="#111" stroke-width="5"/>'+tx(100,55,24,"SPEED","#111")+tx(100,82,24,"LIMIT","#111")+tx(100,160,72,"55","#111");break;
   case "noleft": s+='<rect x="18" y="18" width="164" height="164" rx="10" fill="#fff" stroke="#111" stroke-width="5"/><path d="M142 100 H88" stroke="#111" stroke-width="16"/><polygon points="58,100 92,78 92,122" fill="#111"/><circle cx="100" cy="100" r="70" fill="none" stroke="#c8102e" stroke-width="12"/><line x1="50" y1="50" x2="150" y2="150" stroke="#c8102e" stroke-width="12"/>';break;
   case "noright": s+='<rect x="18" y="18" width="164" height="164" rx="10" fill="#fff" stroke="#111" stroke-width="5"/><path d="M58 100 H112" stroke="#111" stroke-width="16"/><polygon points="142,100 108,78 108,122" fill="#111"/><circle cx="100" cy="100" r="70" fill="none" stroke="#c8102e" stroke-width="12"/><line x1="50" y1="50" x2="150" y2="150" stroke="#c8102e" stroke-width="12"/>';break;
   case "noturnred": s+='<rect x="20" y="20" width="160" height="160" rx="10" fill="#fff" stroke="#111" stroke-width="5"/>'+tx(100,80,30,"NO","#c8102e")+tx(100,116,30,"TURN","#111")+tx(100,150,24,"ON RED","#111");break;
   case "nopass": s+='<rect x="20" y="52" width="160" height="96" rx="8" fill="#fff" stroke="#111" stroke-width="5"/>'+tx(100,88,26,"DO NOT","#111")+tx(100,124,26,"PASS","#111");break;
   case "keepright": s+='<rect x="18" y="18" width="164" height="164" rx="10" fill="#fff" stroke="#111" stroke-width="5"/><path d="M68 62 L116 118" stroke="#111" stroke-width="16"/><polygon points="132,136 92,124 120,92" fill="#111"/>';break;
   case "merge": s+=dia("#f2c200")+'<path d="M74 162 V50" stroke="#111" stroke-width="9"/><path d="M126 162 V112 Q126 80 88 62" stroke="#111" stroke-width="9" fill="none"/><polygon points="82,52 104,66 80,78" fill="#111"/>';break;
   case "hill": s+=dia("#f2c200")+'<path d="M58 150 L142 64" stroke="#111" stroke-width="10"/>'+tx(80,140,19,"8%","#111");break;
   case "dividedends": s+=dia("#f2c200")+'<path d="M82 168 V104 Q82 76 100 62" stroke="#111" stroke-width="9" fill="none"/><path d="M118 168 V104 Q118 76 100 62" stroke="#111" stroke-width="9" fill="none"/>';break;
   case "twoway": s+=dia("#f2c200")+'<path d="M74 62 V138" stroke="#111" stroke-width="10"/><polygon points="74,44 58,74 90,74" fill="#111"/><path d="M126 138 V62" stroke="#111" stroke-width="10"/><polygon points="126,156 110,126 142,126" fill="#111"/>';break;
   case "slippery": s+=dia("#f2c200")+'<rect x="68" y="82" width="64" height="26" rx="9" fill="#111"/><circle cx="82" cy="112" r="7" fill="#111"/><circle cx="118" cy="112" r="7" fill="#111"/><path d="M58 132 q10 -9 20 0 q10 9 20 0 q10 -9 20 0 q10 9 20 0" stroke="#111" stroke-width="5" fill="none"/><path d="M58 148 q10 -9 20 0 q10 9 20 0" stroke="#111" stroke-width="4" fill="none"/>';break;
   case "narrowbridge": s+=dia("#f2c200")+'<path d="M52 78 H78 L88 100 H112 L122 78 H148" stroke="#111" stroke-width="8" fill="none"/><path d="M52 126 H78 L88 100 H112 L122 126 H148" stroke="#111" stroke-width="8" fill="none"/>';break;
   case "winding": s+=dia("#f2c200")+'<path d="M100 162 Q58 132 100 102 Q142 72 100 46" stroke="#111" stroke-width="12" fill="none"/><polygon points="100,34 82,60 118,60" fill="#111"/>';break;
   case "pedcross": s+=dia("#f2c200")+'<circle cx="100" cy="60" r="10" fill="#111"/><path d="M100 72 v34 M100 82 l-17 16 M100 82 l17 16 M100 106 l-14 32 M100 106 l14 32" stroke="#111" stroke-width="8" stroke-linecap="round" fill="none"/>';break;
   case "crossroad": s+=dia("#f2c200")+'<path d="M100 46 V154 M46 100 H154" stroke="#111" stroke-width="14"/>';break;
   case "deer": s+=dia("#f2c200")+'<ellipse cx="98" cy="106" rx="30" ry="15" fill="#111"/><path d="M122 96 l14 -18" stroke="#111" stroke-width="9"/><circle cx="140" cy="72" r="9" fill="#111"/><path d="M140 62 l-7 -14 M140 62 l9 -13" stroke="#111" stroke-width="5"/><path d="M78 118 v28 M94 120 v26 M112 120 v26 M126 118 v28" stroke="#111" stroke-width="7"/>';break;
   case "flagger": s+=dia("#ff7a00")+'<circle cx="90" cy="62" r="10" fill="#111"/><path d="M90 74 v40 M90 84 l-16 14 M90 84 l18 -6 M90 114 l-12 30 M90 114 l12 30" stroke="#111" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M110 78 V44" stroke="#111" stroke-width="6"/><rect x="110" y="44" width="28" height="20" fill="#111"/>';break;
   case "construction": s+=dia("#ff7a00")+'<circle cx="92" cy="58" r="9" fill="#111"/><path d="M92 68 v42 M92 78 l-16 12 M92 78 l16 10 M92 110 l-14 32 M92 110 l14 32" stroke="#111" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M120 74 l20 54" stroke="#111" stroke-width="6"/><path d="M112 74 h16 l-4 14 h-16 z" fill="#111"/>';break;
   case "gas": s+='<rect x="18" y="18" width="164" height="164" rx="12" fill="#1d4f9a" stroke="#fff" stroke-width="4"/><rect x="72" y="58" width="46" height="84" rx="4" fill="#fff"/><rect x="80" y="66" width="30" height="22" fill="#1d4f9a"/><path d="M118 82 h12 q6 0 6 8 v34 q0 8 8 8" stroke="#fff" stroke-width="6" fill="none"/><rect x="66" y="142" width="58" height="8" fill="#fff"/>';break;
   case "hospital": s+='<rect x="25" y="25" width="150" height="150" rx="10" fill="#1d4f9a" stroke="#fff" stroke-width="5"/>'+tx(100,138,104,"H","#fff");break;
   case "restarea": s+='<rect x="18" y="18" width="164" height="164" rx="12" fill="#1d4f9a" stroke="#fff" stroke-width="4"/>'+tx(100,120,86,"P","#fff")+tx(100,158,22,"REST","#fff");break;
  }
  return s+'</svg>';
}

// Ilustraciones para preguntas que no son de una señal concreta: semáforos, flechas,
// marcas viales, señales de mano, autobús escolar, peatón con bastón y glorieta.
function lightBody(lit){
  var c={red:"#3a1414",yellow:"#3a3410",green:"#123a1f"};
  if(lit==="red")c.red="#e23b3b"; if(lit==="yellow")c.yellow="#f2c200"; if(lit==="green")c.green="#2bb35a";
  return '<rect x="74" y="26" width="52" height="148" rx="12" fill="#111"/>'+
    '<circle cx="100" cy="62" r="16" fill="'+c.red+'"/><circle cx="100" cy="100" r="16" fill="'+c.yellow+'"/><circle cx="100" cy="138" r="16" fill="'+c.green+'"/>';
}
function rays(cx,cy,color){var o="";for(var a=0;a<8;a++){var g=a*Math.PI/4,x1=cx+Math.cos(g)*24,y1=cy+Math.sin(g)*24,x2=cx+Math.cos(g)*34,y2=cy+Math.sin(g)*34;o+='<line x1="'+x1.toFixed(0)+'" y1="'+y1.toFixed(0)+'" x2="'+x2.toFixed(0)+'" y2="'+y2.toFixed(0)+'" stroke="'+color+'" stroke-width="5" stroke-linecap="round"/>';}return o;}
function roadBase(extra){
  return '<rect x="0" y="0" width="200" height="200" fill="#6f7a73"/><rect x="46" y="0" width="108" height="200" fill="#8d9a92"/>'+ (extra||"");
}
function svgIlust(k){
  var tx=function(x,y,size,txt,fill){return '<text x="'+x+'" y="'+y+'" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="'+size+'" fill="'+fill+'" text-anchor="middle">'+txt+"</text>";};
  var s='<svg viewBox="0 0 200 200" role="img" aria-label="'+k+'">';
  switch(k){
   case "light-red-flash": s+=lightBody("red")+rays(100,62,"#e23b3b");break;
   case "light-yellow-flash": s+=lightBody("yellow")+rays(100,100,"#f2c200");break;
   case "light-yellow": s+=lightBody("yellow");break;
   case "light-red": s+=lightBody("red");break;
   case "light-green": s+=lightBody("green");break;
   case "light-off": s+=lightBody("off");break;
   case "light-red-arrow": s+='<rect x="66" y="26" width="68" height="148" rx="12" fill="#111"/>'+
     '<path d="M110 150 V100 H92" stroke="#e23b3b" stroke-width="13" fill="none"/><polygon points="70,100 98,84 98,116" fill="#e23b3b"/>';break;
   case "lane-red-x": s+=roadBase('<line x1="46" y1="14" x2="46" y2="30" stroke="#fff" stroke-width="4"/><line x1="154" y1="14" x2="154" y2="30" stroke="#fff" stroke-width="4"/><line x1="46" y1="170" x2="46" y2="186" stroke="#fff" stroke-width="4"/><line x1="154" y1="170" x2="154" y2="186" stroke="#fff" stroke-width="4"/>')+
     '<line x1="76" y1="70" x2="124" y2="118" stroke="#e23b3b" stroke-width="16" stroke-linecap="round"/><line x1="124" y1="70" x2="76" y2="118" stroke="#e23b3b" stroke-width="16" stroke-linecap="round"/>';break;
   case "lane-yellow-x": s+=roadBase('<line x1="46" y1="14" x2="46" y2="30" stroke="#fff" stroke-width="4"/><line x1="154" y1="14" x2="154" y2="30" stroke="#fff" stroke-width="4"/>')+
     '<line x1="76" y1="70" x2="124" y2="118" stroke="#f2c200" stroke-width="16" stroke-linecap="round"/><line x1="124" y1="70" x2="76" y2="118" stroke="#f2c200" stroke-width="16" stroke-linecap="round"/>';break;
   case "lane-hov": s+=roadBase('<line x1="100" y1="10" x2="100" y2="190" stroke="#fff" stroke-width="4" stroke-dasharray="14 12"/>')+
     '<polygon points="100,60 136,100 100,140 64,100" fill="none" stroke="#fff" stroke-width="9"/>';break;
   case "lines-yellow": s+=roadBase('<line x1="92" y1="0" x2="92" y2="200" stroke="#f2c200" stroke-width="6"/><line x1="108" y1="0" x2="108" y2="200" stroke="#f2c200" stroke-width="6"/>');break;
   case "lines-solid-broken": s+=roadBase('<line x1="92" y1="0" x2="92" y2="200" stroke="#f2c200" stroke-width="6"/>'+
     '<line x1="108" y1="0" x2="108" y2="46" stroke="#f2c200" stroke-width="6"/><line x1="108" y1="66" x2="108" y2="112" stroke="#f2c200" stroke-width="6"/><line x1="108" y1="132" x2="108" y2="178" stroke="#f2c200" stroke-width="6"/>');break;
   case "lines-double-solid": s+=roadBase('<line x1="92" y1="0" x2="92" y2="200" stroke="#f2c200" stroke-width="6"/><line x1="108" y1="0" x2="108" y2="200" stroke="#f2c200" stroke-width="6"/>');break;
   case "crosswalk-stopline": s+=roadBase('<rect x="46" y="112" width="108" height="10" fill="#fff"/>')+
     [0,1,2,3,4].map(function(i){return '<rect x="'+(52+i*21)+'" y="132" width="12" height="58" fill="#fff"/>';}).join("");break;
   case "hand-right": s+='<rect x="78" y="118" width="44" height="60" rx="10" fill="#0b6e4f"/>'+
     '<rect x="88" y="62" width="24" height="60" rx="10" fill="#e8b98a"/><circle cx="100" cy="54" r="15" fill="#e8b98a"/>'+
     '<path d="M126 52 q20 -6 26 10" stroke="#0b6e4f" stroke-width="6" fill="none" stroke-linecap="round"/><polygon points="156,70 148,52 164,54" fill="#0b6e4f"/>';break;
   case "hand-stop": s+='<rect x="78" y="24" width="44" height="60" rx="10" fill="#0b6e4f"/>'+
     '<rect x="88" y="82" width="24" height="62" rx="10" fill="#e8b98a"/><circle cx="100" cy="152" r="15" fill="#e8b98a"/>';break;
   case "schoolbus": s+='<rect x="36" y="38" width="128" height="134" rx="16" fill="#f2c200" stroke="#111" stroke-width="4"/>'+
     '<rect x="54" y="60" width="92" height="44" rx="6" fill="#9fd8f0" stroke="#111" stroke-width="3"/>'+
     '<circle cx="72" cy="46" r="8" fill="#e23b3b"/><circle cx="128" cy="46" r="8" fill="#e23b3b"/>'+
     tx(100,142,17,"SCHOOL BUS","#111")+'<rect x="60" y="150" width="80" height="10" rx="4" fill="#111"/>';break;
   case "blind-ped": s+=
     '<circle cx="92" cy="56" r="13" fill="#111"/><path d="M92 70 v44 M92 82 l-16 16 M92 82 l16 14 M92 114 l-14 32 M92 114 l14 32" stroke="#111" stroke-width="8" fill="none" stroke-linecap="round"/>'+
     '<line x1="112" y1="150" x2="140" y2="96" stroke="#fff" stroke-width="6" stroke-linecap="round"/><circle cx="112" cy="150" r="5" fill="#e23b3b"/>';break;
   case "roundabout": s+='<circle cx="100" cy="100" r="66" fill="none" stroke="#111" stroke-width="14"/>'+
     '<polygon points="100,20 84,44 116,44" fill="#111"/><polygon points="168,120 140,112 148,138" fill="#111"/><polygon points="36,84 56,108 60,80" fill="#111"/>';break;
  }
  return s+"</svg>";
}

// ---------- Preguntas ----------
// id estable: "r12" = regla 12, "s:stop" = señal; las opciones se barajan pero se guardan por índice original
function preparar(id){
  if(id.charAt(0)==="s"){var k=id.slice(2);
    return {id:id,ch:"S",sign:k,keys:shuffle([k].concat(shuffle(C.signs.filter(function(c){return c!==k;})).slice(0,3))),correct:k};}
  var i=+id.slice(1); return {id:id,ch:String(C.rules[i].ch),i:i,idx:shuffle([0,1,2,3]),correct:C.rules[i].a};
}
function textoPregunta(p){return p.sign?t("signQ"):P.q[p.i][0];}
function opciones(p){return p.sign?p.keys.map(function(k){return {v:k,txt:P.signs[k]};}):p.idx.map(function(j){return {v:j,txt:P.q[p.i][1][j]};});}
function textoValor(p,v){return v===undefined||v===null?"—":(p.sign?P.signs[v]:P.q[p.i][1][v]);}
function explicacion(p){
  var url=C.fuentes[p.ch];
  if(p.sign) return esc(P.signs[p.sign])+' · <a href="'+url+'" target="_blank" rel="noopener">'+esc(t("signsChart"))+'</a>';
  return esc(P.q[p.i][2])+' · <a href="'+url+'" target="_blank" rel="noopener">'+esc(manRef(p.ch))+'</a>';
}
function cabezaImg(p){
  if(p.sign) return '<div class="signbox">'+svgSenal(p.sign)+"</div>";
  var k=C.qimg&&C.qimg[p.i];
  if(!k) return "";
  if(k.indexOf("p:")===0) return '<div class="qimg"><img src="'+img(k.slice(2))+'" alt="'+esc(P.signs[k.slice(2)]||"")+'" loading="lazy"></div>';
  var art=k.indexOf("s:")===0?svgSenal(k.slice(2)):svgIlust(k);
  return '<div class="qart">'+art+"</div>";
}
var ALL_RULES=[], ALL_SIGNS=[], TOTAL=0, MISS={}, MAST={}, EX=null, PR={ch:"all",qs:[],i:0,ok:0}, RT={};
// Cada estado guarda su propio progreso. NY conserva sus claves alv_miss/alv_mast/alv_exam.
function cargarProgreso(){
  ALL_RULES=C.rules.map(function(_,i){return "r"+i;});
  ALL_SIGNS=(C.signs||[]).map(function(k){return "s:"+k;});
  TOTAL=ALL_RULES.length+ALL_SIGNS.length;
  MISS=store.get(stpre()+"miss",{});
  MAST=store.get(stpre()+"mast",{});
  EX=store.get(stpre()+"exam",null);
  RT=store.get(stpre()+"rt",{});
  PR={ch:"all",qs:[],i:0,ok:0};
}
function marcar(id,bien){if(bien) delete MISS[id]; else MISS[id]=1; store.set(stpre()+"miss",MISS);}
function frase(tipo){var a=(P.guide&&P.guide[tipo])||[""];return a[Math.floor(Math.random()*a.length)]||"";}

// ---------- Navegación ----------
var VISTAS=["inicio","examen","practica","manual","juego","roadtest","escuelas","cdl","maniobras","cultura","acerca"];
function pintarTabs(){var tb=t("tabs"),lab={}; for(var k in tb) lab[k]=tb[k]; if(!lab.escuelas) lab.escuelas=(SCT[LANG]||SCT.en).tab;$("tabs").innerHTML=VISTAS.map(function(v){return '<a href="#'+v+'" data-v="'+v+'">'+esc(lab[v]||v)+'</a>';}).join("");}
function vista(){var v=(location.hash||"#inicio").slice(1); return VISTAS.indexOf(v)<0?"inicio":v;}
function ir(){
  var v=vista();
  VISTAS.forEach(function(x){$(x).classList.toggle("on",x===v);});
  document.querySelectorAll("#tabs a").forEach(function(a){if(a.dataset.v===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  if(v!=="juego"&&GM&&GM.timer) gmStop();
  if(v==="escuelas") pintarEscuelas();
  if(v==="cdl"){ if(!P.course){ Promise.all([loadCourse(LANG),loadCourse("en")]).then(function(r){P.course=r[0];pintarCdl();}).catch(function(){pintarCdl();}); } else pintarCdl(); }
  var hv=$("heroVid"), calm=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(hv){ if(v==="inicio"&&!calm){ if(!hv.dataset.armed){ hv.dataset.armed="1"; var armVid=function(){ if(!hv.getAttribute("src")) hv.setAttribute("src","clips/portada.mp4"); hv.hidden=false; if($("heroImg"))$("heroImg").hidden=true; var p=hv.play(); if(p&&p.catch)p.catch(function(){}); window.removeEventListener("pointerdown",armVid); window.removeEventListener("keydown",armVid); }; window.addEventListener("pointerdown",armVid); window.addEventListener("keydown",armVid); window.addEventListener("scroll",armVid); } } else hv.pause(); }
  if(TTS) TTS.cancel();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",ir);

// ---------- Aviso legal por estado (política de Google Play: nunca oculto) ----------
var GOVN={
 en:"<b>Not a government app.</b> DriveReady is independent and is not affiliated with, endorsed by or representing the {agency} of {state} or any government agency.",
 es:"<b>No es una app del gobierno.</b> DriveReady es independiente y no está afiliada, avalada ni representa al {agency} de {state} ni a ninguna agencia del gobierno.",
 zh:"<b>本应用不是政府应用。</b>DriveReady 是独立产品，与{state}机动车管理局（{agency}）及任何政府机构均无关联，也未获其认可或代表其立场。",
 ru:"<b>Это не государственное приложение.</b> DriveReady — независимый проект: он не связан с {agency} штата {state}, не одобрен им и не представляет его, как и любое другое государственное ведомство.",
 ko:"<b>정부 앱이 아닙니다.</b> DriveReady는 독립 학습 도구로, {state} {agency} 및 어떤 정부 기관과도 관련이 없고, 승인받지 않았으며, 대표하지 않습니다.",
 bn:"<b>এটি সরকারি অ্যাপ নয়।</b> DriveReady একটি স্বাধীন অ্যাপ; এটি {state}-এর {agency} বা কোনো সরকারি সংস্থার সঙ্গে যুক্ত নয়, তাদের অনুমোদিত নয় এবং তাদের প্রতিনিধিত্ব করে না।"
};
var GOVL={
 en:{manual:"Official driver manual",cdl:"CDL manual"},
 es:{manual:"Manual oficial del conductor",cdl:"Manual CDL"},
 zh:{manual:"官方驾驶手册",cdl:"CDL 手册"},
 ru:{manual:"Официальный справочник водителя",cdl:"Справочник CDL"},
 ko:{manual:"공식 운전자 매뉴얼",cdl:"CDL 매뉴얼"},
 bn:{manual:"অফিশিয়াল ড্রাইভার ম্যানুয়াল",cdl:"CDL ম্যানুয়াল"}
};
function stName(){return (ST.names&&ST.names[LANG])||ST.name;}
function pintarGov(){
  var tpl=GOVN[LANG]||GOVN.en;
  $("govText").innerHTML=tpl.replace(/\{state\}/g,esc(stName())).replace(/\{agency\}/g,esc(ST.agency||"DMV"));
  var L=GOVL[LANG]||GOVL.en, man=$("govManual"), cdl=$("govCdl");
  man.textContent=L.manual+" ↗"; man.href=ST.manual||"#"; man.hidden=!ST.manual;
  cdl.textContent=L.cdl+" ↗"; cdl.href=ST.cdl||"#"; cdl.hidden=!ST.cdl;
}
// ---------- Selector de estado ----------
function pintarSelectorEstado(){
  var sel=$("estado"); if(!sel) return;
  if(STATES.length<2){ sel.hidden=true; return; }
  sel.hidden=false;
  sel.innerHTML=STATES.map(function(s){var n=(s.names&&s.names[LANG])||s.name;return '<option value="'+s.code+'"'+(s.code===ST.code?" selected":"")+'>'+esc(s.code.toUpperCase()+" · "+n)+"</option>";}).join("");
  sel.onchange=function(){setState(sel.value);};
  sel.setAttribute("aria-label",({en:"State",es:"Estado",zh:"州",ru:"Штат",ko:"주",bn:"রাজ্য"}[LANG]||"State"));
}
function setState(code){
  var st=stateByCode(code); if(!st||st.code===ST.code) return;
  store.set("state",code);
  window.LANGS={}; window.__langState=null; ENPACK=null;
  loadScript(st.core).then(function(){
    if(!window.CORE) throw new Error("state core failed");
    C=window.CORE; ST=st; window.__coreState=st.code; cargarProgreso();
    return setLang(LANG||"en");
  }).catch(function(e){ try{console.error(e);}catch(x){} });
}

// ---------- Anuncios: solo fuera de las preguntas ----------
var adsLoaded=false;
// Espacio de patrocinio propio: un único anuncio responsable (autoescuelas, cursos de 5 horas), nunca dentro de una pregunta.
var SPONSOR={
 en:{k:"Sponsor spot",t:"Run a driving school or a 5-hour course?",b:"Reach new drivers in 6 languages. One respectful spot: no pop-ups, never inside a question.",c:"Become a sponsor"},
 es:{k:"Patrocinio",t:"¿Tienes una autoescuela o das el curso de 5 horas?",b:"Llega a conductores nuevos en 6 idiomas. Un solo espacio respetuoso: sin ventanas emergentes y nunca dentro de una pregunta.",c:"Quiero patrocinar"},
 zh:{k:"赞助位",t:"您经营驾校或5小时课程吗？",b:"用6种语言接触新司机。只有一个得体的位置：没有弹窗，绝不出现在题目里。",c:"成为赞助商"},
 ru:{k:"Спонсор",t:"У вас автошкола или 5-часовой курс?",b:"Новые водители на 6 языках. Одно аккуратное место: без всплывающих окон и никогда внутри вопроса.",c:"Стать спонсором"},
 ko:{k:"후원 자리",t:"운전학원이나 5시간 교육을 운영하세요?",b:"6개 언어로 새 운전자를 만나세요. 단 하나의 깔끔한 자리: 팝업 없음, 문제 안에는 절대 없음.",c:"후원하기"},
 bn:{k:"স্পনসর",t:"ড্রাইভিং স্কুল বা ৫ ঘণ্টার কোর্স চালান?",b:"৬টি ভাষায় নতুন চালকদের কাছে পৌঁছান। একটিই ভদ্র জায়গা: কোনো পপ-আপ নেই, প্রশ্নের ভেতরে কখনো নয়।",c:"স্পনসর হোন"}};
function pintarAds(){
  document.querySelectorAll("[data-ad]").forEach(function(el){
    if(CFG.adsenseClient){
      if(!el.dataset.filled){el.dataset.filled=1; el.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="'+CFG.adsenseClient+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';
        if(!adsLoaded){adsLoaded=true; var s=document.createElement("script"); s.async=true; s.crossOrigin="anonymous"; s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+CFG.adsenseClient; document.head.appendChild(s);}
        try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){} }
    } else if(CFG.sponsorEmail){
      var s=SPONSOR[LANG]||SPONSOR.en;
      el.className="ad sponsor"; el.innerHTML='<div class="sp-k">'+esc(s.k)+'</div><div class="sp-t">'+esc(s.t)+'</div><div class="sp-b">'+esc(s.b)+'</div><a class="sp-c" href="mailto:'+esc(CFG.sponsorEmail)+'?subject='+encodeURIComponent("DriveReady sponsor")+'">'+esc(s.c)+'</a>';
    } else el.textContent=CFG.showAdDemo?t("ad"):"";
  });
}

var ENPACK=null;
function loadEnPack(){ if(ENPACK) return Promise.resolve(ENPACK); return Promise.all([loadScript((ST.lang||"lang/")+"en.js"),loadScript("ui/en.js")]).then(function(){ENPACK=window.LANGS.en;return ENPACK;}).catch(function(){return null;}); }
function englishQ(p){
  if(!ENPACK) return null;
  if(p.sign){var q=(window.UI&&window.UI.en)?window.UI.en.signQ:null;return (q?q+" ":"")+(ENPACK.signs[p.sign]||"");}
  var n=+String(p.id).replace(/^[a-z]+/,"");
  return ENPACK.q&&ENPACK.q[n]?ENPACK.q[n][0]:null;
}
function bindEn(p,root,btn){
  var box=root.querySelector("#enText"); if(!box||!btn) return;
  btn.onclick=function(){
    if(!ENPACK){ btn.disabled=true; loadEnPack().then(function(){btn.disabled=false; btn.click();}); return; }
    var en=englishQ(p); if(!en) return;
    box.textContent="EN: "+en; box.hidden=!box.hidden;
    btn.textContent=box.hidden?t("seeEn"):t("hideEn");
  };
}

// ---------- Plan de hoy y racha ----------
function todayKey(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2);}
function dailyState(){
  var d=store.get(stpre()+"daily",null);
  if(!d||d.date!==todayKey()){d={date:todayKey(),ids:[],i:0,ok:0,done:false};store.set(stpre()+"daily",d);}
  return d;
}
function dailyBuild(){
  var all=ALL_RULES.concat(ALL_SIGNS);
  var miss=Object.keys(MISS).filter(function(id){return all.indexOf(id)>=0;});
  var rest=all.filter(function(id){return !MAST[id]&&miss.indexOf(id)<0;});
  var pick=shuffle(miss).concat(shuffle(rest));
  if(pick.length<10)pick=pick.concat(shuffle(all));
  return pick.slice(0,10);
}
function dailyStart(){
  var d=dailyState();
  if(d.done){location.hash="#practica";return practicaNueva("miss");}
  if(!d.ids||!d.ids.length){d.ids=dailyBuild();store.set(stpre()+"daily",d);}
  PR={ch:"daily",qs:d.ids.map(preparar),i:d.i||0,ok:d.ok||0};
  location.hash="#practica";
  pintarChips(); pintarDominadas(); practicaPintar();
}
function bumpStreak(){
  var s=store.get(stpre()+"streak",{d:"",n:0}), t=todayKey();
  if(s.d===t)return s;
  var y=new Date();y.setDate(y.getDate()-1);
  var ymd=y.getFullYear()+"-"+("0"+(y.getMonth()+1)).slice(-2)+"-"+("0"+y.getDate()).slice(-2);
  s.n=(s.d===ymd)?(s.n||0)+1:1; s.d=t; store.set(stpre()+"streak",s); return s;
}

// ---------- Inicio ----------
function pintarInicio(){
  $("guideImg").src=img(P.guide.img); $("guideImg2").src=img(P.guide.img);
  var bd=document.querySelector(".brand h1 span"); if(bd){bd.textContent=(ST&&(ST.short||ST.code||"")).toUpperCase()||"NY";}
  $("guideName").textContent=P.guide.name+(P.guide.role?" · "+P.guide.role:""); $("guideHello").textContent=P.guide.hello;
  $("howList").innerHTML=P.ui.how.map(function(x){return "<li>"+esc(x)+"</li>";}).join("");
  var st=store.get("stats",{n:0,p:0,b:0});
  $("stats").textContent=st.n?fmt(uis("statsLine"),{n:num(st.n),p:num(st.p),b:num(st.b),g:num(store.get("best",0))}):t("statsNone");
  var n=Object.keys(MISS).length, gm=$("goMistakes");
  gm.hidden=!n; gm.innerHTML=ic("repeat")+" "+esc(t("practiceTitle"))+" · "+num(n);
  gm.onclick=function(){location.hash="#practica"; practicaNueva("miss");};
  pintarProgresoCapitulos(); pintarListo(); pintarMas(); pintarDaily(); pintarAjustes();
  var acts=$("homeActions")?$("homeActions").querySelectorAll("a"):[];
  if(acts.length===3){acts[0].textContent=t("homePlan");acts[0].href="#practica";acts[0].onclick=function(ev){ev.preventDefault();dailyStart();};acts[1].textContent=t("homeExam");acts[2].textContent=t("homeRoad");}
}
// Barra por capítulo: cuántas preguntas de ese capítulo ya están dominadas.
function pintarProgresoCapitulos(){
  var box=$("chapterProgress"); if(!box) return;
  var chs=Object.keys(P.chapters), h="";
  chs.forEach(function(c){
    var items=c==="S"?C.signs.map(function(k){return "s:"+k;}):ALL_RULES.filter(function(id){return String(C.rules[+id.slice(1)].ch)===c;});
    var done=items.filter(function(id){return MAST[id];}).length, pct=items.length?Math.round(done/items.length*100):0;
    var lab=c==="S"?P.chapters.S:manRef(c);
    var cls=pct>=80?"ok":pct>=40?"warn":"bad";
    h+='<div class="chbar '+cls+'"><div class="lab"><span>' + esc(lab) + '</span><span>' + num(done) + "/" + num(items.length) + '</span></div><div class="bar"><span style="width:' + pct + '%"></span></div></div>';
  });
  box.innerHTML=h+'<p class="small muted" style="margin-top:8px">'+esc(t("readyRule"))+"</p>";
}
// «Listo para el examen»: tres simulacros seguidos aprobados.
function pintarListo(){
  var pill=$("readyPill"); if(!pill) return;
  var hist=store.get(stpre()+"hist",[]);
  var last=hist.slice(-3), ready=last.length===3&&last.every(function(x){return x.pass;});
  pill.hidden=!ready;
  if(ready){ pill.className="pill ok"; pill.innerHTML=ic("check")+" "+(P.ui.readyYes||"Ready for the exam"); }
}
function pintarDaily(){
  var box=$("dailyCard"); if(!box) return;
  var d=dailyState(), st=store.get(stpre()+"streak",{n:0}), p=Math.min(d.i||0,10);
  box.innerHTML='<h3>'+esc(t("dailyTitle"))+'</h3><p class="small muted">'+esc(t("dailyLead"))+'</p>'+
    '<div class="row" style="justify-content:space-between"><span class="pill">'+num(p)+'/10</span><span class="pill">'+esc(t("streak"))+": "+num(st.n||0)+"</span></div>"+
    '<div class="row" style="margin-top:10px"><button class="btn" id="dailyBtn" type="button">'+esc(d.done?t("dailyDone"):t("dailyStart"))+"</button></div>";
  var b=$("dailyBtn"); if(b){b.onclick=dailyStart; if(d.done)b.disabled=true;}
}
function pintarAjustes(){
  var box=$("settingsBox"); if(!box) return;
  box.innerHTML='<div class="card" style="margin-top:14px"><h3>'+esc(t("aboutTitle"))+'</h3><button class="btn ghost" id="onbReset" type="button">'+esc(t("resetOnb"))+"</button></div>";
  $("onbReset").onclick=function(){store.set("onboard",false);location.reload();};
}
function pintarMas(){
  var box=$("homeMore"); if(!box) return;
  var extra=["manual","juego","escuelas","cdl","maniobras","cultura","acerca"];
  box.innerHTML=extra.map(function(v){return '<a class="chip" href="#'+v+'" style="text-decoration:none">'+esc(t("tabs")[v]||v)+"</a>";}).join("");
}

// ---------- Simulacro (se guarda después de cada respuesta) ----------
function guardarEx(){store.set(stpre()+"exam",EX?{ids:EX.qs.map(function(p){return p.id;}),ans:EX.ans,i:EX.i,done:EX.done}:null);}
function rehidratar(){if(EX&&EX.ids){var o=EX; EX={qs:o.ids.map(preparar),ans:o.ans||[],i:o.i||0,done:o.done};}}
function examLeadText(){
  var e=examCfg();
  var b=t("examPlan").replace("{t}",num(e.total)).replace("{p}",num(e.pass));
  if(e.signs) b+=" "+t("examSigns").replace("{m}",num(e.signs)).replace("{n}",num(e.signsPass));
  return b;
}
function examenIntro(){
  $("examAd").hidden=true;
  $("examCard").innerHTML='<h2>'+esc(t("examIntro"))+'</h2><div class="guide" style="margin:10px 0"><img src="'+img(P.guide.img)+'" alt="'+esc(P.guide.name)+'"><div class="bubble">'+esc(P.examLead||examLeadText())+'</div></div><button class="btn" id="exStart" type="button">'+esc(t("start"))+'</button>';
  $("exStart").onclick=examenNuevo;
}
function examCfg(){return C.exam||{total:20,pass:14,signs:4,signsPass:2};}
// El formato del examen cambia por estado: NY 20/14 + 2 de 4 señales; NJ 50/40 sin sección aparte.
function examenNuevo(){
  var e=examCfg(), signN=Math.min(e.signs||0,ALL_SIGNS.length), ruleN=Math.max(0,e.total-signN);
  var ids=shuffle(shuffle(ALL_RULES).slice(0,ruleN).concat(signN?shuffle(ALL_SIGNS).slice(0,signN):[]));
  EX={qs:ids.map(preparar),ans:[],i:0,done:false}; guardarEx(); examenPintar();
}
function examenPintar(){
  $("examAd").hidden=true;
  var p=EX.qs[EX.i], n=EX.qs.length, sel=EX.ans[EX.i], ops=opciones(p);
  var h=cabezaImg(p)+'<div class="qhead"><span class="pill">'+esc(t("question"))+' '+num(EX.i+1)+' '+esc(t("of"))+' '+num(n)+'</span><div class="progress" aria-hidden="true"><span style="width:'+(EX.i/n*100)+'%"></span></div></div>';
  h+='<div class="qtext">'+esc(textoPregunta(p))+'</div><p class="small muted" id="enText" hidden></p><div class="opts">'+ops.map(function(o,k){return '<button type="button" class="opt'+(sel===o.v?" sel":"")+'" data-k="'+k+'">'+esc(o.txt)+'</button>';}).join("")+'</div>'+toolsHtml(p.id)+'<div class="tools"><button type="button" class="linkbtn" id="enBtn">'+esc(t("seeEn"))+'</button></div>';
  h+='<div class="row" style="margin-top:14px"><button class="btn ghost" id="exPrev" type="button"'+(EX.i===0?" disabled":"")+'>'+esc(t("prev"))+'</button><button class="btn" id="exNext" type="button"'+(sel===undefined?" disabled":"")+'>'+esc(EX.i===n-1?t("finish"):t("next"))+'</button></div>';
  var c=$("examCard"); c.innerHTML=h; bindSay(c,p); bindEn(p,c,$('enBtn'));
  c.querySelectorAll(".opt").forEach(function(b){b.onclick=function(){EX.ans[EX.i]=ops[+b.dataset.k].v; guardarEx(); examenPintar();};});
  $("exPrev").onclick=function(){EX.i--; guardarEx(); examenPintar();};
  $("exNext").onclick=function(){if(EX.i===n-1) examenResultado(); else {EX.i++; guardarEx(); examenPintar();}};
}
function examenResultado(){
  var ok=0,sig=0,sigT=0;
  EX.qs.forEach(function(p,i){var b=EX.ans[i]===p.correct; if(b)ok++; if(p.sign){sigT++; if(b)sig++;}});
  var e=examCfg(), aprobado=ok>=e.pass&&(!e.signs||sig>=e.signsPass);
  if(!EX.done){EX.done=true; EX.qs.forEach(function(p,i){marcar(p.id,EX.ans[i]===p.correct);});
    var st=store.get("stats",{n:0,p:0,b:0}); st.n++; if(aprobado)st.p++; st.b=Math.max(st.b,ok); store.set("stats",st);
    var hist=store.get(stpre()+"hist",[]); hist.push({ok:ok,total:EX.qs.length,pass:aprobado}); store.set(stpre()+"hist",hist.slice(-10)); guardarEx();}
  var h='<div class="row"><span class="result-big">'+num(ok)+'/'+num(EX.qs.length)+'</span><span class="pill '+(aprobado?"ok":"bad")+'">'+esc(aprobado?t("passed"):t("failed"))+'</span></div>';
  h+='<div class="guide" style="margin:10px 0"><img src="'+img(P.guide.img)+'" alt="'+esc(P.guide.name)+'"><div class="bubble">'+esc(frase(aprobado?"right":"wrong"))+' '+num(ok)+' '+esc(t("correct"))+' · '+num(sig)+'/'+num(sigT)+' '+esc(t("signsOk"))+'</div></div>';
  if(ok>=e.pass&&e.signs&&sig<e.signsPass) h+='<p class="pill warn">'+esc(t("failSigns"))+'</p>';
  h+='<div class="row"><button class="btn" id="exAgain" type="button">'+esc(t("again"))+'</button></div><h3 style="margin-top:14px">'+esc(t("reviewTitle"))+'</h3><div class="review">';
  EX.qs.forEach(function(p,i){var b=EX.ans[i]===p.correct;
    h+='<div class="'+(b?"ok":"bad")+'"><b>'+num(i+1)+'. '+esc(textoPregunta(p))+(p.sign?' ('+esc(P.signs[p.sign])+')':'')+'</b><br>';
    if(!b) h+='<span class="small">'+esc(t("yourAns"))+': '+esc(textoValor(p,EX.ans[i]))+'</span><br>';
    h+='<span class="small">'+esc(t("rightAns"))+': '+esc(textoValor(p,p.correct))+'</span><br><span class="small muted">'+explicacion(p)+'</span></div>';});
  $("examCard").innerHTML=h+'</div>';
  $("exAgain").onclick=examenNuevo; $("examAd").hidden=false; pintarInicio();
}

// ---------- Práctica por tema y "mis errores" ----------

function pintarDominadas(){var n=Object.keys(MAST).length; $("masteredPill").textContent=n>=TOTAL?t("allDone"):fmt(t("mastered"),{n:num(n),t:num(TOTAL)});}
function hechos(ch){ if(ch==="S") return C.signs.map(function(k){return {id:"s:"+k,txt:P.signs[k],sign:k};});
  return C.rules.map(function(r,i){return {id:"r"+i,ch:String(r.ch),txt:P.q[i][2]};}).filter(function(x){return x.ch===ch;}); }
function panelManual(p,revelar){
  var ch=p.ch, lista=hechos(ch);
  var h='<h3>'+ic("book")+" "+esc(t("fromManual"))+' · '+esc(ch==="S"?P.chapters.S:manRef(ch)+" "+P.chapters[ch])+'</h3>';
  if(ch==="S"&&!revelar) h+='<p class="small muted">'+esc(t("practiceLead"))+'</p>';
  else if(ch==="S") h+='<div class="signgrid">'+lista.map(function(x){return '<div'+(revelar&&x.id===p.id?' style="outline:3px solid var(--warn);border-radius:8px"':'')+'>'+svgSenal(x.sign)+esc(x.txt)+'</div>';}).join("")+'</div>';
  else h+='<ul class="facts-list">'+lista.map(function(x){return '<li'+(revelar&&x.id===p.id?' class="hit" id="factHit"':'')+'>'+esc(x.txt)+'</li>';}).join("")+'</ul>';
  h+='<p class="small" style="margin-top:10px"><a href="'+C.fuentes[ch]+'" target="_blank" rel="noopener">'+esc(t("official"))+' ↗</a></p>';
  $("practiceSide").innerHTML=h;
  var hit=$("factHit"); if(hit&&window.innerWidth>=900) hit.scrollIntoView({block:"nearest"});
}
function pintarChips(){
  var chs=["all"].concat(Object.keys(P.chapters)); if(Object.keys(MISS).length) chs.push("miss");
  $("chapterChips").innerHTML=chs.map(function(c){var lab=c==="all"?t("studyAll")+" · "+num(TOTAL):c==="miss"?"↻ "+num(Object.keys(MISS).length):(c==="S"?P.chapters.S:c+" · "+P.chapters[c]);return '<button type="button" class="chip" data-c="'+c+'" aria-pressed="'+(PR.ch===c)+'">'+esc(lab)+'</button>';}).join("");
  $("chapterChips").querySelectorAll(".chip").forEach(function(b){b.onclick=function(){practicaNueva(b.dataset.c);};});
}
function practicaNueva(c){
  PR.ch=c; PR.i=0; PR.ok=0;
  var ids=c==="miss"?Object.keys(MISS):c==="all"?(function(){var todos=ALL_RULES.concat(ALL_SIGNS);var pend=shuffle(todos.filter(function(id){return !MAST[id];}));return pend.length?pend:shuffle(todos);})():c==="S"?ALL_SIGNS:ALL_RULES.filter(function(id){return String(C.rules[+id.slice(1)].ch)===c;});
  PR.qs=(c==="all"?ids:shuffle(ids)).map(preparar); pintarChips(); pintarDominadas(); practicaPintar();
}
function practicaPintar(){
  var c=$("practiceCard");
  if(!PR.qs.length){c.innerHTML='<p class="muted">—</p>';$("practiceSide").innerHTML="";return;}
  if(PR.i>=PR.qs.length){c.innerHTML='<h3>'+esc(t("done"))+'</h3><p class="result-big">'+num(PR.ok)+'/'+num(PR.qs.length)+'</p><button class="btn" id="prAgain" type="button">'+esc(t("again"))+'</button>';$("prAgain").onclick=function(){practicaNueva(PR.ch==="miss"&&!Object.keys(MISS).length?"all":PR.ch);};pintarInicio();return;}
  var p=PR.qs[PR.i], ops=opciones(p), done=false; panelManual(p,false);
  var h=cabezaImg(p)+'<div class="qhead"><span class="pill">'+num(PR.i+1)+' / '+num(PR.qs.length)+'</span><span class="pill">'+esc(t("score"))+': '+num(PR.ok)+'</span></div>';
  h+='<div class="qtext">'+esc(textoPregunta(p))+'</div><p class="small muted" id="enText" hidden></p><div class="opts">'+ops.map(function(o,k){return '<button type="button" class="opt" data-k="'+k+'">'+esc(o.txt)+'</button>';}).join("")+'</div>'+toolsHtml(p.id)+'<div class="tools"><button type="button" class="linkbtn" id="enBtn">'+esc(t("seeEn"))+'</button></div><div id="prFb"></div>';
  c.innerHTML=h; bindSay(c,p); bindEn(p,c,$('enBtn'));
  c.querySelectorAll(".opt").forEach(function(b){b.onclick=function(){
    if(done)return; done=true; var v=ops[+b.dataset.k].v, bien=v===p.correct; if(bien)PR.ok++; else buzz(); marcar(p.id,bien);
    if(PR.ch==="daily"){var dly=dailyState();dly.i=PR.i+1;dly.ok=PR.ok;if(dly.i>=10){dly.done=true;bumpStreak();}store.set(stpre()+"daily",dly);} if(bien) MAST[p.id]=1; else delete MAST[p.id]; store.set(stpre()+"mast",MAST); pintarDominadas(); panelManual(p,true);
    c.querySelectorAll(".opt").forEach(function(x){var xv=ops[+x.dataset.k].v; x.disabled=true; if(xv===p.correct)x.classList.add("right"); else if(x===b)x.classList.add("wrong");});
    $("prFb").innerHTML='<div class="explain guide"><img src="'+img(P.guide.img)+'" alt="'+esc(P.guide.name)+'"><div class="bubble"><b>'+esc(frase(bien?"right":"wrong"))+'</b>'+explicacion(p)+'</div></div><div class="row" style="margin-top:12px"><button class="btn" id="prNext" type="button">'+esc(t("next"))+'</button></div>';
    $("prNext").onclick=function(){PR.i++; practicaPintar();}; $("prNext").focus({preventScroll:true});
  };});
}

// ---------- Manual: guía de estudio por capítulo ----------
var MANCH="all";
function pintarManual(){
  var chs=Object.keys(P.chapters);
  $("manualChips").innerHTML=["all"].concat(chs).map(function(c){var lab=c==="all"?t("allTopics"):(c==="S"?P.chapters.S:c+" · "+P.chapters[c]);return '<button type="button" class="chip" data-c="'+c+'" aria-pressed="'+(MANCH===c)+'">'+esc(lab)+'</button>';}).join("");
  $("manualChips").querySelectorAll(".chip").forEach(function(b){b.onclick=function(){MANCH=b.dataset.c; pintarManual();};});
  $("manualList").innerHTML=chs.filter(function(c){return MANCH==="all"||MANCH===c;}).map(function(c){
    var lista=hechos(c), titulo=c==="S"?P.chapters.S:manRef(c)+" · "+P.chapters[c];
    var cuerpo=c==="S"?'<div class="signgrid">'+lista.map(function(x){return '<div>'+svgSenal(x.sign)+esc(x.txt)+'</div>';}).join("")+'</div>':'<ul class="facts-list" style="font-size:15px">'+lista.map(function(x){return '<li style="color:var(--ink)">'+esc(x.txt)+'</li>';}).join("")+'</ul>';
    return '<div class="card chcard"><div class="head"><img src="'+chImg(c)+'" alt="'+esc(P.chapters[c]||"")+'" loading="lazy"></div><h3>'+esc(titulo)+'</h3>'+cuerpo+
      '<div class="row" style="margin-top:12px"><button class="btn" type="button" data-pr="'+c+'">'+esc(t("practiceCh"))+'</button>'+(hasVoice()?'<button class="btn ghost" type="button" data-say-ch="'+c+'">'+ic("speaker")+' '+esc(t("readCh"))+'</button>':'')+'<a class="small" href="'+C.fuentes[c]+'" target="_blank" rel="noopener">'+esc(t("official"))+' ↗</a></div></div>';
  }).join("");
  $("manualList").querySelectorAll("[data-pr]").forEach(function(b){b.onclick=function(){location.hash="#practica"; practicaNueva(b.dataset.pr);};});
  $("manualList").querySelectorAll("[data-say-ch]").forEach(function(b){b.onclick=function(){speak(hechos(b.dataset.sayCh).map(function(x){return x.txt;}).join(". "));};});
}

// ---------- Juegos ----------
var GM=null;
function gp(){return P.games||(window.GAMES&&window.GAMES[LANG])||null;}
function gbest(mode){return store.get(stpre()+"game_"+mode,{best:0,stars:0});}
function gsave(mode,pts,stars){var r=gbest(mode); if(pts>r.best){r.best=pts; r.stars=Math.max(r.stars,stars); store.set(stpre()+"game_"+mode,r); return true;} return false;}
function starsFor(pts,t1,t2,t3){return pts>=t3?3:pts>=t2?2:pts>=t1?1:0;}
function starsHtml(n){var s=""; for(var i=0;i<3;i++) s+=ic(i<n?"starOn":"star"); return s;}
function gmStop(){if(GM&&GM.timer){clearInterval(GM.timer); GM.timer=null;}}
function juegoIntro(){
  gmStop(); GM=null;
  var g=gp(); if(!g){$("gameCard").innerHTML="";return;}
  var modes=[["who",g.g1],["numbers",g.g2],["tf",g.g3],["signs",g.g4]];
  var h='<h2>'+esc(g.hubTitle)+"</h2><p>"+esc(g.hubLead)+"</p><div class=\"grid g2\" style=\"margin-top:12px\">";
  h+=modes.map(function(m){var r=gbest(m[0]); return '<div class="card" role="button" tabindex="0" data-gm="'+m[0]+'" style="text-align:start;cursor:pointer"><h3>'+esc(m[1].name)+"</h3><p class=\"small muted\">"+esc(m[1].desc)+"</p><p class=\"small\">"+esc(g.labels.best)+": <b>"+num(r.best)+"</b> · "+starsHtml(r.stars)+"</p></div>";}).join("");
  h+="</div>";
  $("gameCard").innerHTML=h;
  $("gameCard").querySelectorAll("[data-gm]").forEach(function(b){b.onclick=function(){startGame(b.dataset.gm);}; b.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();startGame(b.dataset.gm);}};});
}
function startGame(mode){
  gmStop();
  if(mode==="signs") return signsSetup();
  if(mode==="numbers") return startNumbers();
  if(mode==="tf") return startTF();
  if(mode==="who") return startWho();
}
function gameLayout(g,body,extra){
  var h='<div class="row" style="justify-content:space-between"><button class="btn ghost" id="gmBack" type="button">← '+esc(g.labels.back)+"</button>";
  h+='<div class="gamebar"><div><b id="gmTime">'+num(GM.t)+"</b>"+esc(g.labels.timeLeft)+"</div><div><b>"+num(GM.pts)+"</b>"+esc(g.labels.score)+"</div></div></div>";
  h+=body;
  $("gameCard").innerHTML=h+(extra||"");
  var back=$("gmBack"); if(back) back.onclick=juegoIntro;
}
// --- Señales: categorías, dos sentidos de pregunta, niveles, rachas y estrellas ---
var SIGCAT="all", SIGMISS=false;
function signPool(cat,onlyMiss){
  var list=C.signs.filter(function(k){return (cat==="all"||(C.signcat&&C.signcat[k])===cat)&&(!onlyMiss||MISS["s:"+k]);});
  return list.length?list:C.signs.slice();
}
function signsSetup(){
  var g=gp(); gmStop(); GM=null;
  var cats=[["all",g.labels.all],["reg",g.labels.reg],["warn",g.labels.warn],["rail",g.labels.rail],["work",g.labels.work],["guide",g.labels.guide]];
  var h='<div class="row" style="justify-content:space-between"><button class="btn ghost" id="gmBack" type="button">← '+esc(g.labels.back)+"</button></div>";
  h+="<h2>"+esc(g.g4.name)+"</h2><p>"+esc(g.g4.desc)+"</p>";
  h+='<div class="chips">'+cats.map(function(c){var n=signPool(c[0],false).length;return '<button type="button" class="chip" data-cat="'+c[0]+'" aria-pressed="'+(SIGCAT===c[0])+'">'+esc(c[1])+" · "+num(n)+"</button>";}).join("")+"</div>";
  var miss=Object.keys(MISS).filter(function(k){return k.indexOf("s:")===0;}).length;
  h+='<div class="chips" style="margin-top:10px"><button type="button" class="chip" id="gmMiss" aria-pressed="'+SIGMISS+'"'+(miss?"":" disabled")+">"+esc(g.labels.mistakes)+" · "+num(miss)+"</button></div>";
  h+='<div class="row" style="margin-top:14px"><button class="btn" id="gmStart" type="button">'+esc(g.labels.start)+"</button></div>";
  $("gameCard").innerHTML=h;
  $("gmBack").onclick=juegoIntro;
  $("gameCard").querySelectorAll("[data-cat]").forEach(function(b){b.onclick=function(){SIGCAT=b.dataset.cat;signsSetup();};});
  $("gmMiss").onclick=function(){if(miss){SIGMISS=!SIGMISS;signsSetup();}};
  $("gmStart").onclick=function(){startSigns(SIGCAT,SIGMISS);};
}
function startSigns(cat,onlyMiss){
  var g=gp();
  var pool=signPool(cat||"all",!!onlyMiss);
  GM={mode:"signs",t:60,pts:0,streak:0,right:0,level:1,pool:pool,last:null,cat:cat||"all",miss:!!onlyMiss};
  GM.timer=setInterval(function(){GM.t--;var e=$("gmTime");if(e)e.textContent=num(GM.t);if(GM.t<=0)signsEnd();},1000);
  signsRound();
}
function signsRound(){
  var g=gp(),pool=GM.pool,k;
  do{k=pool[Math.floor(Math.random()*pool.length)];}while(k===GM.last&&pool.length>1);
  GM.last=k;
  var dir=Math.random()<0.5?"sm":"ms";
  var opts=shuffle([k].concat(shuffle(pool.filter(function(x){return x!==k;})).slice(0,3)));
  var correctAt=opts.indexOf(k);
  var h='<div class="qhead"><span class="pill">'+esc(g.labels.level)+" "+num(GM.level)+'</span><span class="pill">×'+num(1+Math.floor(GM.streak/3))+"</span></div>";
  if(dir==="sm"){
    h+='<div class="signbox">'+svgSenal(k)+"</div>";
    h+='<div class="opts">'+opts.map(function(key,i){return '<button type="button" class="opt" data-k="'+i+'">'+esc(P.signs[key])+"</button>";}).join("")+"</div>";
  } else {
    h+='<div class="qtext">'+esc(P.signs[k])+"</div>";
    h+='<div class="signopts">'+opts.map(function(key,i){return '<button type="button" class="signopt" data-k="'+i+'" aria-label="'+esc(P.signs[key])+'">'+svgSenal(key)+"</button>";}).join("")+"</div>";
  }
  h+='<div id="gmFb"></div>';
  gameLayout(g,h);
  document.querySelectorAll("#gameCard .opt, #gameCard .signopt").forEach(function(b){
    b.onclick=function(){
      var chosen=opts[+b.dataset.k],bien=chosen===k,all=document.querySelectorAll("#gameCard .opt, #gameCard .signopt");
      if(bien){GM.streak++;GM.right++;GM.pts+=1+Math.floor((GM.streak-1)/3)+(GM.level-1);if(GM.right%8===0)GM.level++;}
      else {GM.streak=0;buzz();MISS["s:"+k]=1;store.set(stpre()+"miss",MISS);}
      all.forEach(function(x){x.disabled=true;var i=+x.dataset.k;if(i===correctAt)x.classList.add("right");else if(x===b)x.classList.add("wrong");});
      $("gmFb").innerHTML='<div class="explain"><div class="bubble">'+esc(P.signs[k])+' · <a href="'+C.fuentes.S+'" target="_blank" rel="noopener">'+esc(t("signsChart"))+"</a></div></div>";
      setTimeout(function(){if(GM&&GM.timer)signsRound();},bien?320:1500);
    };
  });
}
function signsEnd(){
  var g=gp(); gmStop();
  var stars=starsFor(GM.pts,15,30,50),rec=gsave("signs",GM.pts,stars);
  var h='<h2>'+esc(g.labels.finish)+"</h2><p class=\"result-big\">"+num(GM.pts)+"</p><p>"+starsHtml(stars)+(rec?' <span class="pill ok">'+esc(g.labels.best)+"</span>":"")+"</p>";
  h+='<div class="row"><button class="btn" id="gmAgain" type="button">'+esc(g.labels.again)+"</button></div>";
  $("gameCard").innerHTML=h;
  var cat=GM.cat,miss=GM.miss;
  $("gmAgain").onclick=function(){startSigns(cat,miss);};
  pintarInicio();
}
// --- Números: la respuesta correcta es una cifra ---
function numberBank(){
  var out=[];
  for(var i=0;i<C.rules.length;i++){ var correct=P.q[i][1][C.rules[i].a]; if(/\d/.test(correct)) out.push(i); }
  return out;
}
function startNumbers(){
  var bank=numberBank(); if(!bank.length) return juegoIntro();
  GM={mode:"numbers",t:60,pts:0,right:0,bank:bank,used:[]};
  GM.timer=setInterval(function(){GM.t--; var e=$("gmTime"); if(e)e.textContent=num(GM.t); if(GM.t<=0)quickEnd("numbers",15,30,45);},1000);
  numbersRound();
}
function numbersRound(){
  var g=gp(); if(GM.used.length>=GM.bank.length) GM.used=[];
  var pool=GM.bank.filter(function(i){return GM.used.indexOf(i)<0;});
  var qi=pool[Math.floor(Math.random()*pool.length)]; GM.used.push(qi);
  var p=preparar("r"+qi), ops=opciones(p), correct=P.q[qi][1][C.rules[qi].a];
  var h='<div class="qtext">'+esc(P.q[qi][0])+"</div><div class=\"opts\">"+ops.map(function(o,i){return '<button type="button" class="opt" data-k="'+i+'">'+esc(o.txt)+"</button>";}).join("")+"</div><div id=\"gmFb\"></div>";
  gameLayout(g,h);
  document.querySelectorAll("#gameCard .opt").forEach(function(b){
    b.onclick=function(){
      var v=ops[+b.dataset.k].v, bien=v===p.correct;
      if(bien) GM.pts+=2; else buzz();
      document.querySelectorAll("#gameCard .opt").forEach(function(x){x.disabled=true; var xv=ops[+x.dataset.k].v; if(xv===p.correct)x.classList.add("right"); else if(x===b)x.classList.add("wrong");});
      if(!bien) $("gmFb").innerHTML='<div class="explain"><div class="bubble">'+esc(correct)+"</div></div>";
      setTimeout(function(){if(GM&&GM.timer)numbersRound();},bien?260:1100);
    };
  });
}
// --- Verdadero o falso, 60 segundos ---
function startTF(){
  GM={mode:"tf",t:60,pts:0,right:0};
  GM.timer=setInterval(function(){GM.t--; var e=$("gmTime"); if(e)e.textContent=num(GM.t); if(GM.t<=0)quickEnd("tf",10,20,30);},1000);
  tfRound();
}
function tfRound(){
  var g=gp();
  var qi=Math.floor(Math.random()*C.rules.length);
  var correct=C.rules[qi].a, shownIdx = Math.random()<0.5 ? correct : ((correct+1+Math.floor(Math.random()*3))%4);
  var isTrue = shownIdx===correct;
  var h='<div class="qtext">'+esc(P.q[qi][0])+"</div>";
  h+='<p class="pill" style="display:block;margin:6px 0">'+esc(P.q[qi][1][shownIdx])+"</p>";
  h+='<div class="row"><button class="btn" id="tfT" type="button">'+esc(g.labels.right)+"</button><button class=\"btn ghost\" id=\"tfF\" type=\"button\">"+esc(g.labels.wrong)+"</button></div><div id=\"gmFb\"></div>";
  gameLayout(g,h);
  var answer=function(saysTrue){
    var ok=(saysTrue===isTrue); if(ok) GM.pts+=2; else buzz();
    $("tfT").disabled=true; $("tfF").disabled=true;
    $("gmFb").innerHTML='<div class="explain"><div class="bubble"><b>'+(isTrue?ic("check"):ic("cross"))+"</b> "+esc(P.q[qi][1][correct])+"<br><span class=\"small muted\">"+esc(P.q[qi][2])+"</span></div></div>";
    setTimeout(function(){if(GM&&GM.timer)tfRound();},ok?350:1300);
  };
  $("tfT").onclick=function(){answer(true);}; $("tfF").onclick=function(){answer(false);};
}
// --- ¿Quién pasa primero? ---
function startWho(){
  var g=gp(); if(!g||!g.who) return juegoIntro();
  GM={mode:"who",t:90,pts:0,i:0,total:g.who.length};
  GM.timer=setInterval(function(){GM.t--; var e=$("gmTime"); if(e)e.textContent=num(GM.t); if(GM.t<=0)quickEnd("who",3,5,6);},1000);
  whoRound();
}
function carSvg(){
  var car=function(x,y,id,label){return '<g class="gcar" data-id="'+id+'" style="cursor:pointer" transform="translate('+x+','+y+')">'+
    '<rect x="-24" y="-16" width="48" height="32" rx="7" fill="#0b6e4f" stroke="#fff" stroke-width="2"/>'+
    '<text x="0" y="6" text-anchor="middle" font-size="18" font-weight="700" fill="#fff">'+label+"</text></g>";};
  return '<svg viewBox="0 0 300 300" role="img" aria-label="Intersection" style="max-width:320px;display:block;margin:0 auto">'+
    '<rect x="0" y="0" width="300" height="300" fill="#e7ece8"/>'+
    '<rect x="115" y="0" width="70" height="300" fill="#8d9a92"/>'+
    '<rect x="0" y="115" width="300" height="70" fill="#8d9a92"/>'+
    '<rect x="148" y="10" width="4" height="105" fill="#f2b705"/>'+
    '<rect x="148" y="185" width="4" height="105" fill="#f2b705"/>'+
    car(150,45,"S","C")+car(255,150,"W","D")+car(150,255,"N","A")+car(45,150,"E","B")+
    '<g class="gcar" data-id="P" style="cursor:pointer" transform="translate(205,95)"><circle r="14" fill="#1d4f9a"/><text y="5" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">P</text></g>'+
    '<g class="gcar" data-id="E" style="cursor:pointer" transform="translate(95,205)"><rect x="-16" y="-13" width="32" height="26" rx="5" fill="#b3261e"/><text y="5" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">E</text></g>'+
    "</svg>";
}
function whoRound(){
  var g=gp(), sc=g.who[GM.i];
  var h='<p class="small">'+esc(g.labels.tapCar)+"</p><p><b>"+esc(sc.cap)+"</b></p>"+carSvg();
  gameLayout(g,h);
  document.querySelectorAll("#gameCard .gcar").forEach(function(el){
    el.onclick=function(){
      var ok=el.dataset.id===sc.a; if(ok) GM.pts++;
      document.querySelectorAll("#gameCard .gcar").forEach(function(x){x.style.opacity=x.dataset.id===sc.a?"1":".45";});
      $("gmFb").innerHTML='<div class="explain"><div class="bubble">'+(ok?ic("check"):ic("cross"))+" "+esc(sc.e)+"</div></div>"+'<div class="row" style="margin-top:10px"><button class="btn" id="gmNext" type="button">'+esc(g.labels.next)+"</button></div>";
      $("gmNext").onclick=function(){ GM.i++; if(GM.i>=GM.total) return quickEnd("who",3,5,6); whoRound(); };
    };
  });
}
function quickEnd(mode,t1,t2,t3){
  var g=gp(); gmStop();
  var stars=starsFor(GM.pts,t1,t2,t3), rec=gsave(mode,GM.pts,stars);
  var h='<h2>'+esc(g.labels.finish)+"</h2><p class=\"result-big\">"+num(GM.pts)+"</p><p>"+starsHtml(stars)+(rec?' <span class="pill ok">'+esc(g.labels.best)+"</span>":"")+"</p>";
  h+='<div class="row"><button class="btn" id="gmAgain" type="button">'+esc(g.labels.again)+"</button><button class=\"btn ghost\" id=\"gmHub\" type=\"button\">"+esc(g.labels.back)+"</button></div>";
  $("gameCard").innerHTML=h;
  $("gmAgain").onclick=function(){startGame(mode);}; $("gmHub").onclick=juegoIntro;
  pintarInicio();
}
// ---------- Licencia comercial (CDL): curso, repaso y juegos ----------
var CDL={view:"home",mod:null,les:null,qi:0,ans:[],res:null,en:false,game:null,order:[],step:0};
function cc(){var a=(P.course||(window.CDLCOURSE&&window.CDLCOURSE[LANG])||{}),b=P.cdl||{},o={};
  for(var k in b)o[k]=b[k]; for(var j in a)o[j]=a[j]; return o;}
function cen(){return (window.CDLCOURSE&&window.CDLCOURSE.en)||null;}
function cplan(){return store.get("cdl_plan",null);}
function cprog(){return store.get("cdl_prog",{});}
function cqid(m,l,i){return m+"/"+l+"/"+i;}
function cwhen(b){var ms=[0,10*60e3,24*36e5,3*864e5,7*864e5,21*864e5];return Date.now()+(ms[Math.min(b,5)]||0);}
function cmark(id,ok){var p=cprog(),r=p[id]||{b:1};r.b=ok?Math.min(5,(r.b||1)+1):1;r.d=cwhen(r.b);p[id]=r;store.set("cdl_prog",p);}
function cmods(){var p=cplan();if(!p)return [];var c=cc();return (c.modulesList||[]).filter(function(m){return p.need.indexOf(m.id)>=0;});}
function ctotal(){var n=0;cmods().forEach(function(m){m.lessons.forEach(function(l){n+=l.q.length;});});return n;}
function cdone(){var p=cprog(),n=0;cmods().forEach(function(m){m.lessons.forEach(function(l,i){l.q.forEach(function(_,j){if((p[cqid(m.id,l.id,j)]||{}).b>=3)n++;});});});return n;}
function cnextLesson(){var p=cprog();var ms=cmods();for(var a=0;a<ms.length;a++){for(var b=0;b<ms[a].lessons.length;b++){var l=ms[a].lessons[b],done=l.q.filter(function(_,j){return (p[cqid(ms[a].id,l.id,j)]||{}).b>=3;}).length;if(done<l.q.length)return {m:ms[a],l:l};}}return null;}
function clessonQ(m,l){return l.q;}
function cPracticePool(){var out=[],ms=cmods();ms.forEach(function(m){m.lessons.forEach(function(l){l.q.forEach(function(q,i){out.push({m:m.id,l:l.id,i:i,q:q});});});});return out;}
function cshuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),x=a[i];a[i]=a[j];a[j]=x;}return a;}

function pintarCdl(){
  var c=cc(); if(!c){$("cdlCard").innerHTML="";return;}
  if(CDL.view==="lesson"&&cplan()) return pintarLeccion();
  if((CDL.view==="mock"||CDL.view==="review")&&CDL.pool&&CDL.pool.length) return pintarMock();
  if(CDL.view==="gloss") return pintarGlosario();
  if(CDL.view==="game") return pintarJuegoCdl();
  var h='<div class="row" style="justify-content:space-between;align-items:center"><h2 style="margin:0">'+esc(c.title||"CDL")+"</h2>";
  var plan=cplan();
  if(plan){h+='<button class="btn ghost" id="cdlPlanBtn" type="button">'+esc(c.change||"Change plan")+"</button>";}
  h+="</div>";
  h+='<p class="pill warn" style="display:block;margin:10px 0">'+esc(c.notice||"")+"</p>";
  h+='<p class="small"><a href="'+esc(ST.cdl||"#")+'" target="_blank" rel="noopener">'+esc(c.hOfficial||"CDL manual")+' ↗</a> · <a href="https://www.fmcsa.dot.gov" target="_blank" rel="noopener">FMCSA ↗</a> · <a href="https://tpr.fmcsa.dot.gov" target="_blank" rel="noopener">ELDT ↗</a> · <a href="https://nationalregistry.fmcsa.dot.gov" target="_blank" rel="noopener">Medical ↗</a></p>';
  if(!plan){h+=cdlSetup(c);}else{h+=cdlHome(c,plan);}
  $("cdlCard").innerHTML=h;
  if(!plan)cdlSetupBind(c); else cdlHomeBind(c);
}

// Arranque: plan de 30 segundos
function cdlSetup(c){
  var p=CDL.setup||{v:"A",air:"yes",permit:"no"};CDL.setup=p;
  var h='<h3>'+esc(c.plan.qWhat)+"</h3><div class=\"chips\">"+c.plan.vehicles.map(function(v){return '<button type="button" class="chip" data-v="'+v.id+'" aria-pressed="'+(p.v===v.id)+'">'+esc(v.t)+"</button>";}).join("")+"</div>";
  h+='<h3 style="margin-top:14px">'+esc(c.plan.qAir)+"</h3><div class=\"chips\">"+c.plan.air.map(function(a){return '<button type="button" class="chip" data-air="'+a.id+'" aria-pressed="'+(p.air===a.id)+'">'+esc(a.t)+"</button>";}).join("")+"</div>";
  if(p.air==="dunno")h+='<p class="small muted">'+esc(c.airHint||"Air brakes have a compressor, gauges and a low pressure warning. If your vehicle has none of these, it has hydraulic brakes.")+"</p>";
  h+='<h3 style="margin-top:14px">'+esc(c.plan.qPermit)+"</h3><div class=\"chips\">"+c.plan.permit.map(function(a){return '<button type="button" class="chip" data-per="'+a.id+'" aria-pressed="'+(p.permit===a.id)+'">'+esc(a.t)+"</button>";}).join("")+"</div>";
  h+='<div class="row" style="margin-top:16px"><button class="btn" id="cdlMake" type="button">'+esc(c.plan.start)+"</button></div>";
  return h;
}
function cdlSetupBind(c){
  var box=$("cdlCard");
  box.querySelectorAll("[data-v]").forEach(function(b){b.onclick=function(){CDL.setup.v=b.dataset.v;pintarCdl();};});
  box.querySelectorAll("[data-air]").forEach(function(b){b.onclick=function(){CDL.setup.air=b.dataset.air;pintarCdl();};});
  box.querySelectorAll("[data-per]").forEach(function(b){b.onclick=function(){CDL.setup.permit=b.dataset.per;pintarCdl();};});
  $("cdlMake").onclick=function(){
    var p=CDL.setup, veh=c.plan.vehicles.filter(function(x){return x.id===p.v;})[0];
    var need=veh.need.slice();
    if(p.air==="no")need=need.filter(function(x){return x!=="air";});
    store.set("cdl_plan",{v:p.v,air:p.air,permit:p.permit,need:need,done:false});
    pintarCdl();
  };
}

// Pantalla principal del plan
function cdlHome(c,plan){
  var mods=cmods(),done=cdone(),tot=ctotal();
  var h='<div class="chips" style="justify-content:space-between"><b>'+esc(c.plan.planTitle)+"</b><span>"+num(done)+"/"+num(tot)+"</span></div>";
  h+='<div class="progress" style="margin:8px 0 14px"><span style="width:'+(tot?Math.round(done/tot*100):0)+'%"></span></div>';
  var nxt=cnextLesson();
  h+='<div class="row" style="margin-bottom:12px"><button class="btn" id="cdlGo" type="button">'+esc(nxt?c.resume:c.start)+"</button>";
  h+='<button class="btn ghost" id="cdlReview" type="button">'+esc(c.reviewToday)+"</button></div>";
  h+='<div class="chips">'+mods.map(function(m){var p=cprog(),n=0,t=0;m.lessons.forEach(function(l){l.q.forEach(function(_,j){t++;if(((p[cqid(m.id,l.id,j)]||{}).b)>=3)n++;});});return '<button class="chip" data-mod="'+m.id+'" aria-pressed="false">'+esc(m.name)+" · "+num(n)+"/"+num(t)+"</button>";}).join("")+"</div>";
  h+='<div class="grid g2" style="margin-top:14px">';
  mods.forEach(function(m){
    h+='<div class="card"><h3>'+esc(m.name)+"</h3><p class=\"small muted\">"+esc(m.desc||"")+"</p><ol class=\"small\" style=\"padding-inline-start:18px\">";
    m.lessons.forEach(function(l,li){
      var p=cprog(),d=l.q.filter(function(_,j){return ((p[cqid(m.id,l.id,j)]||{}).b)>=3;}).length;
      h+='<li><a href="#" data-les="'+m.id+'|'+l.id+'">'+esc(l.name)+"</a> <span class=\"muted\">"+num(d)+"/"+num(l.q.length)+"</span></li>";
    });
    h+="</ol></div>";
  });
  h+="</div>";
  h+='<div class="row" style="margin-top:14px"><button class="btn ghost" id="cdlMock" type="button">'+esc(c.practice)+"</button>";
  h+='<button class="btn ghost" id="cdlGloss" type="button">'+esc(c.glossaryTitle)+"</button></div>";
  h+='<p class="small muted">'+esc(c.practiceLead)+"</p>";
  h+=cdlGames(c);
  return h;
}
function cdlHomeBind(c){
  var box=$("cdlCard");
  var go=$("cdlGo");if(go)go.onclick=function(){var n=cnextLesson();if(n)abrirLeccion(n.m.id,n.l.id);else abrirMock();};
  var rv=$("cdlReview");if(rv)rv.onclick=abrirRepaso;
  var mk=$("cdlMock");if(mk)mk.onclick=abrirMock;
  var gl=$("cdlGloss");if(gl)gl.onclick=abrirGlosario;
  box.querySelectorAll("[data-les]").forEach(function(a){a.onclick=function(ev){ev.preventDefault();var x=a.dataset.les.split("|");abrirLeccion(x[0],x[1]);};});
  var ch=$("cdlPlanBtn");if(ch)ch.onclick=function(){store.set("cdl_plan",null);CDL.view="home";pintarCdl();};
  cdlGamesBind(c);
}

// Lección
function abrirLeccion(mid,lid){CDL.view="lesson";CDL.mod=mid;CDL.les=lid;CDL.qi=0;CDL.ans=[];pintarCdl();}
function cLesson(){var ms=cmods();for(var i=0;i<ms.length;i++){if(ms[i].id===CDL.mod){for(var j=0;j<ms[i].lessons.length;j++){if(ms[i].lessons[j].id===CDL.les)return {m:ms[i],l:ms[i].lessons[j]};}}}return null;}
function pintarLeccion(){
  var x=cLesson(),c=cc();if(!x){CDL.view="home";return pintarCdl();}
  var l=x.l,q=l.q[CDL.qi];
  var h='<div class="row" style="justify-content:space-between"><button class="btn ghost" id="cdlBack" type="button">← '+esc(c.back)+"</button><span class=\"pill\">"+esc(l.name)+" · "+num(CDL.qi+1)+"/"+num(l.q.length)+"</span></div>";
  if(CDL.qi===0)h+='<div class="card" style="margin:12px 0;border-left:5px solid var(--warn)"><b>'+esc(l.name)+"</b><p style=\"margin:6px 0 0\">"+esc(l.idea)+"</p></div>";
  h+='<div class="qtext">'+esc(q.q)+"</div>";
  if(CDL.en){var e=cenq(x.m.id,l.id,CDL.qi);if(e)h+='<p class="small muted">EN: '+esc(e.q)+"</p>";}
  h+='<div class="opts">'+q.o.map(function(o,k){var cls="opt";if(CDL.ans.length){if(k===q.a)cls+=" right";else if(k===CDL.ans[0])cls+=" wrong";}return '<button type="button" class="'+cls+'" data-k="'+k+'"'+(CDL.ans.length?" disabled":"")+">"+esc(o)+"</button>";}).join("")+"</div>";
  h+='<div class="row" style="margin-top:10px"><button class="btn ghost" id="cdlEn" type="button">'+esc(CDL.en?c.hideEn:c.seeEn)+"</button>";
  if(hasVoice())h+='<button class="btn ghost" id="cdlSay" type="button">'+ic("speaker")+' '+esc(t("listen"))+"</button>";
  h+="</div>";
  if(CDL.ans.length){h+='<div class="explain"><div class="bubble">'+esc(q.e)+"</div></div>";
    h+='<div class="row" style="margin-top:10px"><button class="btn" id="cdlNextQ" type="button">'+esc(CDL.qi===l.q.length-1?c.finish:c.next)+"</button></div>";}
  $("cdlCard").innerHTML=h;
  $("cdlBack").onclick=function(){CDL.view="home";pintarCdl();};
  $("cdlEn").onclick=function(){CDL.en=!CDL.en;pintarLeccionEn();};
  var sy=$("cdlSay");if(sy)sy.onclick=function(){speak(q.q+". "+q.o.join(". "));};
  $("cdlCard").querySelectorAll(".opt").forEach(function(b){b.onclick=function(){
    if(CDL.ans.length)return;var v=+b.dataset.k;CDL.ans=[v];cmark(cqid(x.m.id,l.id,CDL.qi),v===q.a);pintarLeccion();
  };});
  var nx=$("cdlNextQ");if(nx)nx.onclick=function(){if(CDL.qi===l.q.length-1){CDL.view="home";pintarCdl();}else{CDL.qi++;CDL.ans=[];pintarLeccion();}};
}
function pintarLeccionEn(){var box=$("cdlCard");var y=box.scrollTop;pintarLeccion();box.scrollTop=y;}
function cenq(mid,lid,i){var e=cen();if(!e)return null;var ms=(e.modulesList||[]);for(var a=0;a<ms.length;a++){if(ms[a].id===mid){for(var b=0;b<ms[a].lessons.length;b++){if(ms[a].lessons[b].id===lid)return ms[a].lessons[b].q[i];}}}return null;}

// Simulacro (práctica)
function abrirMock(){CDL.view="mock";CDL.qi=0;CDL.ans=[];CDL.res=null;CDL.pool=cshuffle(cPracticePool()).slice(0,20);pintarCdl();}
function pintarMock(){
  var c=cc(),item=CDL.pool[CDL.qi];if(!item){CDL.view="home";return pintarCdl();}
  var q=item.q,h='<div class="row" style="justify-content:space-between"><button class="btn ghost" id="cdlBack" type="button">← '+esc(c.back)+"</button><span class=\"pill\">"+num(CDL.qi+1)+" / "+num(CDL.pool.length)+"</span></div>";
  h+='<div class="qtext">'+esc(q.q)+"</div><div class=\"opts\">"+q.o.map(function(o,k){var cls="opt";if(CDL.ans.length){if(k===q.a)cls+=" right";else if(k===CDL.ans[0])cls+=" wrong";}return '<button type="button" class="'+cls+'" data-k="'+k+'"'+(CDL.ans.length?" disabled":"")+">"+esc(o)+"</button>";}).join("")+"</div>";
  if(CDL.ans.length)h+='<div class="explain"><div class="bubble">'+esc(q.e)+"</div></div>"+'<div class="row" style="margin-top:10px"><button class="btn" id="cdlNextQ" type="button">'+esc(CDL.qi===CDL.pool.length-1?"Finish":c.next)+"</button></div>";
  $("cdlCard").innerHTML=h;
  $("cdlBack").onclick=function(){CDL.view="home";pintarCdl();};
  $("cdlCard").querySelectorAll(".opt").forEach(function(b){b.onclick=function(){if(CDL.ans.length)return;CDL.ans=[+b.dataset.k];CDL.pool[CDL.qi].chosen=+b.dataset.k;cmark(cqid(item.m,item.l,item.i),+b.dataset.k===q.a);pintarMock();};});
  var nx=$("cdlNextQ");if(nx)nx.onclick=function(){if(CDL.qi===CDL.pool.length-1)mockEnd();else{CDL.qi++;CDL.ans=[];pintarMock();}};
}
function mockEnd(){
  var c=cc(),right=0;
  CDL.pool.forEach(function(it){if(it.chosen===it.q.a)right++;});
  var pct=Math.round(right/CDL.pool.length*100),pass=pct>=80;
  var h='<h3>'+esc(pass?c.pass:c.fail)+"</h3><p class=\"result-big\">"+pct+"%</p><p>"+num(right)+"/"+num(CDL.pool.length)+" "+esc(c.correct)+"</p>";
  h+='<p class="small muted">'+esc(c.practiceLead)+"</p>";
  h+='<div class="row"><button class="btn" id="cdlAgain" type="button">'+esc(t("again"))+"</button>"+'<button class="btn ghost" id="cdlBackHome" type="button">'+esc(c.back)+"</button></div>";
  $("cdlCard").innerHTML=h;
  $("cdlAgain").onclick=function(){abrirMock();};$("cdlBackHome").onclick=function(){CDL.view="home";pintarCdl();};
}

// Repaso espaciado
function abrirRepaso(){CDL.view="review";CDL.qi=0;CDL.ans=[];CDL.pool=[];
  var pool=cPracticePool(),p=cprog(),now=Date.now();
  var due=pool.filter(function(it){var r=p[cqid(it.m,it.l,it.i)];return r&&r.d&&r.d<=now;});
  if(!due.length)due=pool.slice().sort(function(a,b){var ra=p[cqid(a.m,a.l,a.i)]||{b:0},rb=p[cqid(b.m,b.l,b.i)]||{b:0};return (ra.b||0)-(rb.b||0);});
  CDL.pool=cshuffle(due).slice(0,10);pintarCdl();}

// Glosario
function abrirGlosario(){CDL.view="gloss";pintarCdl();}
function pintarGlosario(){
  var c=cc();
  var h='<div class="row" style="justify-content:space-between"><button class="btn ghost" id="cdlBack" type="button">← '+esc(c.back)+"</button><b>"+esc(c.glossaryTitle)+"</b></div>";
  h+='<div class="grid g2" style="margin-top:12px">'+c.glossary.map(function(g,i){return '<div class="card"><h3>'+esc(g.t)+"</h3><p class=\"small muted\">EN: "+esc(g.en)+"</p><p class=\"small\">"+esc(g.d)+"</p>"+(hasVoice()?'<button class="btn ghost" type="button" data-say="'+i+'">'+ic("speaker")+' '+esc(c.listenEn)+"</button>":"")+"</div>";}).join("")+"</div>";
  $("cdlCard").innerHTML=h;
  $("cdlBack").onclick=function(){CDL.view="home";pintarCdl();};
  $("cdlCard").querySelectorAll("[data-say]").forEach(function(b){b.onclick=function(){var g=c.glossary[+b.dataset.say];speakEn(g.en+". "+g.en);};});
}
function speakEn(txt){if(!window.speechSynthesis)return;var T=window.speechSynthesis;T.cancel();var u=new SpeechSynthesisUtterance(txt);u.lang="en-US";u.rate=.92;T.speak(u);}

function cdlTruckSvg(){
  var pt=function(x,y,id,label){return '<g data-part="'+id+'" style="cursor:pointer" transform="translate('+x+','+y+')">'+
    '<circle r="15" fill="#0b6e4f" stroke="#fff" stroke-width="2"/><text y="5" text-anchor="middle" font-size="13" font-weight="700" fill="#fff">'+label+"</text></g>";};
  return '<svg viewBox="0 0 320 170" role="img" aria-label="Truck" style="max-width:420px;display:block;margin:0 auto">'+
    '<rect x="150" y="38" width="150" height="58" rx="6" fill="#dfe6e1" stroke="#111" stroke-width="2"/>'+
    '<rect x="60" y="52" width="88" height="42" rx="6" fill="#0b6e4f" stroke="#111" stroke-width="2"/>'+
    '<rect x="66" y="58" width="34" height="20" rx="3" fill="#9fd8f0"/>'+
    '<rect x="150" y="96" width="150" height="8" fill="#111"/>'+
    '<circle cx="88" cy="118" r="15" fill="#111"/><circle cx="120" cy="118" r="15" fill="#111"/>'+
    '<circle cx="190" cy="118" r="15" fill="#111"/><circle cx="240" cy="118" r="15" fill="#111"/><circle cx="285" cy="118" r="15" fill="#111"/>'+
    pt(88,96,"tires","1")+pt(290,74,"lights","2")+pt(120,96,"brakes","3")+pt(160,74,"hoses","4")+pt(205,80,"fifth","5")+pt(232,80,"coupling","6")+
    "</svg>";
}

// Juegos CDL
function cdlGames(c){
  if(!c.games)return "";
  var g=c.games;
  var items=[["pretrip",g.pretripTitle],["airorder",g.airorderTitle],["gauge",g.gaugeTitle],["class",g.classTitle],["coupling",g.couplingTitle]];
  return '<h3 style="margin-top:18px">'+esc(c.gamesTitle||"Practice games")+"</h3><div class=\"chips\">"+items.map(function(x){return '<button class="chip" data-gmcdl="'+x[0]+'">'+esc(x[1])+"</button>";}).join("")+"</div>";
}
function cdlGamesBind(c){$("cdlCard").querySelectorAll("[data-gmcdl]").forEach(function(b){b.onclick=function(){CDL.view="game";CDL.game=b.dataset.gmcdl;CDL.step=0;CDL.order=[];pintarJuegoCdl();};});}
function pintarJuegoCdl(){
  var c=cc(),g=c.games,k=CDL.game;
  var h='<div class="row" style="justify-content:space-between"><button class="btn ghost" id="cdlBack" type="button">← '+esc(c.back)+"</button><b>"+esc(g[k+"Title"])+"</b></div>";
  h+='<p class="small">'+esc(g[k+"Lead"]||"")+"</p>";
  if(k==="pretrip"){
    h+=cdlTruckSvg();
    h+='<p class="small muted" style="text-align:center">Tap a numbered part of the truck</p>';
    h+='<div class="chips" style="justify-content:center">'+g.pretrip.parts.map(function(p,i){return '<button class="chip" data-part="'+p.id+'">'+num(i+1)+" · "+esc(p.name)+"</button>";}).join("")+"</div>";
    h+='<div id="cdlFb"></div>';
  } else if(k==="airorder"||k==="coupling"){
    var steps=g[k].map(function(s,i){return {s:s,i:i};});
    if(!CDL.shuf)CDL.shuf=cshuffle(steps);
    h+='<div class="opts">'+CDL.shuf.map(function(x){return '<button class="opt" data-step="'+x.i+'">'+esc(x.s)+"</button>";}).join("")+"</div><div id=\"cdlFb\"></div>";
  } else if(k==="gauge"){
    var st=g.gauge[CDL.step%g.gauge.length];
    h+='<p class="result-big">'+num(st.psi)+' psi</p><div class="qtext">'+esc(st.q)+"</div><div class=\"opts\">"+st.o.map(function(o,i){return '<button class="opt" data-g="'+i+'">'+esc(o)+"</button>";}).join("")+"</div><div id=\"cdlFb\"></div>";
  } else if(k==="class"){
    var it=g.classes[CDL.step%g.classes.length];
    h+='<div class="qtext">'+esc(it.q)+"</div><div class=\"opts\">"+it.o.map(function(o,i){return '<button class="opt" data-c="'+i+'">'+esc(o)+"</button>";}).join("")+"</div><div id=\"cdlFb\"></div>";
  }
  $("cdlCard").innerHTML=h;
  $("cdlBack").onclick=function(){CDL.view="home";CDL.shuf=null;pintarCdl();};
  if(k==="pretrip"){$("cdlCard").querySelectorAll("[data-part]").forEach(function(b){b.onclick=function(){var p=g.pretrip.parts.filter(function(x){return x.id===b.dataset.part;})[0];var opts=cshuffle([p.ok].concat(p.bad));$("cdlFb").innerHTML='<div class="card"><b>'+esc(p.name)+"</b><div class=\"opts\">"+opts.map(function(o){return '<button class="opt" data-ok="'+(o===p.ok?1:0)+'">'+esc(o)+"</button>";}).join("")+"</div></div>";$("cdlFb").querySelectorAll("[data-ok]").forEach(function(x){x.onclick=function(){$("cdlFb").innerHTML+='<p class="small">'+(x.dataset.ok==="1"?ic("check")+" "+esc(p.ok):ic("cross")+" "+esc(p.ok))+"</p>";};});};});}
  if(k==="airorder"||k==="coupling"){$("cdlCard").querySelectorAll("[data-step]").forEach(function(b){b.onclick=function(){CDL.order.push(+b.dataset.step);b.disabled=true;var ok=CDL.order.every(function(v,i){return v===i;});if(!ok){$("cdlFb").innerHTML='<div class="explain"><div class="bubble">'+esc(c.fail)+'</div></div>';setTimeout(function(){CDL.order=[];CDL.shuf=null;pintarJuegoCdl();},1200);}else if(CDL.order.length===g[k].length){$("cdlFb").innerHTML='<div class="explain"><div class="bubble">'+ic("check")+" "+esc(c.correct)+'</div></div>';}};});}
  if(k==="gauge"){$("cdlCard").querySelectorAll("[data-g]").forEach(function(b){b.onclick=function(){var st=g.gauge[CDL.step%g.gauge.length],ok=+b.dataset.g===st.a;$("cdlFb").innerHTML='<div class="explain"><div class="bubble">'+(ok?ic("check")+" ":ic("cross")+" ")+esc(st.e)+"</div></div>"+'<button class="btn" id="cdlGNext" type="button">Next</button>';$("cdlGNext").onclick=function(){CDL.step++;pintarJuegoCdl();};};});}
  if(k==="class"){$("cdlCard").querySelectorAll("[data-c]").forEach(function(b){b.onclick=function(){var it=g.classes[CDL.step%g.classes.length],ok=+b.dataset.c===it.a;$("cdlFb").innerHTML='<div class="explain"><div class="bubble">'+(ok?ic("check")+" ":ic("cross")+" ")+esc(it.e)+"</div></div>"+'<button class="btn" id="cdlCNext" type="button">Next</button>';$("cdlCNext").onclick=function(){CDL.step++;pintarJuegoCdl();};};});}
}
// ---------- Road test ----------
function supState(){return store.get(stpre()+"sup",{rows:[],skills:{}});}
function pintarSupervisor(){
  var b=$("supBox"); if(!b) return;
  if(!C.gdl){b.innerHTML="";return;}
  var stt=supState(), g=C.gdl;
  var day=0,night=0; stt.rows.forEach(function(r){day+=(r.day||0);night+=(r.night||0);});
  var pct=g.hours?Math.min(100,Math.round((day/60)/g.hours*100)):0;
  var h='<h3>'+esc(t("supTitle"))+'</h3><p class="small muted">'+esc(t("supLead"))+"</p>";
  h+='<div class="row" style="justify-content:space-between"><span class="pill">'+esc(t("supTotals"))+": "+(day/60).toFixed(1)+' h</span><span class="pill">'+esc(t("supNeed"))+": "+num(g.hours)+' h</span></div>';
  h+='<div class="progress" style="margin:8px 0"><span style="width:'+pct+'%"></span></div>';
  h+='<p class="small muted">'+esc(t("supTotals"))+": "+(night/60).toFixed(1)+" h / "+num(g.night)+" h</p>";
  h+='<div class="row"><label class="small">'+esc(t("supDay"))+' <input id="supDay" type="number" min="0" step="5" value="30" style="width:84px"></label>'+
     '<label class="small">'+esc(t("supNight"))+' <input id="supNight" type="number" min="0" step="5" value="0" style="width:84px"></label></div>';
  h+='<input id="supNote" type="text" placeholder="'+esc(t("supNote"))+'" style="width:100%;margin:8px 0;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface);color:var(--ink)">';
  h+='<button class="btn" id="supAdd" type="button">'+esc(t("supAdd"))+"</button>";
  var doneSkills=Object.keys(stt.skills).filter(function(k){return stt.skills[k];}).length;
  var totalSkills=0; P.rt.forEach(function(c){totalSkills+=c.items.length;});
  h+='<details style="margin-top:12px"><summary style="min-height:44px;display:flex;align-items:center;cursor:pointer">'+esc(t("supSkills"))+": "+num(doneSkills)+"/"+num(totalSkills)+"</summary><div class=\"chips\">";
  P.rt.forEach(function(cat,ci){cat.items.forEach(function(it,ii){var id=ci+"-"+ii;h+='<button type="button" class="chip" data-skill="'+id+'" aria-pressed="'+(!!stt.skills[id])+'">'+esc(it)+"</button>";});});
  h+="</div></details>";
  b.innerHTML=h;
  $("supAdd").onclick=function(){
    var d=+($("supDay").value||0), n=+($("supNight").value||0);
    stt.rows.push({d:todayKey(),day:d,night:n,note:($("supNote").value||"").slice(0,120)});
    store.set(stpre()+"sup",stt); pintarSupervisor();
  };
  b.querySelectorAll("[data-skill]").forEach(function(ch){ch.onclick=function(){stt.skills[ch.dataset.skill]=!stt.skills[ch.dataset.skill];store.set(stpre()+"sup",stt);pintarSupervisor();};});
}
function pintarKit(){
  var b=$("kitBox"); if(!b) return;
  var k=(window.KIT&&window.KIT[LANG])||P.kit; if(!k){b.innerHTML="";return;}
  var code=(ST&&ST.code)||"ny", kk=k[code]||k.ny; if(!kk){b.innerHTML="";return;}
  var h='<h3>'+esc(k.title)+'</h3><p class="small muted">'+esc(k.lead)+"</p><ul class=\"small\" style=\"margin:8px 0\">";
  kk.items.forEach(function(it){h+="<li>"+esc(it)+"</li>";});
  h+="</ul>";
  h+='<a class="linkbtn" target="_blank" rel="noopener" href="'+esc(kk.link)+'">'+esc(t("official"))+" ↗</a>";
  b.innerHTML=h;
}
function pintarRoadtest(){
  pintarKit();
  pintarSupervisor();
  $("rtSource").href=C.fuentes.R;
  var h="";
  P.rt.forEach(function(cat,ci){
    h+='<div class="rt-cat"><h3>'+esc(cat.cat)+'</h3>';
    cat.items.forEach(function(it,ii){var id=ci+"-"+ii, n=RT[id]||0, ch=C.rtch[ci][ii];
      h+='<div class="rt-item"><div><div>'+esc(it)+'</div>'+(ch?'<div class="small muted">'+esc(manRef(ch))+'</div>':'')+'</div><div class="counter"><button type="button" data-id="'+id+'" data-d="-1" aria-label="−">−</button><span>'+num(n)+'</span><button type="button" data-id="'+id+'" data-d="1" aria-label="+">+</button></div></div>';});
    h+='</div>';});
  $("rtList").innerHTML=h;
  $("rtList").querySelectorAll(".counter button").forEach(function(b){b.onclick=function(){var id=b.dataset.id; RT[id]=Math.max(0,(RT[id]||0)+(+b.dataset.d)); store.set(stpre()+"rt",RT); pintarRoadtest();};});
  var total=0, porCat=P.rt.map(function(cat,ci){var s=0; cat.items.forEach(function(_,ii){s+=RT[ci+"-"+ii]||0;}); total+=s; return {n:s,name:cat.cat};});
  var peor=porCat.filter(function(x){return x.n>0;}).sort(function(a,b){return b.n-a.n;}).slice(0,2).map(function(x){return x.name+" ("+num(x.n)+")";}).join(", ");
  $("rtSummary").textContent=total?fmt(t("rtTotal"),{n:num(total),c:peor}):t("rtNone");
}
$("rtReset").onclick=function(){RT={}; store.set(stpre()+"rt",RT); pintarRoadtest();};


// ---------- Escuelas de manejo (lista oficial del DMV; patrocinadas marcadas como tales) ----------
var SCT={
 en:{tab:"Driving schools",title:"Find a licensed driving school near you",lead:"Every school on the official NYS DMV list of licensed driving schools, nearest first. Look for the 5-hour course, lessons for the road test, or motorcycle training.",near:"Use my location",search:"Search by name, city or ZIP",p:"5-hour course",a:"Car lessons",m:"Motorcycle",call:"Call",dir:"Directions",rev:"Reviews on Google Maps",sp:"Sponsored",locErr:"Couldn't get your location. Search by city or ZIP instead.",count:"{n} licensed schools",mi:"mi",note:"Source: NYS DMV list of licensed driving schools (data.ny.gov). Being listed is not an endorsement by DriveReady or the DMV. Sponsored schools pay to appear first and are always labeled.",own:"Own a driving school? Get featured in 6 languages",more:"Show more"},
 es:{tab:"Autoescuelas",title:"Encuentra una autoescuela con licencia cerca de ti",lead:"Todas las escuelas de la lista oficial del DMV de Nueva York, de la más cercana a la más lejana. Busca el curso de 5 horas, clases para el road test o de moto.",near:"Usar mi ubicación",search:"Busca por nombre, ciudad o código postal",p:"Curso de 5 horas",a:"Clases de auto",m:"Moto",call:"Llamar",dir:"Cómo llegar",rev:"Reseñas en Google Maps",sp:"Patrocinado",locErr:"No pudimos obtener tu ubicación. Busca por ciudad o código postal.",count:"{n} escuelas con licencia",mi:"mi",note:"Fuente: lista oficial de autoescuelas con licencia del DMV de Nueva York (data.ny.gov). Aparecer aquí no es una recomendación de DriveReady ni del DMV. Las patrocinadas pagan por salir primero y siempre van marcadas.",own:"¿Tienes una autoescuela? Aparece destacada en 6 idiomas",more:"Ver más"},
 zh:{tab:"驾校",title:"查找附近有执照的驾校",lead:"纽约州 DMV 官方执照驾校名单，按距离由近到远排列。可找5小时课程、路考练车或摩托车培训。",near:"使用我的位置",search:"按名称、城市或邮编搜索",p:"5小时课程",a:"汽车练车",m:"摩托车",call:"打电话",dir:"路线",rev:"Google 地图评价",sp:"赞助",locErr:"无法获取位置，请按城市或邮编搜索。",count:"{n} 所执照驾校",mi:"英里",note:"来源：纽约州 DMV 执照驾校名单 (data.ny.gov)。列入名单不代表 DriveReady 或 DMV 推荐。赞助驾校付费排在前面，并始终标明“赞助”。",own:"您开驾校吗？用6种语言展示",more:"显示更多"},
 ru:{tab:"Автошколы",title:"Найдите лицензированную автошколу рядом",lead:"Все школы из официального списка DMV штата Нью-Йорк, сначала ближайшие. 5-часовой курс, занятия к экзамену по вождению или мотоцикл.",near:"Моё местоположение",search:"Поиск по названию, городу или индексу",p:"5-часовой курс",a:"Вождение авто",m:"Мотоцикл",call:"Позвонить",dir:"Маршрут",rev:"Отзывы в Google Maps",sp:"Спонсор",locErr:"Не удалось определить местоположение. Ищите по городу или индексу.",count:"{n} лицензированных школ",mi:"миль",note:"Источник: список лицензированных автошкол DMV штата Нью-Йорк (data.ny.gov). Наличие в списке — не рекомендация DriveReady или DMV. Спонсоры платят за место вверху и всегда отмечены.",own:"У вас автошкола? Покажитесь на 6 языках",more:"Показать ещё"},
 ko:{tab:"운전학원",title:"가까운 인가 운전학원 찾기",lead:"뉴욕주 DMV 공식 인가 운전학원 목록을 가까운 순서로 보여 드려요. 5시간 교육, 도로주행 연수, 오토바이 교육을 찾아보세요.",near:"내 위치 사용",search:"이름, 도시, 우편번호로 검색",p:"5시간 교육",a:"자동차 연수",m:"오토바이",call:"전화",dir:"길찾기",rev:"Google 지도 리뷰",sp:"후원",locErr:"위치를 가져올 수 없어요. 도시나 우편번호로 검색하세요.",count:"인가 학원 {n}곳",mi:"마일",note:"출처: 뉴욕주 DMV 인가 운전학원 목록 (data.ny.gov). 목록에 있다고 DriveReady나 DMV가 추천하는 것은 아니에요. 후원 학원은 비용을 내고 위에 표시되며 항상 '후원'으로 표시돼요.",own:"운전학원을 운영하세요? 6개 언어로 소개하세요",more:"더 보기"},
 bn:{tab:"ড্রাইভিং স্কুল",title:"কাছের লাইসেন্সপ্রাপ্ত ড্রাইভিং স্কুল খুঁজুন",lead:"নিউ ইয়র্ক স্টেট DMV-এর অফিশিয়াল তালিকার সব স্কুল, কাছেরগুলো আগে। ৫ ঘণ্টার কোর্স, রোড টেস্টের ক্লাস বা মোটরসাইকেল।",near:"আমার লোকেশন",search:"নাম, শহর বা ZIP দিয়ে খুঁজুন",p:"৫ ঘণ্টার কোর্স",a:"গাড়ির ক্লাস",m:"মোটরসাইকেল",call:"কল",dir:"রাস্তা",rev:"Google Maps রিভিউ",sp:"স্পনসর",locErr:"লোকেশন পাওয়া যায়নি। শহর বা ZIP দিয়ে খুঁজুন।",count:"{n}টি লাইসেন্সপ্রাপ্ত স্কুল",mi:"মাইল",note:"উৎস: নিউ ইয়র্ক স্টেট DMV-এর লাইসেন্সপ্রাপ্ত ড্রাইভিং স্কুলের তালিকা (data.ny.gov)। তালিকায় থাকা মানে DriveReady বা DMV-এর সুপারিশ নয়। স্পনসর স্কুল টাকা দিয়ে উপরে থাকে এবং সবসময় চিহ্নিত।",own:"ড্রাইভিং স্কুল আছে? ৬টি ভাষায় দেখান",more:"আরও দেখুন"}};
// Textos para estados sin lista descargable de autoescuelas.
var SCTX={
 en:{noList:"New Jersey publishes its registered driving schools as an official MVC list, not as a data file we can ship offline. Open the official list below: it is updated by the MVC.",officialSearch:"Official list of registered driving schools"},
 es:{noList:"Nueva Jersey publica sus autoescuelas registradas en una lista oficial del MVC, no en un archivo de datos que podamos incluir sin conexión. Abre la lista oficial: la actualiza el MVC.",officialSearch:"Lista oficial de autoescuelas registradas"},
 zh:{noList:"新泽西州的注册驾校名单由 MVC 官方发布，不是我们可以离线打包的数据文件。请打开下方官方名单，它由 MVC 更新。",officialSearch:"官方注册驾校名单"},
 ru:{noList:"Нью-Джерси публикует список зарегистрированных автошкол в официальном перечне MVC, а не в файле данных, который можно встроить в приложение. Откройте официальный список ниже.",officialSearch:"Официальный список автошкол"},
 ko:{noList:"뉴저지는 등록 운전학원 목록을 MVC 공식 명단으로만 공개하며, 앱에 넣을 수 있는 데이터 파일은 제공하지 않아요. 아래 공식 목록을 열어 보세요.",officialSearch:"공식 등록 운전학원 목록"},
 bn:{noList:"নিউ জার্সি তাদের নিবন্ধিত ড্রাইভিং স্কুলের তালিকা MVC-এর অফিশিয়াল তালিকা হিসেবে প্রকাশ করে, অফলাইনে দেওয়ার মতো ডেটা ফাইল হিসেবে নয়। নিচের অফিশিয়াল তালিকা খুলুন।",officialSearch:"নিবন্ধিত ড্রাইভিং স্কুলের অফিসিয়াল তালিকা"}
};
for(var _k in SCTX){ for(var _j in SCTX[_k]) SCT[_k][_j]=SCTX[_k][_j]; }
var SC={pos:null,q:"",lim:20};
function st(k){var o=SCT[LANG]||SCT.en; return o[k]||SCT.en[k];}
function dist(a,b,c,d){var R=3958.8,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h));}
function listaEscuelas(){return window.SCHOOLS||window.SCHOOLS_NY||null;}
function cargarEscuelas(cb){if(listaEscuelas()) return cb(); if(!ST.schools) return cb(); var s=document.createElement("script"); s.src=ST.schools; s.onload=cb; document.head.appendChild(s);}
function pintarEscuelas(){
  $("scTitle").textContent=st("title"); $("scLead").textContent=st("lead"); $("scNear").innerHTML=ic("pin")+" "+esc(st("near")); $("scNear").setAttribute("aria-label",st("near")); $("scQ").placeholder=st("search"); $("scNote").textContent=st("note");
  $("scOwn").textContent=st("own"); $("scOwn").href=CFG.sponsorEmail?"mailto:"+CFG.sponsorEmail+"?subject="+encodeURIComponent("DriveReady featured driving school"):"#";
  $("scOwn").hidden=!CFG.sponsorEmail;
  var list=listaEscuelas();
  if(!list){
    if(!ST.schools){ $("scCount").textContent=""; $("scMore").hidden=true;
      $("scList").innerHTML='<p class="small">'+esc(st("noList"))+"</p>"+(ST.schoolSearch?'<p><a class="btn ghost" target="_blank" rel="noopener" href="'+esc(ST.schoolSearch)+'">'+esc(st("officialSearch"))+" ↗</a></p>":"");
      return; }
    $("scList").innerHTML='<p class="muted small">…</p>'; return cargarEscuelas(pintarEscuelas); }
  var sp={}; (CFG.sponsors||[]).forEach(function(s){sp[s.id]=s;});
  var q=SC.q.trim().toLowerCase(), L=list.filter(function(s){return !q||(s[1]+" "+s[2]+" "+s[3]+" "+s[4]+" "+s[5]).toLowerCase().indexOf(q)>=0;});
  L=L.map(function(s){return {s:s,d:(SC.pos&&s[7]!=null)?dist(SC.pos[0],SC.pos[1],s[7],s[8]):null,sp:sp[s[0]]};});
  if(SC.pos) L.sort(function(a,b){return (a.d==null?1e9:a.d)-(b.d==null?1e9:b.d);});
  var spon=L.filter(function(x){return x.sp&&(x.d==null||x.d<25);}), rest=L.filter(function(x){return !x.sp;});
  $("scCount").textContent=fmt(st("count"),{n:num(L.length)});
  var card=function(x){var s=x.s, f=s[9], tags=[];
    if(f.indexOf("P")>=0) tags.push(st("p")); if(f.indexOf("A")>=0) tags.push(st("a")); if(f.indexOf("M")>=0) tags.push(st("m"));
    var addr=s[3]+", "+s[4]+", NY "+s[5], mq=encodeURIComponent(s[1]+" "+addr), ph=s[6];
    var note=x.sp&&x.sp.note?(x.sp.note[LANG]||x.sp.note.en||""):"";
    return '<div class="school'+(x.sp?' sponsored':'')+'">'+(x.sp?'<span class="sp-badge">'+esc(st("sp"))+'</span>':'')+
      '<div class="sc-name">'+esc(s[1])+'</div>'+(s[2]?'<div class="small muted">'+esc(s[2])+'</div>':'')+
      '<div class="small">'+esc(addr)+(x.d!=null?' · <b>'+num(Math.round(x.d*10)/10)+' '+esc(st("mi"))+'</b>':'')+'</div>'+
      (note?'<div class="small" style="margin-top:4px">'+esc(note)+'</div>':'')+
      '<div class="sc-tags">'+tags.map(function(g){return '<span>'+esc(g)+'</span>';}).join("")+'</div>'+
      '<div class="sc-act">'+(ph?'<a href="tel:+1'+ph+'">'+ic("phone")+' '+esc(st("call"))+'</a>':'')+
      '<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+mq+'">'+ic("compass")+' '+esc(st("dir"))+'</a>'+
      '<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+mq+'">'+ic("starOn")+' '+esc(st("rev"))+'</a>'+
      (x.sp&&x.sp.url?'<a target="_blank" rel="noopener sponsored" href="'+esc(x.sp.url)+'">'+ic("globe")+' Web</a>':'')+'</div></div>';};
  $("scList").innerHTML=spon.slice(0,3).map(card).join("")+rest.slice(0,SC.lim).map(card).join("");
  $("scMore").hidden=rest.length<=SC.lim; $("scMore").textContent=st("more"); $("scMore").setAttribute("aria-label",st("more"));
}
$("scNear").onclick=function(){ if(!navigator.geolocation){ $("scMsg").textContent=st("locErr"); return; }
  navigator.geolocation.getCurrentPosition(function(p){SC.pos=[p.coords.latitude,p.coords.longitude]; SC.lim=20; $("scMsg").textContent=""; pintarEscuelas();},function(){ $("scMsg").textContent=st("locErr"); },{timeout:10000,maximumAge:600000}); };
$("scQ").oninput=function(){SC.q=this.value; SC.lim=20; pintarEscuelas();};
$("scMore").onclick=function(){SC.lim+=20; pintarEscuelas();};

// ---------- Maniobras: video con trayectoria exacta, sincronizado con cada paso ----------
var MAN={tres:{clip:"tres_puntos",poster:"man_tres",ch:"5",marks:[0,6.42,11.25,13.96],dur:21.17},
         paralelo:{clip:"paralelo",poster:"man_paralelo",ch:"7",marks:[0,7.75,10.12,13.0],dur:14.83},
         glorieta:{clip:"glorieta",poster:"man_glorieta",ch:"8",marks:[0,1.38,3.04,8.08],dur:11.5},
         cruce:{clip:"interseccion",poster:"man_cruce",ch:"5",marks:[0,5.29,6.67,14.92],dur:20.63}};
var MS={k:"tres",i:-1};
function pintarManChips(){
  $("manMode").innerHTML="";
  $("manChips").innerHTML=Object.keys(MAN).filter(function(k){return P.man[k];}).map(function(k){return '<button type="button" class="chip" data-k="'+k+'" aria-pressed="'+(MS.k===k)+'">'+esc(P.man[k].name)+'</button>';}).join("");
  $("manChips").querySelectorAll(".chip").forEach(function(b){b.onclick=function(){MS.k=b.dataset.k; MS.i=-1; pintarManChips(); pintarMan();};});
}
function manVideo(){return $("manMedia").querySelector("video");}
function pintarMan(){
  var m=MAN[MS.k];
  if(!P.man||!P.man[MS.k]||!m){return;}
  $("manMedia").innerHTML='<div class="media"><video src="clips/'+m.clip+'.mp4" poster="'+img(m.poster)+'" muted playsinline preload="metadata" controls></video></div>';
  var v=manVideo();
  v.addEventListener("timeupdate",function(){
    if(v.seeking) return;
    var k=0; m.marks.forEach(function(t,i){if(v.currentTime>=t-0.05)k=i;});
    if(MS.stopAt!=null&&v.currentTime>=MS.stopAt){v.pause(); MS.stopAt=null;}
    if(!v.paused&&k!==MS.i){MS.i=k; pasos(false);}
  });
  v.addEventListener("ended",function(){MS.i=3; pasos(false);});
  pasos(false);
}
function irPaso(i){
  var m=MAN[MS.k], v=manVideo(); MS.i=i; pasos(true);
  if(!v) return;
  MS.stopAt=i<3?m.marks[i+1]:null; MS.seekTo=m.marks[i]+0.01;
  var go=function(){ v.currentTime=MS.seekTo; var pr=v.play(); if(pr&&pr.catch) pr.catch(function(){}); };
  if(v.readyState>=1) go(); else { v.preload="auto"; v.addEventListener("loadedmetadata",go,{once:true}); v.load(); }
}
function pasos(hablar){
  var m=MAN[MS.k];
  $("manSteps").innerHTML=P.man[MS.k].steps.map(function(st,i){return '<li class="'+(i===MS.i?"now":"")+'" data-i="'+i+'" style="cursor:pointer">'+esc(st)+'</li>';}).join("");
  $("manSteps").querySelectorAll("li").forEach(function(li){li.onclick=function(){irPaso(+li.dataset.i);};});
  $("manPrev").disabled=MS.i<=0; $("manNext").disabled=MS.i>=3;
  $("manSrc").innerHTML='<a href="'+C.fuentes[m.ch]+'" target="_blank" rel="noopener">'+esc(manRef(m.ch))+'</a>';
  if(hablar&&MS.i>=0&&hasVoice()) speak(P.man[MS.k].steps[MS.i]);
}
$("manNext").onclick=function(){irPaso(Math.min(3,MS.i+1));};
$("manPrev").onclick=function(){irPaso(Math.max(0,MS.i-1));};

// ---------- Cultura y fuentes ----------
function pintarCultura(){
  var VID={interseccion:1,autopista:1,lluvia:1,glorieta:1,portada:1};
  var __cult=function(){ $("cultList").querySelectorAll("video[data-src]").forEach(function(v){v.addEventListener("click",function(){if(!v.getAttribute("src"))v.setAttribute("src",v.dataset.src);var p=v.play();if(p&&p.catch)p.catch(function(){});});}); };
$("cultList").innerHTML=P.culture.map(function(c){var m=VID[c.img]?'<video data-src="clips/'+c.img+'.mp4" poster="'+img(c.img)+'" muted loop playsinline preload="none" aria-label="'+esc(c.title)+'" style="aspect-ratio:16/9;object-fit:cover;width:100%;cursor:pointer"></video>':'<img src="'+img(c.img)+'" alt="'+esc(c.title)+'" loading="lazy">';return '<div class="card">'+m+'<div class="txt"><h3>'+esc(c.title)+'</h3><p class="small">'+esc(c.text)+'</p></div></div>';}).join("");
  __cult();
  var l=Object.keys(P.chapters).filter(function(c){return c!=="S";}).map(function(c){return '<li><a href="'+C.fuentes[c]+'" target="_blank" rel="noopener">'+esc(manRef(c))+' · '+esc(P.chapters[c])+'</a></li>';}).join("");
  $("sourceList").innerHTML=l+'<li><a href="'+C.fuentes.S+'" target="_blank" rel="noopener">'+esc(P.chapters.S)+'</a></li><li><a href="'+C.fuentes.R+'" target="_blank" rel="noopener">'+esc(t("rtSourceLink"))+'</a></li>';
}

// ---------- Primer arranque en tres pasos ----------
var ONB={step:0,lang:null,state:"ny",goal:"permit"};
function onbShow(){
  if(store.get("onboard",false)) return false;
  ONB={step:0,lang:LANG||"en",state:ST.code,goal:store.get("goal","permit")};
  $("onb").hidden=false; onbPaint(); return true;
}
function onbPaint(){
  var u=P.ui, h='<div class="onb-step">'+[0,1,2].map(function(i){return '<span class="'+(i<=ONB.step?"on":"")+'"></span>';}).join("")+"</div>";
  if(ONB.step===0){
    h+="<h2>"+esc(u.onbLang||"Language")+"</h2><div class=\"onb-grid\">"+META.map(function(m){return '<button type="button" data-l="'+m.code+'" aria-pressed="'+(m.code===ONB.lang)+'" lang="'+m.code+'">'+esc(m.name)+"</button>";}).join("")+"</div>";
  } else if(ONB.step===1){
    h+="<h2>"+esc(u.onbState||"State")+"</h2><div class=\"onb-grid\">"+STATES.map(function(s){return '<button type="button" data-s="'+s.code+'" aria-pressed="'+(s.code===ONB.state)+'">'+esc((s.names&&s.names[ONB.lang])||s.name)+"</button>";}).join("")+"</div>";
  } else {
    h+="<h2>"+esc(u.onbGoal||"Goal")+"</h2><div class=\"onb-grid\">"
      +'<button type="button" data-g="permit" aria-pressed="'+(ONB.goal==="permit")+'">'+esc(u.goalPermit||"Permit")+"</button>"
      +'<button type="button" data-g="road" aria-pressed="'+(ONB.goal==="road")+'">'+esc(u.goalRoad||"Road test")+"</button>"
      +'<button type="button" data-g="cdl" aria-pressed="'+(ONB.goal==="cdl")+'">'+esc(u.goalCdl||"CDL")+"</button></div>";
  }
  h+='<div class="row" style="justify-content:flex-end;margin-top:10px">'+
    (ONB.step>0?'<button class="btn ghost" type="button" id="onbBack">←</button>':"")+
    '<button class="btn" type="button" id="onbNext">'+esc(ONB.step===2?(u.onbStart||"Start"):(u.onbNext||"Next"))+"</button></div>";
  $("onbBody").innerHTML=h;
  $("onbBody").querySelectorAll("[data-l]").forEach(function(b){b.onclick=function(){ONB.lang=b.dataset.l; setLang(ONB.lang).then(onbPaint);};});
  $("onbBody").querySelectorAll("[data-s]").forEach(function(b){b.onclick=function(){ONB.state=b.dataset.s; onbPaint();};});
  $("onbBody").querySelectorAll("[data-g]").forEach(function(b){b.onclick=function(){ONB.goal=b.dataset.g; onbPaint();};});
  var back=$("onbBack"); if(back) back.onclick=function(){ONB.step--; onbPaint();};
  $("onbNext").onclick=function(){
    if(ONB.step<2){ ONB.step++; return onbPaint(); }
    store.set("onboard",true); store.set("goal",ONB.goal);
    $("onb").hidden=true;
    if(ONB.state!==ST.code){ setState(ONB.state); }
    location.hash = ONB.goal==="cdl"?"#cdl":ONB.goal==="road"?"#roadtest":"#practica";
  };
}
function conectarMas(){ var b=$("moreBtn"); if(b) b.onclick=function(){var m=$("homeMore"); m.hidden=!m.hidden; b.setAttribute("aria-expanded",String(!m.hidden));}; }

// ---------- Todo ----------
function renderAll(){
  document.title="DriveReady: Permit & Road Test · "+stName()+" · "+P.name;
  document.querySelectorAll("[data-t]").forEach(function(el){var v=uis(el.dataset.t); if(typeof v==="string") el.textContent=v;});
  var ex=examCfg();
  if($("factTotal")){ $("factTotal").textContent=num(ex.total); $("factPass").textContent=num(ex.pass);
    $("factSigns").textContent=ex.signs?num(ex.signsPass)+"/"+num(ex.signs):"—";
    $("factSignsWrap").hidden=!ex.signs; }
  pintarGov(); pintarSelectorEstado();
  if($("estado"))$("estado").setAttribute("aria-label",t("state"));
  var navTabs=document.querySelector("nav.tabs"); if(navTabs)navTabs.setAttribute("aria-label",t("tabs").home||t("state"));
  if($("guideImg")&&P.guide)$("guideImg").alt=P.guide.name;
  if($("guideImg2")&&P.guide)$("guideImg2").alt=P.guide.name;
  if($("rtImg"))$("rtImg").alt=t("rtTitle")||"Road test";
  loadEnPack();
  $("langBtn").innerHTML=ic("globe")+" "+P.name; $("langBtn").setAttribute("aria-label",t("langLabel"));
  pintarTabs(); pintarInicio(); pintarChips(); pintarManual(); pintarDominadas(); pintarRoadtest(); if(vista()==="escuelas") pintarEscuelas(); pintarManChips(); pintarMan(); pintarCultura(); pintarAds();
  rehidratar(); if(EX){ if(EX.done) examenResultado(); else examenPintar(); } else examenIntro();
  if(PR.qs.length) practicaPintar(); else practicaNueva("all");
  if(!GM||!GM.timer) juegoIntro();
  ir();
}
$("langBtn").onclick=pickerShow;
if(TTS&&TTS.addEventListener) TTS.addEventListener("voiceschanged",function(){
  if(!P) return; if(EX&&EX.qs&&!EX.done) return; if(vista()==="juego") return;
  renderAll();
});

// Instalar como app (Android/Chrome) y uso sin conexión
var deferred=null;
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault(); deferred=e; var b=$("installBtn"); b.hidden=false; b.onclick=function(){deferred.prompt(); deferred=null; b.hidden=true;};});
var swOK=location.protocol==="https:"||/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
if("serviceWorker" in navigator && swOK) navigator.serviceWorker.register("sw.js").catch(function(){});

// Primer arranque: estado (URL o guardado), idioma (URL, guardado o del teléfono)
function soportado(c){return META.some(function(m){return m.code===c;});}
function arrancar(){
  var stCode=(location.search.match(/[?&]state=([a-z]{2})/)||[])[1];
  var st=(stCode&&stateByCode(stCode))||stateByCode(store.get("state","ny"))||STATES[0];
  var ready=(st.code==="ny")?Promise.resolve():loadScript(st.core).then(function(){C=window.CORE;});
  return ready.then(function(){
    ST=st; window.__coreState=st.code; cargarProgreso();
    var q=(location.search.match(/[?&]lang=([a-z]{2})/)||[])[1];
    var saved=soportado(q)?q:store.get("lang",null);
    var guess=(navigator.language||"en").slice(0,2);
    return setLang(saved||(soportado(guess)?guess:"en")).then(function(){
      conectarMas();
      if(!onbShow() && !saved) pickerShow();
    });
  });
}
arrancar().catch(function(e){try{console.error(e);}catch(x){}});

// Gancho para las pruebas automáticas y para depurar: no lo usa la interfaz.
window.DR={svg:svgSenal,ilust:svgIlust,signs:function(){return C.signs.slice();},signcat:function(){return C.signcat;},meanings:function(){return P.signs;},qimg:function(){return C.qimg||{};},head:function(i){return cabezaImg({i:i,ch:String(C.rules[i].ch)});}};
})();
