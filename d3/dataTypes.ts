import {
  D3DateKey,
  D3NumberKey,
  D3StringKey,
} from './types';

export type D3DataLinear<
D extends Record<string, unknown>
> = D & {
  [Key in D3NumberKey<D>]: number | null
}

export type D3DataCatgAndLinear<
D extends Record<string, unknown>,
> = D & {
  [Key in D3StringKey<D>]: string
} & {
  [Key in D3NumberKey<D>]: number | null
}

export type D3DataCatg<
D extends Record<string, unknown>,
> = D & {
  [Key in D3StringKey<D>]: string
}

export type D3DataTime<
D extends Record<string, unknown>,
> = D & {
  [Key in D3DateKey<D>]: Date | null
}

export type D3DataTimeAndLinear<
D extends Record<string, unknown>,
> = D & {
  [Key in D3DateKey<D>]: Date | null
} & {
  [Key in D3NumberKey<D>]: number | null
}

export type D3DataCatgTimeAndLinear<
D extends Record<string, unknown>,
> = D & {
  [Key in D3DateKey<D>]: Date | null
} & {
  [Key in D3NumberKey<D>]: number | null
} & {
  [Key in D3StringKey<D>]: string
}

