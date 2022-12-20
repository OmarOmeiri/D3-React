import {
  ScaleLinear,
  scaleLinear,
} from 'd3';
import D3Axis, { ID3Axis } from '../Axes/Axis';
import { D3DataLinear } from '../dataTypes';
import { D3IsZoomed } from '../helpers/d3Zoom';
import { D3NumberKey } from '../types';
import { D3GetDomainNumber } from './helpers/getDomain';
import { D3GetScaleRange } from './helpers/getScaleRange';
import { D3LinearDomain } from './types';

import type D3Chart from '../Chart';

type IScaleLinearBase = {
  id: string,
}

export type IScaleLinearWithData<
D extends Record<string, unknown>
> = {
  data: D3DataLinear<D>[],
  dataKey: TypeOrArrayOfType<D3NumberKey<D>>,
  domain?: [D3LinearDomain | number, D3LinearDomain | number],
  roundDomain?: boolean
} & IScaleLinearBase

export type IScaleLinearNoData = {
  data?: undefined
  dataKey?: undefined,
  domain: [number, number]
  roundDomain?: undefined
} & IScaleLinearBase

export type IScaleLinear<
D extends Record<string, unknown>
> = (IScaleLinearWithData<D> | IScaleLinearNoData) & Omit<ID3Axis, 'scale'>

type IUpdateScale<
D extends Record<string, unknown>,
> = Expand<Pick<
IScaleLinear<D>,
| 'type'
| 'dataKey'
| 'data'
| 'domain'
| 'chart'
| 'label'
| 'roundDomain'
> & {
  range?: [number, number]
}>

class D3ScaleLinear<
D extends Record<string, unknown>,
> {
  private scale: ScaleLinear<number, number, never>;
  private zoomScale: ScaleLinear<number, number, never> | null = null;
  private zoomState: {k: number, x: number, y: number} | null = null;
  private dataKey?: D3NumberKey<D>[];
  private chart: D3Chart;
  public id: string;
  public axis: D3Axis;
  private data?: D3DataLinear<D>[];
  private domain?: [D3LinearDomain | number, D3LinearDomain | number] | [number, number];
  private range: [number, number];
  private roundDomain?: boolean;

  constructor(params: IScaleLinear<D>) {
    this.id = params.id;
    this.chart = params.chart;
    this.data = params.data;
    this.dataKey = params.dataKey
      ? [params.dataKey].flat() as D3NumberKey<D>[]
      : undefined;
    this.domain = params.domain;
    this.range = D3GetScaleRange(params.type, params.chart.dims);
    this.scale = scaleLinear()
      .domain(this.getDomain({ ...params, dataKey: this.dataKey }))
      .range(this.range);
    this.axis = new D3Axis({
      id: params.id,
      chart: params.chart,
      scale: this.scale,
      type: params.type,
      label: params.label,
      tickValues: params.tickValues,
      ticks: params.ticks,
      tickFormat: params.tickFormat,
    });
  }

  getScale() {
    return this.zoomScale || this.scale;
  }

  invert(v: number) {
    return this.getScale().invert(v);
  }

  private getDomain({
    data = this.data,
    dataKey = this.dataKey,
    domain = this.domain,
    roundDomain = this.roundDomain,
  }: IUpdateScale<D> & {dataKey?: D3NumberKey<D>[]}): [number, number] {
    return D3GetDomainNumber({
      data,
      dataKey,
      domain,
      roundDomain,
    });
  }

  updateScale(params: IUpdateScale<D>) {
    this.range = params.range || D3GetScaleRange(params.type, params.chart.dims);
    if (params.dataKey) this.dataKey = [params.dataKey].flat() as D3NumberKey<D>[];
    this.scale = scaleLinear()
      .domain(this.getDomain({ ...params, dataKey: this.dataKey }))
      .range(this.range);

    const zoomScale = this.getZoomScale(this.zoomState);
    if (zoomScale) {
      this.zoomScale = zoomScale
        .domain(this.getDomain({ ...params, dataKey: this.dataKey }));
    }
    this.axis.updateAxis({ scale: this.getScale(), chart: params.chart, label: params.label });
  }

  private getZoomScale(transform: any) {
    if (!transform) return;
    if (this.axis.type === 'bottom' || this.axis.type === 'top') {
      return transform.rescaleX(this.scale);
    }
    if (this.axis.type === 'left' || this.axis.type === 'right') {
      return transform.rescaleY(this.scale);
    }
  }

  zoomRescale(e: any) {
    if (this.zoomState && !D3IsZoomed(e)) {
      this.zoomState = null;
    } else {
      this.zoomState = e.transform;
    }
    this.zoomScale = this.getZoomScale(this.zoomState);

    this.axis.updateAxis({
      scale: this.getScale(),
      chart: this.chart,
      transition: 0,
      delay: 0,
    });
  }
}

export default D3ScaleLinear;
