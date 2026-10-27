// te_common's page setup, but with the reel's own fonts (Archivo, JetBrains Mono) served from cardlab/fonts instead of
// blocked, so titles and cards render as they do for the viewer
const { chromium } = require('playwright'), path = require('path');
const FD = [path.resolve(__dirname, 'cardlab/fonts'), path.resolve(__dirname, '../cardlab/fonts'), path.resolve(process.cwd(), 'cardlab/fonts')].find(d => require('fs').existsSync(d));   // (scripts/cardlab in the skill; cardlab/ in the workspace)
const CSS = `@font-face{font-family:'Archivo';font-style:normal;font-weight:400 900;font-stretch:62% 125%;font-display:block;src:url(https://fonts.gstatic.com/l/archivo.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:500 700;font-display:block;src:url(https://fonts.gstatic.com/l/jbm.woff2) format('woff2')}`;
exports.open = async (vw = { width:1440, height:900 }, opts = {}) => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport:vw, deviceScaleFactor:opts.dsf || 1 });
  const p = await ctx.newPage(), errs = [], cwd = process.cwd();
  p.on('pageerror', e => errs.push('PAGEERR ' + String(e) + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text().slice(0, 240)); });
  await p.route('https://cdn.jsdelivr.net/npm/three@0.128.0/**', r => { const u = new URL(r.request().url()); r.fulfill({ path:cwd + '/npmthree/package/' + u.pathname.replace('/npm/three@0.128.0/', '') }); });
  await p.route('https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.2/**', r => r.fulfill({ path:cwd + '/npmmux/package/build/mp4-muxer.js', contentType:'application/javascript' }));
  await p.route('https://fonts.googleapis.com/**', r => r.fulfill({ body:CSS, contentType:'text/css', headers:{ 'Access-Control-Allow-Origin':'*' } }));
  await p.route('https://fonts.gstatic.com/**', r => { const u = r.request().url();
    if (u.endsWith('/l/archivo.woff2')) return r.fulfill({ path:FD + '/k3kQo8UDI-1M0wlSfdnoLg.woff2', contentType:'font/woff2', headers:{ 'Access-Control-Allow-Origin':'*' } });
    if (u.endsWith('/l/jbm.woff2')) return r.fulfill({ path:FD + '/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2', contentType:'font/woff2', headers:{ 'Access-Control-Allow-Origin':'*' } });
    return r.abort(); });
  await p.goto('file://' + cwd + '/' + (opts.page || 'the-graveyard-shift-part2.html'), { timeout:opts.timeout || +(process.env.GOTO_MS || 150000) });
  await p.evaluate(() => document.fonts.ready);
  return { b, p, errs };
};
