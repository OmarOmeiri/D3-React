import {
  scaleOrdinal,
  ScaleOrdinal,
} from 'd3';
import { ID3Axis } from '../Axes/Axis';
import { D3DataCatg } from '../dataTypes';
import { D3StringKey } from '../types';

export type IScaleOrdinal<
D extends Record<string, unknown>,
> = {
  id: string,
  data: D3DataCatg<D>[],
  dataKey: D3StringKey<D>,
  scheme: Iterable<string | number>;
  domain: string[] | number[]
}

class D3ScaleOrdinal<
D extends Record<string, unknown>,
> {
  public scale: ScaleOrdinal<string, unknown>;
  public id: string;
  private scheme: Iterable<string | number>;

  constructor(params: IScaleOrdinal<D>) {
    this.id = params.id;
    this.scheme = params.scheme;
    this.scale = scaleOrdinal(this.scheme)
      .domain(params.domain as any);
  }

  updateScale(params: IScaleOrdinal<D>) {
    this.scheme = params.scheme || this.scheme;
    this.scale = scaleOrdinal(this.scheme)
      .domain(params.domain as any);
  }
}

export default D3ScaleOrdinal;
