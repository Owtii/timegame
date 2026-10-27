# the keys' colours, graded in even steps of lightness (OKLCH): a keycap under a light from above. rt/rb: the top and
# front rims, catching the light; u, m, l: the dish, darker in its upper half, turning to the light lower down; wt, wb:
# the front wall at its rim and at its foot; sd: the side walls. Pressed: a step lighter; the one not chosen: dulled
import math, json, sys
def oklch(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b; m_ = L - 0.1055613458 * a - 0.0638541728 * b; s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s; g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s; bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    f = lambda x: 255 * (12.92 * x if x <= 0.0031308 else 1.055 * x ** (1 / 2.4) - 0.055)
    return '#' + ''.join(f'{max(0, min(255, round(f(c)))):02x}' for c in (r, g, bb))
PARTS = [('rt', .54, .88), ('u', .39, 1), ('m', .415, 1), ('l', .45, 1), ('rb', .515, .9), ('wt', .325, .8), ('wb', .235, .64), ('sd', .17, .5)]
INK = {'red': '#F7EDE6', 'blue': '#EEF2F9', 'red_pick': '#FFF8F2', 'blue_pick': '#FAFCFF', 'red_dim': '#9d8e8b', 'blue_dim': '#8a93a3'}
pal = {}
for name, h, C in (('red', 25, .128), ('blue', 262, .1)):
    pal[name] = {k: oklch(L, C * cm, h) for k, L, cm in PARTS}
    pal[name + '_pick'] = {k: oklch(L + .045, C * cm, h) for k, L, cm in PARTS}
    pal[name + '_dim'] = {k: oklch(L * .74, C * cm * .3, h) for k, L, cm in PARTS}
for k in pal: pal[k]['ink'] = INK[k]
json.dump(pal, open(sys.argv[1] if len(sys.argv) > 1 else 'pal.json', 'w'), indent=1)
for k, v in pal.items(): print(k, ';'.join(f'--{a}:{b}' for a, b in v.items()))
