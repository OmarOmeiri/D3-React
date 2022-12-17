export type D3StringKey<D extends Record<string, unknown>> = KeysOfType<D, string>
export type D3NumberKey<D extends Record<string, unknown>> = KeysOfType<D, number | null>
export type D3DateKey<D extends Record<string, unknown>> = KeysOfType<D, Date | null>
export type D3NumberOrStringKey<D extends Record<string, unknown>> = KeysOfType<D, number | string | null>
export type D3NumberStringOrDateKey<D extends Record<string, unknown>> = KeysOfType<D, number | string | Date | null>

export interface ID3Attrs<
D extends Record<string, unknown>,
> {
  stroke?: string | ((d: D, index: number) => string);
  strokeWidth?: string | ((d: D, index: number) => string);
  strokeOpacity?: string | ((d: D, index: number) => string);
}

export interface ID3ShapeAttrs<
D extends Record<string, unknown>,
> extends ID3Attrs<D> {
  fill?: string | ((d: D, index: number) => string);
  fillOpacity?: string | ((d: D, index: number) => string);
}

export interface ID3CircleAttrs<
D extends Record<string, unknown>,
> extends ID3Attrs<D>, ID3ShapeAttrs<D>{
  radius?: string | ((d: D, index: number) => string);
}

export interface ID3AllAttrs<
D extends Record<string, unknown>,
> extends ID3Attrs<D>,
 ID3ShapeAttrs<D>,
 ID3CircleAttrs<D> {}

export type ID3Events<
D extends Record<string, unknown>,
MouseOver = D,
MouseMove = D,
Multi extends boolean = false
> =
 Multi extends false
? {
  mouseOver?: (d: MouseOver) => void
  mouseMove?: (d: MouseMove) => void
  mouseOut?: () => void
}
: {
  mouseOver?: (d: MouseOver[]) => void
  mouseMove?: (d: MouseMove[]) => void
  mouseOut?: () => void
}

export type ID3TooltipAttrs<D extends Record<string, unknown>> = {
  [A in keyof ID3AllAttrs<D>]?: string
} & {
  name?: string,
  xKey: string,
  yKey: string,
}

export interface ID3TooltipDataMulti<D extends Record<string, unknown>> {
  data: D,
  position?: {
    x: number,
    y: number,
  }
  attrs: {
    [K in keyof D]?: ID3TooltipAttrs<D>
  }
}

export interface ID3TooltipDataSingle<D extends Record<string, unknown>> {
  data: D,
  position?: {
    x: number,
    y: number,
  }
  attrs: ID3TooltipAttrs<D>
}
