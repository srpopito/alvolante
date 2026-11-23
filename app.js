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
  if(CFG.reportEmail) h+='<a class="linkbtn" href="mailto:'+CFG.reportEmail+'?subject='+encodeURIComponent("DriveReady "+LANG+" "+id)+'">⚑ '+({es:"Reportar un error",en:"Report a mistake",zh:"报告错误",ru:"Сообщить об ошибке",ko:"오류 신고",bn:"ভুল জানান"}[LANG]||"⚑")+'</a>';
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
   case "crossbuck": s+='<g transform="rotate(-35 100 100)"><rect x="8" y="82" width="184" height="36" fill="#fff" stroke="#111" stroke-width="4"/>'+tx(52,108,19,"CROSS","#111")+tx(152,108,19,"ING","#111")+'</g><g transform="rotate(35 100 100)"><rect x="8" y="82" width="184" height="36" fill="#fff" stroke="#111" stroke-width="4"/>'+tx(52,108,19,"RAIL","#111")+tx(150,108,19,"ROAD","#111")+'</g>';break;
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
var VISTAS=["inicio","examen","practica","manual","juego","roadtest","escuelas","maniobras","cultura","acerca"];
function pintarTabs(){var tb=t("tabs"); if(tb&&!tb.escuelas) tb.escuelas=(SCT[LANG]||SCT.en).tab;$("tabs").innerHTML=VISTAS.map(function(v){return '<a href="#'+v+'" data-v="'+v+'">'+esc(t("tabs")[v])+'</a>';}).join("");}
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
var MAST=store.get("mast",{}), TOTAL=ALL_RULES.length+ALL_SIGNS.length;
function pintarDominadas(){var n=Object.keys(MAST).length; $("masteredPill").textContent=n>=TOTAL?t("allDone"):fmt(t("mastered"),{n:num(n),t:num(TOTAL)});}
function hechos(ch){ if(ch==="S") return C.signs.map(function(k){return {id:"s:"+k,txt:P.signs[k],sign:k};});
  return C.rules.map(function(r,i){return {id:"r"+i,ch:String(r.ch),txt:P.q[i][2]};}).filter(function(x){return x.ch===ch;}); }
function panelManual(p,revelar){
  var ch=p.ch, lista=hechos(ch);
  var h='<h3>📖 '+esc(t("fromManual"))+' · '+esc(ch==="S"?P.chapters.S:manRef(ch)+" "+P.chapters[ch])+'</h3>';
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
  h+='<div class="qtext">'+esc(textoPregunta(p))+'</div><div class="opts">'+ops.map(function(o,k){return '<button type="button" class="opt" data-k="'+k+'">'+esc(o.txt)+'</button>';}).join("")+'</div>'+toolsHtml(p.id)+'<div id="prFb"></div>';
  c.innerHTML=h; bindSay(c,p);
  c.querySelectorAll(".opt").forEach(function(b){b.onclick=function(){
    if(done)return; done=true; var v=ops[+b.dataset.k].v, bien=v===p.correct; if(bien)PR.ok++; marcar(p.id,bien); if(bien) MAST[p.id]=1; else delete MAST[p.id]; store.set("mast",MAST); pintarDominadas(); panelManual(p,true);
    c.querySelectorAll(".opt").forEach(function(x){var xv=ops[+x.dataset.k].v; x.disabled=true; if(xv===p.correct)x.classList.add("right"); else if(x===b)x.classList.add("wrong");});
    $("prFb").innerHTML='<div class="explain guide"><img src="'+img(P.guide.img)+'" alt=""><div class="bubble"><b>'+esc(frase(bien?"right":"wrong"))+'</b>'+explicacion(p)+'</div></div><div class="row" style="margin-top:12px"><button class="btn" id="prNext" type="button">'+esc(t("next"))+'</button></div>';
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
    return '<div class="card chcard"><div class="head"><img src="'+img(CH_IMG[c])+'" alt="" loading="lazy"></div><h3>'+esc(titulo)+'</h3>'+cuerpo+
      '<div class="row" style="margin-top:12px"><button class="btn" type="button" data-pr="'+c+'">'+esc(t("practiceCh"))+'</button>'+(hasVoice()?'<button class="btn ghost" type="button" data-say-ch="'+c+'">🔊 '+esc(t("readCh"))+'</button>':'')+'<a class="small" href="'+C.fuentes[c]+'" target="_blank" rel="noopener">'+esc(t("official"))+' ↗</a></div></div>';
  }).join("");
  $("manualList").querySelectorAll("[data-pr]").forEach(function(b){b.onclick=function(){location.hash="#practica"; practicaNueva(b.dataset.pr);};});
  $("manualList").querySelectorAll("[data-say-ch]").forEach(function(b){b.onclick=function(){speak(hechos(b.dataset.sayCh).map(function(x){return x.txt;}).join(". "));};});
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


// ---------- Escuelas de manejo (lista oficial del DMV; patrocinadas marcadas como tales) ----------
var SCT={
 en:{tab:"Driving schools",title:"Find a licensed driving school near you",lead:"Every school on the official NYS DMV list of licensed driving schools, nearest first. Look for the 5-hour course, lessons for the road test, or motorcycle training.",near:"Use my location",search:"Search by name, city or ZIP",p:"5-hour course",a:"Car lessons",m:"Motorcycle",call:"Call",dir:"Directions",rev:"Reviews on Google Maps",sp:"Sponsored",locErr:"Couldn't get your location. Search by city or ZIP instead.",count:"{n} licensed schools",mi:"mi",note:"Source: NYS DMV list of licensed driving schools (data.ny.gov). Being listed is not an endorsement by DriveReady or the DMV. Sponsored schools pay to appear first and are always labeled.",own:"Own a driving school? Get featured in 6 languages",more:"Show more"},
 es:{tab:"Autoescuelas",title:"Encuentra una autoescuela con licencia cerca de ti",lead:"Todas las escuelas de la lista oficial del DMV de Nueva York, de la más cercana a la más lejana. Busca el curso de 5 horas, clases para el road test o de moto.",near:"Usar mi ubicación",search:"Busca por nombre, ciudad o código postal",p:"Curso de 5 horas",a:"Clases de auto",m:"Moto",call:"Llamar",dir:"Cómo llegar",rev:"Reseñas en Google Maps",sp:"Patrocinado",locErr:"No pudimos obtener tu ubicación. Busca por ciudad o código postal.",count:"{n} escuelas con licencia",mi:"mi",note:"Fuente: lista oficial de autoescuelas con licencia del DMV de Nueva York (data.ny.gov). Aparecer aquí no es una recomendación de DriveReady ni del DMV. Las patrocinadas pagan por salir primero y siempre van marcadas.",own:"¿Tienes una autoescuela? Aparece destacada en 6 idiomas",more:"Ver más"},
 zh:{tab:"驾校",title:"查找附近有执照的驾校",lead:"纽约州 DMV 官方执照驾校名单，按距离由近到远排列。可找5小时课程、路考练车或摩托车培训。",near:"使用我的位置",search:"按名称、城市或邮编搜索",p:"5小时课程",a:"汽车练车",m:"摩托车",call:"打电话",dir:"路线",rev:"Google 地图评价",sp:"赞助",locErr:"无法获取位置，请按城市或邮编搜索。",count:"{n} 所执照驾校",mi:"英里",note:"来源：纽约州 DMV 执照驾校名单 (data.ny.gov)。列入名单不代表 DriveReady 或 DMV 推荐。赞助驾校付费排在前面，并始终标明“赞助”。",own:"您开驾校吗？用6种语言展示",more:"显示更多"},
 ru:{tab:"Автошколы",title:"Найдите лицензированную автошколу рядом",lead:"Все школы из официального списка DMV штата Нью-Йорк, сначала ближайшие. 5-часовой курс, занятия к экзамену по вождению или мотоцикл.",near:"Моё местоположение",search:"Поиск по названию, городу или индексу",p:"5-часовой курс",a:"Вождение авто",m:"Мотоцикл",call:"Позвонить",dir:"Маршрут",rev:"Отзывы в Google Maps",sp:"Спонсор",locErr:"Не удалось определить местоположение. Ищите по городу или индексу.",count:"{n} лицензированных школ",mi:"миль",note:"Источник: список лицензированных автошкол DMV штата Нью-Йорк (data.ny.gov). Наличие в списке — не рекомендация DriveReady или DMV. Спонсоры платят за место вверху и всегда отмечены.",own:"У вас автошкола? Покажитесь на 6 языках",more:"Показать ещё"},
 ko:{tab:"운전학원",title:"가까운 인가 운전학원 찾기",lead:"뉴욕주 DMV 공식 인가 운전학원 목록을 가까운 순서로 보여 드려요. 5시간 교육, 도로주행 연수, 오토바이 교육을 찾아보세요.",near:"내 위치 사용",search:"이름, 도시, 우편번호로 검색",p:"5시간 교육",a:"자동차 연수",m:"오토바이",call:"전화",dir:"길찾기",rev:"Google 지도 리뷰",sp:"후원",locErr:"위치를 가져올 수 없어요. 도시나 우편번호로 검색하세요.",count:"인가 학원 {n}곳",mi:"마일",note:"출처: 뉴욕주 DMV 인가 운전학원 목록 (data.ny.gov). 목록에 있다고 DriveReady나 DMV가 추천하는 것은 아니에요. 후원 학원은 비용을 내고 위에 표시되며 항상 '후원'으로 표시돼요.",own:"운전학원을 운영하세요? 6개 언어로 소개하세요",more:"더 보기"},
 bn:{tab:"ড্রাইভিং স্কুল",title:"কাছের লাইসেন্সপ্রাপ্ত ড্রাইভিং স্কুল খুঁজুন",lead:"নিউ ইয়র্ক স্টেট DMV-এর অফিশিয়াল তালিকার সব স্কুল, কাছেরগুলো আগে। ৫ ঘণ্টার কোর্স, রোড টেস্টের ক্লাস বা মোটরসাইকেল।",near:"আমার লোকেশন",search:"নাম, শহর বা ZIP দিয়ে খুঁজুন",p:"৫ ঘণ্টার কোর্স",a:"গাড়ির ক্লাস",m:"মোটরসাইকেল",call:"কল",dir:"রাস্তা",rev:"Google Maps রিভিউ",sp:"স্পনসর",locErr:"লোকেশন পাওয়া যায়নি। শহর বা ZIP দিয়ে খুঁজুন।",count:"{n}টি লাইসেন্সপ্রাপ্ত স্কুল",mi:"মাইল",note:"উৎস: নিউ ইয়র্ক স্টেট DMV-এর লাইসেন্সপ্রাপ্ত ড্রাইভিং স্কুলের তালিকা (data.ny.gov)। তালিকায় থাকা মানে DriveReady বা DMV-এর সুপারিশ নয়। স্পনসর স্কুল টাকা দিয়ে উপরে থাকে এবং সবসময় চিহ্নিত।",own:"ড্রাইভিং স্কুল আছে? ৬টি ভাষায় দেখান",more:"আরও দেখুন"}};
var SC={pos:null,q:"",lim:20};
function st(k){var o=SCT[LANG]||SCT.en; return o[k]||SCT.en[k];}
function dist(a,b,c,d){var R=3958.8,r=Math.PI/180,x=(c-a)*r,y=(d-b)*r,h=Math.sin(x/2)*Math.sin(x/2)+Math.cos(a*r)*Math.cos(c*r)*Math.sin(y/2)*Math.sin(y/2);return 2*R*Math.asin(Math.sqrt(h));}
function cargarEscuelas(cb){if(window.SCHOOLS_NY) return cb(); var s=document.createElement("script"); s.src="schools/ny.js"; s.onload=cb; document.head.appendChild(s);}
function pintarEscuelas(){
  $("scTitle").textContent=st("title"); $("scLead").textContent=st("lead"); $("scNear").textContent="📍 "+st("near"); $("scQ").placeholder=st("search"); $("scNote").textContent=st("note");
  $("scOwn").textContent=st("own"); $("scOwn").href=CFG.sponsorEmail?"mailto:"+CFG.sponsorEmail+"?subject="+encodeURIComponent("DriveReady featured driving school"):"#";
  $("scOwn").hidden=!CFG.sponsorEmail;
  if(!window.SCHOOLS_NY){ $("scList").innerHTML='<p class="muted small">…</p>'; return cargarEscuelas(pintarEscuelas); }
  var sp={}; (CFG.sponsors||[]).forEach(function(s){sp[s.id]=s;});
  var q=SC.q.trim().toLowerCase(), L=SCHOOLS_NY.filter(function(s){return !q||(s[1]+" "+s[2]+" "+s[3]+" "+s[4]+" "+s[5]).toLowerCase().indexOf(q)>=0;});
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
      '<div class="sc-act">'+(ph?'<a href="tel:+1'+ph+'">📞 '+esc(st("call"))+'</a>':'')+
      '<a target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination='+mq+'">🧭 '+esc(st("dir"))+'</a>'+
      '<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query='+mq+'">⭐ '+esc(st("rev"))+'</a>'+
      (x.sp&&x.sp.url?'<a target="_blank" rel="noopener sponsored" href="'+esc(x.sp.url)+'">🌐 Web</a>':'')+'</div></div>';};
  $("scList").innerHTML=spon.slice(0,3).map(card).join("")+rest.slice(0,SC.lim).map(card).join("");
  $("scMore").hidden=rest.length<=SC.lim; $("scMore").textContent=st("more");
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
  $("cultList").innerHTML=P.culture.map(function(c){var m=VID[c.img]?'<video src="clips/'+c.img+'.mp4" poster="'+img(c.img)+'" muted loop playsinline autoplay preload="none" style="aspect-ratio:16/9;object-fit:cover;width:100%"></video>':'<img src="'+img(c.img)+'" alt="" loading="lazy">';return '<div class="card">'+m+'<div class="txt"><h3>'+esc(c.title)+'</h3><p class="small">'+esc(c.text)+'</p></div></div>';}).join("");
  var l=Object.keys(P.chapters).filter(function(c){return c!=="S";}).map(function(c){return '<li><a href="'+C.fuentes[c]+'" target="_blank" rel="noopener">'+esc(manRef(c))+' · '+esc(P.chapters[c])+'</a></li>';}).join("");
  $("sourceList").innerHTML=l+'<li><a href="'+C.fuentes.S+'" target="_blank" rel="noopener">'+esc(P.chapters.S)+'</a></li><li><a href="'+C.fuentes.R+'" target="_blank" rel="noopener">'+esc(t("rtSourceLink"))+'</a></li>';
}

// ---------- Todo ----------
function renderAll(){
  document.title="DriveReady: Permit & Road Test · "+P.name;
  document.querySelectorAll("[data-t]").forEach(function(el){var v=P.ui[el.dataset.t]; if(typeof v==="string") el.textContent=v;});
  $("langBtn").textContent="🌐 "+P.name; $("langBtn").setAttribute("aria-label",t("langLabel"));
  pintarTabs(); pintarInicio(); pintarChips(); pintarManual(); pintarDominadas(); pintarRoadtest(); pintarEscuelas(); pintarManChips(); pintarMan(); pintarCultura(); pintarAds();
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
