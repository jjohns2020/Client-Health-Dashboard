/** Experian brand palette used by the prototype (mirrors the CSS custom properties in global.css). */
export const C = {
  blue: '#005EB8',
  purple: '#662D91',
  magenta: '#D6007B',
  teal: '#00B4AA',
  orange: '#FF8D1B',
  gray: '#53565A',
} as const;

export const CARD_CYCLE = [C.blue, C.purple, C.magenta, C.teal, C.orange, C.gray, C.blue, C.purple];
