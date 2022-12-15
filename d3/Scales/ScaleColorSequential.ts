import {
  scaleLinear,
  ScaleLinear,
} from 'd3';
import { D3DataLinear } from '../dataTypes';
import { D3NumberKey } from '../types';
import { D3GetDomainNumber } from './helpers/getDomain';

import type { D3LinearDomain } from './types';

type IScaleColorSequentialBase = {
  id: string,
  range: string[],
}

export type IScaleColorSequentialWithData<
D extends Record<string, unknown>
> = {
  data: D3DataLinear<D>[],
  dataKey: TypeOrArrayOfType<D3NumberKey<D>>,
  domain?: [D3LinearDomain | number, D3LinearDomain | number],
} & IScaleColorSequentialBase

export type IScaleColorSequentialNoData = {
  data?: undefined
  dataKey?: undefined,
  domain: [number, number]
} & IScaleColorSequentialBase

export type IScaleColorSequential<
D extends Record<string, unknown>
> = IScaleColorSequentialWithData<D>
 | IScaleColorSequentialNoData

 type IUpdateScale<
D extends Record<string, unknown>,
> = Expand<Pick<
IScaleColorSequential<D>,
| 'dataKey'
| 'data'
| 'domain'
> & {
  range?: string[]
}>

class D3ScaleColorSequential<
D extends Record<string, unknown>,
> {
  public scale: ScaleLinear<string, unknown>;
  public id: string;
  private range: Iterable<string>;
  private dataKey?: D3NumberKey<D>[];
  private data?: D3DataLinear<D>[];
  private domain?: [D3LinearDomain | number, D3LinearDomain | number] | [number, number];

  constructor(params: IScaleColorSequential<D>) {
    this.id = params.id;
    this.range = params.range;
    this.data = params.data;
    this.dataKey = params.dataKey
      ? [params.dataKey].flat() as D3NumberKey<D>[]
      : undefined;
    this.scale = scaleLinear(this.range)
      .domain(this.getDomain({ ...params, dataKey: this.dataKey }));
  }

  private getDomain({
    data = this.data,
    dataKey = this.dataKey,
    domain = this.domain,
  }: IUpdateScale<D> & {dataKey?: D3NumberKey<D>[]}): [number, number] {
    return D3GetDomainNumber({
      data,
      dataKey,
      domain,
    });
  }

  updateScale(params: IScaleColorSequential<D>) {
    this.range = params.range || this.range;
    if (params.dataKey) this.dataKey = [params.dataKey].flat() as D3NumberKey<D>[];
    this.scale = scaleLinear(this.range)
      .domain(this.getDomain({ ...params, dataKey: this.dataKey }));
  }

  getScale() {
    return this.scale;
  }
}

export default D3ScaleColorSequential;
