# contact sheet of v13_<t>.png frames: python3 sheet_t.py out.png cols t1 t2 ...
import sys
from PIL import Image, ImageDraw
out, cols, ts = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
import os
fn = lambda t: (__import__('os').environ.get('PFX','v13_')+'%s.png') % (t[:-2] if t.endswith('.0') else t).replace('.', '_')
ims = [Image.open(fn(t)) for t in ts]
w, h = ims[0].size; s = 360 / w; W, H = int(w * s), int(h * s)
rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (W * cols, H * rows), 'black'); d = ImageDraw.Draw(S)
for i, (im, t) in enumerate(zip(ims, ts)):
    x, y = (i % cols) * W, (i // cols) * H; S.paste(im.resize((W, H)), (x, y)); d.text((x + 6, y + 6), t, fill='yellow')
S.save(out)
