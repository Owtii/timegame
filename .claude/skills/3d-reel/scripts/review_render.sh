#!/bin/bash
# renders every sheet the reviewers look at into review/: grit, desk, lockers (real camera + lit overview), continuity
set -e
mkdir -p review; export GOTO_MS=240000
G="42.8,42.95,43.1,43.3,43.6,43.75,43.95,44.2,44.45,44.6,44.8,45.3"
D="82.4,82.55,82.7,82.8,82.9,83.0,83.1,83.2,83.3,83.4,83.5,83.6,83.7,83.8,83.9,84.0,84.1,84.2,84.3,84.4,84.5,84.6"
L="85.9,86.2,86.5,86.8,87.0,87.15,87.3,87.5,87.7,87.9,88.1,88.3,88.5,88.7,88.9,89.1,89.3,89.5,89.7,89.85,90.7"
C="49.8,53.0,55.0,55.6,56.3,57.0,58.3,61.0,64.0,68.5,70.0,70.9,71.4,72.0,72.6,73.3,74.0,76.0,77.0,78.5,80.0,81.5,85.0"
(TIMES="$G,$D" timeout 2400 node v2f.cjs > review/r1.log 2>&1) &
(TIMES="$L,$C" timeout 2400 node v2f.cjs > review/r2.log 2>&1) &
wait
for n in G D L C; do eval T=\$$n; PFX=p2_ python3 sheet2.py review/${n}_real.png 6 ${T//,/ }; done
CAM=2.2,1.6,-18.1 LOOK=3.5,1.0,-19.0 FOV=60 TIMES="83.0,83.2,83.4,83.6,83.8,84.0,84.2,84.4" timeout 1200 node dbgpose.cjs > review/r3.log 2>&1
PFX=dp_ python3 sheet2.py review/D_side.png 4 83.0 83.2 83.4 83.6 83.8 84.0 84.2 84.4
CAM=2.4,1.9,-16.3 LOOK=3.9,1.0,-18.6 FOV=60 TIMES="87.1,87.3,87.6,87.8,88.3,88.6,89.3,89.85" timeout 1200 node dbgpose.cjs > review/r4.log 2>&1
PFX=dp_ python3 sheet2.py review/L_side.png 4 87.1 87.3 87.6 87.8 88.3 88.6 89.3 89.85
echo review sheets done
