# migrate the saved sound mix (artifact DB mix/timeline) onto a rebuilt clips.json, keeping everything the user did:
#  - per clip: their lane, mute, volume, trims, fades and pan; a sound they swapped in (a key unlike the one the build
#    gave it); a move they made (their offset from the previous build's time, applied to the new time)
#  - clips they added themselves (random ids, not from the build), moved with the film if this build shifted the
#    timeline (pass shift_at shift: page times past shift_at moved by shift)
#  - new clips from the build come in unlaned; a voice clip keeps its caption link (cap), or the page hides the caption
# usage: python3 migrate_mix.py <current timeline.json read from the DB> <out.json> <previous build's clips.json> [shift_at shift]
import json, sys, re, datetime
old = json.load(open(sys.argv[1])); c = json.load(open('ns2/audio/clips.json')); prevb = json.load(open(sys.argv[3]))
SHIFT_AT, SHIFT = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (1e9, 0.0)
oc = {x['id']: x for x in old['clips']}; pb = {x['id']: x for x in prevb['clips']}; built = {x['id'] for x in c['clips']}
BUILT_ID = re.compile(r'^(s_|r\d_|r_|v\d\d$)')   # (ids the build makes; the editor gives the user's own clips random ids)
KEEP = ['ln', 'mute', 'vol', 'off', 'len', 'fi', 'fo', 'pan']
out, notes = [], []
for x in c['clips']:
    y = {'id': x['id'], 'key': x['key'], 'label': x['label'], 't': x['t'], 'track': x['track']}
    if x.get('cap'): y['cap'] = x['cap']
    o, p = oc.get(x['id']), pb.get(x['id'])
    if o:
        for k in KEEP:
            if k in o: y[k] = o[k]
        if o.get('key') != (p or x)['key']: y['key'], y['label'] = o['key'], o.get('label', x['label']); notes.append(f"{x['id']}: their sound {o['key']}")
        if p and abs(o.get('t', 0) - p['t']) > 1e-3: y['t'] = round(x['t'] + o['t'] - p['t'], 4); notes.append(f"{x['id']}: moved {o['t'] - p['t']:+.2f}s")
    out.append(y)
mine = [dict(o) for k, o in oc.items() if k not in built and not BUILT_ID.match(k)]   # (sounds the user added)
for o in mine:
    if o.get('t', 0) >= SHIFT_AT: o['t'] = round(o['t'] + SHIFT, 4)
    out.append(o)
doc = {'clips': out, 'lanes': old.get('lanes', {}), 'v': old.get('v', 1), 'updated': datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%S.000Z')}
json.dump(doc, open(sys.argv[2], 'w'))
print(len(out), 'clips;', sum('ln' in y for y in out), 'laned; theirs kept:', [(o['id'], o.get('label'), o['t']) for o in mine], '; edits kept:', notes,
      '; new:', sorted(built - set(oc)), '; dropped:', sorted(set(oc) - built - {o['id'] for o in mine}))
