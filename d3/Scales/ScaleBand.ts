import {
  scaleBand,
  ScaleBand,
} from 'd3';
import { invert } from 'lodash';
import D3Axis, { ID3Axis } from '../Axes/Axis';
import D3Chart from '../Chart';
import { D3DataCatg } from '../dataTypes';
import { D3IsZoomed } from '../helpers/d3Zoom';
import { D3StringKey } from '../types';
import { D3GetScaleRange } from './helpers/getScaleRange';

const DEFAULT_PADDING = {
  inner: 0.3,
  outer: 0.2,
};

type IScaleBandBase = {
  id: string,
  domain?: string[],
  padding?: {
    inner?: number,
    outer?: number
  }
}

export type IScaleBandWithData<
D extends Record<string, unknown>,
> = {
  data: D3DataCatg<D>[],
  dataKey: TypeOrArrayOfType<D3StringKey<D>>,
} & IScaleBandBase

export type IScaleBandNoData = {
  data?: undefined,
  dataKey?: undefined,
} & IScaleBandBase

export type IScaleBand<
D extends Record<string, unknown>,
> = (IScaleBandNoData | IScaleBandWithData<D>) & Omit<ID3Axis, 'scale'>

type IUpdateScale<
D extends Record<string, unknown>,
> = Expand<Pick<
IScaleBand<D>,
| 'type'
| 'dataKey'
| 'data'
| 'domain'
| 'padding'
| 'chart'
| 'label'
> & {
  range?: [number, number],
  transition?: number,
}>

class D3ScaleBand<
D extends Record<string, unknown>,
> {
  private scale: ScaleBand<string>;
  public dataKey?: D3StringKey<D>[];
  public id: string;
  private chart: D3Chart;
  private data?: D3DataCatg<D>[];
  private zoomState: {k: number, x: number, y: number} | null = null;
  private domain?: string[];
  private range: [number, number];
  public axis: D3Axis;
  private zoomScale: ScaleBand<string> | null = null;
  private padding?: {
    inner?: number,
    outer?: number
  };

  constructor(params: IScaleBand<D>) {
    this.id = params.id;
    this.data = params.data;
    this.chart = params.chart;
    this.dataKey = params.dataKey
      ? [params.dataKey].flat() as D3StringKey<D>[]
      : undefined;
    this.domain = params.domain || this.getDomain({ ...params, dataKey: this.dataKey });
    this.range = D3GetScaleRange(params.type, params.chart.dims);
    this.padding = params.padding;

    this.scale = scaleBand()
      .domain(this.domain)
      .range(this.range)
      .paddingInner(this.padding?.inner || DEFAULT_PADDING.inner)
      .paddingOuter(this.padding?.outer || DEFAULT_PADDING.outer);

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

  private getDomain({
    data = this.data,
    dataKey = this.dataKey,
    domain = this.domain,
  }: IUpdateScale<D> & {dataKey?: D3StringKey<D>[]}): string[] {
    if (domain) {
      return domain;
    }
    if (data && data.length && dataKey) {
      return data.reduce((vals, d) => [
        ...vals,
        ...dataKey.map((k) => d[k]).filter((d) => typeof d === 'string') as string[],
      ], [] as string[]);
    }

    throw new RangeError('No domain or data was passed.');
  }

  updateScale(
    params: IUpdateScale<D>,
    axisOptions?: {transition?: number, delay?: number},
  ) {
    this.range = params.range || D3GetScaleRange(params.type, params.chart.dims);
    this.padding = params.padding || this.padding;
    if (params.dataKey) this.dataKey = [params.dataKey].flat() as D3StringKey<D>[];
    this.domain = this.getDomain({ ...params, dataKey: this.dataKey });
    this.scale = scaleBand()
      .domain(this.domain)
      .range(this.range)
      .paddingInner(this.padding?.inner || DEFAULT_PADDING.inner)
      .paddingOuter(this.padding?.outer || DEFAULT_PADDING.outer);

    this.axis.updateAxis({
      scale: this.getScale(),
      chart: params.chart,
      label: params.label,
      transition: axisOptions?.transition,
      delay: axisOptions?.delay,
    });
  }

  invert(v: number) {
    const domain = this.scale.domain();
    const step = this.getScale().step();
    const firstVisibleBand = Math.abs(this.getScale().range()[0]) / step;

    const index = Math.floor(
      (
        (v / this.chart.dims.innerDims.width)
        / (step / this.chart.dims.innerDims.width)
      )
      + firstVisibleBand,
    );
    return domain[Math.max(0, Math.min(index, domain.length - 1))];
  }

  zoomRescale(e: any) {
    let newRange: [number, number] | undefined;
    if (this.axis.type === 'bottom' || this.axis.type === 'top') {
      newRange = D3GetScaleRange(this.axis.type, this.chart.dims)
        .map((d) => e.transform.applyX(d)) as [number, number];
    }

    if (this.axis.type === 'left' || this.axis.type === 'right') {
      newRange = D3GetScaleRange(this.axis.type, this.chart.dims)
        .map((d) => e.transform.applyY(d)) as [number, number];
    }

    if (this.zoomState && !D3IsZoomed(e)) {
      this.zoomState = null;
      this.zoomScale = null;
    } else {
      this.zoomState = e.transform;
    }

    if (newRange) {
      this.zoomScale = scaleBand()
        .domain(this.getDomain({ chart: this.chart, type: this.axis.type, dataKey: this.dataKey }))
        .range(newRange)
        .paddingInner(this.padding?.inner || DEFAULT_PADDING.inner)
        .paddingOuter(this.padding?.outer || DEFAULT_PADDING.outer);
    }
    this.axis.updateAxis({
      scale: this.getScale(),
      chart: this.chart,
      transition: 0,
      delay: 0,
    });
  }
}

export default D3ScaleBand;
