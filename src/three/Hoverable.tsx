import { Outlines } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import type { Group } from 'three';

/**
 * Whether the structure this mesh belongs to is currently picked out.
 *
 * Passed by context rather than by prop: a structure is a dozen meshes deep
 * in places, and threading a boolean through every one of them would put
 * layout plumbing in the middle of the modelling code.
 */
const HoverContext = createContext(false);

export const useLit = () => useContext(HoverContext);

interface HoverableProps {
  children: ReactNode;
  position: [number, number, number];
  onSelect: () => void;
  /** Keeps the outline on without a pointer - used to point at the tapped one. */
  forced?: boolean;
  disabled?: boolean;
}

/**
 * An upgradeable structure on the deck.
 *
 * Hovering lifts it off the platform and draws an outline around every part
 * of it; tapping opens its upgrade sheet. On a touch screen there is no
 * hover to speak of, so the same treatment is driven by `forced` while the
 * sheet is open - otherwise a phone would never see the highlight at all.
 */
export function Hoverable({ children, position, onSelect, forced, disabled }: HoverableProps) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const lit = !disabled && (hovered || !!forced);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;

    // eased, never snapped: a structure that jumps on hover reads as a glitch
    const k = 1 - Math.pow(0.0015, dt);
    const targetY = position[1] + (lit ? 0.34 : 0);
    const targetScale = lit ? 1.055 : 1;

    g.position.y += (targetY - g.position.y) * k;
    const s = g.scale.x + (targetScale - g.scale.x) * k;
    g.scale.setScalar(s);
  });

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!disabled) {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = '';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onSelect();
      }}
    >
      <HoverContext.Provider value={lit}>{children}</HoverContext.Provider>
    </group>
  );
}

interface SkinProps {
  colour: string;
  /** Trim that only decorates - it takes no outline of its own. */
  plain?: boolean;
  emissive?: string;
}

/**
 * The surface of one shape of a structure: goes inside a mesh, next to its
 * geometry.
 *
 * `Outlines` draws an inverted hull, so it has to sit inside each mesh
 * rather than around the group. Mounting it only while lit keeps the extra
 * draw calls off the frame budget the rest of the time.
 */
export function Skin({ colour, plain, emissive }: SkinProps) {
  const lit = useLit();
  return (
    <>
      <meshLambertMaterial color={colour} emissive={emissive ?? '#000000'} />
      {lit && !plain && (
        <Outlines thickness={0.05} color="#F2F0FF" transparent opacity={0.95} />
      )}
    </>
  );
}
