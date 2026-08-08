/**
 * Looks only. Nothing in the shop changes how a match plays, and energy is
 * never for sale at any price.
 *
 * The colour table is the original app's `COLORS`, kept intact so a save
 * carried over from the single-file build still recognises its own mark.
 */
export interface MarkColour {
  id: string;
  name: string;
  hex: string;
  price: number;
}

export const MARK_COLOURS: MarkColour[] = [
  { id: 'ice', name: 'Ice', hex: '#4CC9F0', price: 0 },
  { id: 'rose', name: 'Rose', hex: '#FF5FA2', price: 0 },
  { id: 'signal', name: 'Signal', hex: '#FFB020', price: 60 },
  { id: 'mint', name: 'Mint', hex: '#2ED3A0', price: 60 },
  { id: 'arc', name: 'Blue', hex: '#2D6CFF', price: 90 },
  { id: 'flare', name: 'Red', hex: '#E23B2E', price: 90 },
  { id: 'lime', name: 'Lime', hex: '#B4E33D', price: 140 },
  { id: 'nebula', name: 'Nebula', hex: '#A46BFF', price: 140 },
  { id: 'sky', name: 'Sky', hex: '#5AA9FF', price: 170 },
  { id: 'plum', name: 'Plum', hex: '#C264F0', price: 170 },
  { id: 'jade', name: 'Jade', hex: '#19C79B', price: 210 },
  { id: 'coral', name: 'Coral', hex: '#FF8A5B', price: 210 },
  { id: 'neon', name: 'Neon', hex: '#39F5C0', price: 340 },
  { id: 'solar', name: 'Solar', hex: '#FFC93C', price: 340 },
];

export interface BoardStyle {
  id: string;
  name: string;
  /** The frame the grid is cut out of. */
  frame: string;
  /** The empty hole colour. */
  hole: string;
  price: number;
}

export const BOARD_STYLES: BoardStyle[] = [
  { id: 'night', name: 'Night', frame: '#221E52', hole: '#0B0B1B', price: 0 },
  { id: 'arcade', name: 'Arcade', frame: '#2E2A5C', hole: '#100E2C', price: 90 },
  { id: 'orchid', name: 'Orchid', frame: '#3A2450', hole: '#150C22', price: 210 },
  { id: 'reef', name: 'Reef', frame: '#12414A', hole: '#04171B', price: 260 },
];

export const colourById = (id: string): MarkColour =>
  MARK_COLOURS.find((c) => c.id === id) ?? MARK_COLOURS[0];

export const styleById = (id: string): BoardStyle =>
  BOARD_STYLES.find((s) => s.id === id) ?? BOARD_STYLES[0];
