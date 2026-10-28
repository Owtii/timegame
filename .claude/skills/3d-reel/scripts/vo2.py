# The Graveyard Shift, Part 2: the narration. One ElevenLabs take of the narrator (Spuds Oxley "Grandpa", the voice of
# Part 1) reading all 17 lines (the old recap's three, unused since v25; the narration; the two things I say in the moment), cut into its
# lines at the long pauses, and each line cut again into its phrases (at the commas, the full stops, the "…").
# Every phrase is placed on the moment it describes: a line starts where the picture calls for it, its phrases follow
# each other with natural pauses (short at a comma, longer at a full stop or a "…"), and a phrase can be pinned so a
# chosen word lands on a beat (the photo found, his eye caught). The words are aligned (pocketsphinx) so the captions
# light up as they're spoken, one phrase per caption.
# Writes ns2/audio/vo2.json (placement on the page's clock, word times, phrases) and ns2/audio/vo2_<i>.npy (mono, at
# the mix's rate).
import sys, re, json, numpy as np
sys.path.insert(0, 'pylib'); sys.path.insert(0, 'ns2')
from vo2lib import load, segments, SR, ff, align2
sys.path.insert(0, 'vo'); from synth import SR as MIX_SR

story = open('ns2/story.js').read()
CUE_TEXTS = re.findall(r'\{ t:[^,]+,\s+text:"(.*?)"', story)   # (every caption, in order)
# the take's lines, in order: (caption, who, the words as the recogniser hears them, where each phrase starts (caption
# word index), when (page clock): a time for the phrase's start, (word, time) to land that word on a beat, or None to
# follow the phrase before with a natural pause; the line's tempo; the latest it may end; optionally its own pauses).
# A line with no caption (None) is in the take but not in the film (the old recap's three lines)
LINES = [   # (v32: the narration rewritten; only the first line's words are unchanged, so only it is placed from this take)
    (None, 'narrator', 'two fourteen a m he walked in', [0], [0], 1.0, 0),
    (None, 'narrator', 'he just stared at me', [0], [0], 1.0, 0),
    (None, 'narrator', 'something was behind my chair', [0], [0], 1.0, 0),
    (0,  'narrator', "i didn't turn around i grabbed the flashlight and ran", [0, 4, 8], [9.61, None, None], 1.05, 13.15, {'.': .22, '…': .22}),   # (up out of the chair, over the desk, down the hall; done before the desk crashes)
    (None,  'narrator', 'behind me i heard a crash when i looked back nobody was there just my desk thrown upside down', [0, 2, 6, 10, 13], [13.60, None, None, 17.30, None], 1.14, 20.2, {',': .07, '.': .16, '…': .1}),   # (the crash as I reach the doors and come round; "When I looked back," while I stare at him; "nobody was there…" from the pitch dark, "there" as the lights come back on; the desk over the empty lobby, ending as I turn to the doors)
    (None,  'me',       'the doors are locked', [0], [22.05], 1.0, 23.45),   # (shoving the bars)
    (None,  'narrator', 'so i ran into the room right next to it and locked the door', [0], [25.05], 1.0, 28.40),   # ("locked" as the lock turns)
    (None,  'narrator', 'when i looked around i found this old photo on the wall', [0, 4], [34.85, (8, 37.35)], 1.0, 38.60),   # (my beam going round the room; "photo" as it comes back to it)
    (None,  'me',       'wait this guy is the guy from the morning shift why does he have that suit on', [0, 1, 10], [39.00, None, None], 1.0, 44.25, {'…': .3, '.': .3}),
    (None,  'narrator', 'then someone started trying to break the door down so i panicked and hid inside a locker', [0, 9], [45.80, None], 1.0, 51.70),
    (None,  'narrator', 'then the door burst open and he came in slowly', [0, 5, 9], [52.45, None, None], 1.0, 56.70),
    (None,  'narrator', 'his suit was covered in dark stains now', [0], [56.95], 1.0, 59.75),
    (None,  'narrator', 'he stopped right at my locker', [0], [59.85], 1.0, 61.80),   # (as he stops there)
    (None, 'narrator', 'then something beside it caught his eye', [0], [(4, 63.20)], 1.0, 65.00),   # ("caught" as he freezes on the photo)
    (None, 'narrator', 'he was looking for someone and he was getting angry', [0, 5], [65.40, None], 1.0, 68.90),
    (None, 'narrator', 'he knew someone was hiding in there', [0], [73.50], 1.0, 75.60),
    (None, 'narrator', 'the exit was open this might be my chance', [0, 4], [76.90, None], 1.06, 79.50, {'…': .25}),   # (as my eyes reach the exit; done before his first fist on the lockers)
]
WMAP = {}   # (a caption's words -> the recogniser's, where they differ)
GAP = {',': .16, '.': .3, '!': .3, '?': .3, '…': .36}   # (the pause after a phrase, by how it ends)
LEAD, TAIL, TAIL_END = .025, .07, .15   # (kept before a phrase's first sound, and after its last (the line's last phrase: more), for the breath and the decay)

def env(x, hop):
    return np.sqrt(np.convolve(x ** 2, np.ones(hop) / hop, 'same'))
def fades(x, a=.008, b=.03):
    x = x.copy(); na, nb = int(a * SR), int(b * SR); x[:na] *= np.linspace(0, 1, na); x[-nb:] *= np.linspace(1, 0, nb); return x

x = load('ns2/vo2/narr2_A.mp3'); segs, gaps = segments(x, len(LINES))
out = []
for k, (spec, (a, b)) in enumerate(zip(LINES, segs)):
    cue, who, words, splits, targets, tempo, latest = spec[:7]; gap = dict(GAP, **(spec[7] if len(spec) > 7 else {}))
    if cue is None: continue   # (in the take, not in the film)
    lo = segs[k - 1][1] if k else 0; hi = segs[k + 1][0] if k < len(LINES) - 1 else len(x) / SR
    a0 = max(lo + .5 * (a - lo), a - .06); b0 = min(b + .5 * (hi - b), b + .25)
    piece = x[int(a0 * SR):int(b0 * SR)]
    cw = CUE_TEXTS[cue].split(' '); wm = WMAP.get(cue, list(range(len(cw))))
    assert cue in WMAP or len(cw) == len(words.split()), (cue, cw, words)
    st, en = align2(piece, words)
    e = env(piece, int(.01 * SR)); thr = np.max(e) * .03
    # cut the line into its phrases, in the quietest spot between them
    cuts = [0]
    for s in splits[1:]:
        j = wm[s]; w0, w1 = int((en[j - 1] - .03) * SR), int((st[j] + .03) * SR)
        cuts.append(w0 + int(np.argmin(e[w0:w1])) if w1 > w0 else int((en[j - 1] + st[j]) / 2 * SR))
    cuts.append(len(piece))
    phrases = []
    for p in range(len(splits)):
        seg = piece[cuts[p]:cuts[p + 1]]; es = e[cuts[p]:cuts[p + 1]]; on = np.where(es > thr)[0]
        i0 = max(0, on[0] - int(LEAD * SR)); i1 = min(len(seg), on[-1] + int((TAIL_END if p == len(splits) - 1 else TAIL) * SR))
        w_first = splits[p]; w_last = (splits[p + 1] if p + 1 < len(splits) else len(cw)) - 1
        base = (cuts[p] + i0) / SR
        y = seg[i0:i1]
        if tempo > 1.0005: y = ff(y, f'atempo={tempo:.4f}')
        phrases.append({'y': fades(y), 'first': w_first, 'last': w_last, 'base': base})
    # place them
    starts = []
    for p, ph in enumerate(phrases):
        tg = targets[p]
        want = tg[1] - (st[wm[tg[0]]] - ph['base']) / tempo if isinstance(tg, tuple) else tg
        if p == 0: t = want
        else:
            prev_end = starts[-1] + len(phrases[p - 1]['y']) / SR; natural = prev_end + gap.get(cw[phrases[p - 1]['last']][-1], .2)
            t = natural if want is None else max(want, prev_end + .1)
        starts.append(t)
    t0 = starts[0]; t_end = starts[-1] + len(phrases[-1]['y']) / SR
    line = np.zeros(int((t_end - t0) * SR) + 1)
    for s, ph in zip(starts, phrases):
        i = int(round((s - t0) * SR)); line[i:i + len(ph['y'])] += ph['y']
    line = ff(line, 'highpass=f=60')
    # the words where they now fall, from the finished line itself
    ws, we = align2(line, words)
    w = [round(ws[wm[i]], 3) for i in range(len(cw))]; d = round(we[wm[-1]], 3)
    ph = [[q['first'], round(we[wm[q['last']]], 3)] for q in phrases]   # (each phrase: its first caption word, and where its last word ends)
    if t0 + d > latest + .02: print(f'WARNING line {k} (caption {cue}): ends {t0 + d:.2f}, past {latest:.2f}')
    y = np.interp(np.arange(0, len(line), SR / MIX_SR), np.arange(len(line)), line) if MIX_SR != SR else line
    np.save(f'ns2/audio/vo2_{k}.npy', y.astype(np.float32))
    out.append({'i': k, 'cue': cue, 'who': who, 'clock': 'page', 't': round(t0, 3), 'dur': round(len(line) / SR, 3), 'tempo': tempo, 'w': w, 'd': d, 'ph': ph, 'text': CUE_TEXTS[cue]})
    gaps_txt = '  '.join(f'+{s - (starts[i - 1] + len(phrases[i - 1]["y"]) / SR):.2f}' for i, s in enumerate(starts) if i)
    print(f'{k:2d} cue {cue:2d} {t0:6.2f} → {t0 + d:6.2f} (limit {latest:6.2f})  pauses {gaps_txt or "-":24s} "{CUE_TEXTS[cue][:48]}"')
# the lines written but not recorded yet (v32): each phrase on the moment it belongs to, its words timed the way the
# narrator speaks (about 0.08 s a word plus 0.042 s a letter, his pace in this take, and his pauses), so the captions light as he will say them;
# [caption, who, where each phrase starts (caption word index), when: a time for the phrase's start, (word, time) to land
# that word on a beat, or None to follow the phrase before]. When the take comes, these are its placements
PLAN = [
    (1,  'narrator', [0, 4, 8, 12], [13.55, 15.10, (10, 17.18), 17.95]),   # (the crash as I reach the doors and come round; him, while I stare; "went out" as every light cuts out; the lights back, the lobby empty)
    (2,  'me',       [0], [21.55]),                                  # (shoving the bars)
    (3,  'narrator', [0, 5], [24.45, (6, 26.80)]),                    # (the beam swings to the last door; "locked" as the lock turns)
    (4,  'narrator', [0, 1, 3, 7], [33.50, 34.30, 35.50, (8, 36.75)]),   # (the beam going round the room; "photo" as it comes back to it)
    (5,  'me',       [0, 1, 8], [38.50, None, None]),
    (6,  'narrator', [0, 3], [45.30, 46.75]),                          # (after the second bang; into the locker)
    (7,  'narrator', [0, 3, 8], [51.70, (6, 53.90), None]),           # (through the slits, the door gives; "come" as he steps in)
    (8,  'narrator', [0, 8], [55.25, None]),                          # (while he looks round the room)
    (9,  'narrator', [0], [(4, 62.60)]),                               # (quiet while he walks up to my locker and peers in; "attention" as he freezes on the photo)
    (10, 'narrator', [0], [63.90]),                                    # (backing away, still staring at it)
    (11, 'narrator', [0, 5], [65.50, None]),                          # (crossing to the desk, looking round)
    (13, 'narrator', [0, 3], [72.90, None]),                          # (while he looks round the room)
    (14, 'narrator', [0, 5], [76.40, None]),                           # (my eyes going to the exit)
]
def word_d(x): return .08 + .042 * len(re.sub(r'[^A-Za-z]', '', x))
planned = []
for cue, who, splits, targets in PLAN:
    cw = CUE_TEXTS[cue].split(' '); w = [0.0] * len(cw); starts = []
    for p, f in enumerate(splits):
        l = splits[p + 1] if p + 1 < len(splits) else len(cw)
        rel = []; at = 0.0
        for i in range(f, l):
            rel.append(at); at += word_d(cw[i]) + (GAP.get(cw[i][-1], 0) * .6 if i < l - 1 and cw[i][-1] in GAP else 0)
        tg = targets[p]
        if tg is None: t = starts[-1][1] + GAP.get(cw[f - 1][-1], .2)
        elif isinstance(tg, tuple): t = tg[1] - rel[tg[0] - f]
        else: t = tg
        if starts and t < starts[-1][1] + .1: t = starts[-1][1] + .1
        for i in range(f, l): w[i] = t + rel[i - f]
        starts.append((t, t + at))
    t0 = starts[0][0]
    planned.append({'cue': cue, 'who': who, 'clock': 'page', 't': round(t0, 3), 'w': [round(x - t0, 3) for x in w], 'd': round(starts[-1][1] - t0, 3),
                    'ph': [[f, round(e - t0, 3)] for f, (s0, e) in zip(splits, starts)], 'text': CUE_TEXTS[cue], 'planned': True})
    print(f'   cue {cue:2d} planned {t0:6.2f} → {starts[-1][1]:6.2f}  "{CUE_TEXTS[cue][:56]}"')
# the opening's question (v34, "do the voice grandpa for the hook"): its own take of the narrator, cut at its five pauses
# into its six phrases, each placed on its moment at tempo 1.1 (the take runs 7.4 s of speech; the opening has 9.6 s):
# the three phrases of the first question, one after the other, over the live shot and into the freeze; "You only had
# two options?" as the card rises; "Turn around…" and "…or run?" as each key is named, RUN pressed just after. The
# words light from the recording: story.js's HOOK_LINES, HOOK_HEAD and HOOK_NAME carry these times
HOOK_TAKE, HOOK_TEMPO = 'ns2/vo2/hook2_A.mp3', 1.1
HOOK_PH = [('what would you do', .06), ('if you were working alone at night', .15), ('and someone was standing behind you', .12),
           ('you only had two options', (4.72, .15)), ('turn around', .12), ('or run', .10)]   # (the first phrase's start; then each one's pause after the
# phrase before, where its speech ends; (no earlier than, pause) for the card's question, which waits for the card)
hx = load(HOOK_TAKE); hsegs, _ = segments(hx, len(HOOK_PH))
hparts = []
for k, ((words, at), (a, b)) in enumerate(zip(HOOK_PH, hsegs)):
    lo = hsegs[k - 1][1] if k else 0; hi = hsegs[k + 1][0] if k < len(HOOK_PH) - 1 else len(hx) / SR
    a0 = max(lo + .5 * (a - lo), a - LEAD); b0 = min(b + .5 * (hi - b), b + (TAIL_END if k == len(HOOK_PH) - 1 else TAIL) + .05)
    y = hx[int(a0 * SR):int(b0 * SR)]
    e = env(y, int(.01 * SR)); on = np.where(e > np.max(e) * .03)[0]; y = y[max(0, on[0] - int(LEAD * SR)):on[-1] + int((TAIL_END if k == len(HOOK_PH) - 1 else TAIL) * SR)]
    y = fades(ff(y, f'atempo={HOOK_TEMPO:.4f}'))
    st, en = align2(y, words)
    ey = env(y, int(.01 * SR)); spoke = (np.where(ey > np.max(ey) * .03)[0][-1]) / SR   # (where its speech ends, in the piece)
    if k == 0: t = at
    else:
        prev_end = hparts[-1][3]; gap = at[1] if isinstance(at, tuple) else at
        t = max(prev_end + gap, at[0] if isinstance(at, tuple) else 0)
    hparts.append((t, y, [t + v for v in st], t + spoke))
ht0 = hparts[0][0]; hend = hparts[-1][0] + len(hparts[-1][1]) / SR
hline = np.zeros(int((hend - ht0) * SR) + 1)
for at, y, _, _ in hparts:
    i = int(round((at - ht0) * SR)); hline[i:i + len(y)] += y
hline = ff(hline, 'highpass=f=60')
hy = np.interp(np.arange(0, len(hline), SR / MIX_SR), np.arange(len(hline)), hline) if MIX_SR != SR else hline
np.save('ns2/audio/vo2_90.npy', hy.astype(np.float32))
hw = [w for _, _, ws, _ in hparts for w in ws]
out.append({'i': 90, 'cue': None, 'who': 'narrator', 'clock': 'page', 't': round(ht0, 3), 'dur': round(len(hline) / SR, 3), 'tempo': HOOK_TEMPO,
            'w': [round(w - ht0, 3) for w in hw], 'd': round(hparts[-1][3] - ht0, 3), 'ph': [], 'text': 'HOOK'})
for (words, _), (at, y, ws, e) in zip(HOOK_PH, hparts):
    print(f'   hook {at:5.2f} → {e:5.2f}  ' + ' '.join(f'{w}@{t:.3f}' for w, t in zip(words.split(), ws)))
json.dump({'lines': out, 'planned': planned}, open('ns2/audio/vo2.json', 'w'), indent=1)
