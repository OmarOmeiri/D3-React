import {
  area,
  curveCatmullRom,
  scaleLinear,
  ScaleLinear,
  Selection,
  zoom as D3Zoom,
} from 'd3';
import { D3Classes } from '../../consts/classes';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { d3AppendIfNotExists } from '../../helpers/d3Exists';
import { D3ZoomHelper } from '../../helpers/d3Zoom';
import { D3ScaleLinear } from '../../Scales';
import D3ScaleBand from '../../Scales/ScaleBand';
import {
  D3NumberKey,
  ID3ShapeAttrs,
} from '../../types';
import { D3FormatCrosshair } from '../helpers/formatCrosshair';
import { D3GetMousePosition } from '../Mouse/getMousePosition';
import D3MouseRect from '../Mouse/MouseRect';
import KDE from './helpers/kde';

import type D3Chart from '../../Chart';

export interface ID3ViolinSerie<
D extends Record<string, unknown>
> {
  yKey: D3NumberKey<D>,
  name: string;
  active?: boolean,
  filterFn?: (value: D, i: number) => boolean,
  fill?: string | ((d: BinnedData<D>[number], index: number) => string);
  fillOpacity?: string | ((d: BinnedData<D>[number], index: number) => string);
  stroke?: string | ((d: BinnedData<D>[number], index: number) => string);
  strokeWidth?: string | ((d: BinnedData<D>[number], index: number) => string);
  strokeOpacity?: string | ((d: BinnedData<D>[number], index: number) => string);
  formatCrosshair?: {
    x?: (val: string | number | Date) => string
    y?: (val: string | number | Date) => string
  }
}

type BinnedData<D extends Record<string, unknown>> = {
  attrs: ID3ViolinSerie<D>
  bins: [number, number][];
}[]

const getBins = (
  yScale: ScaleLinear<number, number, never>,
  data: number[],
) => {
  let maxNum = 0;
  const kde = KDE(0.2, yScale.ticks(50));
  const bins = kde(data);
  maxNum = Math.max(maxNum, ...bins.map((v) => v[1]));
  return {
    bins,
    maxNum,
  };
};

const DEFAULT_VIOLIN_ATTRS: Partial<Record<keyof ID3ShapeAttrs<any>, string>> = {
  fill: 'purple',
  fillOpacity: '1',
  strokeWidth: '1',
  strokeOpacity: '1',
};

export interface ID3Violin<
D extends Record<string, unknown>,
> {
  chart: D3Chart,
  data: D3DataCatgAndLinear<D>[],
  xScale: D3ScaleBand<D>,
  yScale: D3ScaleLinear<D>,
  filter?: (d: D, i: number) => boolean
  series: ID3ViolinSerie<D>[],
  transitionMs?: number,
  disableZoom?: boolean,
  crosshair?: boolean
}

class Violin<
D extends Record<string, unknown>,
> {
  private chart: D3Chart;
  private xScale: D3ScaleBand<D>;
  private xScaleNum!: ScaleLinear<number, number, never>;
  private yScale: D3ScaleLinear<D>;
  private group!: Selection<SVGGElement, BinnedData<D>[number], SVGGElement, unknown>;
  private parentGroup!: Selection<SVGGElement, unknown, null, undefined>;
  private violin!: Selection<SVGPathElement, BinnedData<D>[number], SVGGElement, BinnedData<D>[number]>;
  private data: D3DataCatgAndLinear<D>[];
  private bins!: BinnedData<D>;
  private filter?: (d: D, index: number) => boolean;
  private series: ID3ViolinSerie<D>[];
  private mouseRect: D3MouseRect;
  private transitionMs: number;
  private disableZoom: boolean;
  private crosshair: boolean;
  private binsMax!: number;

  constructor({
    chart,
    data,
    xScale,
    yScale,
    series,
    transitionMs = 150,
    disableZoom = false,
    crosshair = true,
    filter,
  }: ID3Violin<D>) {
    this.chart = chart;
    this.series = series;
    this.xScale = xScale;
    this.yScale = yScale;
    this.data = data;
    this.transitionMs = transitionMs;
    this.disableZoom = disableZoom;
    this.crosshair = crosshair;
    this.filter = filter;
    this.mouseRect = new D3MouseRect(this.chart);

    this.parentGroup = d3AppendIfNotExists(
      this.chart.chart
        .select<SVGGElement>(`.${D3Classes.chartElements.violin.allViolinsGroup}`),
      () => this.chart.chart
        .append('g')
        .attr('class', D3Classes.chartElements.violin.allViolinsGroup)
        .attr('clip-path', `url(#${this.chart.chartAreaClipId})`),
    );

    this.update(data);
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
        const xScaled = Number(this.xScale.getScale()(xVal)) + (this.xScale.getScale().bandwidth() / 2);
        const yScaled = Number(this.yScale.getScale()(yVal));
        mouseCallback(xScaled, yScaled);

        this.mouseRect.setCrosshairText(
          D3FormatCrosshair(xVal),
          D3FormatCrosshair(yVal),
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
          this.updateScales();
        });

      this.chart.svg
        .call(zoom);
    }
  }

  setData(data: D3DataCatgAndLinear<D>[]) {
    this.data = data;

    const filteredData = (
      this.filter ? data.filter(this.filter) : data
    );
    this.binsMax = -Infinity;
    this.bins = this.series.reduce((d, s) => {
      const dt = (
        s.filterFn
          ? filteredData.filter(s.filterFn)
          : filteredData
      ).map((d) => (d[s.yKey]));
      const { bins, maxNum } = getBins(
        this.yScale.getScale(),
        dt,
      );
      this.binsMax = Math.max(this.binsMax, maxNum);
      return ([
        ...d,
        {
          bins,
          attrs: s,
        },
      ]);
    }, [] as BinnedData<D>);

    this.xScaleNum = scaleLinear()
      .domain([-this.binsMax, this.binsMax])
      .range([0, this.xScale.getScale().bandwidth()]);
  }

  private getAttr(
    attrs: BinnedData<D>[number]['attrs'],
    key: keyof ID3ShapeAttrs<D>,
  ): ((d: BinnedData<D>[number], index: number) => string) {
    const attr = key === 'fill' && !attrs.fill
      ? attrs.stroke
      : attrs[key];
    if (!attr) {
      return () => DEFAULT_VIOLIN_ATTRS[key] || '';
    }

    return typeof attr === 'function'
      ? (d: BinnedData<D>[number], i: number) => attr(d, i)
      : () => attr;
  }

  update(data: D3DataCatgAndLinear<D>[]) {
    this.mouseEventHandlers();
    this.setData(data);

    this.updateGroups();
    this.exitGroups();
    this.enterGroups();
    this.updatePaths();
    this.exitPaths();
    this.enterPaths();
  }

  updateGroups() {
    this.group = this.parentGroup
      .selectAll<SVGGElement, BinnedData<D>>(`.${D3Classes.chartElements.violin.violinGroup}`)
      .data(this.bins, (d) => (d as BinnedData<D>[number]).attrs.name);
  }

  exitGroups() {
    this.group
      .exit()
      .selectAll(`.${D3Classes.chartElements.violin.violinGroup}`)
      .transition()
      .duration(this.transitionMs)
      .attr('opacity', 0);

    this.group
      .exit()
      .transition()
      .duration(this.transitionMs)
      .remove();
  }

  enterGroups() {
    const groupEnter = this.group
      .enter()
      .append('g')
      .attr('class', D3Classes.chartElements.violin.violinGroup)
      .attr('transform', (d) => (`translate(${this.xScale.getScale()(d.attrs.name)} ,0)`));
    this.group = groupEnter.merge(this.group);
  }

  updatePaths() {
    this.violin = this.group
      .selectAll<SVGPathElement, BinnedData<D>>(`.${D3Classes.chartElements.violin.violin}`)
      .data((d) => [d], (d) => (d as BinnedData<D>[number]).attrs.name);

    this.violin
      .attr('class', D3Classes.chartElements.violin.violin)
      .transition()
      .duration(this.transitionMs)
      .attr('d', (d) => (
        area()
          .x0(() => (this.xScale.getScale().bandwidth() / 2))
          .x1(() => (this.xScale.getScale().bandwidth() / 2))
          .y((d) => this.yScale.getScale()(d[0]))
          .curve(curveCatmullRom)(d.bins)
      ))
      .transition()
      .duration(this.transitionMs)
      .attr('stroke', (d, i) => this.getAttr(d.attrs, 'stroke')(d, i))
      .attr('stroke-width', (d, i) => this.getAttr(d.attrs, 'strokeWidth')(d, i))
      .attr('stroke-opacity', (d, i) => this.getAttr(d.attrs, 'strokeOpacity')(d, i))
      .attr('fill', (d, i) => this.getAttr(d.attrs, 'fill')(d, i))
      .attr('fill-opacity', (d, i) => this.getAttr(d.attrs, 'fillOpacity')(d, i))
      .attr('d', (d) => (
        area()
          .x0((d) => (this.xScaleNum(-d[1])))
          .x1((d) => (this.xScaleNum(d[1])))
          .y((d) => (this.yScale.getScale()(d[0])))
          .curve(curveCatmullRom)(d.bins)
      ));
  }

  exitPaths() {
    this.violin
      .exit()
      .transition()
      .duration(this.transitionMs)
      .attr('opacity', 0)
      .remove();
  }

  enterPaths() {
    this.violin
      .enter()
      .append('path')
      .attr('class', D3Classes.chartElements.violin.violin)
      .transition()
      .duration(this.transitionMs)
      .attr('stroke', (d, i) => this.getAttr(d.attrs, 'stroke')(d, i))
      .attr('stroke-width', (d, i) => this.getAttr(d.attrs, 'strokeWidth')(d, i))
      .attr('stroke-opacity', (d, i) => this.getAttr(d.attrs, 'strokeOpacity')(d, i))
      .attr('fill', (d, i) => this.getAttr(d.attrs, 'fill')(d, i))
      .attr('fill-opacity', (d, i) => this.getAttr(d.attrs, 'fillOpacity')(d, i))
      .attr('d', (d) => (
        area()
          .x0((d) => (this.xScaleNum(-d[1])))
          .x1((d) => (this.xScaleNum(d[1])))
          .y((d) => (this.yScale.getScale()(d[0])))
          .curve(curveCatmullRom)(d.bins)
      ));
  }

  updateScales() {
    this.xScaleNum = scaleLinear()
      .domain([-this.binsMax, this.binsMax])
      .range([0, this.xScale.getScale().bandwidth()]);

    this.parentGroup
      .selectAll<SVGPathElement, BinnedData<D>[number]>(`.${D3Classes.chartElements.violin.violin}`)
      .attr('d', (d) => (
        area()
          .x0((d) => (this.xScaleNum(-d[1])))
          .x1((d) => (this.xScaleNum(d[1])))
          .y((d) => (this.yScale.getScale()(d[0])))
          .curve(curveCatmullRom)(d.bins)
      ));

    this.parentGroup
      .selectAll<SVGGElement, BinnedData<D>[number]>(`.${D3Classes.chartElements.violin.violinGroup}`)
      .attr('transform', (d) => (`translate(${this.xScale.getScale()(d.attrs.name)} ,0)`));
  }
}

export default Violin;
