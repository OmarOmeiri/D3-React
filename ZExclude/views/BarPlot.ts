import {
  select,
  Selection,
} from 'd3';
import React from 'react';
import D3Axis from '../Axes/Axis';
import Bar from '../chartElements/Bar/Bar';
import { D3DataCatgAndLinear } from '../dataTypes';
import { D3Dimensions } from '../Dimensions';
import { ID3Dimensions } from '../Dimensions/Dimensions';
import { D3ScaleLinear } from '../Scales';
import D3ScaleBand from '../Scales/ScaleBand';
import { D3Domain } from '../Scales/types';

export interface ID3Bar<
D extends Record<string, unknown>,
CatgKey extends KeysOfType<D, string>,
NumKey extends KeysOfType<D, number>
> {
  ref: HTMLElement,
  data: D3DataCatgAndLinear<D, CatgKey, NumKey>[];
  xKey: CatgKey,
  yKey: NumKey,
}

const xScaleParams = <
  D extends Record<string, unknown>,
  CatgKey extends KeysOfType<D, string>,
  NumKey extends KeysOfType<D, number>
>(
    data: D3DataCatgAndLinear<D, CatgKey, NumKey>[],
    key: CatgKey,
    dims: D3Dimensions,
  ) => ({
    data,
    key,
    range: [0, dims.innerDims.width] as [number, number],
    padding: {
      inner: 0.3,
      outer: 0.5,
    },
  });

const yScaleParams = <
  D extends Record<string, unknown>,
  CatgKey extends KeysOfType<D, string>,
  NumKey extends KeysOfType<D, number>
>(
    data: D3DataCatgAndLinear<D, CatgKey, NumKey>[],
    key: NumKey,
    dims: D3Dimensions,
  ) => ({
    data,
    key,
    domain: [0, 'dataMax'] as [number, D3Domain],
    range: [dims.innerDims.height, 0] as [number, number],
  });

class D3Bar<
D extends Record<string, unknown>,
CatgKey extends KeysOfType<D, string>,
NumKey extends KeysOfType<D, number>
> {
  private data!: D3DataCatgAndLinear<D, CatgKey, NumKey>[];
  private xKey: CatgKey;
  private yKey: NumKey;
  private svg: Selection<SVGSVGElement, unknown, null, undefined>;
  private chart!: Selection<SVGGElement, unknown, null, undefined>;
  private bar!: Bar<D, CatgKey, NumKey>;
  public dims!: D3Dimensions;
  private xScale!: D3ScaleBand<D, CatgKey>;
  private yScale!: D3ScaleLinear<D, NumKey>;
  private xAxis!: D3Axis;
  private yAxis!: D3Axis;

  constructor({
    ref,
    data,
    xKey,
    yKey,
  }: ID3Bar<D, CatgKey, NumKey>) {
    const hasSvg = select(ref)
      .select('svg').size();

    if (!hasSvg) {
      this.svg = select(ref)
        .append('svg');
    } else {
      this.svg = select(ref)
        .select('svg');
    }
    this.svg.attr('width', '100%').attr('height', '100%');
    this.data = data;
    this.xKey = xKey;
    this.yKey = yKey;
  }

  set keys({
    xKey,
    yKey,
  }: {
    xKey?: CatgKey,
    yKey?: NumKey
  }) {
    if (xKey) this.xKey = xKey;
    if (yKey) this.yKey = yKey;
    if (xKey || yKey) {
      this.bar.keys = {
        xKey,
        yKey,
      };
      this.updateData(this.data);
    }
  }

  init(dims: ID3Dimensions) {
    this.dims = new D3Dimensions(dims);
    this.chart = this.svg.append('g');
    this.chart.attr('transform', `translate(${this.dims.margin.left}, ${this.dims.margin.top})`);

    this.xScale = new D3ScaleBand(xScaleParams(
      this.data,
      this.xKey,
      this.dims,
    ));

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

    this.bar = new Bar({
      chart: this.chart,
      data: this.data,
      xScale: this.xScale,
      yScale: this.yScale,
      xKey: this.xKey,
      yKey: this.yKey,
    });
  }

  updateData(data: D3DataCatgAndLinear<D, CatgKey, NumKey>[]) {
    this.data = data;
    this.bar.updateData(this.data);
    this.updateAxes();
  }

  updateAxes() {
    this.xScale.updateScale(xScaleParams(
      this.data,
      this.xKey,
      this.dims,
    ));
    this.yScale.updateScale(yScaleParams(
      this.data,
      this.yKey,
      this.dims,
    ));
    this.xAxis.updateAxis(this.xScale, this.dims);
    this.yAxis.updateAxis(this.yScale, this.dims);
    this.bar.updateScales({
      x: this.xScale,
      y: this.yScale,
    });
  }

  updateDims(dims: DOMRectReadOnly) {
    if (dims) this.dims.setDims(dims);
    this.updateAxes();
  }
}

export default D3Bar;
