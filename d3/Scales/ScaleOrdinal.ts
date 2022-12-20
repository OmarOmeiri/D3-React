/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  scaleOrdinal,
  ScaleOrdinal,
} from 'd3';
import { D3DataCatg } from '../dataTypes';
import { D3StringKey } from '../types';

export type IScaleOrdinal<
D extends Record<string, unknown>,
> = {
  id: string,
  data: D3DataCatg<D>[],
  dataKey: D3StringKey<D>,
  scheme: Iterable<string | number>;
  domain?: string[]
} | {
  id: string,
  data: D3DataCatg<D>[],
  dataKey?: D3StringKey<D>,
  scheme: Iterable<string | number>;
  domain: string[]
}

class D3ScaleOrdinal<
D extends Record<string, unknown>,
> {
  public scale: ScaleOrdinal<string, unknown>;
  public id: string;
  private scheme: Iterable<string | number>;
  private domain: string[];

  constructor(params: IScaleOrdinal<D>) {
    this.id = params.id;
    this.scheme = params.scheme;
    if (!params.dataKey && !params.domain) {
      throw new Error('No domain and dataKey provided.');
    }
    this.domain = params.domain || params.data.map((d) => d[params.dataKey!]);
    this.scale = scaleOrdinal(this.scheme)
      .domain(this.domain);
  }

  updateScale(params: IScaleOrdinal<D>) {
    this.id = params.id;
    this.scheme = params.scheme;
    if (!params.dataKey && !params.domain) {
      throw new Error('No domain and dataKey provided.');
    }

    this.domain = params.domain || params.data.map((d) => d[params.dataKey!]);
    this.scale = scaleOrdinal(this.scheme)
      .domain(this.domain);
  }

  getScale() {
    return this.scale;
  }
}

export default D3ScaleOrdinal;
