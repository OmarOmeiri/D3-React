import {
  BaseType,
  select,
  Selection,
  zoom as D3Zoom,
} from 'd3';
import { genScale } from 'lullo-utils/Math';
import { D3Classes } from '../../consts/classes';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { D3ZoomHelper } from '../../helpers/d3Zoom';
import { D3ScaleLinear } from '../../Scales';
import D3ScaleBand from '../../Scales/ScaleBand';
import D3ScaleLog from '../../Scales/ScaleLog';
import D3ScaleOrdinal from '../../Scales/ScaleOrdinal';
import D3ScaleTime from '../../Scales/ScaleTime';
import {
  D3NumberKey,
  D3NumberOrStringKey,
  D3StringKey,
  ID3CircleAttrs,
  ID3Events,
} from '../../types';
import D3MouseRect from '../Mouse/MouseRect';

import type D3Chart from '../../Chart';

type CircleScales<
D extends Record<string, unknown>,
> =
| D3ScaleLinear<D>
| D3ScaleBand<D>
| D3ScaleLog<D>
| D3ScaleTime<D>

type D3CircleScales<
D extends Record<string, unknown>,
> =
| D3ScaleLinear<D>['scale']
| D3ScaleBand<D>['scale']
| D3ScaleLog<D>['scale']
| D3ScaleTime<D>['scale']

export interface ID3Circle<
D extends Record<string, unknown>,
> extends ID3CircleAttrs<D>, ID3Events<D> {
  chart: D3Chart
  data: D3DataCatgAndLinear<D>[],
  xScale: CircleScales<D>;
  yScale: CircleScales<D>;
  colorScale?: D3ScaleOrdinal<D>;
  colorKey?: D3StringKey<D>,
  xKey: D3NumberOrStringKey<D>,
  yKey: D3NumberOrStringKey<D>,
  rKey?: D3NumberKey<D>,
  radiusNorm?: {max?: number, min?: number}
  dataJoinKey?: keyof D | (keyof D)[]
  transitionMs?: number
  filter?: (d: D) => boolean
}

const DEFAULT_RADIUS_NORM = {
  max: 20,
  min: 5,
};

class Circle<
D extends Record<string, unknown>,
> {
  private chart: D3Chart;
  private xScale: CircleScales<D>;
  private yScale: CircleScales<D>;
  private colorScale?: D3ScaleOrdinal<D>;
  private colorKey?: D3StringKey<D>;
  private circles!: Selection<SVGCircleElement, D3DataCatgAndLinear<D>, SVGGElement, unknown>;
  private data!: D3DataCatgAndLinear<D>[];
  private yKey: D3NumberOrStringKey<D>;
  private xKey: D3NumberOrStringKey<D>;
  private rKey?: D3NumberKey<D>;
  private radius?: string | ((d: D, index: number) => string);
  private radiusNorm: {min: number, max: number};
  private radiusScaler: (n: number) => number;
  private dataJoinKey?: (keyof D)[];
  private fill: ID3CircleAttrs<D>['fill'];
  private fillOpacity: ID3CircleAttrs<D>['fillOpacity'];
  private stroke: ID3CircleAttrs<D>['stroke'];
  private strokeWidth: ID3CircleAttrs<D>['strokeWidth'];
  private strokeOpacity: ID3CircleAttrs<D>['strokeOpacity'];
  private transitionMs: number;
  private mouseRect: D3MouseRect;
  private filter?: (d: D, index: number) => boolean;
  private mouseOut: Required<ID3Events<D>>['mouseOut'];
  private mouseOver: Required<ID3Events<D>>['mouseOver'];
  private mouseMove: Required<ID3Events<D>>['mouseMove'];

  constructor({
    chart,
    data,
    filter,
    xScale,
    yScale,
    colorScale,
    colorKey,
    xKey,
    yKey,
    rKey,
    radius,
    radiusNorm = DEFAULT_RADIUS_NORM,
    dataJoinKey,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    strokeOpacity,
    transitionMs,
    mouseOut,
    mouseMove,
    mouseOver,
  }: ID3Circle<D>) {
    this.chart = chart;
    this.xScale = xScale;
    this.yScale = yScale;
    this.colorScale = colorScale;
    this.yKey = yKey;
    this.xKey = xKey;
    this.rKey = rKey;
    this.colorKey = colorKey;
    this.radius = radius;
    this.fill = fill || 'none';
    this.stroke = stroke || 'none';
    this.strokeOpacity = strokeOpacity || '1';
    this.fillOpacity = fillOpacity || '1';
    this.strokeWidth = strokeWidth || '0';
    this.radiusNorm = {
      ...radiusNorm,
      ...DEFAULT_RADIUS_NORM,
    };
    this.radiusScaler = (n: number) => n;
    this.transitionMs = transitionMs || 200;
    this.dataJoinKey = dataJoinKey
      ? [dataJoinKey].flat() as (keyof D)[]
      : undefined;
    this.filter = filter;

    this.mouseRect = new D3MouseRect(this.chart);
    this.mouseOut = mouseOut || (() => {});
    this.mouseMove = mouseMove || (() => {});
    this.mouseOver = mouseOver || (() => {});
    this.setData(data);
    this.update(data);
  }

  set keys({
    xKey,
    yKey,
    colorKey,
  }: {
    xKey?: D3NumberOrStringKey<D>,
    yKey?: D3NumberOrStringKey<D>,
    colorKey?: D3StringKey<D>
  }) {
    if (xKey) this.xKey = xKey;
    if (yKey) this.yKey = yKey;
    if (colorKey) this.colorKey = colorKey;
  }

  private setData(data: D3DataCatgAndLinear<D>[]) {
    const { rKey } = this;
    this.data = this.filter ? data.filter(this.filter) : data;
    this.radiusScaler = rKey
      ? genScale({
        ...this.radiusNorm,
        values: this.data.map((d) => d[rKey]),
      })
      : (n: number) => n;
  }

  // private getPosition(v: any, type: 'x' | 'y') {
  //   const scale = this.getScale(type);
  //   return Number(scale(v)) + (
  //     'bandwidth' in scale
  //       ? (scale.bandwidth() / 2)
  //       : 0
  //   );
  // }

  private getPosition(v: any, scale: D3CircleScales<D>) {
    return Number(scale(v)) + (
      'bandwidth' in scale
        ? (scale.bandwidth() / 2)
        : 0
    );
  }

  private getAttr(
    key: keyof ID3CircleAttrs<D>,
  ): ((d: D3DataCatgAndLinear<D>, index: number) => string) {
    if (key === 'fill') {
      const {
        colorScale,
        colorKey,
      } = this;
      if (colorScale && colorKey) {
        return (d: D3DataCatgAndLinear<D>) => String(colorScale.scale(d[colorKey]));
      }
    }

    const attr = this[key];
    if (!attr) {
      console.warn(`No attribute: ${key} found for Circle`);
      return () => '';
    }

    return typeof attr === 'function'
      ? (d: D3DataCatgAndLinear<D>, i: number) => attr(d, i)
      : () => attr;
  }

  private mouseEventHandlers() {
    this.mouseRect.appendMouseRect();

    const zoom = D3Zoom<SVGGElement, unknown>()
      .scaleExtent([1, 20])
      .extent([[
        0,
        0,
      ], [
        this.chart.dims.innerDims.width,
        this.chart.dims.innerDims.height,
      ]])
      .translateExtent([[0, 0], [this.chart.dims.innerDims.width, this.chart.dims.innerDims.height]])
      .on('zoom', (e) => {
        D3ZoomHelper(e, this.xScale);
        D3ZoomHelper(e, this.yScale);
        this.updateScales({ transition: 0 });
      });

    this.mouseRect.mouseG
      .call(zoom);
  }

  private circleStart(circles: typeof this.circles) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const vis = this;
    return circles
      .attr('stroke-width', 0)
      .attr('fill-opacity', 0)
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`)
      .attr('class', D3Classes.chartElements.circle.circle)
      .attr('cy', (d) => this.getPosition(d[this.yKey], this.yScale.getScale()))
      .attr('cx', (d) => this.getPosition(d[this.xKey], this.xScale.getScale()))
      .attr('r', 0)
      .on('mousemove', (e, d) => this.mouseMove(d))
      .on('mouseover', function (e, d) {
        select(this)
          .classed(D3Classes.events.hovered, true);
        vis.mouseOver(d);
      })
      .on('mouseout', function () {
        select(this)
          .classed(D3Classes.events.hovered, false);

        vis.mouseOut();
      }) as unknown as typeof this.circles;
  }

  private circleEnd(circles: typeof this.circles) {
    return circles
      .attr('fill', this.getAttr('fill'))
      .attr('stroke', this.getAttr('stroke'))
      .attr('stroke-width', this.getAttr('strokeWidth'))
      .attr('fill-opacity', this.getAttr('fillOpacity'))
      .attr('cy', (d) => this.getPosition(d[this.yKey], this.yScale.getScale()))
      .attr('cx', (d) => this.getPosition(d[this.xKey], this.xScale.getScale()))
      .attr('r', (d) => {
        const { rKey } = this;
        if (rKey) {
          return this.radiusScaler(d[rKey]);
        }
        return d[this.rKey as keyof D] || this.radius || 5;
      }) as unknown as typeof this.circles;
  }

  update(newData: D3DataCatgAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.setData(newData);
    this.circles = this.chart.chart
      .selectAll<SVGCircleElement, D3DataCatgAndLinear<D>>(`.${D3Classes.chartElements.circle.circle}`)
      .data(this.data, (d, i) => {
        if (this.dataJoinKey) return this.dataJoinKey.map((k) => `${(d as any)[k]}`).join('-');
        return i;
      });

    this.exit();
    // this.pattern(this.circles);
    this.circleEnd(
      this.circles
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.circles,
    );
    this.enter();
  }

  enter() {
    const circlesInit = this.circleStart(
      this.circles
        .enter()
        .append('circle'),
    );

    this.circleEnd(
      circlesInit
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.circles,
    );
  }

  exit() {
    this.circles
      .exit()
      .attr('fill-opacity', 1)
      .transition()
      .duration(this.transitionMs)
      .attr('r', 0)
      .attr('fill-opacity', 0)
      .remove();
  }

  updateScales({ x, y, transition }: {
    x?: D3CircleScales<D>,
    y?: D3CircleScales<D>
    transition?: number,
  } = {}) {
    this.chart.chart
      .selectAll<BaseType, D3DataCatgAndLinear<D>>(
        `.${D3Classes.chartElements.circle.circle}`,
      )
      .attr('fill', this.getAttr('fill'))
      .attr('stroke', this.getAttr('stroke'))
      .attr('stroke-width', this.getAttr('strokeWidth'))
      .attr('fill-opacity', this.getAttr('fillOpacity'))
      .transition()
      .duration(transition || this.transitionMs)
      .attr('cy', (d) => this.getPosition(d[this.yKey], y || this.yScale.getScale()))
      .attr('cx', (d) => this.getPosition(d[this.xKey], x || this.xScale.getScale()))
      .attr('r', (d) => {
        const { rKey } = this;
        if (rKey) {
          return this.radiusScaler(d[rKey]);
        }
        return d[this.rKey as keyof D] || this.radius || 5;
      });
  }
}

export default Circle;
