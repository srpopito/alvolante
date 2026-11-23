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
function $(id){return document.getElementById(id);}
function t(k){var v=P.ui[k];return v===undefined?k:v;}
function fmt(s,o){return s.replace(/\{(\w+)\}/g,function(_,k){return o[k];});}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];});}
function num(n){try{return new Intl.NumberFormat(LANG).format(n);}catch(e){return String(n);}}
function shuffle(a){a=a.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var x=a[i];a[i]=a[j];a[j]=x;}return a;}
function manRef(ch){return t("manual")+" "+ch+t("manualEnd");}
var CH_IMG={"4":"senales_calle","5":"interseccion","6":"autopista","7":"cuesta","8":"espejo","9":"alcohol","10":"nieve","11":"peatones","S":"senales_calle"};
function img(k){return "img/"+k+".webp";}

// ---------- Carga de idioma ----------
function loadLang(code){
  return new Promise(function(res,rej){
    if(window.LANGS&&window.LANGS[code]) return res(window.LANGS[code]);
    var s=document.createElement("script"); s.src="lang/"+code+".js";
    s.onload=function(){res(window.LANGS[code]);}; s.onerror=rej; document.head.appendChild(s);
  });
}
function pickerShow(){
  $("lpList").innerHTML=META.map(function(m){return '<button type="button" data-c="'+m.code+'" aria-current="'+(m.code===LANG)+'" lang="'+m.code+'"><img src="'+img("guia_"+m.code)+'" alt=""><b>'+esc(m.name)+'</b><span>'+esc(m.guide)+'</span></button>';}).join("");
  $("lpList").querySelectorAll("button").forEach(function(b){b.onclick=function(){setLang(b.dataset.c);};});
  $("langPick").classList.add("on");
}
function setLang(code){
  loadLang(code).then(function(p){
    LANG=code; P=p; store.set("lang",code);
    $("langPick").classList.remove("on");
    document.documentElement.lang=code; document.documentElement.dir=p.dir||"ltr";
    document.documentElement.style.setProperty("--body",p.font);
    renderAll();
  });
}

// ---------- Voz (gratis, del propio teléfono) ----------
var TTS=window.speechSynthesis||null;
function ttsLang(){for(var i=0;i<META.length;i++) if(META[i].code===LANG) return META[i].tts; return "en-US";}
function hasVoice(){
  if(!TTS) return false; var v=TTS.getVoices(); if(!v.length) return true;
  var l=ttsLang().slice(0,2); return v.some(function(x){return (x.lang||"").toLowerCase().indexOf(l)===0;});
}
function speak(txt){
  if(!TTS) return; TTS.cancel(); var u=new SpeechSynthesisUtterance(txt); u.lang=ttsLang(); u.rate=.95;
  var v=TTS.getVoices().filter(function(x){return (x.lang||"").toLowerCase().indexOf(ttsLang().slice(0,2))===0;});
  if(v.length) u.voice=v[0]; TTS.speak(u);
}
function toolsHtml(id){
  var h='<div class="tools">';
  if(hasVoice()) h+='<button type="button" class="linkbtn" data-say>🔊 '+esc(t("listen"))+'</button>';
  if(CFG.reportEmail) h+='<a class="linkbtn" href="mailto:'+CFG.reportEmail+'?subject='+encodeURIComponent("Al Volante NY "+LANG+" "+id)+'">⚑ '+({es:"Reportar un error",en:"Report a mistake",zh:"报告错误",ru:"Сообщить об ошибке",ko:"오류 신고",bn:"ভুল জানান"}[LANG]||"⚑")+'</a>';
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
   case "oneway": s+='<rect x="10" y="62" width="180" height="76" rx="6" fill="#111"/><polygon points="25,100 150,100 150,82 185,100 150,118 150,100" fill="#fff" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>'+tx(85,108,22,"ONE WAY","#111");break;
   case "crossbuck": s+='<g transform="rotate(35 100 100)"><rect x="10" y="82" width="180" height="36" fill="#fff" stroke="#111" stroke-width="4"/>'+tx(100,108,20,"RAILROAD","#111")+'</g><g transform="rotate(-35 100 100)"><rect x="10" y="82" width="180" height="36" fill="#fff" stroke="#111" stroke-width="4"/>'+tx(100,108,20,"CROSSING","#111")+'</g>';break;
   case "rradvance": s+='<circle cx="100" cy="100" r="88" fill="#f2c200" stroke="#111" stroke-width="5"/><line x1="45" y1="45" x2="155" y2="155" stroke="#111" stroke-width="12"/><line x1="155" y1="45" x2="45" y2="155" stroke="#111" stroke-width="12"/>'+tx(62,112,34,"R","#111")+tx(138,112,34,"R","#111");break;
   case "school": s+='<polygon points="100,12 185,80 185,188 15,188 15,80" fill="#c6d400" stroke="#111" stroke-width="5"/><circle cx="78" cy="88" r="10" fill="#111"/><path d="M78 100 v38 M78 112 l-16 14 M78 112 l14 14 M78 138 l-12 26 M78 138 l12 26" stroke="#111" stroke-width="8" stroke-linecap="round"/><circle cx="124" cy="96" r="9" fill="#111"/><path d="M124 106 v32 M124 116 l-13 12 M124 116 l12 12 M124 138 l-10 22 M124 138 l10 22" stroke="#111" stroke-width="7" stroke-linecap="round"/>';break;
   case "curve": s+=dia("#f2c200")+'<path d="M85 150 V110 Q85 80 115 72" fill="none" stroke="#111" stroke-width="12"/><polygon points="108,55 138,68 112,90" fill="#111"/>';break;
   case "laneends": s+=dia("#f2c200")+'<path d="M80 150 V60 M125 150 V112 Q125 95 108 80 V60" fill="none" stroke="#111" stroke-width="10"/><line x1="102" y1="150" x2="102" y2="120" stroke="#111" stroke-width="6" stroke-dasharray="10 8"/>';break;
   case "signal": s+=dia("#f2c200")+'<rect x="82" y="58" width="36" height="84" rx="6" fill="#111"/><circle cx="100" cy="74" r="10" fill="#e33"/><circle cx="100" cy="100" r="10" fill="#f2c200"/><circle cx="100" cy="126" r="10" fill="#2b2"/>';break;
   case "slowmoving": s+='<polygon points="100,20 185,170 15,170" fill="#c8102e"/><polygon points="100,52 158,152 42,152" fill="#ff7a00"/>';break;
   case "roadwork": s+=dia("#ff7a00")+tx(100,96,26,"ROAD","#111")+tx(100,126,26,"WORK","#111");break;
   case "speed55": s+='<rect x="35" y="15" width="130" height="170" rx="10" fill="#fff" stroke="#111" stroke-width="5"/>'+tx(100,55,24,"SPEED","#111")+tx(100,82,24,"LIMIT","#111")+tx(100,160,72,"55","#111");break;
   case "hospital": s+='<rect x="25" y="25" width="150" height="150" rx="10" fill="#1d4f9a" stroke="#fff" stroke-width="5"/>'+tx(100,135,100,"H","#fff");break;
  }
  return s+'</svg>';
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
function cabezaImg(p){return p.sign?'<div class="signbox">'+svgSenal(p.sign)+'</div>':'<div class="qimg"><img src="'+img(CH_IMG[p.ch])+'" alt="" loading="lazy"></div>';}
var ALL_RULES=C.rules.map(function(_,i){return "r"+i;}), ALL_SIGNS=C.signs.map(function(k){return "s:"+k;});
var MISS=store.get("miss",{});
function marcar(id,bien){if(bien) delete MISS[id]; else MISS[id]=1; store.set("miss",MISS);}
function frase(tipo){var a=P.guide[tipo];return a[Math.floor(Math.random()*a.length)];}

// ---------- Navegación ----------
var VISTAS=["inicio","examen","practica","juego","roadtest","maniobras","cultura","acerca"];
function pintarTabs(){$("tabs").innerHTML=VISTAS.map(function(v){return '<a href="#'+v+'" data-v="'+v+'">'+esc(t("tabs")[v])+'</a>';}).join("");}
function vista(){var v=(location.hash||"#inicio").slice(1); return VISTAS.indexOf(v)<0?"inicio":v;}
function ir(){
  var v=vista();
  VISTAS.forEach(function(x){$(x).classList.toggle("on",x===v);});
  document.querySelectorAll("#tabs a").forEach(function(a){if(a.dataset.v===v)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
  if(v!=="juego"&&GM&&GM.timer) juegoFin();
  var hv=$("heroVid"); if(hv){ if(v==="inicio"){ if(!hv.src) hv.src="clips/portada.mp4"; var pr=hv.play(); if(pr&&pr.catch) pr.catch(function(){}); } else hv.pause(); }
  if(TTS) TTS.cancel();
  window.scrollTo(0,0);
}
window.addEventListener("hashchange",ir);

// ---------- Anuncios: solo fuera de las preguntas ----------
var adsLoaded=false;
function pintarAds(){
  document.querySelectorAll("[data-ad]").forEach(function(el){
    if(CFG.adsenseClient){
      if(!el.dataset.filled){el.dataset.filled=1; el.innerHTML='<ins class="adsbygoogle" style="display:block" data-ad-client="'+CFG.adsenseClient+'" data-ad-format="auto" data-full-width-responsive="true"></ins>';
        if(!adsLoaded){adsLoaded=true; var s=document.createElement("script"); s.async=true; s.crossOrigin="anonymous"; s.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+CFG.adsenseClient; document.head.appendChild(s);}
        try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch(e){} }
    } else el.textContent=CFG.showAdDemo?t("ad"):"";
  });
}

// ---------- Inicio ----------
function pintarInicio(){
  $("guideImg").src=img(P.guide.img); $("guideImg2").src=img(P.guide.img);
  $("guideName").textContent=P.guide.name+" · "+P.guide.role; $("guideHello").textContent=P.guide.hello;
  $("howList").innerHTML=P.ui.how.map(function(x){return "<li>"+esc(x)+"</li>";}).join("");
  var st=store.get("stats",{n:0,p:0,b:0});
  $("stats").textContent=st.n?fmt(t("statsLine"),{n:num(st.n),p:num(st.p),b:num(st.b),g:num(store.get("best",0))}):t("statsNone");
  var n=Object.keys(MISS).length, gm=$("goMistakes");
  gm.hidden=!n; gm.textContent="↻ "+t("practiceTitle")+" · "+num(n);
  gm.onclick=function(){location.hash="#practica"; practicaNueva("miss");};
}

// ---------- Simulacro (se guarda después de cada respuesta) ----------
var EX=store.get("exam",null);
function guardarEx(){store.set("exam",EX?{ids:EX.qs.map(function(p){return p.id;}),ans:EX.ans,i:EX.i,done:EX.done}:null);}
function rehidratar(){if(EX&&EX.ids){var o=EX; EX={qs:o.ids.map(preparar),ans:o.ans||[],i:o.i||0,done:o.done};}}
function examenIntro(){
  $("examAd").hidden=true;
  $("examCard").innerHTML='<h2>'+esc(t("examIntro"))+'</h2><div class="guide" style="margin:10px 0"><img src="'+img(P.guide.img)+'" alt=""><div class="bubble">'+esc(t("examIntroLead"))+'</div></div><button class="btn" id="exStart" type="button">'+esc(t("start"))+'</button>';
  $("exStart").onclick=examenNuevo;
}
function examenNuevo(){
  var ids=shuffle(shuffle(ALL_RULES).slice(0,16).concat(shuffle(ALL_SIGNS).slice(0,4)));
  EX={qs:ids.map(preparar),ans:[],i:0,done:false}; guardarEx(); examenPintar();
}
function examenPintar(){
  $("examAd").hidden=true;
  var p=EX.qs[EX.i], n=EX.qs.length, sel=EX.ans[EX.i], ops=opciones(p);
  var h=cabezaImg(p)+'<div class="qhead"><span class="pill">'+esc(t("question"))+' '+num(EX.i+1)+' '+esc(t("of"))+' '+num(n)+'</span><div class="progress" aria-hidden="true"><span style="width:'+(EX.i/n*100)+'%"></span></div></div>';
  h+='<div class="qtext">'+esc(textoPregunta(p))+'</div><div class="opts">'+ops.map(function(o,k){return '<button type="button" class="opt'+(sel===o.v?" sel":"")+'" data-k="'+k+'">'+esc(o.txt)+'</button>';}).join("")+'</div>'+toolsHtml(p.id);
  h+='<div class="row" style="margin-top:14px"><button class="btn ghost" id="exPrev" type="button"'+(EX.i===0?" disabled":"")+'>'+esc(t("prev"))+'</button><button class="btn" id="exNext" type="button"'+(sel===undefined?" disabled":"")+'>'+esc(EX.i===n-1?t("finish"):t("next"))+'</button></div>';
  var c=$("examCard"); c.innerHTML=h; bindSay(c,p);
  c.querySelectorAll(".opt").forEach(function(b){b.onclick=function(){EX.ans[EX.i]=ops[+b.dataset.k].v; guardarEx(); examenPintar();};});
  $("exPrev").onclick=function(){EX.i--; guardarEx(); examenPintar();};
  $("exNext").onclick=function(){if(EX.i===n-1) examenResultado(); else {EX.i++; guardarEx(); examenPintar();}};
}
function examenResultado(){
  var ok=0,sig=0,sigT=0;
  EX.qs.forEach(function(p,i){var b=EX.ans[i]===p.correct; if(b)ok++; if(p.sign){sigT++; if(b)sig++;}});
  var aprobado=ok>=14&&sig>=2;
  if(!EX.done){EX.done=true; EX.qs.forEach(function(p,i){marcar(p.id,EX.ans[i]===p.correct);});
    var st=store.get("stats",{n:0,p:0,b:0}); st.n++; if(aprobado)st.p++; st.b=Math.max(st.b,ok); store.set("stats",st); guardarEx();}
  var h='<div class="row"><span class="result-big">'+num(ok)+'/'+num(20)+'</span><span class="pill '+(aprobado?"ok":"bad")+'">'+esc(aprobado?t("passed"):t("failed"))+'</span></div>';
  h+='<div class="guide" style="margin:10px 0"><img src="'+img(P.guide.img)+'" alt=""><div class="bubble">'+esc(frase(aprobado?"right":"wrong"))+' '+num(ok)+' '+esc(t("correct"))+' · '+num(sig)+'/'+num(sigT)+' '+esc(t("signsOk"))+'</div></div>';
  if(ok>=14&&sig<2) h+='<p class="pill warn">'+esc(t("failSigns"))+'</p>';
  h+='<div class="row"><button class="btn" id="exAgain" type="button">'+esc(t("again"))+'</button></div><h3 style="margin-top:14px">'+esc(t("reviewTitle"))+'</h3><div class="review">';
  EX.qs.forEach(function(p,i){var b=EX.ans[i]===p.correct;
    h+='<div class="'+(b?"ok":"bad")+'"><b>'+num(i+1)+'. '+esc(textoPregunta(p))+(p.sign?' ('+esc(P.signs[p.sign])+')':'')+'</b><br>';
    if(!b) h+='<span class="small">'+esc(t("yourAns"))+': '+esc(textoValor(p,EX.ans[i]))+'</span><br>';
    h+='<span class="small">'+esc(t("rightAns"))+': '+esc(textoValor(p,p.correct))+'</span><br><span class="small muted">'+explicacion(p)+'</span></div>';});
  $("examCard").innerHTML=h+'</div>';
  $("exAgain").onclick=examenNuevo; $("examAd").hidden=false; pintarInicio();
}

// ---------- Práctica por tema y "mis errores" ----------
var PR={ch:"all",qs:[],i:0,ok:0};
function pintarChips(){
  var chs=["all"].concat(Object.keys(P.chapters)); if(Object.keys(MISS).length) chs.push("miss");
  $("chapterChips").innerHTML=chs.map(function(c){var lab=c==="all"?t("allTopics"):c==="miss"?"↻ "+num(Object.keys(MISS).length):(c==="S"?P.chapters.S:c+" · "+P.chapters[c]);return '<button type="button" class="chip" data-c="'+c+'" aria-pressed="'+(PR.ch===c)+'">'+esc(lab)+'</button>';}).join("");
  $("chapterChips").querySelectorAll(".chip").forEach(function(b){b.onclick=function(){practicaNueva(b.dataset.c);};});
}
function practicaNueva(c){
  PR.ch=c; PR.i=0; PR.ok=0;
  var ids=c==="miss"?Object.keys(MISS):c==="all"?shuffle(ALL_RULES.concat(ALL_SIGNS)).slice(0,20):c==="S"?ALL_SIGNS:ALL_RULES.filter(function(id){return String(C.rules[+id.slice(1)].ch)===c;});
  PR.qs=shuffle(ids).map(preparar); pintarChips(); practicaPintar();
}
function practicaPintar(){
  var c=$("practiceCard");
  if(!PR.qs.length){c.innerHTML='<p class="muted">—</p>';return;}
  if(PR.i>=PR.qs.length){c.innerHTML='<h3>'+esc(t("done"))+'</h3><p class="result-big">'+num(PR.ok)+'/'+num(PR.qs.length)+'</p><button class="btn" id="prAgain" type="button">'+esc(t("again"))+'</button>';$("prAgain").onclick=function(){practicaNueva(PR.ch==="miss"&&!Object.keys(MISS).length?"all":PR.ch);};pintarInicio();return;}
  var p=PR.qs[PR.i], ops=opciones(p), done=false;
  var h=cabezaImg(p)+'<div class="qhead"><span class="pill">'+num(PR.i+1)+' / '+num(PR.qs.length)+'</span><span class="pill">'+esc(t("score"))+': '+num(PR.ok)+'</span></div>';
  h+='<div class="qtext">'+esc(textoPregunta(p))+'</div><div class="opts">'+ops.map(function(o,k){return '<button type="button" class="opt" data-k="'+k+'">'+esc(o.txt)+'</button>';}).join("")+'</div>'+toolsHtml(p.id)+'<div id="prFb"></div>';
  c.innerHTML=h; bindSay(c,p);
  c.querySelectorAll(".opt").forEach(function(b){b.onclick=function(){
    if(done)return; done=true; var v=ops[+b.dataset.k].v, bien=v===p.correct; if(bien)PR.ok++; marcar(p.id,bien);
    c.querySelectorAll(".opt").forEach(function(x){var xv=ops[+x.dataset.k].v; x.disabled=true; if(xv===p.correct)x.classList.add("right"); else if(x===b)x.classList.add("wrong");});
    $("prFb").innerHTML='<div class="explain guide"><img src="'+img(P.guide.img)+'" alt=""><div class="bubble"><b>'+esc(frase(bien?"right":"wrong"))+'</b>'+explicacion(p)+'</div></div><div class="row" style="margin-top:12px"><button class="btn" id="prNext" type="button">'+esc(t("next"))+'</button></div>';
    $("prNext").onclick=function(){PR.i++; practicaPintar();}; $("prNext").focus({preventScroll:true});
  };});
}

// ---------- Juego de señales ----------
var GM=null;
function juegoIntro(){
  $("gameCard").innerHTML='<h2>'+esc(t("gameTitle"))+'</h2><p>'+esc(t("gameLead"))+'</p><p class="small">'+esc(t("best"))+': <b>'+num(store.get("best",0))+'</b></p><button class="btn" id="gmStart" type="button">'+esc(t("play"))+'</button>';
  $("gmStart").onclick=juegoNuevo;
}
function juegoNuevo(){
  if(GM&&GM.timer)clearInterval(GM.timer);
  GM={t:60,pts:0,streak:0,last:null};
  GM.timer=setInterval(function(){GM.t--; var e=$("gmTime"); if(e)e.textContent=num(GM.t); if(GM.t<=0)juegoFin();},1000);
  juegoRonda();
}
function juegoRonda(){
  var k; do{k=C.signs[Math.floor(Math.random()*C.signs.length)];}while(k===GM.last);
  GM.last=k; var p=preparar("s:"+k), ops=opciones(p);
  var h='<div class="gamebar"><div><b id="gmTime">'+num(GM.t)+'</b>'+esc(t("time"))+'</div><div><b>'+num(GM.pts)+'</b>'+esc(t("points"))+'</div><div><b>×'+num(1+Math.floor(GM.streak/3))+'</b>'+esc(t("streak"))+' '+num(GM.streak)+'</div></div>';
  h+='<div class="signbox">'+svgSenal(k)+'</div><div class="opts">'+ops.map(function(o,i){return '<button type="button" class="opt" data-k="'+i+'">'+esc(o.txt)+'</button>';}).join("")+'</div>';
  var c=$("gameCard"); c.innerHTML=h;
  c.querySelectorAll(".opt").forEach(function(b){b.onclick=function(){
    var v=ops[+b.dataset.k].v, bien=v===p.correct;
    if(bien){GM.streak++; GM.pts+=1+Math.floor((GM.streak-1)/3);} else GM.streak=0;
    c.querySelectorAll(".opt").forEach(function(x){x.disabled=true; var xv=ops[+x.dataset.k].v; if(xv===p.correct)x.classList.add("right"); else if(x===b)x.classList.add("wrong");});
    setTimeout(function(){if(GM&&GM.timer)juegoRonda();},bien?250:700);
  };});
}
function juegoFin(){
  if(!GM)return; clearInterval(GM.timer); GM.timer=null;
  var best=store.get("best",0), record=GM.pts>best; if(record)store.set("best",GM.pts);
  if(vista()!=="juego"){GM=null; juegoIntro(); return;}
  $("gameCard").innerHTML='<h2>'+esc(t("gameOver"))+'</h2><p class="result-big">'+num(GM.pts)+'</p><p class="small">'+esc(t("best"))+': <b>'+num(Math.max(best,GM.pts))+'</b>'+(record?' <span class="pill ok">★</span>':'')+'</p><button class="btn" id="gmAgain" type="button">'+esc(t("playAgain"))+'</button><div class="ad" data-ad></div>';
  $("gmAgain").onclick=juegoNuevo; pintarAds(); pintarInicio();
}

// ---------- Road test ----------
var RT=store.get("rt",{});
function pintarRoadtest(){
  $("rtSource").href=C.fuentes.R;
  var h="";
  P.rt.forEach(function(cat,ci){
    h+='<div class="rt-cat"><h3>'+esc(cat.cat)+'</h3>';
    cat.items.forEach(function(it,ii){var id=ci+"-"+ii, n=RT[id]||0, ch=C.rtch[ci][ii];
      h+='<div class="rt-item"><div><div>'+esc(it)+'</div>'+(ch?'<div class="small muted">'+esc(manRef(ch))+'</div>':'')+'</div><div class="counter"><button type="button" data-id="'+id+'" data-d="-1" aria-label="−">−</button><span>'+num(n)+'</span><button type="button" data-id="'+id+'" data-d="1" aria-label="+">+</button></div></div>';});
    h+='</div>';});
  $("rtList").innerHTML=h;
  $("rtList").querySelectorAll(".counter button").forEach(function(b){b.onclick=function(){var id=b.dataset.id; RT[id]=Math.max(0,(RT[id]||0)+(+b.dataset.d)); store.set("rt",RT); pintarRoadtest();};});
  var total=0, porCat=P.rt.map(function(cat,ci){var s=0; cat.items.forEach(function(_,ii){s+=RT[ci+"-"+ii]||0;}); total+=s; return {n:s,name:cat.cat};});
  var peor=porCat.filter(function(x){return x.n>0;}).sort(function(a,b){return b.n-a.n;}).slice(0,2).map(function(x){return x.name+" ("+num(x.n)+")";}).join(", ");
  $("rtSummary").textContent=total?fmt(t("rtTotal"),{n:num(total),c:peor}):t("rtNone");
}
$("rtReset").onclick=function(){RT={}; store.set("rt",RT); pintarRoadtest();};

// ---------- Maniobras: video generado + animación por pasos ----------
var MAN={tres:{clip:"tres_puntos",ch:"5",start:[110,196,0],p:[[250,196,0],[352,112,-75],[318,178,-160],[170,118,180]]},
         paralelo:{clip:"paralelo",ch:"7",start:[300,170,0],p:[[448,170,0],[372,196,-32],[338,214,0],[352,216,0]]},
         glorieta:{clip:"glorieta",ch:"8",start:[384,300,-90],p:[[384,262,-90],[384,236,-90],[440,160,-90],[600,160,0]]}};
var MS={k:"tres",i:-1,mode:store.get("manMode","anim")};
function pintarManChips(){
  $("manChips").innerHTML=Object.keys(MAN).map(function(k){return '<button type="button" class="chip" data-k="'+k+'" aria-pressed="'+(MS.k===k)+'">'+esc(P.man[k].name)+'</button>';}).join("");
  $("manChips").querySelectorAll(".chip").forEach(function(b){b.onclick=function(){MS.k=b.dataset.k; MS.i=-1; pintarManChips(); pintarMan();};});
  $("manMode").innerHTML=["anim","video"].map(function(m){return '<button type="button" class="chip" data-m="'+m+'" aria-pressed="'+(MS.mode===m)+'">'+esc(m==="video"?"▶ "+t("video"):"⟳ "+t("animation"))+'</button>';}).join("");
  $("manMode").querySelectorAll(".chip").forEach(function(b){b.onclick=function(){MS.mode=b.dataset.m; store.set("manMode",MS.mode); pintarManChips(); pintarMan();};});
}
function auto(id,color,p){return '<g class="car" id="'+id+'" style="transform:translate('+p[0]+'px,'+p[1]+'px) rotate('+p[2]+'deg)"><rect x="-30" y="-14" width="60" height="28" rx="7" fill="'+color+'" stroke="#111" stroke-width="2"/><rect x="6" y="-11" width="14" height="22" rx="3" fill="#bfe3f5" opacity=".9"/>'+(id==="yo"?'<polygon points="30,-6 38,0 30,6" fill="#111"/>':'')+'</g>';}
function escena(){
  var m=MAN[MS.k], s='';
  if(MS.k==="glorieta"){
    s+='<rect width="720" height="320" fill="#5a6460"/><rect y="120" width="720" height="80" fill="#3b4340"/><rect x="344" width="80" height="320" fill="#3b4340"/><circle cx="384" cy="160" r="110" fill="#3b4340"/><circle cx="384" cy="160" r="50" fill="#6f9b63" stroke="#fff" stroke-width="3"/>';
    s+='<path d="M454 95 a95 95 0 0 0 -70 -30" fill="none" stroke="#f2c200" stroke-width="3" stroke-dasharray="8 8"/><polygon points="380,58 396,66 380,74" fill="#f2c200"/>';
  } else {
    s+='<rect width="720" height="320" fill="#5a6460"/><rect y="80" width="720" height="150" fill="#3b4340"/><rect y="66" width="720" height="14" fill="#c9cfcb"/><rect y="230" width="720" height="14" fill="#c9cfcb"/><line x1="0" y1="155" x2="720" y2="155" stroke="#f2c200" stroke-width="4" stroke-dasharray="26 18"/>';
    if(MS.k==="paralelo") s+=auto("p1","#8a8f99",[240,214,0])+auto("p2","#8a8f99",[460,214,0]);
  }
  return '<svg class="scene" viewBox="0 0 720 320" role="img" aria-label="'+esc(P.man[MS.k].name)+'">'+s+auto("yo","#f2b705",MS.i<0?m.start:m.p[MS.i])+'</svg>';
}
function pintarMan(){
  var m=MAN[MS.k];
  $("manMedia").innerHTML='<div class="media">'+(MS.mode==="video"?'<video src="clips/'+m.clip+'.mp4" poster="'+img(m.clip)+'" muted loop playsinline autoplay controls preload="metadata"></video>':escena())+'</div>';
  pasos();
}
function pasos(){
  var m=MAN[MS.k];
  $("manSteps").innerHTML=P.man[MS.k].steps.map(function(st,i){return '<li class="'+(i===MS.i?"now":"")+'">'+esc(st)+'</li>';}).join("");
  $("manPrev").disabled=MS.i<0; $("manNext").disabled=MS.i>=3;
  $("manSrc").innerHTML='<a href="'+C.fuentes[m.ch]+'" target="_blank" rel="noopener">'+esc(manRef(m.ch))+'</a>';
  var g=$("yo"); if(g){var p=MS.i<0?m.start:m.p[MS.i]; g.style.transform='translate('+p[0]+'px,'+p[1]+'px) rotate('+p[2]+'deg)';}
  if(MS.i>=0&&hasVoice()&&MS.say) speak(P.man[MS.k].steps[MS.i]);
}
$("manNext").onclick=function(){MS.i++; MS.say=true; pasos();};
$("manPrev").onclick=function(){MS.i--; MS.say=true; pasos();};

// ---------- Cultura y fuentes ----------
function pintarCultura(){
  var VID={interseccion:1,autopista:1,lluvia:1,glorieta:1,portada:1};
  $("cultList").innerHTML=P.culture.map(function(c){var m=VID[c.img]?'<video src="clips/'+c.img+'.mp4" poster="'+img(c.img)+'" muted loop playsinline autoplay preload="none" style="aspect-ratio:16/9;object-fit:cover;width:100%"></video>':'<img src="'+img(c.img)+'" alt="" loading="lazy">';return '<div class="card">'+m+'<div class="txt"><h3>'+esc(c.title)+'</h3><p class="small">'+esc(c.text)+'</p></div></div>';}).join("");
  var l=Object.keys(P.chapters).filter(function(c){return c!=="S";}).map(function(c){return '<li><a href="'+C.fuentes[c]+'" target="_blank" rel="noopener">'+esc(manRef(c))+' · '+esc(P.chapters[c])+'</a></li>';}).join("");
  $("sourceList").innerHTML=l+'<li><a href="'+C.fuentes.S+'" target="_blank" rel="noopener">'+esc(P.chapters.S)+'</a></li><li><a href="'+C.fuentes.R+'" target="_blank" rel="noopener">'+esc(t("rtSourceLink"))+'</a></li>';
}

// ---------- Todo ----------
function renderAll(){
  document.title="Al Volante NY · "+P.name;
  document.querySelectorAll("[data-t]").forEach(function(el){var v=P.ui[el.dataset.t]; if(typeof v==="string") el.textContent=v;});
  $("langBtn").textContent="🌐 "+P.name; $("langBtn").setAttribute("aria-label",t("langLabel"));
  pintarTabs(); pintarInicio(); pintarChips(); pintarRoadtest(); pintarManChips(); MS.say=false; pintarMan(); pintarCultura(); pintarAds();
  rehidratar(); if(EX){ if(EX.done) examenResultado(); else examenPintar(); } else examenIntro();
  if(PR.qs.length) practicaPintar(); else practicaNueva("all");
  if(!GM||!GM.timer) juegoIntro();
  ir();
}
$("langBtn").onclick=pickerShow;
if(TTS&&TTS.addEventListener) TTS.addEventListener("voiceschanged",function(){});

// Instalar como app (Android/Chrome) y uso sin conexión
var deferred=null;
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault(); deferred=e; var b=$("installBtn"); b.hidden=false; b.onclick=function(){deferred.prompt(); deferred=null; b.hidden=true;};});
if("serviceWorker" in navigator && location.protocol==="https:") navigator.serviceWorker.register("sw.js").catch(function(){});

// Primer arranque: idioma guardado, o el del teléfono, o el selector
var q=(location.search.match(/[?&]lang=([a-z]{2})/)||[])[1];
var saved=META.some(function(m){return m.code===q;})?q:store.get("lang",null);
if(saved) setLang(saved);
else {
  LANG=(navigator.language||"en").slice(0,2); pickerShow();
}
})();
