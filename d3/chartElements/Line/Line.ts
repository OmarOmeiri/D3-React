import {
  BaseType,
  curveCatmullRom,
  line,
  pointer,
  Selection,
  zoom as D3Zoom,
} from 'd3';
import dayjs from 'dayjs';
import { merge } from 'lodash';
import { D3Classes } from '../../consts/classes';
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
  ID3AllAttrs,
  ID3Attrs,
  ID3Events,
  ID3TooltipData,
} from '../../types';
import D3MouseRect from '../Mouse/MouseRect';

import type D3Chart from '../../Chart';

export interface ID3LineSerie<
D extends Record<string, unknown>
> extends ID3Attrs<D> {
  xKey: D3NumberStringOrDateKey<D>,
  yKey: D3NumberOrStringKey<D>,
  name: string;
}

type LineScales<
D extends Record<string, unknown>,
> =
| D3ScaleLinear<D>
| D3ScaleBand<D>
| D3ScaleLog<D>
| D3ScaleTime<D>

type D3LineScales<
D extends Record<string, unknown>,
> =
| D3ScaleLinear<D>['scale']
| D3ScaleBand<D>['scale']
| D3ScaleLog<D>['scale']
| D3ScaleTime<D>['scale']

export interface ID3Line<
D extends Record<string, unknown>,
> extends ID3Events<D, D, ID3TooltipData<D>> {
  chart: D3Chart
  data: D3DataCatgAndLinear<D>[],
  xScale: LineScales<D>;
  yScale: LineScales<D>;
  alpha?: number;
  transitionMs?: number
  filter?: (d: D) => boolean
  series: ID3LineSerie<D>[]
  withDots?: boolean,
}

type DotsSelection<
D extends Record<string, unknown>,
> = D3DataCatgAndLinear<D> & {
  __attrs__: ID3LineSerie<D>;
}

type LineData<
D extends Record<string, unknown>,
> = {
  data: D3DataCatgAndLinear<D>[]
  attrs: ID3LineSerie<D>
}

const DEFAULT_LINE_ATTRS: Record<keyof ID3Attrs<any>, string> = {
  stroke: 'black',
  strokeWidth: '2',
  strokeOpacity: '1',
};

const getTooltipAttributes = <D extends Record<string, unknown>>(
  d: D3DataCatgAndLinear<D>,
  i: number,
  attrs: ID3LineSerie<D>,
) => Object.fromEntries(
  (Object.entries(attrs) as Entries<Required<ID3LineSerie<D>>>)
    .map(([k, v]) => {
      if (typeof v === 'function') return [k, v(d, i)];
      return [k, v];
    }),
) as {[A in keyof ID3AllAttrs<D>]?: string};

let tooltipTimeout: NodeJS.Timeout | null = null;
const filterTooltipValues = <D extends Record<string, unknown>>(
  data: LineData<D>[],
  xVal: string | number | Date | null,
): ID3TooltipData<D> | undefined => {
  if (!tooltipTimeout) {
    const tooltipData = data.reduce((merged, dt) => {
      const dataWithAttributes = dt.data.reduce((values, d, i) => {
        let isMatch = false;
        if (typeof xVal === 'object' && (xVal as any).getTime) {
          isMatch = dayjs(d[dt.attrs.xKey]).isSame(xVal, 'day');
        } else {
          isMatch = d[dt.attrs.xKey] === xVal;
        }

        if (!isMatch) return values;
        return {
          data: {
            ...values.data,
            ...d,
          },
          attrs: {
            ...values.attrs,
            [dt.attrs.yKey]: {
              ...DEFAULT_LINE_ATTRS,
              ...getTooltipAttributes(d, i, dt.attrs),
            },
          },
        };
      }, {} as ID3TooltipData<D>);

      return {
        data: {
          ...merged.data,
          ...dataWithAttributes.data,
        },
        attrs: {
          ...merged.attrs,
          ...dataWithAttributes.attrs,
        },
      };
    }, {} as ID3TooltipData<D>);

    tooltipTimeout = setTimeout(() => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
      tooltipTimeout = null;
    }, 100);
    return tooltipData;
  }
};

class Line<
D extends Record<string, unknown>,
> {
  private chart: D3Chart;
  private xScale: LineScales<D>;
  private yScale: LineScales<D>;
  private parentGroup!: Selection<SVGGElement, LineData<D>, SVGGElement, unknown>;
  private lines!: Selection<SVGPathElement, LineData<D>, BaseType, LineData<D>>;
  private data!: LineData<D>[];
  private dots?: Selection<SVGCircleElement, DotsSelection<D>, BaseType, LineData<D>>;
  private series: ID3LineSerie<D>[];
  private alpha: number;
  private transitionMs: number;
  private tooltipIndex: number | string | Date | null = null;
  private filter?: (d: D, index: number) => boolean;
  private mouseOut: Required<ID3Events<D>>['mouseOut'];
  private mouseOver: Required<ID3Events<D>>['mouseOver'];
  private mouseMove: Required<ID3Events<D, D, ID3TooltipData<D>>>['mouseMove'];
  private mouseRect: D3MouseRect;
  private withDots: boolean;

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
    mouseOut,
    mouseMove,
    mouseOver,
  }: ID3Line<D>) {
    this.chart = chart;
    this.mouseRect = new D3MouseRect(this.chart);
    this.xScale = xScale;
    this.yScale = yScale;

    this.series = series;
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
    attrs: LineData<D>['attrs'],
    key: keyof ID3Attrs<D>,
  ): ((d: D3DataCatgAndLinear<D>, index: number) => string) {
    const attr = attrs[key];
    if (!attr) {
      return () => DEFAULT_LINE_ATTRS[key];
    }

    return typeof attr === 'function'
      ? (d: D3DataCatgAndLinear<D>, i: number) => attr(d, i)
      : () => attr;
  }

  private getPosition(v: any, scale: D3LineScales<D>) {
    return Number(scale(v)) + (
      'bandwidth' in scale
        ? (scale.bandwidth() / 2)
        : 0
    );
  }

  private lineGenerator(d: LineData<D>, scales: {x?: D3LineScales<D>, y?: D3LineScales<D>} = {}) {
    return line<LineData<D>['data'][number]>()
      .defined((l) => D3Defined(l[d.attrs.xKey]) && D3Defined(l[d.attrs.yKey]))
      .x((xd) => this.getPosition(xd[d.attrs.xKey], scales.x || this.xScale.getScale()))
      .y((yd) => this.getPosition(yd[d.attrs.yKey], scales.y || this.yScale.getScale()))
      .curve(curveCatmullRom.alpha(this.alpha))(d.data);
  }

  private mouseEventHandlers() {
    this.mouseRect.appendMouseRect({
      mouseOut: () => {
        this.chart.chart
          .select(`.${D3Classes.events.mouseVerticalLine}`)
          .style('opacity', '0');
        this.mouseOut();
      },
      mouseOver: (e) => {
        this.chart.chart
          .select(`.${D3Classes.events.mouseVerticalLine}`)
          .style('opacity', '1');
        this.mouseOver(e);
      },
      mouseMove: (e) => {
        const [x] = pointer(e);
        const xVal = this.xScale.invert(x);
        const lineXPos = this.getPosition(xVal, this.xScale.getScale());

        this.chart.chart
          .select(`.${D3Classes.events.mouseVerticalLine}`)
          .attr('x1', lineXPos)
          .attr('y1', 0)
          .attr('x2', lineXPos)
          .attr('y2', this.chart.dims.innerDims.height);
        if (this.tooltipIndex === xVal) return;
        if (this.tooltipIndex !== xVal) {
          this.tooltipIndex = xVal;
          const tooltipData = filterTooltipValues(this.data, xVal);
          if (tooltipData) this.mouseMove(tooltipData);
        }
      },
    });

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
        this.updateScales();
      });

    this.mouseRect.mouseG
      .call(zoom);
  }

  private linesStart(lines: typeof this.lines) {
    return lines
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`)
      .attr('class', D3Classes.chartElements.line.line)
      .attr('stroke-width', 0)
      .attr('stroke', (d, i) => this.getAttr(d.attrs, 'stroke')(d as any, i))
      .attr('fill', 'none')
      .attr('d', (d) => this.lineGenerator(d));
  }

  private linesEnd(lines: typeof this.lines) {
    return lines
      .attr('stroke-width', (d, i) => this.getAttr(d.attrs, 'strokeWidth')(d as any, i));
  }

  private dotsStart(dots: Exclude<typeof this.dots, undefined>) {
    return dots
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`)
      .attr('r', 0)
      .attr('class', D3Classes.chartElements.line.lineDot)
      .attr('cx', (xd) => this.getPosition(xd[xd.__attrs__.xKey], this.xScale.getScale()))
      .attr('cy', (yd) => this.getPosition(yd[yd.__attrs__.yKey], this.yScale.getScale()));
  }

  private dotsEnd(dots: Exclude<typeof this.dots, undefined>) {
    return dots
      .attr('r', 4);
  }

  update(newData: D3DataCatgAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.setData(newData);
    this.updateGroups();
    this.exitGroups();
    this.enterGroups();
    this.updateLines();
    this.updateDots();
    this.exitLines();
    this.exitDots();
    this.enterLines();
    this.enterDots();
  }

  updateGroups() {
    this.parentGroup = this.chart.chart
      .selectAll(`.${D3Classes.chartElements.line.lines}`)
      .data(this.data, (_d) => {
        const d = _d as LineData<D>;
        return d.attrs.name;
      }) as unknown as typeof this.parentGroup;
  }

  exitGroups() {
    this.dotsStart(
      this.parentGroup
        .exit()
        .select(`.${D3Classes.chartElements.line.lineDotGroup}`)
        .selectAll<SVGCircleElement, DotsSelection<D>>('circle')
        .transition()
        .duration(this.transitionMs) as unknown as Exclude<typeof this.dots, undefined>,
    );

    this.linesStart(
      this.parentGroup
        .exit()
        .select(`.${D3Classes.chartElements.line.lineGroup}`)
        .selectAll<SVGPathElement, LineData<D>>('path')
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.lines,
    );

    this.parentGroup
      .exit()
      .transition()
      .duration(this.transitionMs)
      .remove();
  }

  enterGroups() {
    const parentEnter = this.parentGroup
      .enter()
      .append('g')
      .attr('class', D3Classes.chartElements.line.lines);

    parentEnter.append('g')
      .attr('class', D3Classes.chartElements.line.lineGroup);

    parentEnter.append('g')
      .attr('class', D3Classes.chartElements.line.lineDotGroup);

    this.parentGroup = parentEnter.merge(this.parentGroup);
  }

  updateLines() {
    const linesGroup = this.parentGroup
      .select(`.${D3Classes.chartElements.line.lineGroup}`);

    this.lines = linesGroup.selectAll<SVGPathElement, LineData<D>>('path')
      .data((d) => [d], (_d) => {
        const d = _d as LineData<D>;
        return d.attrs.name;
      });
  }

  updateDots() {
    if (this.withDots) {
      const dotsGroup = this.parentGroup
        .select(`.${D3Classes.chartElements.line.lineDotGroup}`)
        .attr('fill', (d, i) => this.getAttr(d.attrs, 'stroke')(d as any, i));

      this.dots = dotsGroup.selectAll<SVGCircleElement, DotsSelection<D>>('circle')
        .data((dt) => dt.data.map((d) => ({ ...d, __attrs__: dt.attrs })));
    }
  }

  exitLines() {
    this.linesStart(
      this.lines
        .exit()
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.lines,
    ).remove();
  }

  exitDots() {
    if (this.dots) {
      this.dotsStart(
        this.dots
          .exit<DotsSelection<D>>()
          .transition()
          .duration(this.transitionMs) as unknown as typeof this.dots,
      ).remove();
    }
  }

  enterLines() {
    const linesInit = this.linesStart(
      this.lines
        .enter()
        .append('path'),
    );

    this.linesEnd(
      linesInit
        .transition()
        .duration(this.transitionMs) as unknown as typeof this.lines,
    );
  }

  enterDots() {
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
    x?: D3LineScales<D>;
    y?: D3LineScales<D>;
  } = {}) {
    this.chart.chart
      .selectAll<SVGPathElement, LineData<D>>(`.${D3Classes.chartElements.line.line}`)
      .attr('fill', 'none')
      .attr('stroke-width', (d, i) => this.getAttr(d.attrs, 'strokeWidth')(d as any, i))
      .attr('stroke', (d, i) => this.getAttr(d.attrs, 'stroke')(d as any, i))
      .attr('d', (d) => this.lineGenerator(d, { x, y }));

    if (this.dots) {
      this.chart.chart
        .selectAll<SVGCircleElement, DotsSelection<D>>(`.${D3Classes.chartElements.line.lineDot}`)
        .attr('r', 4)
        .attr('cx', (xd) => this.getPosition(xd[xd.__attrs__.xKey], x || this.xScale.getScale()))
        .attr('cy', (yd) => this.getPosition(yd[yd.__attrs__.yKey], y || this.yScale.getScale()));
    }

    this.mouseRect.updateRect();
  }
}

export default Line;
