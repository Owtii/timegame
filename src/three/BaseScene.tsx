import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';

import {
  carryCapacity,
  nozzles,
  speedMultiplier,
  workerLoopSeconds,
  type StructureId,
} from '../state/economy';
import { useSaveData } from '../state/store';
import { Hoverable } from './Hoverable';
import { Machine, OilPump, Platform, Worker } from './structures';

/** Left to right: where the oil comes from, who moves it, where it burns. */
const PUMP_X = -3.5;
const MACHINE_X = 3.5;

interface Props {
  /** Which structure's sheet is open, so it stays lit under the popup. */
  selected: StructureId | null;
  onSelect: (id: StructureId) => void;
}

export function BaseScene({ selected, onSelect }: Props) {
  return (
    <Canvas
      orthographic
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [16, 14, 16], near: -100, far: 200, zoom: 26 }}
      style={{ position: 'absolute', inset: 0, touchAction: 'none' }}
    >
      <Rig />
      <Deck selected={selected} onSelect={onSelect} />
    </Canvas>
  );
}

/**
 * Camera: a fixed isometric angle, framed so the whole deck is visible at
 * rest. Drag pans, pinch and wheel zoom, double-tap puts it back - the
 * framing is the default, never something you have to hunt for.
 */
function Rig() {
  const { camera, size, gl } = useThree();
  const pan = useRef({ x: 0, y: 0 });
  const zoom = useRef(1);
  const target = useRef({ pan: { x: 0, y: 0 }, zoom: 1 });

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchStart = 0;
    let zoomStart = 1;
    let lastTap = 0;

    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const down = (e: PointerEvent) => {
      el.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        pinchStart = spread();
        zoomStart = target.current.zoom;
      }
      const now = performance.now();
      if (now - lastTap < 300 && pointers.size === 1) {
        target.current = { pan: { x: 0, y: 0 }, zoom: 1 };
      }
      lastTap = now;
    };

    const move = (e: PointerEvent) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const next = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, next);

      if (pointers.size === 2 && pinchStart > 0) {
        target.current.zoom = clamp((spread() / pinchStart) * zoomStart, 0.7, 2.2);
        return;
      }
      if (pointers.size !== 1) return;

      const k = 0.055 / target.current.zoom;
      target.current.pan.x = clamp(target.current.pan.x - (next.x - prev.x) * k, -6, 6);
      target.current.pan.y = clamp(target.current.pan.y + (next.y - prev.y) * k, -5, 5);
    };

    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStart = 0;
    };

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current.zoom = clamp(target.current.zoom * (e.deltaY > 0 ? 0.92 : 1.08), 0.7, 2.2);
    };

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [gl]);

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.002, dt);
    pan.current.x += (target.current.pan.x - pan.current.x) * k;
    pan.current.y += (target.current.pan.y - pan.current.y) * k;
    zoom.current += (target.current.zoom - zoom.current) * k;

    // the deck is wider than it is deep, so on a portrait screen width is
    // what binds: an isometric diamond is (w + d) * sin45 across
    camera.zoom = (size.width / 15.5) * zoom.current;

    // pan on the ground plane along the screen axes, not the world ones -
    // dragging right has to move the deck right, whatever the camera angle
    const s = Math.SQRT1_2;
    const tx = pan.current.x * s - pan.current.y * s;
    const tz = -pan.current.x * s - pan.current.y * s;

    camera.position.set(tx + 16, 14, tz + 16);
    camera.lookAt(tx, 0.6, tz);
    camera.updateProjectionMatrix();
  });

  return null;
}

function Deck({ selected, onSelect }: Props) {
  const save = useSaveData();
  const speed = speedMultiplier(save.energy);
  const coins = useRef<CoinPool>(null);

  const loop = useMemo(
    () => workerLoopSeconds(save.structures.worker) / speed,
    [save.structures.worker, speed],
  );

  return (
    <>
      <ambientLight intensity={1.35} color="#B9B0FF" />
      <directionalLight position={[9, 16, 7]} intensity={2.1} color="#FFF3D6" />
      <directionalLight position={[-10, 7, -8]} intensity={0.9} color="#4CC9F0" />
      <pointLight position={[MACHINE_X, 3.4, 2.4]} intensity={30} color="#FF5FA2" distance={12} />
      <pointLight position={[PUMP_X, 3.4, 2.4]} intensity={24} color="#4CC9F0" distance={12} />

      <Platform />

      <Hoverable
        position={[PUMP_X, 0, -1.1]}
        forced={selected === 'pump'}
        onSelect={() => onSelect('pump')}
      >
        <OilPump nozzles={nozzles(save.structures.pump)} speed={speed} />
      </Hoverable>

      <Hoverable
        position={[MACHINE_X, 0, -1.1]}
        forced={selected === 'machine'}
        onSelect={() => onSelect('machine')}
      >
        <Machine level={save.structures.machine} speed={speed} />
      </Hoverable>

      {/* the worker walks, so its own hit box travels with it */}
      <Hoverable position={[0, 0, 1.9]} forced={selected === 'worker'} onSelect={() => onSelect('worker')}>
        <group scale={1.55}>
          <Worker
            from={PUMP_X / 1.55}
            to={MACHINE_X / 1.55}
            loopSeconds={loop}
            carrying={carryCapacity(save.structures.worker)}
            onDrop={() => coins.current?.pop()}
          />
        </group>
      </Hoverable>

      <Coins ref={coins} at={[MACHINE_X, 3.2, -1.1]} />
    </>
  );
}

interface CoinPool {
  pop: () => void;
}

/**
 * Coins thrown out of the machine on a delivery.
 *
 * A fixed pool rather than a spawner: the base runs for hours unattended and
 * allocating a mesh per coin would leak the whole time.
 */
const POOL_SIZE = 12;

const Coins = forwardRef<CoinPool, { at: [number, number, number] }>(function Coins({ at }, ref) {
  const group = useRef<Group>(null);
  const lives = useRef(
    Array.from({ length: POOL_SIZE }, () => ({ t: 2, vx: 0, vz: 0, spin: 0 })),
  );
  const cursor = useRef(0);

  useImperativeHandle(ref, () => ({
    pop: () => {
      for (let n = 0; n < 3; n++) {
        const slot = lives.current[cursor.current % POOL_SIZE];
        cursor.current++;
        slot.t = 0;
        slot.vx = (Math.random() - 0.5) * 2.2;
        slot.vz = (Math.random() - 0.5) * 2.2;
        slot.spin = 4 + Math.random() * 6;
      }
    },
  }));

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    lives.current.forEach((slot, i) => {
      const child = g.children[i];
      if (!child) return;
      if (slot.t >= 1.4) {
        child.visible = false;
        return;
      }
      slot.t += dt;
      const t = slot.t;
      child.visible = true;
      child.position.set(slot.vx * t, 4 * t - 5.2 * t * t, slot.vz * t);
      child.rotation.y += slot.spin * dt;
      child.scale.setScalar(Math.max(0, 1 - t / 1.4));
    });
  });

  return (
    <group ref={group} position={at}>
      {Array.from({ length: POOL_SIZE }, (_, i) => (
        <mesh key={i} visible={false} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.07, 14]} />
          <meshLambertMaterial color="#FFC93C" emissive="#4A3200" />
        </mesh>
      ))}
    </group>
  );
});

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Hook the Base screen uses to show whether the deck is asleep or boosted. */
export function useBaseSpeedLabel(): { label: string; boosted: boolean } {
  const save = useSaveData();
  const boosted = save.energy > 0;
  return { label: boosted ? 'BOOSTED x2' : 'SLEEP x0.25', boosted };
}

export function useSelectedStructure(): [StructureId | null, (id: StructureId | null) => void] {
  return useState<StructureId | null>(null);
}
