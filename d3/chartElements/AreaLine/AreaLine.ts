import {
  area,
  BaseType,
  curveCatmullRom,
  line,
  Selection,
  zoom as D3Zoom,
} from 'd3';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { D3Defined } from '../../helpers/d3Defined';
import { D3ZoomHelper } from '../../helpers/d3Zoom';
import { D3ScaleLinear } from '../../Scales';
import D3ScaleBand from '../../Scales/ScaleBand';
import D3ScaleLog from '../../Scales/ScaleLog';
import D3ScaleTime from '../../Scales/ScaleTime';
import {
  D3NumberOrStringKey,
  D3NumberStringOrDateKey,
  ID3Attrs,
  ID3Events,
  ID3ShapeAttrs,
  ID3TooltipData,
} from '../../types';
import { D3FormatCrosshair } from '../helpers/formatCrosshair';
import { D3GetMousePosition } from '../Mouse/getMousePosition';
import D3MouseRect from '../Mouse/MouseRect';
import { sortSeriesByAUC } from './helpers/AUC';
import { D3AreaLineClasses } from './helpers/classes';
import { filterAreaLineTooltipValues } from './helpers/tooltip';

import type D3Chart from '../../Chart';

export interface ID3AreaLineSerie<
D extends Record<string, unknown>
> extends ID3ShapeAttrs<D> {
  xKey: D3NumberStringOrDateKey<D>,
  yKey: D3NumberStringOrDateKey<D>,
  name: string;
}

type AreaLineScales<
D extends Record<string, unknown>,
> =
| D3ScaleLinear<D>
| D3ScaleBand<D>
| D3ScaleLog<D>
| D3ScaleTime<D>

type D3AreaLineScales<
D extends Record<string, unknown>,
> =
| D3ScaleLinear<D>['scale']
| D3ScaleBand<D>['scale']
| D3ScaleLog<D>['scale']
| D3ScaleTime<D>['scale']

export interface ID3AreaLine<
D extends Record<string, unknown>,
> extends ID3Events<D, D, ID3TooltipData<D>> {
  chart: D3Chart
  data: D3DataCatgAndLinear<D>[],
  xScale: AreaLineScales<D>;
  yScale: AreaLineScales<D>;
  alpha?: number;
  transitionMs?: number
  filter?: (d: D) => boolean
  series: ID3AreaLineSerie<D>[]
  withDots?: boolean,
  type: 'area' | 'line',
  disableZoom?: boolean,
  crosshair?: boolean,
  formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  }
}

type DotsSelection<
D extends Record<string, unknown>,
> = D3DataCatgAndLinear<D> & {
  __attrs__: ID3AreaLineSerie<D>;
}

export type AreaLineData<
D extends Record<string, unknown>,
> = {
  data: D3DataCatgAndLinear<D>[]
  attrs: ID3AreaLineSerie<D>
}

const DEFAULT_AREA_ATTRS: Record<keyof ID3ShapeAttrs<any>, string> = {
  stroke: 'white',
  fill: 'purple',
  fillOpacity: '0.6',
  strokeWidth: '2',
  strokeOpacity: '1',
};

const DEFAULT_LINE_ATTRS: Record<keyof ID3Attrs<any>, string> = {
  stroke: 'black',
  strokeWidth: '2',
  strokeOpacity: '1',
};

const defaultAttrs = (type: 'area' | 'line') => (
  type === 'area'
    ? DEFAULT_AREA_ATTRS
    : DEFAULT_LINE_ATTRS
);

class AreaLine <
D extends Record<string, unknown>,
> {
  private chart: D3Chart;
  private xScale: AreaLineScales<D>;
  private yScale: AreaLineScales<D>;
  private parentGroup!: Selection<SVGGElement, AreaLineData<D>, SVGGElement, unknown>;
  private paths!: Selection<SVGPathElement, AreaLineData<D>, BaseType, AreaLineData<D>>;
  private dots?: Selection<SVGCircleElement, DotsSelection<D>, BaseType, AreaLineData<D>>;
  private data!: AreaLineData<D>[];
  private series: ID3AreaLineSerie<D>[];
  private alpha: number;
  private transitionMs: number;
  private tooltipIndex: number | string | Date | null = null;
  private filter?: (d: D, index: number) => boolean;
  private mouseOut: Required<ID3Events<D>>['mouseOut'];
  private mouseOver: Required<ID3Events<D>>['mouseOver'];
  private mouseMove: Required<ID3Events<D, D, ID3TooltipData<D>>>['mouseMove'];
  private mouseRect: D3MouseRect;
  private withDots: boolean;
  private type: 'area' | 'line';
  private defaultAttrs: {[k: string]: string};
  private crosshair: boolean;
  private disableZoom: boolean;
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
    series,
    alpha = 0.5,
    transitionMs,
    withDots,
    crosshair = false,
    disableZoom = false,
    formatCrosshair,
    mouseOut,
    mouseMove,
    mouseOver,
    type,
  }: ID3AreaLine<D>) {
    this.chart = chart;
    this.mouseRect = new D3MouseRect(this.chart);
    this.xScale = xScale;
    this.yScale = yScale;
    this.type = type;
    this.disableZoom = disableZoom;
    this.crosshair = crosshair;
    this.defaultAttrs = defaultAttrs(this.type);
    this.formatCrosshair = formatCrosshair;

    if (this.type === 'area') {
      this.series = sortSeriesByAUC(data, series, Array.from(new Set(series.map((s) => s.yKey))));
    } else {
      this.series = series;
    }

    this.alpha = alpha;
    this.transitionMs = transitionMs || 250;
    this.withDots = withDots ?? true;
    this.filter = filter;

    this.mouseOut = mouseOut || (() => {});
    this.mouseMove = mouseMove || (() => {});
    this.mouseOver = mouseOver || (() => {});
    this.setData(data);
    this.update(data);
  }

  private setData(data: D3DataCatgAndLinear<D>[]) {
    const filteredData = (
      this.filter ? data.filter(this.filter) : data
    );
    this.data = this.series.reduce((d, s) => {
      const data = filteredData.map((d) => ({
        [s.xKey]: d[s.xKey],
        [s.yKey]: d[s.yKey],
      } as D3DataCatgAndLinear<D>));
      return ([
        ...d,
        {
          data,
          attrs: s,
        },
      ]);
    }, [] as typeof this.data);
  }

  private getAttr(
    attrs: AreaLineData<D>['attrs'],
    key: keyof ID3ShapeAttrs<D>,
  ): ((d: D3DataCatgAndLinear<D>, index: number) => string) {
    if (this.type === 'line' && key === 'fill') return () => 'none';

    const attr = key === 'fill' && !attrs.fill
      ? attrs.stroke
      : attrs[key];
    if (!attr) {
      return () => this.defaultAttrs[key] || '';
    }

    return typeof attr === 'function'
      ? (d: D3DataCatgAndLinear<D>, i: number) => attr(d, i)
      : () => attr;
  }

  private getPosition(v: any, scale: D3AreaLineScales<D>) {
    return Number(scale(v)) + (
      'bandwidth' in scale
        ? (scale.bandwidth() / 2)
        : 0
    );
  }
  private pathGenerator(d: AreaLineData<D>, scales: {x?: D3AreaLineScales<D>, y?: D3AreaLineScales<D>} = {}) {
    return this.type === 'area'
      ? (
        area<AreaLineData<D>['data'][number]>()
          .defined((l) => D3Defined(l[d.attrs.xKey]) && D3Defined(l[d.attrs.yKey]))
          .x((xd) => this.getPosition(xd[d.attrs.xKey], scales.x || this.xScale.getScale()))
          .y0(this.chart.dims.innerDims.height)
          .y1((yd) => this.getPosition(yd[d.attrs.yKey], scales.y || this.yScale.getScale()))
          .curve(curveCatmullRom.alpha(this.alpha))(d.data)
      )
      : (
        line<AreaLineData<D>['data'][number]>()
          .defined((l) => D3Defined(l[d.attrs.xKey]) && D3Defined(l[d.attrs.yKey]))
          .x((xd) => this.getPosition(xd[d.attrs.xKey], scales.x || this.xScale.getScale()))
          .y((yd) => this.getPosition(yd[d.attrs.yKey], scales.y || this.yScale.getScale()))
          .curve(curveCatmullRom.alpha(this.alpha))(d.data)
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
        if (this.tooltipIndex === xVal) return;
        if (this.tooltipIndex !== xVal) {
          this.tooltipIndex = xVal;
          const tooltipData = filterAreaLineTooltipValues(this.data, xVal, this.defaultAttrs);
          if (tooltipData) this.mouseMove(tooltipData);
        }
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
          this.updateScales();
        });

      this.chart.svg
        .call(zoom);
    }
  }

  private pathStart(paths: typeof this.paths) {
    return paths
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`)
      .attr('class', D3AreaLineClasses[this.type].path)
      .attr('stroke-width', 0)
      .attr('stroke', (d, i) => this.getAttr(d.attrs, 'stroke')(d as any, i))
      .attr('fill', (d, i) => this.getAttr(d.attrs, 'fill')(d as any, i))
      .attr('fill-opacity', 0)
      .attr('d', (d) => this.pathGenerator(d));
  }

  private pathEnd(paths: typeof this.paths) {
    return paths
      .attr('stroke-width', (d, i) => this.getAttr(d.attrs, 'strokeWidth')(d as any, i))
      .attr('fill-opacity', (d, i) => this.getAttr(d.attrs, 'fillOpacity')(d as any, i));
  }

  private dotsStart(dots: Exclude<typeof this.dots, undefined>) {
    return dots
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`)
      .attr('r', 0)
      .attr('class', D3AreaLineClasses[this.type].dots)
      .attr('cx', (xd) => this.getPosition(xd[xd.__attrs__.xKey], this.xScale.getScale()))
      .attr('cy', (yd) => this.getPosition(yd[yd.__attrs__.yKey], this.yScale.getScale()));
  }

  private dotsEnd(dots: Exclude<typeof this.dots, undefined>) {
    return dots
      .attr('r', 4);
  }

  private update(newData: D3DataCatgAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.setData(newData);
    this.updateGroups();
    this.exitGroups();
    this.enterGroups();
    this.updatePaths();
    this.updateDots();
    this.exitPaths();
    this.exitDots();
    this.enterPaths();
    this.enterDots();
  }

  private updateGroups() {
    this.parentGroup = this.chart.chart
      .selectAll(`.${D3AreaLineClasses[this.type].paths}`)
      .data(this.data, (_d) => {
        const d = _d as AreaLineData<D>;
        return d.attrs.name;
      }) as unknown as typeof this.parentGroup;
  }

  private exitGroups() {
    this.dotsStart(
      this.parentGroup
        .exit()
        .select(`.${D3AreaLineClasses[this.type].dotsGroup}`)
        .selectAll<SVGCircleElement, DotsSelection<D>>('circle')
        .transition()
        .duration(this.transitionMs) as unknown as Exclude<typeof this.dots, undefined>,
    );

    this.pathStart(
      this.parentGroup
        .exit()
        .select(`.${D3AreaLineClasses[this.type].pathGroup}`)
        .selectAll<SVGPathElement, AreaLineData<D>>('path')
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.paths,
    );

    this.parentGroup
      .exit()
      .transition()
      .duration(this.transitionMs)
      .remove();
  }

  private enterGroups() {
    const parentEnter = this.parentGroup
      .enter()
      .append('g')
      .attr('class', D3AreaLineClasses[this.type].paths);

    parentEnter.append('g')
      .attr('class', D3AreaLineClasses[this.type].pathGroup);

    parentEnter.append('g')
      .attr('class', D3AreaLineClasses[this.type].dotsGroup);

    this.parentGroup = parentEnter.merge(this.parentGroup);
  }

  private updatePaths() {
    const pathsGroup = this.parentGroup
      .select(`.${D3AreaLineClasses[this.type].pathGroup}`);

    this.paths = pathsGroup.selectAll<SVGPathElement, AreaLineData<D>>('path')
      .data((d) => [d], (_d) => {
        const d = _d as AreaLineData<D>;
        return d.attrs.name;
      });
  }

  private updateDots() {
    if (this.withDots) {
      const dotsGroup = this.parentGroup
        .select(`.${D3AreaLineClasses[this.type].dotsGroup}`)
        .attr('fill', (d, i) => this.getAttr(d.attrs, 'fill')(d as any, i));

      this.dots = dotsGroup.selectAll<SVGCircleElement, DotsSelection<D>>('circle')
        .data((dt) => dt.data.map((d) => ({ ...d, __attrs__: dt.attrs })));
    }
  }

  private exitPaths() {
    this.pathStart(
      this.paths
        .exit()
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.paths,
    ).remove();
  }

  private exitDots() {
    if (this.dots) {
      this.dotsStart(
        this.dots
          .exit<DotsSelection<D>>()
          .transition()
          .duration(this.transitionMs) as unknown as typeof this.dots,
      ).remove();
    }
  }

  private enterPaths() {
    const pathsInit = this.pathStart(
      this.paths
        .enter()
        .append('path'),
    );

    this.pathEnd(
      pathsInit
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.paths,
    );
  }

  private enterDots() {
    if (this.dots) {
      const dotsInit = this.dotsStart(
        this.dots
          .enter()
          .append('circle'),
      );

      this.dotsEnd(
      dotsInit
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.dots,
      );
    }
  }

  updateScales({
    x,
    y,
  }:{
    x?: D3AreaLineScales<D>;
    y?: D3AreaLineScales<D>;
  } = {}) {
    this.chart.chart
      .selectAll<SVGPathElement, AreaLineData<D>>(`.${D3AreaLineClasses[this.type].path}`)
      .attr('stroke-width', (d, i) => this.getAttr(d.attrs, 'strokeWidth')(d as any, i))
      .attr('stroke', (d, i) => this.getAttr(d.attrs, 'stroke')(d as any, i))
      .attr('d', (d) => this.pathGenerator(d, { x, y }));

    if (this.dots) {
      this.chart.chart
        .selectAll<SVGCircleElement, DotsSelection<D>>(`.${D3AreaLineClasses[this.type].dots}`)
        .attr('r', 4)
        .attr('cx', (xd) => this.getPosition(xd[xd.__attrs__.xKey], x || this.xScale.getScale()))
        .attr('cy', (yd) => this.getPosition(yd[yd.__attrs__.yKey], y || this.yScale.getScale()));
    }
  }
}

export default AreaLine;
