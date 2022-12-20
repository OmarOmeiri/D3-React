import {
  area,
  BaseType,
  curveCatmullRom,
  line,
  Selection,
  Transition,
} from 'd3';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { D3Defined } from '../../helpers/d3Defined';
import { D3OnTransitionEnd } from '../../helpers/d3OnTransitionEnd';
import { D3Zoom } from '../../helpers/d3Zoom';
import { D3ScaleLinear } from '../../Scales';
import D3ScaleBand from '../../Scales/ScaleBand';
import D3ScaleLog from '../../Scales/ScaleLog';
import D3ScaleTime from '../../Scales/ScaleTime';
import {
  D3NumberStringOrDateKey,
  ID3Attrs,
  ID3Events,
  ID3ShapeAttrs,
  ID3TooltipDataMulti,
} from '../../types';
import { D3FormatCrosshair } from '../helpers/formatCrosshair';
import D3Mouse from '../Mouse/D3Mouse';
import { D3GetMousePosition } from '../Mouse/helpers/getMousePosition';
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
> extends ID3Events<D, D, ID3TooltipDataMulti<D>> {
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

type DotsData<
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

type PathTransition<D extends Record<string, unknown>> = Transition<SVGPathElement, AreaLineData<D>, BaseType, AreaLineData<D>>;
type PathSelection<D extends Record<string, unknown>> = Selection<SVGPathElement, AreaLineData<D>, BaseType, AreaLineData<D>>
type DotsSelection<D extends Record<string, unknown>> = Selection<SVGCircleElement, DotsData<D>, BaseType, AreaLineData<D>>;
type DotsTransition<D extends Record<string, unknown>> = Transition<SVGCircleElement, DotsData<D>, BaseType, AreaLineData<D>>

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
  private paths!: PathSelection<D>;
  private dots?: DotsSelection<D>;
  private data!: AreaLineData<D>[];
  private series: ID3AreaLineSerie<D>[];
  private alpha: number;
  private transitionMs: number;
  private tooltipIndex: number | string | Date | null = null;
  private filter?: (d: D, index: number) => boolean;
  private mouseOut: Required<ID3Events<D>>['mouseOut'];
  private mouseOver: Required<ID3Events<D>>['mouseOver'];
  private mouseMove: Required<ID3Events<D, D, ID3TooltipDataMulti<D>>>['mouseMove'];
  private mouse: D3Mouse;
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
    this.mouse = new D3Mouse(this.chart);
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
    this.pattern(data);
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
  private pathGenerator(d: AreaLineData<D>) {
    return this.type === 'area'
      ? (
        area<AreaLineData<D>['data'][number]>()
          .defined((l) => D3Defined(l[d.attrs.xKey]) && D3Defined(l[d.attrs.yKey]))
          .x((xd) => this.getPosition(xd[d.attrs.xKey], this.xScale.getScale()))
          .y0(this.chart.dims.innerDims.height)
          .y1((yd) => this.getPosition(yd[d.attrs.yKey], this.yScale.getScale()))
          .curve(curveCatmullRom.alpha(this.alpha))(d.data)
      )
      : (
        line<AreaLineData<D>['data'][number]>()
          .defined((l) => D3Defined(l[d.attrs.xKey]) && D3Defined(l[d.attrs.yKey]))
          .x((xd) => this.getPosition(xd[d.attrs.xKey], this.xScale.getScale()))
          .y((yd) => this.getPosition(yd[d.attrs.yKey], this.yScale.getScale()))
          .curve(curveCatmullRom.alpha(this.alpha))(d.data)
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

        if (this.tooltipIndex === xVal) return;
        if (this.tooltipIndex !== xVal) {
          this.tooltipIndex = xVal;
          const tooltipData = filterAreaLineTooltipValues(this.data, xVal, this.defaultAttrs);
          if (tooltipData) this.mouseMove(tooltipData);
        }
      },
    });
    if (!this.disableZoom) {
      D3Zoom({
        chart: this.chart,
        xScale: this.xScale,
        yScale: this.yScale,
        onZoom: () => { this.update(0).all(); },
      });
    }
  }

  private pathStart<
    T extends PathSelection<D>
    | PathTransition<D>
  >(paths: T): T {
    return (paths as PathSelection<D>)
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`)
      .attr('class', D3AreaLineClasses[this.type].path)
      .attr('stroke', (d, i) => this.getAttr(d.attrs, 'stroke')(d as any, i))
      .attr('fill', (d, i) => (this.type === 'line' ? 'none' : this.getAttr(d.attrs, 'fill')(d as any, i)))
      .attr('d', (d) => this.pathGenerator(d))
      .attr('fill-opacity', 0)
      .attr('stroke-width', 0) as T;
  }

  private pathEnd<
  T extends PathSelection<D>
  | PathTransition<D>
    >(paths: T): T {
    return (paths as PathSelection<D>)
      .attr('stroke-width', (d, i) => this.getAttr(d.attrs, 'strokeWidth')(d as any, i))
      .attr('fill-opacity', (d, i) => this.getAttr(d.attrs, 'fillOpacity')(d as any, i))
      .attr('d', (d) => this.pathGenerator(d)) as T;
  }

  private dotsStart<
  T extends DotsSelection<D>
  | DotsTransition<D>
  >(dots: T): T {
    return (dots as DotsSelection<D>)
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`)
      .attr('r', 0)
      .attr('class', D3AreaLineClasses[this.type].dots)
      .attr('cx', (xd) => this.getPosition(xd[xd.__attrs__.xKey], this.xScale.getScale()))
      .attr('cy', (yd) => this.getPosition(yd[yd.__attrs__.yKey], this.yScale.getScale())) as T;
  }

  private dotsEnd<
  T extends DotsSelection<D>
  | DotsTransition<D>
  >(dots: T): T {
    return (dots as DotsSelection<D>)
      .attr('r', 4)
      .attr('cx', (xd) => this.getPosition(xd[xd.__attrs__.xKey], this.xScale.getScale()))
      .attr('cy', (yd) => this.getPosition(yd[yd.__attrs__.yKey], this.yScale.getScale())) as T;
  }

  private pattern(newData: D3DataCatgAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.setData(newData);
    this.groupDataJoin();
    const exiting = this.exit();
    this.enterGroups();
    this.dataJoins();
    const entering = this.enter();
    this.onTransitionEnd(...entering, ...exiting);
  }

  private groupDataJoin() {
    this.parentGroup = this.chart.chart
      .selectAll<SVGGElement, AreaLineData<D>>(`.${D3AreaLineClasses[this.type].paths}`)
      .data(this.data, (d) => d.attrs.name);
  }

  private exit() {
    const dotsExit = this.dotsStart(
      this.parentGroup
        .exit()
        .select(`.${D3AreaLineClasses[this.type].dotsGroup}`)
        .selectAll<SVGCircleElement, DotsData<D>>('circle')
        .transition()
        .duration(this.transitionMs),
    ).remove();

    const pathsExit = this.pathStart(
      this.parentGroup
        .exit()
        .select(`.${D3AreaLineClasses[this.type].pathGroup}`)
        .selectAll<SVGPathElement, AreaLineData<D>>('path')
        .transition()
        .duration(this.transitionMs),
    ).remove();

    this.parentGroup
      .exit()
      .transition()
      .duration(this.transitionMs)
      .remove();
    return [pathsExit, dotsExit];
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

  private dataJoins() {
    const pathsGroup = this.parentGroup
      .select(`.${D3AreaLineClasses[this.type].pathGroup}`);

    this.paths = pathsGroup.selectAll<SVGPathElement, AreaLineData<D>>('path')
      .data((d) => [d], (d) => d.attrs.name);

    if (this.withDots) {
      const dotsGroup = this.parentGroup
        .select(`.${D3AreaLineClasses[this.type].dotsGroup}`)
        .attr('fill', (d, i) => this.getAttr(d.attrs, 'fill')(d as any, i));

      this.dots = dotsGroup.selectAll<SVGCircleElement, DotsData<D>>('circle')
        .data((dt) => dt.data.map((d) => ({ ...d, __attrs__: dt.attrs })));
    }
  }

  private enter() {
    const pathsInit = this.pathStart(
      this.paths
        .enter()
        .append('path'),
    );

    const pathsEnter = this.pathEnd(
      pathsInit
        .transition()
        .duration(this.transitionMs),
    );

    if (this.dots) {
      const dotsInit = this.dotsStart(
        this.dots
          .enter()
          .append('circle'),
      );

      const dotsEnter = this.dotsEnd(
        dotsInit
          .transition()
          .duration(this.transitionMs),
      );
      return [pathsEnter, dotsEnter];
    }
    return [pathsEnter];
  }

  private onTransitionEnd(
    ...transitions: Transition<any, any, any, any>[]
  ) {
    D3OnTransitionEnd(...transitions)({
      onResolve: () => this.update().new(),
      onReject: () => this.update().new(),
      onEmpty: () => this.update().new(),
    });
  }

  private getUpdateSelection(all?: true) {
    return all
      ? {
        paths: this.chart.chart
          .selectAll<SVGPathElement, AreaLineData<D>>(`.${D3AreaLineClasses[this.type].path}`) as PathSelection<D>,
        dots: this.chart.chart
          .selectAll<SVGCircleElement, DotsData<D>>(`.${D3AreaLineClasses[this.type].dots}`) as DotsSelection<D>,
      }
      : {
        paths: this.paths,
        dots: this.dots,
      };
  }

  update(transition?: number) {
    return {
      new: () => {
        const updtSelection = this.getUpdateSelection();
        this.pathEnd(
          updtSelection
            .paths
            .transition()
            .duration(transition ?? this.transitionMs),
        );
        if (updtSelection.dots) {
          this.dotsEnd(
            updtSelection
              .dots
              .transition()
              .duration(transition ?? this.transitionMs),
          );
        }
      },
      all: () => {
        const updtSelection = this.getUpdateSelection(true);
        this.pathEnd(
          updtSelection
            .paths
            .transition()
            .duration(transition ?? this.transitionMs),
        );
        if (updtSelection.dots) {
          this.dotsEnd(
            updtSelection
              .dots
              .transition()
              .duration(transition ?? this.transitionMs),
          );
        }
      },
    };
  }
}

export default AreaLine;

