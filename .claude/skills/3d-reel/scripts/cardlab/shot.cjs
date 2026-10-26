// screenshots of a card design: node cardlab/shot.cjs <dir with card.css>  ->  <dir>/sheet.png (end, end picked, recap, recap picked) + each state
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const dir = path.resolve(process.argv[2]); const lab = path.resolve(__dirname);
  const page = fs.readFileSync(lab + '/mock.html', 'utf8').replace('CARD_CSS', 'file://' + dir + '/card.css');
  fs.writeFileSync(lab + '/.mock_' + path.basename(dir) + '.html', page);
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' }); const ctx = await b.newContext({ viewport:{ width:560, height:980 }, deviceScaleFactor:2 }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const states = (process.env.STATES || 'end,endpicked,recap,recappicked').split(',');
  for (const s of states){ await p.goto('file://' + lab + '/.mock_' + path.basename(dir) + '.html?state=' + s + (process.env.W ? '&w=' + process.env.W : '')); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(250);
    await p.locator('#stage').screenshot({ path:dir + '/' + s + '.png' }); }
  await b.close();
  require('child_process').execSync(`python3 -c "
from PIL import Image
ims=[Image.open('${dir}/'+s+'.png').convert('RGB') for s in '${states.join(',')}'.split(',')]
w,h=ims[0].size; out=Image.new('RGB',(w*len(ims)+10*(len(ims)-1),h),(40,40,40))
for i,im in enumerate(ims): out.paste(im,(i*(w+10),0))
out.thumbnail((2400,2400)); out.save('${dir}/sheet.png')"`);
  console.log(errs.join('\n') || 'ok', dir + '/sheet.png');
})();
