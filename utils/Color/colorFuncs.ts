export const isHexColor = (color: string): boolean => (
  /^#(?:[0-9a-fA-F]{3,4}){1,2}$/i.test(color)
);

export const isRgbColor = (color: string) => (
  /rgba?\(\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,\s*(25[0-5]|2[0-4]\d|1\d{1,2}|\d\d?)\s*,?\s*([01.]\.?\d*)?\s*\)/i
    .test(color)
);

/**
 * Converts a HEX color to RGB
 * @param hex
 * @returns
 */
export function hexToRgb(
  hex: string,
  overrides: {
    r?: number | string,
    g?: number | string,
    b?: number | string,
    a?: number | string
  } = {},
): {
  r: number,
  g: number,
  b: number,
  a: number,
  toString: () => string
} {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  // Repeats the characters if the hex color is shorthand. Eg: "#F0C" => "#FF00CC"
  const fullHex = hex.replace(shorthandRegex, (m: string, r: string, g: string, b: string) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(fullHex);
  if (!result) throw new Error(`Color: "${hex}" is invalid.`);
  return {
    r: Number(overrides.r) || parseInt(result[1], 16),
    g: Number(overrides.g) || parseInt(result[2], 16),
    b: Number(overrides.b) || parseInt(result[3], 16),
    a: Number(overrides.a) || parseInt(result[4] || 'FF', 16) / 255,
    toString() {
      return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    },
  };
}

export const opacityToHex = (n: number | string) => {
  const num = (Math.min(Math.max(Number(n), 0), 1) * 255);
  if (Number.isNaN(num)) return 'ff';
  return num.toString(16).padStart(2, '0').slice(0, 2);
};

export function cssColorNameToHex(str: string) {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) throw new Error('Could not create canvas.');
  ctx.fillStyle = str;
  return ctx.fillStyle;
}

export const colorToRgba = (
  color: string,
  overrides: {
    r?: number | string,
    g?: number | string,
    b?: number | string,
    a?: number | string
  } = {},
) => {
  if (isHexColor(color)) return hexToRgb(color, overrides);
  if (!isRgbColor(color)) {
    return hexToRgb(cssColorNameToHex(color), overrides);
  }
  const digits = color.match(/\b(\d+\.\d+)|(\d+)\b/g);
  if (!digits) throw new Error(`Color: "${color}" is invalid.`);
  const [r, g, b, a = '1'] = digits;
  return {
    r: Number(overrides.r) || Number(r),
    g: Number(overrides.g) || Number(g),
    b: Number(overrides.b) || Number(b),
    a: Number(overrides.a) || Number(a),
    toString() {
      return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    },
  };
};
