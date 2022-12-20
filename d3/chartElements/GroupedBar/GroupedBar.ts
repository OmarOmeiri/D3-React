import {
  ScaleBand,
  scaleBand,
  select,
  Selection,
  Transition,
} from 'd3';
import { D3Classes } from '../../consts/classes';
import { D3DataCatgTimeAndLinear } from '../../dataTypes';
import { d3AppendIfNotExists } from '../../helpers/d3Exists';
import { D3OnTransitionEnd } from '../../helpers/d3OnTransitionEnd';
import { D3Zoom } from '../../helpers/d3Zoom';
import {
  D3AxedScales,
  TD3AxedScales,
} from '../../Scales/types';
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

import type D3ScaleBand from '../../Scales/ScaleBand';
import type D3ScaleOrdinal from '../../Scales/ScaleOrdinal';
import type D3Chart from '../../Chart';

export interface ID3GroupedBarSerie<
D extends Record<string, unknown>
> extends ID3ShapeAttrs<D> {
  name: string;
  id: string,
  active: boolean,
  yKey: D3NumberKey<D>
  formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  }
}

export interface ID3GroupedBar<
D extends Record<string, unknown>,
> extends ID3ShapeAttrs<D>, Pick<ID3Events<D>, 'mouseMove' | 'mouseOut'> {
  chart: D3Chart
  data: D3DataCatgTimeAndLinear<D>[],
  xScale: D3ScaleBand<D>;
  yScale: D3AxedScales<D>;
  colorScale?: D3ScaleOrdinal<D>;
  colorKey?: D3StringKey<D>,
  groupKey: D3StringKey<D>,
  groupPadding?: number,
  transitionMs?: number
  disableZoom?: boolean,
  crosshair?: boolean,
  series: ID3GroupedBarSerie<D>[];
  filter?: (d: D) => boolean
  mouseOver?: (d: ID3TooltipDataSingle<D>) => void;
  formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  }
}

type GroupedData<D extends Record<string, unknown>> = {
  x: D3DataCatgTimeAndLinear<D>[D3StringKey<D>];
  data: {
      data: D3DataCatgTimeAndLinear<D>;
      attrs: ID3GroupedBarSerie<D>;
  }[];
}

type BarsSelection<D extends Record<string, unknown>> = Selection<SVGRectElement, GroupedData<D>['data'][number], SVGGElement, GroupedData<D>>;
type BarsTransition<D extends Record<string, unknown>> = Transition<SVGRectElement, GroupedData<D>['data'][number], SVGGElement, GroupedData<D>>;

class GroupedBar<
D extends Record<string, unknown>,
> {
  private chart: D3Chart;
  private parentGroup!: Selection<SVGGElement, unknown, null, undefined>;
  private barsGroup!: Selection<SVGGElement, GroupedData<D>, SVGGElement, unknown>;
  private xScale: D3ScaleBand<D>;
  private yScale: D3AxedScales<D>;
  private groupScale!: ScaleBand<D3NumberKey<D>>;
  private colorScale?: D3ScaleOrdinal<D>;
  private colorKey?: D3StringKey<D>;
  private bars!: BarsSelection<D>;
  private data!: GroupedData<D>[];
  private groupKey: D3StringKey<D>;
  private groups!: D3DataCatgTimeAndLinear<D>[D3StringKey<D>][];
  private subGroups!: D3NumberKey<D>[];
  private groupPadding: number;
  private series: ID3GroupedBarSerie<D>[];

  private fill: ID3ShapeAttrs<D>['fill'];
  private fillOpacity: ID3ShapeAttrs<D>['fillOpacity'];
  private stroke: ID3ShapeAttrs<D>['stroke'];
  private strokeWidth: ID3ShapeAttrs<D>['strokeWidth'];
  private strokeOpacity: ID3ShapeAttrs<D>['strokeOpacity'];
  private transitionMs: number;
  private mouse: D3Mouse;
  private disableZoom: boolean;
  private crosshair: boolean;
  private filter?: (d: D, index: number) => boolean;
  private mouseOut: Required<ID3Events<D>>['mouseOut'];
  private mouseOver: (d: ID3TooltipDataSingle<D>) => void;
  private mouseMove: Required<ID3Events<D>>['mouseMove'];
  private formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  };

  constructor({
    chart,
    data,
    series,
    xScale,
    yScale,
    colorScale,
    colorKey,
    groupKey,
    groupPadding = 0.05,
    disableZoom = false,
    crosshair = true,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    strokeOpacity,
    formatCrosshair,
    transitionMs = 200,
    filter,
    mouseOut,
    mouseMove,
    mouseOver,
  }: ID3GroupedBar<D>) {
    this.chart = chart;
    this.xScale = xScale;
    this.yScale = yScale;
    this.colorScale = colorScale;

    this.series = series.filter((s) => s.active);

    this.groupKey = groupKey;
    this.colorKey = colorKey;
    this.groupPadding = groupPadding;

    this.fill = fill || 'none';
    this.stroke = stroke || 'none';
    this.strokeOpacity = strokeOpacity || '1';
    this.fillOpacity = fillOpacity || '1';
    this.strokeWidth = strokeWidth || '0';
    this.transitionMs = transitionMs;
    this.formatCrosshair = formatCrosshair;
    this.disableZoom = disableZoom;
    this.crosshair = crosshair;
    this.mouse = new D3Mouse(this.chart);

    this.filter = filter;
    this.mouseOut = mouseOut || (() => {});
    this.mouseMove = mouseMove || (() => {});
    this.mouseOver = mouseOver || (() => {});
    this.setData(data);

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

  private setData(data: D3DataCatgTimeAndLinear<D>[]) {
    this.subGroups = this.series.map((s) => s.yKey);

    this.groups = data.map((d) => d[this.groupKey]);
    this.data = data.map((d) => ({
      x: d[this.groupKey],
      data: this.series.map((s) => ({
        data: d,
        attrs: s,
      })),
    }));

    this.groupScale = scaleBand<D3NumberKey<D>>()
      .domain(this.subGroups)
      .range([0, this.xScale.getScale().bandwidth()])
      .padding(this.groupPadding);
  }

  private getPosition(v: any, scale: TD3AxedScales<D> | ScaleBand<D3NumberKey<D>>) {
    return Number(scale(v)) + (
      'bandwidth' in scale
        ? (scale.bandwidth() / 2)
        : 0
    );
  }

  private barsStart<
  T extends BarsSelection<D>
  | BarsTransition<D>
  >(bars: T, isExit?: boolean): T {
    return (bars as BarsSelection<D>)
      .attr('class', D3Classes.chartElements.bar.bar)
      .attr('x', (d, i, nodes) => {
        if (isExit) return parseFloat(nodes[i].getAttribute('x') || '');
        return Number(this.groupScale(d.attrs.yKey));
      })
      .attr('y', this.chart.dims.innerDims.height)
      .attr('width', (_, i, nodes) => {
        if (isExit) return parseFloat(nodes[i].getAttribute('width') || '');
        return this.groupScale.bandwidth();
      })
      .attr('height', 0)
      .attr('fill', 'rgba(0, 0, 0, 0)') as T;
  }

  private barsEnd<
  T extends BarsSelection<D>
  | BarsTransition<D>
>(bars: T): T {
    return (bars as BarsSelection<D>)
      .attr('class', D3Classes.chartElements.bar.bar)
      .attr('x', (d) => Number(this.groupScale(d.attrs.yKey)))
      .attr('y', (d) => Number(this.yScale.getScale()(d.data[d.attrs.yKey])))
      .attr('width', this.groupScale.bandwidth())
      .attr('height', (d) => this.chart.dims.innerDims.height - Number(this.yScale.getScale()(d.data[d.attrs.yKey])))
      .attr('stroke', (d, i) => this.getAttr('stroke')(d, i))
      .attr('stroke-width', (d, i) => this.getAttr('strokeWidth')(d, i))
      .attr('stroke-opacity', (d, i) => this.getAttr('strokeOpacity')(d, i))
      .attr('fill', (d, i) => this.getAttr('fill')(d, i))
      .attr('fillOpacity', (d, i) => this.getAttr('fillOpacity')(d, i)) as T;
  }

  private getAttr(
    key: keyof ID3ShapeAttrs<D>,
  ): ((d: GroupedData<D>['data'][number], index: number) => string) {
    if (key === 'fill') {
      const {
        colorScale,
        colorKey,
      } = this;

      if (colorScale && colorKey) {
        return (d: GroupedData<D>['data'][number]) => String(colorScale.scale(d.attrs.id));
      }
    }

    const attr = this[key];
    if (!attr) {
      return () => '';
    }

    return typeof attr === 'function'
      ? (d: GroupedData<D>['data'][number], i: number) => attr(d.data, i)
      : () => attr;
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
        onZoom: () => { this.update(0).all(); },
      });
    }
  }

  private pattern(newData: D3DataCatgTimeAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.setData(newData);
    this.barsGroup = this.parentGroup
      .selectAll<SVGGElement, GroupedData<D>>(`.${D3Classes.chartElements.bar.barGroup}`)
      .data(this.data);
    this.enterGroups();
    this.dataJoins();
    const exiting = this.exit();
    this.enter();
    this.onTransitionEnd(exiting);
  }

  private exit() {
    const exiting = this.barsStart(
      this.bars
        .exit<GroupedData<D>['data'][number]>()
        .transition()
        .duration(this.transitionMs),
      true,
    ).remove();

    return exiting;
  }

  private enterGroups() {
    const groupEnter = this.barsGroup
      .enter()
      .append('g')
      .attr('class', D3Classes.chartElements.bar.barGroup)
      .attr('transform', (d) => (`translate(${this.xScale.getScale()(d.x)} ,0)`));

    this.barsGroup = groupEnter.merge(this.barsGroup);
  }

  private dataJoins() {
    this.bars = this.barsGroup
      .selectAll<SVGRectElement, GroupedData<D>['data'][number]>('rect')
      .data((d) => d.data, (d) => d.attrs.id);
  }

  private setBarEvents(bars: BarsSelection<D>) {
    bars
      .on('mouseenter', (e, d) => {
        const bar = select(e.currentTarget);
        bar
          .classed(D3Classes.events.hovered, true);
        const x = Number(this.xScale.getScale()(d.data[this.groupKey]))
        + this.getPosition(d.attrs.yKey, this.groupScale);
        const y = this.getPosition(d.data[d.attrs.yKey], this.yScale.getScale());
        this.mouseOver({
          data: d.data,
          position: {
            x,
            y,
          },
          attrs: {
            name: String(d.attrs.name),
            fill: bar.attr('fill') || undefined,
            fillOpacity: bar.attr('fill-opacity') || undefined,
            stroke: bar.attr('stroke') || undefined,
            strokeWidth: bar.attr('stroke-width') || undefined,
            strokeOpacity: bar.attr('stroke-opacity'),
            yKey: String(d.attrs.yKey),
            xKey: d.data[this.groupKey],
          },
        });
      })
      .on('mouseout', (e) => {
        select(e.currentTarget)
          .classed(D3Classes.events.hovered, false);
        this.mouseOut();
      });
  }

  private enter() {
    const barsInit = this.barsStart(
      this.bars
        .enter()
        .append('rect'),
    );

    this.setBarEvents(
      barsInit,
    );

    this.barsEnd(
      barsInit
        .transition()
        .duration(this.transitionMs),
    );
    this.update().new();
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

  private getUpdateSelection(all?: boolean) {
    return all
      ? {
        bars: this.chart.chart
          .selectAll<SVGRectElement, GroupedData<D>['data'][number]>(`.${D3Classes.chartElements.bar.bar}`),
        groups: this.parentGroup
          .selectAll<SVGGElement, GroupedData<D>>(`.${D3Classes.chartElements.bar.barGroup}`),
      }
      : {
        bars: this.bars,
        groups: this.barsGroup,
      };
  }

  update(transition?: number) {
    this.groupScale = scaleBand<D3NumberKey<D>>()
      .domain(this.subGroups)
      .range([0, this.xScale.getScale().bandwidth()])
      .padding(this.groupPadding);

    return {
      new: () => {
        const selection = this.getUpdateSelection();
        this.barsEnd(
          selection
            .bars
            .transition()
            .duration(transition ?? this.transitionMs),
        );

        selection
          .groups
          .transition()
          .duration(transition ?? this.transitionMs)
          .attr('transform', (d) => (`translate(${this.xScale.getScale()(d.x)} ,0)`));

        this.setBarEvents(selection.bars);
      },
      all: () => {
        const selection = this.getUpdateSelection(true);
        this.barsEnd(
          selection
            .bars
            .transition()
            .duration(transition ?? this.transitionMs),
        );
        selection
          .groups
          .transition()
          .duration(transition ?? this.transitionMs)
          .attr('transform', (d) => (`translate(${this.xScale.getScale()(d.x)} ,0)`));

        this.setBarEvents(selection.bars);
      },
    };
  }
}

export default GroupedBar;
