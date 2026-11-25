
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
const root = process.argv[2];
const errs = [], warns = [];
const E = (m) => errs.push(m);
const W = (m) => warns.push(m);
const load = (rel) => {
  const c = { window: {}, self: {}, document: { addEventListener() {} }, console };
  c.window = c; c.self = c;
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(path.join(root, rel), 'utf8'), c, { filename: rel });
  return c;
};
const registry = load('states/registry.js').window.STATES;
if (!Array.isArray(registry) || registry.length < 1) E('registry: no states');
const LANGS = ['en','es','zh','ru','ko','bn'];
const uiEn = load('ui/en.js').window.UI.en;
for (const st of registry) {
  const code = st.code;
  const tag = '[' + code + '] ';
  const core = load(st.core).window.CORE;
  if (!core) { E(tag + 'core missing'); continue; }
  for (const key of ['rules','signs','signcat','exam','fuentes']) if (!(key in core)) E(tag + 'core.' + key + ' missing');
  if (!Array.isArray(core.signs)) E(tag + 'core.signs must be an array');
  if (!Array.isArray(core.rules)) E(tag + 'core.rules must be an array');
  const packs = {};
  for (const L of LANGS) {
    const file = (st.lang || 'lang/') + L + '.js';
    if (!fs.existsSync(path.join(root, file))) { E(tag + 'missing language ' + L); continue; }
    const c = load(file);
    const p = c.window.LANGS && c.window.LANGS[L];
    if (!p) { E(tag + 'lang ' + L + ' not exported'); continue; }
    packs[L] = p;
  }
  const en = packs.en;
  if (!en) { E(tag + 'no English pack, cannot compare'); continue; }
  const qn = en.q.length;
  if (qn < 60) E(tag + qn + ' questions (min 60)');
  if (qn > 90) W(tag + qn + ' questions (max 90 recommended)');
  if (core.rules.length !== qn) E(tag + 'rules ' + core.rules.length + ' != questions ' + qn);
  const seenQ = new Set();
  en.q.forEach((q, i) => {
    if (!Array.isArray(q) || q.length !== 3) E(tag + 'q' + i + ' must have 3 fields [question, options, explanation]');
    if (!Array.isArray(q[1]) || q[1].length !== 4) E(tag + 'q' + i + ' must have 4 options');
    if (!q[2] || String(q[2]).trim().length < 4) E(tag + 'q' + i + ' empty explanation');
    const s = String(q[0]).trim().toLowerCase();
    if (seenQ.has(s)) E(tag + 'duplicate question: ' + String(q[0]).slice(0, 50));
    seenQ.add(s);
    const r = core.rules[i];
    if (!r || typeof r.ch !== 'number') E(tag + 'rules[' + i + '] bad');
    else if (typeof r.a !== 'number' || r.a < 0 || r.a > 3) E(tag + 'rules[' + i + '] answer index bad');
    else if (!(String(r.ch) in en.chapters)) E(tag + 'rules[' + i + '] chapter ' + r.ch + ' not in chapters');
  });
  if (!core.fuentes.R) E(tag + 'core.fuentes.R missing (road test source)');
  for (const ch of Object.keys(en.chapters)) {
    if (!core.fuentes[ch]) E(tag + 'core.fuentes missing chapter ' + ch);
  }
  if (!core.exam || typeof core.exam.total !== 'number') E(tag + 'exam config missing');
  else {
    if (core.exam.total > qn) E(tag + 'exam total ' + core.exam.total + ' > questions ' + qn);
    if (core.exam.pass <= 0 || core.exam.pass > core.exam.total) E(tag + 'exam pass out of range');
    if (core.exam.signs > core.signs.length) E(tag + 'exam asks more signs than exist');
  }
  if (!en.guide || !en.guide.name || !en.guide.hello) E(tag + 'guide incomplete');
  if (!en.examLead) W(tag + 'no examLead, generic template used');
  for (const L of LANGS) {
    const p = packs[L]; if (!p) continue;
    if (p.q.length !== qn) E(tag + L + ' has ' + p.q.length + ' questions, en has ' + qn);
    const keys = Object.keys(en).sort().join(',');
    const lkeys = Object.keys(p).sort().join(',');
    if (keys !== lkeys) E(tag + L + ' keys differ from en');
    p.q.forEach((q, i) => {
      if (!Array.isArray(q) || q.length !== 3) E(tag + L + ' q' + i + ' needs 3 fields');
      if (q[1].length !== 4) E(tag + L + ' q' + i + ' needs 4 options');
      if (!q[2] || String(q[2]).trim().length < 4) E(tag + L + ' q' + i + ' empty explanation');
    });
    if (Object.keys(p.chapters).join(',') !== Object.keys(en.chapters).join(',')) E(tag + L + ' chapter keys differ');
    if (core.signs.length) {
      for (const sid of core.signs) if (!p.signs || !p.signs[sid]) E(tag + L + ' sign "' + sid + '" has no meaning');
    }
  }
  if (core.signs.length) {
    for (const sid of core.signs) if (!core.signcat || !core.signcat[sid]) E(tag + 'signcat missing ' + sid);
    for (const sid of Object.keys(core.signcat)) if (!core.signs.includes(sid)) W(tag + 'signcat has extra ' + sid);
  }
  if (core.gdl && typeof core.gdl.hours === 'number' && core.gdl.hours < 10) W(tag + 'gdl hours suspicious');
}
// UI packs completeness
for (const L of LANGS) {
  const p = load('ui/' + L + '.js').window.UI[L];
  if (!p) { E('ui/' + L + ' missing'); continue; }
  const a = Object.keys(uiEn).sort().join(',');
  const b = Object.keys(p).sort().join(',');
  if (a !== b) E('ui/' + L + ' keys differ from en');
}
// CDL course packs
const courseEn = load('cdl/course/en.js').window.CDLCOURSE.en;
for (const L of LANGS) {
  const p = load('cdl/course/' + L + '.js').window.CDLCOURSE[L];
  if (!p) { E('course ' + L + ' missing'); continue; }
  for (const k of ['resume','change','tapPart','plan','games','glossary']) if (!(k in p)) E('course ' + L + ' missing ' + k);
  const q = p.modulesList.reduce((s,m)=>s+m.lessons.reduce((x,l)=>x+l.q.length,0),0);
  const qe = courseEn.modulesList.reduce((s,m)=>s+m.lessons.reduce((x,l)=>x+l.q.length,0),0);
  if (q !== qe) E('course ' + L + ' has ' + q + ' questions, en has ' + qe);
  p.modulesList.forEach((m, mi) => m.lessons.forEach((l, li) => l.q.forEach((qq, qi) => {
    const e = courseEn.modulesList[mi].lessons[li].q[qi];
    if (qq.a !== e.a) E('course ' + L + ' ' + m.id + '/' + l.id + '/' + qi + ' answer differs');
    if (!qq.e) E('course ' + L + ' ' + m.id + '/' + l.id + '/' + qi + ' no explanation');
  })));
}
// Kit packs
const kitEn = load('kit/en.js').window.KIT.en;
for (const L of LANGS) {
  const p = load('kit/' + L + '.js').window.KIT[L];
  if (!p) { E('kit ' + L + ' missing'); continue; }
  if (Object.keys(p).sort().join(',') !== Object.keys(kitEn).sort().join(',')) E('kit ' + L + ' state keys differ');
  for (const k of Object.keys(kitEn)) {
    if (typeof kitEn[k] === 'string') { if (typeof p[k] !== 'string' || (k === 'link' && p[k] !== kitEn[k])) E('kit ' + L + ' ' + k + ' differs'); continue; }
    if (!p[k] || !Array.isArray(p[k].items)) { E('kit ' + L + ' ' + k + ' bad'); continue; }
    if (p[k].items.length !== kitEn[k].items.length) E('kit ' + L + ' ' + k + ' item count differs');
    if (p[k].link !== kitEn[k].link) E('kit ' + L + ' ' + k + ' link differs');
  }
}
console.log('STATES ' + registry.length + ' | LANGS ' + LANGS.length);
console.log('ERRORS ' + errs.length);
errs.slice(0, 80).forEach(e => console.log('E ' + e));
console.log('WARNINGS ' + warns.length);
warns.slice(0, 40).forEach(w => console.log('W ' + w));
process.exit(errs.length ? 1 : 0);
