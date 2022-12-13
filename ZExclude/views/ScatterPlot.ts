import {
  select,
  Selection,
} from 'd3';
import React from 'react';
import D3Axis from '../Axes/Axis';
import Circle from '../chartElements/Circle';
import { D3DataLinear } from '../dataTypes';
import { D3Dimensions } from '../Dimensions';
import { ID3Dimensions } from '../Dimensions/Dimensions';
import { D3ScaleLinear } from '../Scales';

const xScaleParams = (
  dims: D3Dimensions,
) => ({
  domain: [0, 100] as [number, number],
  range: [0, dims.innerDims.width] as [number, number],
});

const yScaleParams = <
D extends Record<string, unknown>,
K extends KeysOfType<D, number>
>(
    data: D3DataLinear<D, K>[],
    key: K,
    dims: D3Dimensions,
  ) => ({
    data,
    key,
    domain: [0, 50] as [number, number], // ['dataMin-5%', 'dataMax+5%'],
    range: [dims.innerDims.height, 0] as [number, number],
  });

export interface ID3Scatter<
D extends Record<string, unknown>,
K extends KeysOfType<D, number>
> {
  ref: React.MutableRefObject<HTMLElement | null>,
  data: D3DataLinear<D, K>[],
  xKey: K,
  yKey: K,
  rKey: K,
}

class D3Scatter<
D extends Record<string, unknown>,
K extends KeysOfType<D, number>
> {
  private data!: D3DataLinear<D, K>[];
  private xKey: K;
  private yKey: K;
  private rKey: K;
  private svg: Selection<SVGSVGElement, unknown, null, undefined>;
  private chart!: Selection<SVGGElement, unknown, null, undefined>;
  private circle!: Circle<D, K>;
  public dims!: D3Dimensions;
  private xScale!: D3ScaleLinear<D, K>;
  private yScale!: D3ScaleLinear<D, K>;
  private xAxis!: D3Axis;
  private yAxis!: D3Axis;

  constructor({
    ref,
    data,
    xKey,
    yKey,
    rKey,
  }: ID3Scatter<D, K>) {
    const hasSvg = select(ref.current)
      .select('svg').size();

    if (!hasSvg) {
      this.svg = select(ref.current)
        .append('svg');
    } else {
      this.svg = select(ref.current)
        .select('svg');
    }
    this.svg.attr('width', '100%').attr('height', '100%');
    this.data = data;
    this.xKey = xKey;
    this.yKey = yKey;
    this.rKey = rKey;
  }

  init(dims: ID3Dimensions) {
    this.dims = new D3Dimensions(dims);
    this.chart = this.svg.append('g');
    this.chart.attr('transform', `translate(${this.dims.margin.left}, ${this.dims.margin.top})`);
    this.xScale = new D3ScaleLinear(xScaleParams(this.dims));

    this.yScale = new D3ScaleLinear(yScaleParams(
      this.data,
      this.yKey,
      this.dims,
    ));

    this.xAxis = new D3Axis({
      parent: this.chart,
      scale: this.xScale,
      dims: this.dims,
      type: 'bottom',
    });

    this.yAxis = new D3Axis({
      parent: this.chart,
      scale: this.yScale,
      dims: this.dims,
      type: 'left',
    });

    this.circle = new Circle({
      chart: this.chart,
      data: this.data,
      xScale: this.xScale,
      yScale: this.yScale,
      xKey: this.xKey,
      yKey: this.yKey,
      rKey: this.rKey,
    });
  }

  updateData(data: D3DataLinear<D, K>[]) {
    this.data = data;
    this.circle.updateData(this.data);
    this.updateAxes();
  }

  updateAxes() {
    this.xScale.updateScale(xScaleParams(this.dims));
    this.yScale.updateScale(yScaleParams(
      this.data,
      this.yKey,
      this.dims,
    ));
    this.xAxis.updateAxis(this.xScale, this.dims);
    this.yAxis.updateAxis(this.yScale, this.dims);
    this.circle.updateScales({
      x: this.xScale,
      y: this.yScale,
    });
  }

  updateDims(dims: DOMRectReadOnly) {
    if (dims) this.dims.setDims(dims);
    this.updateAxes();
  }
}

export default D3Scatter;
