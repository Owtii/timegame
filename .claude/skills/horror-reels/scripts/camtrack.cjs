// where the camera looks across the film (page times), and where he is on screen: camtrack.json
const { open } = require('./te_common.cjs');
(async () => { const { b, p } = await open({ width:540, height:960 }, { page:'the-graveyard-shift-part2.html', timeout:240000 });
  await p.waitForFunction(() => window.reel && window.reel._fig, null, { timeout:240000 });
  await p.evaluate(() => window.reel.play(false));
  const r = await p.evaluate(() => { const f = window.reel._fig, cam = f.objs.camera, V = cam.position.constructor, out = [];
    for (let t = 9.8; t <= 95.2; t += .1){ window.reel.seek(t); cam.updateMatrixWorld(); const d = new V(); cam.getWorldDirection(d);
      const h = t > 52 ? f.haz(t - 13.8) : null; let s = null;
      if (h){ const v = new V(h.x, 1.55, h.z).project(cam); s = [+v.x.toFixed(2), +v.y.toFixed(2), v.z < 1 ? 1 : 0]; }
      out.push({ t:+t.toFixed(2), p:cam.position.toArray().map(x => +x.toFixed(2)), yaw:+Math.atan2(d.x, -d.z).toFixed(3), pitch:+Math.asin(d.y).toFixed(3), fov:+cam.fov.toFixed(1), him:s }); }
    return out; });
  require('fs').writeFileSync('camtrack.json', JSON.stringify(r)); console.log(r.length, 'samples'); await b.close(); })();
