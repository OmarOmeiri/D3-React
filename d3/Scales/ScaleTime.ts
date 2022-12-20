import {
  ScaleTime,
  scaleTime,
} from 'd3';
import dayjs from 'dayjs';
import MinMaxDate from 'dayjs/plugin/minMax';
import { isDate } from 'lullo-utils/Date';
import D3Axis, { ID3Axis } from '../Axes/Axis';
import D3Chart from '../Chart';
import { D3DataTime } from '../dataTypes';
import { D3IsZoomed } from '../helpers/d3Zoom';
import { D3DateKey } from '../types';
import { D3GetScaleRange } from './helpers/getScaleRange';
import {
  D3TimeDomain,
  D3TimeDomainOffset,
} from './types';

dayjs.extend(MinMaxDate);

type IScaleTimeBase = {
  id: string,
}

export type IScaleTimeWithData<
D extends Record<string, unknown>
> = {
  data: D3DataTime<D>[],
  dataKey: TypeOrArrayOfType<D3DateKey<D>>,
  domain?: [D3TimeDomain | Date, D3TimeDomain | Date],
} & IScaleTimeBase

export type IScaleTimeNoData = {
  data?: undefined
  dataKey?: undefined,
  domain: [Date, Date]
} & IScaleTimeBase

export type IScaleTime<
D extends Record<string, unknown>
> = (IScaleTimeWithData<D> | IScaleTimeNoData) & Omit<ID3Axis, 'scale'>

type IUpdateScale<
D extends Record<string, unknown>,
> = Expand<Pick<
IScaleTime<D>,
| 'type'
| 'dataKey'
| 'data'
| 'domain'
| 'chart'
| 'label'
> & {
  range?: [number, number]
}>

const isDomainDate = (value: unknown): value is [Date, Date] => {
  if (!Array.isArray(value)) return false;
  if (
    isDate(value[0])
    && isDate(value[1])
  ) return true;
  return false;
};

class D3ScaleTime<
D extends Record<string, unknown>,
> {
  private scale: ScaleTime<number, number, never>;
  private zoomScale: ScaleTime<number, number, never> | null = null;
  private zoomState: {k: number, x: number, y: number} | null = null;
  public dataKey?: D3DateKey<D>[];
  private chart: D3Chart;
  private data?: D3DataTime<D>[];
  public id: string;
  public axis: D3Axis;
  private domain?: [D3TimeDomain | Date, D3TimeDomain | Date] | [Date, Date];
  private range: [number, number];

  constructor(params: IScaleTime<D>) {
    this.id = params.id;
    this.chart = params.chart;
    this.data = params.data;
    this.dataKey = params.dataKey
      ? [params.dataKey].flat() as D3DateKey<D>[]
      : undefined;
    this.domain = params.domain;
    this.range = D3GetScaleRange(params.type, params.chart.dims);
    this.scale = scaleTime()
      .domain((this.getDomain({ ...params, dataKey: this.dataKey })))
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

  private _getDomain(
    domain: Date | D3TimeDomain,
    d: number[],
  ) {
    if (isDate(domain)) {
      return domain;
    }

    const domainTrimmed = domain.trim();
    const maxVal = new Date(Math.max(...d));
    const minVal = new Date(Math.min(...d));
    if (domainTrimmed === 'dataMax') {
      return maxVal;
    }
    if (domainTrimmed === 'dataMin') {
      return minVal;
    }

    const isMin = domainTrimmed.startsWith('dataMin');
    const isMax = domainTrimmed.startsWith('dataMax');
    const isSum = /[+]/.test(domainTrimmed);
    const isSubtraction = /[-]/.test(domainTrimmed);
    const value = isMin ? minVal : maxVal;

    if (!isSum && !isSubtraction) {
      throw new RangeError(`Invalid domain operator: ${domainTrimmed}`);
    }

    if (!isMin && !isMax) {
      throw new RangeError(`Invalid domain value: ${domainTrimmed}`);
    }

    const domainSplit = domainTrimmed.split(/[+|-]/);
    const offsetValue = Number(domainSplit[1].replace(/[^0-9.]/g, ''));
    const offsetMagnitude = domainSplit[1].replace(/[^a-z]/g, '') as D3TimeDomainOffset;

    if (Number.isNaN(offsetValue)) {
      throw new RangeError(`Invalid domain offset: ${offsetValue}`);
    }

    if (isSum) {
      return dayjs(value).add(offsetValue, offsetMagnitude).toDate();
    }

    if (isSubtraction) {
      return dayjs(value).subtract(offsetValue, offsetMagnitude).toDate();
    }

    throw new RangeError(`Invalid domain: ${domainTrimmed}.`);
  }

  private getDomain({
    data = this.data,
    dataKey = this.dataKey,
    domain = this.domain,
  }: IUpdateScale<D> & {dataKey?: D3DateKey<D>[]}): [Date, Date] {
    if (
      domain
      && isDomainDate(domain)
    ) {
      return domain;
    }
    if (data && data.length && dataKey) {
      const d = data.reduce((vals, d) => ([
        ...vals,
        ...dataKey.reduce((timestamps, k) => {
          const potentialDate = d[k] as unknown;
          if (isDate(potentialDate)) return [...timestamps, potentialDate.getTime()];
          return timestamps;
        }, [] as number[]),
      ]), [] as number[]);

      if (!domain) {
        return [
          new Date(Math.min(...d)),
          new Date(Math.max(...d)),
        ];
      }

      return [
        this._getDomain(domain[0], d),
        this._getDomain(domain[1], d),
      ];
    }

    throw new RangeError('No domain or data was passed.');
  }

  updateScale(params: IUpdateScale<D>) {
    this.range = params.range || D3GetScaleRange(params.type, params.chart.dims);
    if (params.dataKey) this.dataKey = [params.dataKey].flat() as D3DateKey<D>[];
    this.scale = scaleTime()
      .domain(this.getDomain({ ...params, dataKey: this.dataKey }))
      .range(this.range);

    const zoomScale = this.getZoomScale(this.zoomState);
    if (zoomScale) {
      this.zoomScale = zoomScale
        .domain(this.getDomain({ ...params, dataKey: this.dataKey }));
    }

    this.axis.updateAxis({
      scale: this.getScale(),
      chart: params.chart,
      label: params.label,
    });
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
      scale: this.zoomScale || this.scale,
      chart: this.chart,
      transition: 0,
      delay: 0,
    });
  }
}

export default D3ScaleTime;
