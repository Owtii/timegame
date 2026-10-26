#!/bin/bash
# two batches of frames in parallel, then their contact sheets: render2.sh NAME "times A" "times B"
export GOTO_MS=240000
TIMES="$2" timeout 1500 node v2f.cjs > r_${1}a.log 2>&1 &
TIMES="$3" timeout 1500 node v2f.cjs > r_${1}b.log 2>&1 &
wait
PFX=p2_ python3 sheet2.py ${1}_sheet_a.png 6 ${2//,/ }
PFX=p2_ python3 sheet2.py ${1}_sheet_b.png 6 ${3//,/ }
echo sheets done
