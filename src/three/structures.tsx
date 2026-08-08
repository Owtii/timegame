import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, Mesh } from 'three';

import { Skin } from './Hoverable';

/**
 * The deck everything stands on: a fat rounded slab floating in the night,
 * with a dashed ring inset from the edge and a darker skirt underneath.
 */
export function Platform() {
  const ring = useMemo(() => {
    const dashes: { angle: number }[] = [];
    for (let i = 0; i < 40; i++) dashes.push({ angle: (i / 40) * Math.PI * 2 });
    return dashes;
  }, []);

  return (
    <group>
      {/*
        The corner radius has to stay under half the smallest side. A radius
        larger than that inflates the box into a pillow and the deck stops
        reading as a slab you could stand on.
      */}
      <RoundedBox args={[11.6, 2.0, 8.0]} radius={0.85} smoothness={4} position={[0, -1, 0]}>
        <meshLambertMaterial color="#2E2769" />
      </RoundedBox>

      {/* the skirt: a darker, smaller slab that reads as thickness */}
      <RoundedBox args={[10.2, 2.2, 6.6]} radius={0.8} smoothness={3} position={[0, -2.6, 0]}>
        <meshLambertMaterial color="#161238" />
      </RoundedBox>

      {/* a dashed ring, inset - it gives the deck a size you can read */}
      {ring.map((d, i) =>
        i % 2 === 0 ? (
          <mesh
            key={i}
            position={[Math.cos(d.angle) * 4.9, 0.02, Math.sin(d.angle) * 3.2]}
            rotation={[-Math.PI / 2, 0, -d.angle]}
          >
            <planeGeometry args={[0.5, 0.14]} />
            <meshBasicMaterial color="#4CC9F0" transparent opacity={0.4} />
          </mesh>
        ) : null,
      )}
    </group>
  );
}

/**
 * OIL PUMP - the rocking arm. The nozzle count is a child group so a later
 * level can switch more of them on without the model changing shape.
 */
export function OilPump({ nozzles, speed }: { nozzles: number; speed: number }) {
  const arm = useRef<Group>(null);

  useFrame((state) => {
    if (!arm.current) return;
    // the arm never stops, it only slows - the base is always alive
    arm.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.6 * speed) * 0.42 - 0.15;
  });

  return (
    <group>
      <RoundedBox args={[2.9, 0.5, 2.2]} radius={0.2} smoothness={3} position={[0, 0.25, 0]}>
        <Skin colour="#2A8FB4" />
      </RoundedBox>

      <RoundedBox args={[1.9, 1.5, 1.5]} radius={0.42} smoothness={4} position={[0, 1.2, 0]}>
        <Skin colour="#4CC9F0" />
      </RoundedBox>

      <group ref={arm} position={[0, 2.05, 0]}>
        <RoundedBox args={[3.1, 0.42, 0.42]} radius={0.2} smoothness={4} position={[0.5, 0, 0]}>
          <Skin colour="#FFB020" />
        </RoundedBox>
        <mesh position={[1.95, -0.42, 0]}>
          <sphereGeometry args={[0.34, 14, 12]} />
          <Skin colour="#FFC93C" />
        </mesh>
      </group>

      {/* nozzles: one now, more with level. Space is reserved for all four. */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-1.0 + i * 0.66, 0.72, 1.0]} visible={i < nozzles}>
          <cylinderGeometry args={[0.16, 0.2, 0.7, 10]} />
          <Skin colour={i === 0 ? '#FFC93C' : '#3ED598'} plain />
        </mesh>
      ))}
    </group>
  );
}

/**
 * MACHINE - chassis plus three named children, so a milestone level can
 * light one of them without the silhouette being rebuilt.
 */
export function Machine({ level, speed }: { level: number; speed: number }) {
  const dial = useRef<Mesh>(null);
  const steam = useRef<Group>(null);

  useFrame((state, dt) => {
    if (dial.current) dial.current.rotation.z -= dt * 2.4 * speed;
    if (steam.current) {
      const t = (state.clock.elapsedTime * 0.55 * speed) % 1;
      steam.current.position.y = 2.4 + t * 1.9;
      steam.current.scale.setScalar(0.4 + t * 0.9);
    }
  });

  return (
    <group>
      <RoundedBox args={[3.2, 0.5, 2.4]} radius={0.2} smoothness={3} position={[0, 0.25, 0]}>
        <Skin colour="#C22E70" />
      </RoundedBox>

      <RoundedBox args={[2.6, 1.9, 1.9]} radius={0.5} smoothness={4} position={[0, 1.45, 0]}>
        <Skin colour="#FF5FA2" />
      </RoundedBox>

      <mesh ref={dial} position={[0, 1.5, 0.98]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 0.16, 18]} />
        <Skin colour="#FFC93C" />
      </mesh>

      {/* Burner / Gearbox / Cooler - always present, lit by milestone level */}
      <RoundedBox args={[0.7, 0.7, 0.7]} radius={0.22} smoothness={3} position={[-1.6, 0.85, 0]}>
        <Skin colour={level >= 4 ? '#FFB020' : '#3A2E63'} plain />
      </RoundedBox>
      <RoundedBox args={[0.7, 0.7, 0.7]} radius={0.22} smoothness={3} position={[1.6, 0.85, 0]}>
        <Skin colour={level >= 8 ? '#3ED598' : '#3A2E63'} plain />
      </RoundedBox>
      <RoundedBox args={[0.9, 0.4, 0.9]} radius={0.16} smoothness={3} position={[0, 2.5, -0.4]}>
        <Skin colour={level >= 12 ? '#A46BFF' : '#3A2E63'} plain />
      </RoundedBox>

      <mesh position={[0.55, 2.55, 0]}>
        <cylinderGeometry args={[0.24, 0.3, 0.9, 10]} />
        <Skin colour="#C22E70" />
      </mesh>

      <group ref={steam} position={[0.55, 2.4, 0]}>
        <mesh>
          <sphereGeometry args={[0.3, 10, 8]} />
          <meshBasicMaterial color="#F2F0FF" transparent opacity={0.16} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * WORKER - the star of the deck.
 *
 * One loop: pick a can up at the pump, walk it across loaded, drop it at the
 * machine, walk back empty. Every stop eases in and out, and the can is
 * carried visibly rather than implied, because the whole idle layer is only
 * legible if you can see what is being moved.
 */
export function Worker({
  from,
  to,
  loopSeconds,
  carrying,
  onDrop,
}: {
  from: number;
  to: number;
  loopSeconds: number;
  carrying: number;
  onDrop: () => void;
}) {
  const body = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const cans = useRef<Group>(null);
  const phase = useRef(0);
  const wasDropping = useRef(false);

  const PICKUP = 0.5;
  const DROP = 0.5;

  useFrame((_, dt) => {
    const g = body.current;
    if (!g) return;

    const walk = Math.max(0.4, (loopSeconds - PICKUP - DROP) / 2);
    phase.current = (phase.current + dt) % (PICKUP + DROP + walk * 2);
    const t = phase.current;

    let x: number;
    let loaded: boolean;
    let moving = false;
    let facing = 1;

    if (t < PICKUP) {
      // idle at the pump, waiting on a can
      x = from;
      loaded = false;
    } else if (t < PICKUP + walk) {
      x = from + (to - from) * ease((t - PICKUP) / walk);
      loaded = true;
      moving = true;
      facing = Math.sign(to - from) || 1;
    } else if (t < PICKUP + walk + DROP) {
      x = to;
      loaded = true;
    } else {
      x = to + (from - to) * ease((t - PICKUP - walk - DROP) / walk);
      loaded = false;
      moving = true;
      facing = Math.sign(from - to) || -1;
    }

    // fire once on entering the drop, not on every frame of it
    const dropping = t >= PICKUP + walk && t < PICKUP + walk + DROP;
    if (dropping && !wasDropping.current) onDrop();
    wasDropping.current = dropping;

    g.position.x = x;
    g.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    if (cans.current) cans.current.visible = loaded;

    // a gait, not a glide: the legs only swing while there is ground moving
    const swing = moving ? Math.sin(t * 13) * 0.55 : 0;
    if (legL.current) legL.current.rotation.x = swing;
    if (legR.current) legR.current.rotation.x = -swing;
    g.position.y = moving ? Math.abs(Math.sin(t * 13)) * 0.07 : 0;
  });

  return (
    <group ref={body}>
      {/* head */}
      <mesh position={[0, 1.42, 0]}>
        <sphereGeometry args={[0.34, 16, 14]} />
        <Skin colour="#F2F0FF" />
      </mesh>

      {/* torso */}
      <RoundedBox args={[0.78, 0.9, 0.6]} radius={0.24} smoothness={4} position={[0, 0.82, 0]}>
        <Skin colour="#FFB020" />
      </RoundedBox>

      {/* legs */}
      <group ref={legL} position={[-0.2, 0.4, 0]}>
        <RoundedBox args={[0.24, 0.8, 0.26]} radius={0.11} smoothness={3} position={[0, -0.2, 0]}>
          <Skin colour="#2A8FB4" plain />
        </RoundedBox>
      </group>
      <group ref={legR} position={[0.2, 0.4, 0]}>
        <RoundedBox args={[0.24, 0.8, 0.26]} radius={0.11} smoothness={3} position={[0, -0.2, 0]}>
          <Skin colour="#2A8FB4" plain />
        </RoundedBox>
      </group>

      {/* the cans, carried on the hand anchor so they are actually visible */}
      <group ref={cans}>
        {[0, 1, 2, 3].map((i) => (
          <RoundedBox
            key={i}
            args={[0.34, 0.4, 0.3]}
            radius={0.1}
            smoothness={3}
            position={[0.52, 0.62 + i * 0.42, 0]}
            visible={i < carrying}
          >
            <Skin colour="#4CC9F0" plain />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}

/** Smooth in, smooth out - a worker that starts at full speed reads as a slide. */
const ease = (t: number): number => t * t * (3 - 2 * t);
