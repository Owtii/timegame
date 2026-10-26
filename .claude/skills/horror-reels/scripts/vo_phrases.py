# the pauses inside each narrated line (page times): speech runs and the silences between them, with the words in each run
import json, sys, numpy as np
sys.path.insert(0, 'ns2')
SR = 44100
L = json.load(open('ns2/audio/vo2.json'))['lines']
spans = json.load(open('ns2/audio/vo_spans.json'))
def runs(x, gap=.2):
    hop = int(.01 * SR); e = np.sqrt(np.convolve(x ** 2, np.ones(hop * 2) / (hop * 2), 'same')[::hop]); thr = max(np.max(e) * .035, np.percentile(e, 15) * 2.5)
    on = e > thr; out = []; i = 0
    while i < len(on):
        if on[i]:
            j = i
            while j < len(on) and on[j]: j += 1
            out.append([i * .01, j * .01]); i = j
        else: i += 1
    merged = []
    for a, b in out:
        if merged and a - merged[-1][1] < gap: merged[-1][1] = b
        else: merged.append([a, b])
    return merged
res = []
for l, (tp, _, _) in zip(L, spans):
    x = np.load(f"ns2/audio/vo2_{l['i']}.npy").astype(float); R = runs(x); words = l['text'].split(' ')
    ph = []
    for a, b in R:
        ws = [w for w, s in zip(words, l['w']) if a - .08 <= s < b]
        ph.append({'a': round(tp + a, 2), 'b': round(tp + b, 2), 'words': ' '.join(ws)})
    res.append({'i': l['i'], 'cue': l['cue'], 'tp': tp, 'phrases': ph})
    print(f"{l['i']:2d} @{tp:6.2f} " + '  |'.join(f" [{p['a']:.2f}-{p['b']:.2f}] {p['words']}" + (f"  (pause {ph[k + 1]['a'] - p['b']:.2f})" if k + 1 < len(ph) else '') for k, p in enumerate(ph)))
json.dump(res, open('vo_phrases.json', 'w'), indent=1)
