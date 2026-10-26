# shared helpers for the narration (from Part 1's ns/vo.py): ffmpeg filter, fades, pocketsphinx word alignment
import sys, re, subprocess, numpy as np
sys.path.insert(0, 'pylib'); sys.path.insert(0, 'ns2')
from vo_split import load, segments, SR
from pocketsphinx import Decoder
def ff(x, chain, sr=SR):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-i', '-', '-af', chain, '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'],
                         input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(out, np.float32).astype(np.float64)
def fade(x, a=.012, b=.06):
    x = x.copy(); na, nb = int(a * SR), int(b * SR); x[:na] *= np.linspace(0, 1, na); x[-nb:] *= np.linspace(1, 0, nb); return x

# ---- word alignment: where each word of a line starts and the line's last word ends (seconds into the clip)
DEC = None
ALT = {'hazmat': ['has', 'mat']}   # words the dictionary lacks, aligned as sound-alikes
def align(x, text):
    global DEC
    if DEC is None: DEC = Decoder(samprate=16000, bestpath=False, loglevel='ERROR')
    words = [re.sub(r"[^a-z']", '', w.lower()) for w in text.replace('…', ' ').split()]
    words = [w for w in words if w]
    toks, owner = [], []
    for i, w in enumerate(words):
        sub = ALT.get(w) or ([w] if DEC.lookup_word(w) else None)
        if sub is None: raise SystemExit(f'not in the dictionary: {w}')
        for s in sub: toks.append(s); owner.append(i)
    x16 = ff(x, 'lowpass=f=7600')[::3]   # 48 kHz → 16 kHz for the recogniser
    raw = (np.clip(x16 / (np.max(np.abs(x16)) + 1e-9) * .9, -1, 1) * 32000).astype(np.int16).tobytes()
    DEC.set_align_text(' '.join(toks))
    DEC.start_utt(); DEC.process_raw(raw, full_utt=True); DEC.end_utt()
    DEC.set_alignment()
    DEC.start_utt(); DEC.process_raw(raw, full_utt=True); DEC.end_utt()
    al = [(w.name, w.start / 100, (w.start + w.duration) / 100) for w in DEC.get_alignment() if w.name not in ('<s>', '</s>', '<sil>', 'sil')]
    al = [(re.sub(r'\(\d+\)$', '', n), a, b) for n, a, b in al]
    if len(al) != len(toks): raise SystemExit(f'alignment mismatch: {len(al)} vs {len(toks)} for "{text}"')
    starts = [None] * len(words)
    for (n, a, b), o in zip(al, owner):
        if starts[o] is None: starts[o] = a
    return starts, al[-1][2]

