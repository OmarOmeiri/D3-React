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
import { D3FormatCrosshair } from '../helpers/formatCrosshair';
import { D3GetMousePosition } from '../Mouse/getMousePosition';
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
  dataJoinKey?: (d: D) => string;
  transitionMs?: number
  disableZoom?: boolean,
  filter?: (d: D) => boolean
  crosshair?: boolean,
  formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  }
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
  private dataJoinKey?: (d: D) => string;
  private fill: ID3CircleAttrs<D>['fill'];
  private fillOpacity: ID3CircleAttrs<D>['fillOpacity'];
  private stroke: ID3CircleAttrs<D>['stroke'];
  private strokeWidth: ID3CircleAttrs<D>['strokeWidth'];
  private strokeOpacity: ID3CircleAttrs<D>['strokeOpacity'];
  private transitionMs: number;
  private mouseRect: D3MouseRect;
  private disableZoom: boolean;
  private crosshair: boolean;
  private filter?: (d: D, index: number) => boolean;
  private mouseOut: Required<ID3Events<D>>['mouseOut'];
  private mouseOver: Required<ID3Events<D>>['mouseOver'];
  private mouseMove: Required<ID3Events<D>>['mouseMove'];
  private formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  };

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
    disableZoom = false,
    crosshair = true,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    strokeOpacity,
    formatCrosshair,
    transitionMs = 200,
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
    this.transitionMs = transitionMs;
    this.dataJoinKey = dataJoinKey;
    this.filter = filter;
    this.formatCrosshair = formatCrosshair;
    this.disableZoom = disableZoom;
    this.crosshair = crosshair;
    this.mouseRect = new D3MouseRect(this.chart);
    this.mouseOut = mouseOut || (() => {});
    this.mouseMove = mouseMove || (() => {});
    this.mouseOver = mouseOver || (() => {});
    this.setData(data);
    this.update(data);
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
      return () => '';
    }

    return typeof attr === 'function'
      ? (d: D3DataCatgAndLinear<D>, i: number) => attr(d, i)
      : () => attr;
  }

  private mouseEventHandlers() {
    if (this.crosshair) {
      this.mouseRect.appendCrosshair();
    }
    this.mouseRect.setEvents({
      mouseMove: (e, mouseCallback) => {
        const [x, y] = D3GetMousePosition(e, this.chart);
        const xVal = this.xScale.invert(x);
        const yVal = this.yScale.invert(y);
        const xScaled = this.getPosition(xVal, this.xScale.getScale());
        const yScaled = this.getPosition(yVal, this.yScale.getScale());
        mouseCallback(xScaled, yScaled);

        this.mouseRect.setCrosshairText(
          this.formatCrosshair?.x ? this.formatCrosshair.x(xVal as any) : D3FormatCrosshair(xVal),
          this.formatCrosshair?.y ? this.formatCrosshair.y(yVal as any) : D3FormatCrosshair(yVal),
        );
      },
    });
    if (!this.disableZoom) {
      const zoom = D3Zoom<SVGSVGElement, unknown>()
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
          this.updateScales(0);
        });

      this.chart.svg
        .call(zoom);
    }
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
        if (this.dataJoinKey) return this.dataJoinKey(d);
        return i;
      });

    this.exit();
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

  updateScales(transition?: number) {
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
      .attr('cy', (d) => this.getPosition(d[this.yKey], this.yScale.getScale()))
      .attr('cx', (d) => this.getPosition(d[this.xKey], this.xScale.getScale()))
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
