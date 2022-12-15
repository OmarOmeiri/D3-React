import {
  BaseType,
  select,
  Selection,
  zoom as D3Zoom,
} from 'd3';
import { D3Classes } from '../../consts/classes';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { D3ZoomHelper } from '../../helpers/d3Zoom';
import { D3ScaleLinear } from '../../Scales';
import D3ScaleBand from '../../Scales/ScaleBand';
import D3ScaleColorSequential from '../../Scales/ScaleColorSequential';
import D3ScaleOrdinal from '../../Scales/ScaleOrdinal';
import {
  D3NumberKey,
  D3StringKey,
  ID3Events,
  ID3ShapeAttrs,
} from '../../types';
import { D3FormatCrosshair } from '../helpers/formatCrosshair';
import { D3GetMousePosition } from '../Mouse/getMousePosition';
import D3MouseRect from '../Mouse/MouseRect';

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
  mouseOver: (d: D, pos: {x: number, y: number}) => void;
  formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  }
}

class Bar<
D extends Record<string, unknown>,
> {
  private chart: D3Chart;
  private xScale: D3ScaleBand<D>;
  private yScale: D3ScaleLinear<D>;
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
  private mouseRect: D3MouseRect;
  private disableZoom: boolean;
  private crosshair: boolean;
  private transitionMs: number;
  private mouseOver: (d: D, pos: {x: number, y: number}) => void;
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

    this.mouseRect = new D3MouseRect(this.chart);
    this.mouseOver = mouseOver || (() => {});
    this.mouseOut = mouseOut || (() => {});
    this.update(data);
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

  private barsStart(bars: typeof this.bars) {
    return bars
      .attr('class', D3Classes.chartElements.bar.bar)
      .attr('x', (d) => Number(this.xScale.getScale()(d[this.xKey])))
      .attr('width', this.xScale.getScale().bandwidth())
      .attr('fill', 'rgba(0, 0, 0, 0)')
      .attr('y', this.yScale.getScale()(0))
      .attr('height', 0);
  }

  private barsEnd(bars: typeof this.bars) {
    return bars
      .attr('fill', (d, i) => this.getAttr('fill')(d, i))
      .attr('fillOpacity', (d, i) => this.getAttr('fillOpacity')(d, i))
      .attr('stroke', (d, i) => this.getAttr('stroke')(d, i))
      .attr('strokeWidth', (d, i) => this.getAttr('strokeWidth')(d, i))
      .attr('strokeOpacity', (d, i) => this.getAttr('strokeOpacity')(d, i))
      .attr('y', (d) => this.yScale.getScale()(d[this.yKey]))
      .attr('height', (d) => this.yScale.getScale()(0) - this.yScale.getScale()(d[this.yKey]));
  }

  update(newData: D3DataCatgAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.data = newData;
    this.bars = this.chart.chart
      .selectAll<SVGRectElement, D3DataCatgAndLinear<D>>(`.${D3Classes.chartElements.bar.bar}`)
      .data(this.data, (d, i) => {
        if (this.dataJoinKey) return this.dataJoinKey(d);
        return i;
      });

    this.barsEnd(
      this.bars
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.bars,
    );

    this.exit();
    this.enter();
  }

  enter() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const vis = this;
    const barsEnter = this.barsStart(
      this.bars
        .enter()
        .append('rect'),
    );
    barsEnter
      .on('mouseover', function (e, d) {
        select(this)
          .classed(D3Classes.events.hovered, true);
        const x = vis.getPosition(d[vis.xKey], vis.xScale.getScale());
        const y = vis.getPosition(d[vis.yKey], vis.yScale.getScale());
        vis.mouseOver(d, { x, y });
      })
      .on('mouseout', function () {
        select(this)
          .classed(D3Classes.events.hovered, false);
        vis.mouseOut();
      });

    this.barsEnd(
      barsEnter
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.bars,
    );
  }

  exit() {
    this.barsStart(
      this.bars
        .exit()
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.bars,
    ).remove();
  }

  updateScales(transition?: number) {
    this.chart.chart
      .selectAll<SVGRectElement, D3DataCatgAndLinear<D>>(`.${D3Classes.chartElements.bar.bar}`)
      .transition()
      .duration(transition || this.transitionMs)
      .attr('y', (d) => this.yScale.getScale()(d[this.yKey]))
      .attr('x', (d) => Number(this.xScale.getScale()(d[this.xKey])))
      .attr('width', this.xScale.getScale().bandwidth())
      .attr('height', (d) => this.yScale.getScale()(0) - this.yScale.getScale()(d[this.yKey]))
      .attr('fill', (d, i) => this.getAttr('fill')(d, i))
      .attr('fillOpacity', (d, i) => this.getAttr('fillOpacity')(d, i))
      .attr('stroke', (d, i) => this.getAttr('stroke')(d, i))
      .attr('strokeWidth', (d, i) => this.getAttr('strokeWidth')(d, i))
      .attr('strokeOpacity', (d, i) => this.getAttr('strokeOpacity')(d, i));
  }
}

export default Bar;
