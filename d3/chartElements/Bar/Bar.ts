import {
  select,
  Selection,
  Transition,
} from 'd3';
import { D3Classes } from '../../consts/classes';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { d3AppendIfNotExists } from '../../helpers/d3Exists';
import { D3OnTransitionEnd } from '../../helpers/d3OnTransitionEnd';
import { D3Zoom } from '../../helpers/d3Zoom';
import { D3ScaleLinear } from '../../Scales';
import D3ScaleBand from '../../Scales/ScaleBand';
import D3ScaleColorSequential from '../../Scales/ScaleColorSequential';
import D3ScaleOrdinal from '../../Scales/ScaleOrdinal';
import {
  D3NumberKey,
  D3StringKey,
  ID3Events,
  ID3ShapeAttrs,
  ID3TooltipDataSingle,
} from '../../types';
import { D3FormatCrosshair } from '../helpers/formatCrosshair';
import D3Mouse from '../Mouse/D3Mouse';
import { D3GetMousePosition } from '../Mouse/helpers/getMousePosition';

import type D3Chart from '../../Chart';

const DEFAULT_BAR_ATTRS = {
  fill: '#47a9ff',
  fillOpacity: '1',
  stroke: 'none',
  strokeWidth: '1',
  strokeOpacity: '1',
};

export interface ID3Bar<
D extends Record<string, unknown>,
> extends ID3ShapeAttrs<D>, Pick<ID3Events<D>, 'mouseOut'> {
  chart: D3Chart,
  data: D3DataCatgAndLinear<D>[],
  xScale: D3ScaleBand<D>,
  yScale: D3ScaleLinear<D>,
  xKey: D3StringKey<D>,
  yKey: D3NumberKey<D>,
  colorScale?: D3ScaleOrdinal<D> | D3ScaleColorSequential<D>;
  colorKey?: D3StringKey<D> | D3NumberKey<D>,
  dataJoinKey?: (d: D) => string,
  crosshair?: boolean,
  disableZoom?: boolean,
  transitionMs?: number
  mouseOver: (d: ID3TooltipDataSingle<D>) => void;
  formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  }
}

type BarsSelection<D extends Record<string, unknown>> = Selection<SVGRectElement, D3DataCatgAndLinear<D>, SVGGElement, unknown>
type BarsTransition<D extends Record<string, unknown>> = Transition<SVGRectElement, D3DataCatgAndLinear<D>, SVGGElement, unknown>

class Bar<
D extends Record<string, unknown>,
> {
  private chart: D3Chart;
  private xScale: D3ScaleBand<D>;
  private yScale: D3ScaleLinear<D>;
  private parentGroup!: Selection<SVGGElement, unknown, null, undefined>;
  private bars!: Selection<SVGRectElement, D3DataCatgAndLinear<D>, SVGGElement, unknown>;
  private data: D3DataCatgAndLinear<D>[];
  private yKey: D3NumberKey<D>;
  private xKey: D3StringKey<D>;
  private colorScale?: D3ScaleOrdinal<D> | D3ScaleColorSequential<D>;
  private colorKey?: D3StringKey<D> | D3NumberKey<D>;
  private dataJoinKey?: (d: D) => string;
  private fill: string | ((d: D, index: number) => string);
  private fillOpacity: string | ((d: D, index: number) => string);
  private stroke: string | ((d: D, index: number) => string);
  private strokeWidth: string | ((d: D, index: number) => string);
  private strokeOpacity: string | ((d: D, index: number) => string);
  private mouse: D3Mouse;
  private disableZoom: boolean;
  private crosshair: boolean;
  private transitionMs: number;
  private mouseOver: (d: ID3TooltipDataSingle<D>) => void;
  private mouseOut: Required<ID3Events<D>>['mouseOut'];
  private formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  };

  constructor({
    chart,
    data,
    xScale,
    yScale,
    xKey,
    yKey,
    colorKey,
    colorScale,
    dataJoinKey,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    strokeOpacity,
    formatCrosshair,
    crosshair = true,
    disableZoom = false,
    transitionMs = 200,
    mouseOver,
    mouseOut,
  }: ID3Bar<D>) {
    this.chart = chart;
    this.xScale = xScale;
    this.yScale = yScale;
    this.colorScale = colorScale;
    this.yKey = yKey;
    this.xKey = xKey;
    this.data = data;
    this.dataJoinKey = dataJoinKey;

    this.transitionMs = transitionMs;
    this.colorKey = colorKey;
    this.fill = fill || DEFAULT_BAR_ATTRS.fill;
    this.fillOpacity = fillOpacity || DEFAULT_BAR_ATTRS.fillOpacity;
    this.stroke = stroke || DEFAULT_BAR_ATTRS.stroke;
    this.strokeWidth = strokeWidth || DEFAULT_BAR_ATTRS.strokeWidth;
    this.strokeOpacity = strokeOpacity || DEFAULT_BAR_ATTRS.strokeOpacity;
    this.disableZoom = disableZoom;
    this.crosshair = crosshair;
    this.formatCrosshair = formatCrosshair;

    this.mouse = new D3Mouse(this.chart);
    this.mouseOver = mouseOver || (() => {});
    this.mouseOut = mouseOut || (() => {});

    this.parentGroup = d3AppendIfNotExists(
      this.chart.chart
        .select<SVGGElement>(`.${D3Classes.chartElements.bar.allBarsGroup}`),
      () => this.chart.chart
        .append('g')
        .attr('class', D3Classes.chartElements.bar.allBarsGroup)
        .attr('clip-path', `url(#${this.chart.chartAreaClipId})`),
    );
    this.pattern(data);
  }

  private getAttr(
    key: keyof ID3ShapeAttrs<D>,
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

  private getPosition(v: any, scale: D3ScaleBand<D>['scale'] | D3ScaleLinear<D>['scale']) {
    return Number(scale(v)) + (
      'bandwidth' in scale
        ? (scale.bandwidth() / 2)
        : 0
    );
  }

  private mouseEventHandlers() {
    if (this.crosshair) {
      this.mouse.appendCrosshair();
    }
    this.mouse.setEvents({
      mouseMove: (e, mouseCallback) => {
        const [x, y] = D3GetMousePosition(e, this.chart);
        const xVal = this.xScale.invert(x);
        const yVal = this.yScale.invert(y);
        const xScaled = this.getPosition(xVal, this.xScale.getScale());
        const yScaled = this.getPosition(yVal, this.yScale.getScale());
        mouseCallback(xScaled, yScaled);

        this.mouse.setCrosshairText(
          this.formatCrosshair?.x ? this.formatCrosshair.x(xVal as any) : D3FormatCrosshair(xVal),
          this.formatCrosshair?.y ? this.formatCrosshair.y(yVal as any) : D3FormatCrosshair(yVal),
        );
      },
    });
    if (!this.disableZoom) {
      D3Zoom({
        chart: this.chart,
        xScale: this.xScale,
        yScale: this.yScale,
        onZoom: () => { this.update(0); },
      });
    }
  }

  private barsStart<
    T extends BarsSelection<D>
    | BarsTransition<D>
  >(bars: T) {
    return (bars as BarsSelection<D>)
      .attr('class', D3Classes.chartElements.bar.bar)
      .attr('x', (d) => Number(this.xScale.getScale()(d[this.xKey])))
      .attr('width', this.xScale.getScale().bandwidth())
      .attr('fill', 'rgba(0, 0, 0, 0)')
      .attr('y', this.yScale.getScale()(0))
      .attr('height', 0) as T;
  }

  private barsEnd<
    T extends BarsSelection<D>
    | BarsTransition<D>
  >(bars: T): T {
    return (bars as BarsSelection<D>)
      .attr('class', D3Classes.chartElements.bar.bar)
      .attr('x', (d) => Number(this.xScale.getScale()(d[this.xKey])))
      .attr('y', (d) => this.yScale.getScale()(d[this.yKey]))
      .attr('width', this.xScale.getScale().bandwidth())
      .attr('fill', (d, i) => this.getAttr('fill')(d, i))
      .attr('fillOpacity', (d, i) => this.getAttr('fillOpacity')(d, i))
      .attr('stroke', (d, i) => this.getAttr('stroke')(d, i))
      .attr('strokeWidth', (d, i) => this.getAttr('strokeWidth')(d, i))
      .attr('strokeOpacity', (d, i) => this.getAttr('strokeOpacity')(d, i))
      .attr('height', (d) => this.yScale.getScale()(0) - this.yScale.getScale()(d[this.yKey])) as T;
  }

  private pattern(newData: D3DataCatgAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.data = newData;
    this.bars = this.parentGroup
      .selectAll<SVGRectElement, D3DataCatgAndLinear<D>>(`.${D3Classes.chartElements.bar.bar}`)
      .data(this.data, (d, i) => {
        if (this.dataJoinKey) return this.dataJoinKey(d);
        return i;
      });

    const exiting = this.exit();
    const entering = this.enter();
    this.onTransitionEnd(entering, exiting);
  }

  private enter() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const vis = this;
    const barsInit = this.barsStart(
      this.bars
        .enter()
        .append('rect'),
    );
    barsInit
      .on('mouseover', function (_, d) {
        const bar = select(this);
        bar
          .classed(D3Classes.events.hovered, true);
        const x = vis.getPosition(d[vis.xKey], vis.xScale.getScale());
        const y = vis.getPosition(d[vis.yKey], vis.yScale.getScale());
        vis.mouseOver({
          data: d,
          position: {
            x,
            y,
          },
          attrs: {
            name: String(vis.yKey),
            fill: bar.attr('fill') || undefined,
            fillOpacity: bar.attr('fill-opacity') || undefined,
            stroke: bar.attr('stroke') || undefined,
            strokeWidth: bar.attr('stroke-width') || undefined,
            strokeOpacity: bar.attr('stroke-opacity'),
            xKey: String(vis.xKey),
            yKey: String(vis.yKey),
          },
        });
      })
      .on('mouseout', function () {
        select(this)
          .classed(D3Classes.events.hovered, false);
        vis.mouseOut();
      });

    const entering = this.barsEnd(
      barsInit
        .transition()
        .duration(this.transitionMs),
    );
    return entering;
  }

  private exit() {
    const exiting = this.barsStart(
      this.bars
        .exit<D3DataCatgAndLinear<D>>()
        .transition()
        .duration(this.transitionMs),
    ).remove();

    return exiting;
  }

  private onTransitionEnd(
    ...transitions: Transition<any, any, any, any>[]
  ) {
    D3OnTransitionEnd(...transitions)({
      onResolve: () => this.update(),
      onReject: () => this.update(),
      onEmpty: () => this.update(),
    });
  }

  update(transition?: number) {
    this.barsEnd(
      this.bars
        .transition()
        .duration(transition ?? this.transitionMs),
    );
  }
}

export default Bar;
