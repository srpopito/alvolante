# Cambios de estilo

Antes y después de los textos modificados en la revisión de estilo. Solo se toca lo que mejora la claridad o la honestidad; no se reescribe lo que ya funcionaba.

## Motivos

1. **Honestidad:** «un simulacro igual de exigente» (en/es) promete más de lo que la app puede demostrar. Se cambia por «practica con simulacros».
2. **Menos texto en el inicio:** la lista de 4 pasos pasa a 3. El cuarto (ver maniobras antes del road test) ya tiene su propia pestaña.

## Antes y después

```diff
- en homeLead: The written test for a learner permit is {total} multiple-choice questions from the official {agency} driver manual. Take a mock exam that is just as strict, study by topic, then get ready for the road test.
+ -> The written test for a learner permit is {total} multiple-choice questions from the official {agency} driver manual. Practise with mock exams, study by topic, then get ready for the road test.
```
```diff
- en how: ["Take a practice exam to see where you stand.","Drill the chapters you miss most.","Play the sign game until you know them on sight.","Before the road test, watch the maneuvers, then do a practice drive with the score sheet."]
+ -> ["Take a practice exam to see where you stand.","Drill the chapters you miss most.","Play the sign game until you know them on sight."]
```
```diff
- es homeLead: El examen escrito del permiso de aprendiz tiene {total} preguntas de opción múltiple sobre el manual oficial del {agency}. Practica con un simulacro igual de exigente, repasa por tema y prepárate para el examen de manejo.
+ -> El examen escrito del permiso de aprendiz tiene {total} preguntas de opción múltiple sobre el manual oficial del {agency}. Practica con simulacros, repasa por tema y prepárate para el examen de manejo.
```
```diff
- es how: ["Haz un simulacro para ver dónde estás.","Repasa por tema lo que más fallas.","Juega con las señales hasta reconocerlas al instante.","Antes del examen de manejo, mira las maniobras y practica con alguien con licencia usando la hoja de errores."]
+ -> ["Haz un simulacro para ver dónde estás.","Repasa por tema lo que más fallas.","Juega con las señales hasta reconocerlas al instante."]
```
```diff
- zh homeLead: 学习驾照笔试共 {total} 道选择题，内容全部来自 {agency} 官方驾驶手册。在这里先做模拟题、按章节复习，再准备路考。
+ -> 学习驾照笔试共 {total} 道选择题，内容全部来自 {agency} 官方驾驶手册。在这里先做模拟题、按章节复习，再准备路考。
```
```diff
- zh how: ["先做一套模拟题，看看自己的水平。","错得多的章节，用分章练习反复刷。","玩标志游戏，做到一眼认出。","路考前看动作演示，再请陪练按评分表帮你练。"]
+ -> ["先做一套模拟题，看看自己的水平。","错得多的章节，用分章练习反复刷。","玩标志游戏，做到一眼认出。"]
```
```diff
- ru homeLead: Экзамен на учебные права — это {total} вопросов с вариантами ответа по официальному справочнику {agency}. Тренируйся на пробных билетах, повторяй по главам и готовься к экзамену по вождению.
+ -> Экзамен на учебные права — это {total} вопросов с вариантами ответа по официальному справочнику {agency}. Тренируйся на пробных билетах, повторяй по главам и готовься к экзамену по вождению.
```
```diff
- ru how: ["Пройди пробный экзамен и посмотри свой уровень.","Повтори главы, где больше всего ошибок.","Играй со знаками, пока не будешь узнавать их сразу.","Перед вождением посмотри манёвры и прокатись с наставником по оценочному листу."]
+ -> ["Пройди пробный экзамен и посмотри свой уровень.","Повтори главы, где больше всего ошибок.","Играй со знаками, пока не будешь узнавать их сразу."]
```
```diff
- ko homeLead: 연습면허 필기시험은 {agency} 공식 운전자 매뉴얼에서 나오는 객관식 {total}문제예요. 모의고사로 실력을 확인하고, 단원별로 복습한 뒤 도로주행을 준비하세요.
+ -> 연습면허 필기시험은 {agency} 공식 운전자 매뉴얼에서 나오는 객관식 {total}문제예요. 모의고사로 실력을 확인하고, 단원별로 복습한 뒤 도로주행을 준비하세요.
```
```diff
- ko how: ["모의고사로 지금 실력을 확인해요.","많이 틀린 단원을 반복해서 풀어요.","표지판 게임으로 보자마자 알 수 있게 해요.","도로주행 전에 주행 기술 영상을 보고, 동승자와 채점표대로 연습해요."]
+ -> ["모의고사로 지금 실력을 확인해요.","많이 틀린 단원을 반복해서 풀어요.","표지판 게임으로 보자마자 알 수 있게 해요."]
```
```diff
- bn homeLead: লার্নার পারমিটের লিখিত পরীক্ষায় {agency}-এর অফিশিয়াল ড্রাইভার ম্যানুয়াল থেকে {total}টি বহুনির্বাচনী প্রশ্ন থাকে। মক টেস্ট দিন, অধ্যায় ধরে পড়ুন, তারপর রোড টেস্টের প্রস্তুতি নিন।
+ -> লার্নার পারমিটের লিখিত পরীক্ষায় {agency}-এর অফিশিয়াল ড্রাইভার ম্যানুয়াল থেকে {total}টি বহুনির্বাচনী প্রশ্ন থাকে। মক টেস্ট দিন, অধ্যায় ধরে পড়ুন, তারপর রোড টেস্টের প্রস্তুতি নিন।
```
```diff
- bn how: ["একটি মক টেস্ট দিয়ে নিজের অবস্থা দেখুন।","যে অধ্যায়ে বেশি ভুল, সেটা বারবার অনুশীলন করুন।","সাইন খেলা খেলুন, যতক্ষণ না এক নজরে চিনতে পারেন।","রোড টেস্টের আগে কৌশলের ভিডিও দেখুন, তারপর লাইসেন্সধারী কারো সাথে স্কোরশিট ধরে প্র্যাকটিস করুন।"]
+ -> ["একটি মক টেস্ট দিয়ে নিজের অবস্থা দেখুন।","যে অধ্যায়ে বেশি ভুল, সেটা বারবার অনুশীলন করুন।","সাইন খেলা খেলুন, যতক্ষণ না এক নজরে চিনতে পারেন।"]
```