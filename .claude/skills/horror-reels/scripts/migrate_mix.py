# migrate the saved sound mix (artifact DB mix/timeline) onto a rebuilt clips.json: new times and labels from the build,
# the lanes (ln) the user's mix already had kept, new clips left for the editor to place
# usage: python3 migrate_mix.py <current timeline.json read from the DB> <out.json> [<last migration json, to report user edits>]
import json, sys, datetime
old = json.load(open(sys.argv[1])); c = json.load(open('ns2/audio/clips.json'))
if len(sys.argv) > 3: print('unchanged since last migration:', json.load(open(sys.argv[3]))['clips'] == old['clips'])
oc = {x['id']: x for x in old['clips']}; out = []
for x in c['clips']:
    y = {'id': x['id'], 'key': x['key'], 'label': x['label'], 't': x['t'], 'track': x['track']}
    if x['id'] in oc and 'ln' in oc[x['id']]: y['ln'] = oc[x['id']]['ln']
    out.append(y)
doc = {'clips': out, 'lanes': old.get('lanes', {}), 'v': old.get('v', 1), 'updated': datetime.datetime.now(datetime.UTC).strftime('%Y-%m-%dT%H:%M:%S.000Z')}
json.dump(doc, open(sys.argv[2], 'w'))
print(len(out), 'clips;', sum('ln' in y for y in out), 'laned; new:', sorted(set(y['id'] for y in out) - set(oc)), '; dropped:', sorted(set(oc) - set(y['id'] for y in out)))
