// shared Playwright setup: local copies of the CDN libraries, fonts blocked
const { chromium } = require('playwright');
exports.open = async (vw = { width:1440, height:900 }, opts = {}) => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport:vw, deviceScaleFactor:opts.dsf || 1 });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERR ' + String(e) + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 240)); });
  await p.route('https://cdn.jsdelivr.net/npm/three@0.128.0/**', r => { const u = new URL(r.request().url()); r.fulfill({ path:process.cwd() + '/npmthree/package/' + u.pathname.replace('/npm/three@0.128.0/', ''), contentType:'application/javascript' }); });
  await p.route('https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/**', r => r.fulfill({ path:process.cwd() + '/npmmux/package/build/mp4-muxer.js', contentType:'application/javascript' }));
  await p.route('https://fonts.**', r => r.abort());
  await p.goto('file://' + process.cwd() + '/' + (opts.page || 'the-13th-floor.html'), { timeout:opts.timeout || +(process.env.GOTO_MS || 30000) });
  return { b, p, errs };
};
