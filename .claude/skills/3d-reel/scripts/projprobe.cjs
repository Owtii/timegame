// where things land on screen from the real camera (NDC x,y in -1..1) at page times TIMES=a,b: him, the east lockers, the
// opened locker door's tips, the camera (seek and the camera take page time; _fig.haz takes beat time = page - 13.8 after the room look-round)
const { open } = require('./te_common.cjs');
(async () => { const { b, p } = await open({ width:540, height:960 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p.waitForFunction(() => window.reel && window.reel._fig, null, { timeout:240000 });
  const r = await p.evaluate((TS) => { const f = window.reel._fig, out = []; const cam = f.objs.camera, V = cam.position.constructor;
    const pr = (x, y, z) => { const v = new V(x, y, z).project(cam); return [+(v.x).toFixed(2), +(v.y).toFixed(2)]; };
    for (const t of TS){ window.reel.seek(t); f.objs.scene.updateMatrixWorld(true); cam.updateMatrixWorld(); const h = f.haz(t - 13.8);
      const L = f.objs.lockersE.map(l => { const w = new V(); l.getWorldPosition(w); return pr(w.x - .46, 1.1, w.z); });
      const hinge = new V(); f.objs.lockersE[2].userData.hinge.getWorldPosition(hinge);
      const tips = [60, 95, 110, 146].map(d => { const a = d * Math.PI / 180; return [d, pr(4.34 - .36 * Math.sin(a), 1.1, -18.94 - .36 * Math.cos(a) * -1 * -1)]; });
      out.push({ t, tips, cam:cam.position.toArray().map(x => +x.toFixed(2)), him: h && [+h.x.toFixed(2), +h.z.toFixed(2)], himS: h && pr(h.x, 1.1, h.z), lockersS:L, hingeW:hinge.toArray().map(x=>+x.toFixed(2)) }); }
    return out; }, (process.env.TIMES || '88.8,89.15,89.7').split(',').map(Number));
  r.forEach(x => console.log(JSON.stringify(x))); await b.close(); })();
