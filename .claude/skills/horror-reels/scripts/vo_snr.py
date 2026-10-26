# how clearly each narrated line stands above everything under it (speech frames only)
import numpy as np, json
vo = np.load('ns2/audio/stem_vo.npy').mean(1); rest = np.load('ns2/audio/stem_rest.npy').mean(1)
for a, b, t in json.load(open('ns2/audio/vo_spans.json')):
    v = vo[int(a * 44100):int(b * 44100)]; r = rest[int(a * 44100):int(b * 44100)]; hop = 441
    fr = np.array([(np.sqrt(np.mean(v[k:k + hop] ** 2)), np.sqrt(np.mean(r[k:k + hop] ** 2))) for k in range(0, len(v) - hop, hop)])
    if len(fr) < 3: print(f'{a:6.2f}  (too short to measure)  {t}'); continue
    act = fr[fr[:, 0] > fr[:, 0].max() * .25]
    vr = np.sqrt(np.mean(act[:, 0] ** 2)); rr = np.sqrt(np.mean(act[:, 1] ** 2)); worst = np.percentile(20 * np.log10(act[:, 0] / (act[:, 1] + 1e-9)), 10)
    print(f'{a:6.2f}  snr {20 * np.log10(vr / (rr + 1e-9)):5.1f} dB (worst 10% {worst:5.1f})  voice {20 * np.log10(vr):6.1f} dB  {t}')
