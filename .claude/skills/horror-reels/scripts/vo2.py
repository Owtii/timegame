# The Graveyard Shift, Part 2: the narration. One ElevenLabs take of the narrator (Spuds Oxley "Grandpa", the voice of
# Part 1) reading all 17 lines (the recap's three, the narration, and the two things I say in the moment), cut into its
# lines at the long pauses. Each line goes where its caption is (sped up a touch only where it would run into the next
# line), its words are aligned (pocketsphinx) so the captions light up as they're spoken, and the processed audio is
# saved for sound.py, which turns them into the voice clips of the page's mix.
# Writes ns2/audio/vo2.json (placement, word times, which caption) and ns2/audio/vo2_<i>.npy (mono, at the mix's rate).
import sys, re, json, numpy as np
sys.path.insert(0, 'pylib'); sys.path.insert(0, 'ns2')
from vo2lib import load, segments, SR, ff, fade, align
sys.path.insert(0, 'vo'); from synth import SR as MIX_SR

story = open('ns2/story.js').read()
const = lambda n: float(re.search(r'\b' + n + r'\s*=\s*([\d.]+)', story).group(1))
R_CUT1, R_CUT2, R_CUT3, R_FREEZE = const('R_CUT1'), const('R_CUT2'), const('R_CUT3'), const('R_FREEZE')
CUE_TEXTS = re.findall(r'\{ t:[^,]+,\s+text:"(.*?)"', story)   # (every caption, in order: the recap's four, then Part 2's)
# the take's lines: which caption each one speaks, who, the words as the recogniser hears them, and where it starts
# ('page': the page's clock, the recap; 'beat': Part 2's beats clock, like the captions) and the most it may be sped up
LINES = [
    (0,  'narrator', 'two fourteen a m he walked in',                              'page', .35,            1.06),
    (1,  'narrator', 'he just stared at me',                                       'page', R_CUT1 + .08,   1.05),
    (3,  'narrator', 'something was behind my chair',                              'page', R_CUT3 + .08,   1.05),
    (4,  'narrator', "i didn't turn around i grabbed the flashlight and ran",      'beat', 2.05,           1.05),
    (5,  'narrator', 'behind me i heard a crash when i looked back nobody was there just my desk thrown upside down', 'beat', 6.05, 1.06),
    (6,  'me',       'the doors are locked',                                       'beat', 13.4,           1.0),
    (7,  'narrator', 'so i ran into the room right next to it and locked the door', 'beat', 15.3,          1.0),
    (8,  'narrator', 'when i looked around i found this old photo on the wall',    'beat', 19.9,           1.0),
    (9,  'me',       'wait this guy is the guy from the morning shift why does he have that suit on', 'beat', 24.3, 1.0),
    (10, 'narrator', 'then someone started trying to break the door down so i panicked and hid inside a locker', 'beat', 30.9, 1.0),
    (11, 'narrator', 'then the door burst open and he came in slowly',             'beat', 38.2,           1.0),
    (12, 'narrator', 'his suit was covered in dark stains now',                    'beat', 43.6,           1.04),
    (13, 'narrator', 'he stopped right at my locker',                              'beat', 46.25,          1.0),
    (14, 'narrator', 'then something beside it caught his eye',                    'beat', 48.1,           1.0),
    (15, 'narrator', 'he was looking for someone and he was getting angry',        'beat', 59.3,           1.0),
    (17, 'narrator', 'he knew someone was hiding in there',                        'beat', 69.4,           1.0),
    (18, 'narrator', 'the exit was open this might be my chance',                  'beat', 72.85,          1.05),
]
# the caption's words -> the recogniser's (where they differ: "2:14 AM." is four spoken words)
WMAP = {0: [0, 2, 4, 5, 6]}
# the latest each line may end, on its own clock (the recap's lines end before their cut; Part 2's before the next line)
LATEST = {0: R_CUT1 - .1, 1: R_CUT2 - .1, 3: R_FREEZE - .08, 4: 6.0, 5: 13.35, 12: 46.2, 13: 48.05, 18: 75.45}   # (18: before his first fist on the lockers)

x = load('ns2/vo2/narr2_A.mp3'); segs, gaps = segments(x, len(LINES))
out = []
for k, ((cue, who, words, clock, t0, tmax), (a, b)) in enumerate(zip(LINES, segs)):
    lo = segs[k - 1][1] if k else 0; hi = segs[k + 1][0] if k < len(LINES) - 1 else len(x) / SR
    a0 = max(lo + .5 * (a - lo), a - .06); b0 = min(b + .5 * (hi - b), b + .22)
    piece = x[int(a0 * SR):int(b0 * SR)]
    if cue == 0:   # "Two-fourteen A.M. … He walked in.": the pause between the two closed up to a breath
        st, _ = align(piece, words); m_end = st[4] - .02
        e = np.sqrt(np.convolve(piece ** 2, np.ones(480) / 480, 'same')); thr = np.max(e) * .03
        g0 = int((st[3] + .12) * SR) + int(np.argmax(e[int((st[3] + .12) * SR):int(m_end * SR)] < thr))   # (where "A.M." has died away)
        g1 = int(m_end * SR); keep = int(.16 * SR)
        if g1 - g0 > keep:
            xf = int(.015 * SR); A, B = piece[:g0 + keep // 2], piece[g1 - keep // 2:]
            piece = np.concatenate([A[:-xf], A[-xf:] * np.linspace(1, 0, xf) + B[:xf] * np.linspace(0, 1, xf), B[xf:]])
    starts, end = align(piece, words)
    room = LATEST.get(cue, 1e9) - t0; tempo = 1.0
    if end > room: tempo = min(tmax, end / room)
    if tempo > 1.0005:
        piece = ff(piece, f'atempo={tempo:.4f}'); starts = [s / tempo for s in starts]; end /= tempo
    if end > room + .02: print(f'WARNING line {k} (caption {cue}): ends {t0 + end:.2f}, past {LATEST[cue]:.2f}')
    piece = fade(ff(piece, 'highpass=f=60'))
    cw = CUE_TEXTS[cue].split(' '); idx = WMAP.get(cue, list(range(len(cw))))
    assert len(idx) == len(cw) and (cue in WMAP or len(cw) == len(words.split())), (cue, cw, words)
    w = [round(starts[j], 3) for j in idx]
    dur = len(piece) / SR
    y = np.interp(np.arange(0, len(piece), SR / MIX_SR), np.arange(len(piece)), piece) if MIX_SR != SR else piece
    np.save(f'ns2/audio/vo2_{k}.npy', y.astype(np.float32))
    out.append({'i': k, 'cue': cue, 'who': who, 'clock': clock, 't': round(t0, 3), 'dur': round(dur, 3), 'tempo': round(tempo, 4), 'w': w, 'd': round(end, 3), 'text': CUE_TEXTS[cue]})
    print(f'{k:2d} cue {cue:2d} {who:8s} {clock} {t0:6.2f} → {t0 + end:6.2f} (limit {LATEST.get(cue, 0):6.2f}) tempo {tempo:.3f}  "{CUE_TEXTS[cue][:44]}"')
json.dump({'lines': out}, open('ns2/audio/vo2.json', 'w'), indent=1)
# what the recap's shots need, for the voice to fit (each line from its start to its last word, plus a breath)
print('recap needs: R_CUT1 >=', round(.45 + out[0]['d'] + .2, 2), '| R_CUT2 - R_CUT1 >=', round(.1 + out[1]['d'] + .2, 2), '| R_FREEZE - R_CUT3 >=', round(.1 + out[2]['d'] + .18, 2))
