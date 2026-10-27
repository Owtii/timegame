// samples the figure's pose 240 times a second over beat windows (WIN="a,b;c,d", on the beats' clock) and prints where
// it moves fastest: hand and elbow speeds (m/s), joint turning speeds (rad/s) and sudden jolts (m/s²). A one-frame jump,
// an arm flipping its elbow or a pose switched on without easing shows up as a spike far above its neighbours. Every
// sample is written to arms.json for a closer look.
const { open } = require('./te_common.cjs');
(async () => {
  const { b, p, errs } = await open({ width:600, height:800 }, { page:process.env.PAGE || 'the-graveyard-shift-part2.html' });
  await p.waitForTimeout(4500);
  const W = (process.env.WIN || '60.8,64.2;64.2,67.6').split(';').map(s => s.split(',').map(Number));
  const res = await p.evaluate((W) => {
    const F = window.reel._fig, out = [], v = new THREE.Vector3();
    const wp = n => { F.hz[n].getWorldPosition(v); return [v.x, v.y, v.z]; };
    const ang = n => { const r = F.hz[n].rotation; return [r.x, r.y, r.z]; };
    for (const [t0, t1] of W) for (let t = t0; t <= t1 + 1e-9; t += 1 / 240){
      F.pose(t); F.objs.scene.updateMatrixWorld(true);
      out.push({ t, shR:ang('shR'), elR:ang('elR'), shL:ang('shL'), elL:ang('elL'), torso:ang('torso'), head:ang('head'),
        pElR:wp('elR'), pWrR:wp('wrR'), pElL:wp('elL'), pWrL:wp('wrL'), pShR:wp('shR'), pHead:wp('head') });
    }
    return out; }, W);
  require('fs').writeFileSync('arms.json', JSON.stringify(res));
  const dt = 1 / 240, top = (arr, n = 3) => arr.map((v, i) => [v, i]).sort((a, c) => c[0] - a[0]).slice(0, n).map(([v, i]) => `${res[i].t.toFixed(2)}: ${v.toFixed(1)}`).join('  ');
  for (const k of ['pWrR', 'pElR', 'pWrL', 'pElL', 'pHead']){
    const sp = res.slice(1).map((s, i) => Math.hypot(s[k][0] - res[i][k][0], s[k][1] - res[i][k][1], s[k][2] - res[i][k][2]) / dt), ac = sp.slice(1).map((s, i) => Math.abs(s - sp[i]) / dt);
    console.log(`${k.padEnd(6)} fastest (m/s) ${top(sp)}   | jolts (m/s²) ${top(ac)}`);
  }
  for (const k of ['shR', 'elR', 'shL', 'elL', 'torso', 'head']){
    const w = res.slice(1).map((s, i) => Math.max(...[0, 1, 2].map(c => Math.abs(s[k][c] - res[i][k][c]))) / dt);
    console.log(`${k.padEnd(6)} fastest turn (rad/s) ${top(w)}`);
  }
  console.log(errs.filter(e => !/fonts|ERR_FAILED|net::|Canvas2D/.test(e)).slice(0, 5).join('\n') || 'no errors'); await b.close();
})();
