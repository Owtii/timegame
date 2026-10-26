#!/bin/bash
# a private working copy for one agent: its own ns2/ (and build output), everything else linked read-only
set -e
D=wk_$1; rm -rf $D; mkdir $D
cp -r ns2 $D/ns2; rm -rf $D/ns2/el 2>/dev/null; ln -s ../../ns2/el $D/ns2/el 2>/dev/null || true
for f in phones-jammed-3d.html notes_patch.txt f13 ns npmthree npmmux te_common.cjs dbgpose.cjs v2f.cjs sheet2.py render2.sh buildns2.py coll.cjs errs.cjs; do ln -s ../$f $D/$f; done
echo $D
