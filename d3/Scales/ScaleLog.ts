import {
  scaleLog,
  ScaleLogarithmic,
} from 'd3';
import D3Axis, { ID3Axis } from '../Axes/Axis';
import D3Chart from '../Chart';
import { D3DataLinear } from '../dataTypes';
import { D3IsZoomed } from '../helpers/d3Zoom';
import { D3NumberKey } from '../types';
import { D3GetDomainNumber } from './helpers/getDomain';
import { D3GetScaleRange } from './helpers/getScaleRange';
import { D3LinearDomain } from './types';

type IScaleLogBase = {
  id: string,
  base?: number,
}

export type IScaleLogWithData<
D extends Record<string, unknown>
> = {
  data: D3DataLinear<D>[],
  dataKey: TypeOrArrayOfType<D3NumberKey<D>>,
  domain?: [D3LinearDomain | number, D3LinearDomain | number],
  roundDomain?: boolean
} & IScaleLogBase

export type IScaleLogNoData = {
  data?: undefined
  dataKey?: undefined,
  domain: [number, number]
  roundDomain?: undefined
} & IScaleLogBase

export type IScaleLog<
D extends Record<string, unknown>
> = (IScaleLogWithData<D> | IScaleLogNoData) & Omit<ID3Axis, 'scale'>

type IUpdateScale<
D extends Record<string, unknown>,
> = Expand<Pick<
IScaleLog<D>,
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

class D3ScaleLog<
D extends Record<string, unknown>,
> {
  private scale: ScaleLogarithmic<number, number, never>;
  private zoomScale: ScaleLogarithmic<number, number, never> | null = null;
  private zoomState: {k: number, x: number, y: number} | null = null;
  public dataKey?: D3NumberKey<D>[];
  public id: string;
  public axis: D3Axis;
  private chart: D3Chart;
  private data?: D3DataLinear<D>[];
  private domain?: [D3LinearDomain | number, D3LinearDomain | number] | [number, number];
  private range: [number, number];
  private roundDomain?: boolean;
  private base: number;

  constructor(params: IScaleLog<D>) {
    this.id = params.id;
    this.chart = params.chart;
    this.data = params.data;
    this.dataKey = params.dataKey
      ? [params.dataKey].flat() as D3NumberKey<D>[]
      : undefined;
    this.domain = params.domain;
    this.range = D3GetScaleRange(params.type, params.chart.dims);
    this.base = params.base || 10;
    this.scale = scaleLog()
      .domain((this.getDomain({ ...params, dataKey: this.dataKey })))
      .range(this.range)
      .base(this.base);

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
    this.scale = scaleLog()
      .domain(this.getDomain({ ...params, dataKey: this.dataKey }))
      .range(this.range);

    this.axis.updateAxis({ scale: this.getScale(), chart: params.chart, label: params.label });
  }

  zoomRescale(e: any) {
    if (this.axis.type === 'bottom' || this.axis.type === 'top') {
      this.zoomScale = e.transform.rescaleX(this.scale);
    } else if (this.axis.type === 'left' || this.axis.type === 'right') {
      this.zoomScale = e.transform.rescaleY(this.scale);
    } else {
      this.zoomScale = null;
    }

    if (this.zoomState && !D3IsZoomed(e)) {
      this.zoomState = null;
      this.zoomScale = null;
    } else {
      this.zoomState = e.transform;
    }

    this.axis.updateAxis({
      scale: this.getScale(),
      chart: this.chart,
      transition: 0,
      delay: 0,
    });
  }
}

export default D3ScaleLog;
