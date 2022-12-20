import {
  select,
  Selection,
  Transition,
} from 'd3';
import { genScale } from 'lullo-utils/Math';
import { D3Classes } from '../../consts/classes';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { D3OnTransitionEnd } from '../../helpers/d3OnTransitionEnd';
import { D3Zoom } from '../../helpers/d3Zoom';
import D3ScaleOrdinal from '../../Scales/ScaleOrdinal';
import {
  D3AxedScales,
  TD3AxedScales,
} from '../../Scales/types';
import {
  D3NumberKey,
  D3NumberOrStringKey,
  D3StringKey,
  ID3CircleAttrs,
  ID3Events,
  ID3TooltipDataSingle,
} from '../../types';
import { D3FormatCrosshair } from '../helpers/formatCrosshair';
import D3Mouse from '../Mouse/D3Mouse';
import { D3GetMousePosition } from '../Mouse/helpers/getMousePosition';

import type D3Chart from '../../Chart';

export interface ID3Circle<
D extends Record<string, unknown>,
> extends ID3CircleAttrs<D>, Pick<ID3Events<D>, 'mouseMove' | 'mouseOut'> {
  chart: D3Chart
  data: D3DataCatgAndLinear<D>[],
  xScale: D3AxedScales<D>;
  yScale: D3AxedScales<D>;
  colorScale?: D3ScaleOrdinal<D>;
  colorKey?: D3NumberOrStringKey<D>,
  xKey: D3NumberOrStringKey<D>,
  yKey: D3NumberOrStringKey<D>,
  rKey?: D3NumberKey<D>,
  radiusNorm?: {max?: number, min?: number}
  dataJoinKey?: (d: D) => string;
  transitionMs?: number
  disableZoom?: boolean,
  filter?: (d: D) => boolean
  crosshair?: boolean,
  mouseOver?: (d: ID3TooltipDataSingle<D>) => void;
  formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  }
}

type CirclesSelection<D extends Record<string, unknown>> = Selection<SVGCircleElement, D3DataCatgAndLinear<D>, SVGGElement, unknown>;
type CirclesTransition<D extends Record<string, unknown>> = Transition<SVGCircleElement, D3DataCatgAndLinear<D>, SVGGElement, unknown>;

const DEFAULT_RADIUS_NORM = {
  max: 25,
  min: 5,
};

class Circle<
D extends Record<string, unknown>,
> {
  private chart: D3Chart;
  private xScale: D3AxedScales<D>;
  private yScale: D3AxedScales<D>;
  private colorScale?: D3ScaleOrdinal<D>;
  private colorKey?: D3NumberOrStringKey<D>;
  private circles!: CirclesSelection<D>;
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
    this.mouse = new D3Mouse(this.chart);
    this.mouseOut = mouseOut || (() => {});
    this.mouseMove = mouseMove || (() => {});
    this.mouseOver = mouseOver || (() => {});
    this.setData(data);
    this.pattern(data);
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

  private getPosition(v: any, scale: TD3AxedScales<D>) {
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

  private circleStart<
  T extends CirclesSelection<D>
  | CirclesTransition<D>
  >(circles: T): T {
    return (circles as CirclesSelection<D>)
      .attr('stroke-width', 0)
      .attr('fill-opacity', 0)
      .attr('clip-path', `url(#${this.chart.chartAreaClipId})`)
      .attr('class', D3Classes.chartElements.circle.circle)
      .attr('cy', (d) => this.getPosition(d[this.yKey], this.yScale.getScale()))
      .attr('cx', (d) => this.getPosition(d[this.xKey], this.xScale.getScale()))
      .attr('r', 0) as unknown as T;
  }

  private circleEnd<
  T extends CirclesSelection<D>
  | CirclesTransition<D>
  >(circles: T): T {
    return (circles as CirclesSelection<D>)
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
      }) as T;
  }

  private pattern(newData: D3DataCatgAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.setData(newData);
    this.circles = this.chart.chart
      .selectAll<SVGCircleElement, D3DataCatgAndLinear<D>>(`.${D3Classes.chartElements.circle.circle}`)
      .data(this.data, (d, i) => {
        if (this.dataJoinKey) return this.dataJoinKey(d);
        return i;
      });

    const exiting = this.exit();
    const entering = this.enter();
    this.onTransitionEnd(entering, exiting);
  }

  private setCircleEvents(circle: CirclesSelection<D>) {
    circle
      .on('mousemove', (e, d) => this.mouseMove(d))
      .on('mouseover', (e, d) => {
        const circle = select(e.currentTarget);
        circle
          .classed(D3Classes.events.hovered, true);
        const x = this.getPosition(d[this.xKey], this.xScale.getScale());
        const y = this.getPosition(d[this.yKey], this.yScale.getScale());
        this.mouseOver({
          data: d,
          position: {
            x,
            y,
          },
          attrs: {
            fill: circle.attr('fill') || undefined,
            fillOpacity: circle.attr('fill-opacity') || undefined,
            stroke: circle.attr('stroke') || undefined,
            strokeWidth: circle.attr('stroke-width') || undefined,
            strokeOpacity: circle.attr('stroke-opacity'),
            xKey: String(this.xKey),
            yKey: String(this.yKey),
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
    const circlesInit = this.circleStart(
      this.circles
        .enter()
        .append('circle'),
    );

    this.setCircleEvents(circlesInit);

    return this.circleEnd(
      circlesInit
        .transition()
        .duration(this.transitionMs),
    );
  }

  private exit() {
    const exiting = this.circleStart(
      this.circles
        .exit<D3DataCatgAndLinear<D>>()
        .transition()
        .duration(this.transitionMs),
    ).remove();

    // exiting.remove();
    return exiting;
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
      ? this.chart.chart
        .selectAll<SVGCircleElement, D3DataCatgAndLinear<D>>(`.${D3Classes.chartElements.circle.circle}`)
      : this.circles;
  }

  update(transition?: number) {
    return {
      new: () => {
        const selection = this.getUpdateSelection();
        this.circleEnd(
          selection
            .transition()
            .duration(transition ?? this.transitionMs),
        );
        this.setCircleEvents(selection);
      },
      all: () => {
        const selection = this.getUpdateSelection(true);
        this.circleEnd(
          selection
            .transition()
            .duration(transition ?? this.transitionMs),
        );
        this.setCircleEvents(selection);
      },
    };
  }
}

export default Circle;
