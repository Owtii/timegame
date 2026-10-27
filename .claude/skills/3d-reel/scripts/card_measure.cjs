// where each piece of the opening's card and the end's question sits on the page, in % of the frame's width from the
// frame's middle (for HOOK_LAYOUT, CHOICE_LAYOUT and KEY_TY in choice.js): each phrase's lines at its full; the card's
// header lines, its keys' faces, OR and its middle; RUN CHOSEN and PART 2; the end's question lines, keys and OR
const { open } = require('./te_fonts.cjs');
(async () => {
  const { b, p, errs } = await open({ width:700, height:1000 });
  await p.waitForTimeout(4000);
  const at = async t => { await p.evaluate(t => { window.reel.play(false); window.reel.seek(t); }, t); await p.waitForTimeout(900); };
  const M = () => p.evaluate(() => {
    const se = document.getElementById('stage'), r0 = se.getBoundingClientRect(), cs = getComputedStyle(se), bl = parseFloat(cs.borderLeftWidth), bt = parseFloat(cs.borderTopWidth), st = { left:r0.left + bl, top:r0.top + bt, width:se.clientWidth, height:se.clientHeight }, cq = st.width / 100, my = st.top + st.height / 2;
    const yc = q => +((q.top + q.height / 2 - my) / cq).toFixed(2), y = e => yc(e.getBoundingClientRect());
    const lines = el => { const m = new Map(); el.querySelectorAll('span span, .hw > span').forEach(s => { const q = s.getClientRects()[0]; if (!q) return; const k = Math.round(q.top); if (!m.has(k)) m.set(k, q); }); return [...m.values()].map(yc); };
    const face = e => { const q = e.getBoundingClientRect(); return { top:+((q.top - my) / cq).toFixed(2), x:+((q.left - st.left) / cq - 50).toFixed(2), w:+(q.width / cq).toFixed(2), h:+(q.height / cq).toFixed(2) }; };
    const lab = e => { const s = e.querySelector('span'), r = document.createRange(); r.selectNodeContents(s); const q = r.getBoundingClientRect(), f = e.getBoundingClientRect(); return +(((q.top + q.height / 2) - (f.top + f.height / 2)) / cq).toFixed(2); };
    const rc = document.getElementById('rcard'), ch = rc.querySelector('.rchose'), chb = ch.querySelector('b'), rg = document.createRange(); rg.selectNodeContents(ch.firstChild);
    const card = document.getElementById('hcard').getBoundingClientRect();
    return { l:[0, 1, 2].map(i => lines(document.getElementById('hl' + i))), hh:lines(document.getElementById('hh')), keys:[...rc.querySelectorAll('.rb')].map(face), lab:[...rc.querySelectorAll('.rb')].map(lab),
      or:y(rc.querySelector('.or')), card:yc(card), chose:yc(rg.getBoundingClientRect()), part:y(chb) }; });
  const E = () => p.evaluate(() => {
    const se = document.getElementById('stage'), r0 = se.getBoundingClientRect(), cs = getComputedStyle(se), bl = parseFloat(cs.borderLeftWidth), bt = parseFloat(cs.borderTopWidth), st = { left:r0.left + bl, top:r0.top + bt, width:se.clientWidth, height:se.clientHeight }, cq = st.width / 100, my = st.top + st.height / 2;
    const yc = q => +((q.top + q.height / 2 - my) / cq).toFixed(2), c = document.getElementById('choice'), h3 = c.querySelector('h3'), r = document.createRange(); r.selectNodeContents(h3);
    const rects = [...r.getClientRects()], m = new Map(); rects.forEach(q => { const k = Math.round(q.top); if (!m.has(k) && q.width > 5) m.set(k, q); });
    const bts = [...c.querySelectorAll('button[data-k]')].map(e => { const q = e.getBoundingClientRect(); return { top:+((q.top - my) / cq).toFixed(2), x:+((q.left - st.left) / cq - 50).toFixed(2), w:+(q.width / cq).toFixed(2) }; });
    return { q:[...m.values()].map(yc), keys:bts, or:yc(c.querySelector('.or').getBoundingClientRect()) }; });
  const out = {};
  for (const [i, t] of [[0, .9], [1, 2.6], [2, 4.1]]){ await at(t); out['l' + i] = (await M()).l[i]; }
  await at(7.6); const k = await M(); await at(9.2); const c = await M();
  await p.evaluate(() => window.reel.seek(window.reel.duration ? window.reel.duration - 1 : 88.5)); await p.waitForTimeout(1500); const e = await E();
  console.log(JSON.stringify({ l:[out.l0, out.l1, out.l2], hh:k.hh, keys:k.keys, lab:k.lab, or:k.or, card:k.card, chose:c.chose, part:c.part, end:e }));
  console.log(errs.filter(e => !/ERR_FAILED|net::|Canvas2D/.test(e)).slice(0, 5).join('\n') || 'no errors'); await b.close();
})();
