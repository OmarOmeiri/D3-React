import {
  BaseType,
  Selection,
} from 'd3';
import { D3Classes } from '../../consts/classes';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { D3ScaleLinear } from '../../Scales';
import D3ScaleBand from '../../Scales/ScaleBand';
import {
  D3NumberKey,
  D3StringKey,
} from '../../types';

export interface ID3Bar<
D extends Record<string, unknown>,
> {
  chart: Selection<SVGGElement, unknown, null, undefined>
  data: D3DataCatgAndLinear<D>[],
  xScale: D3ScaleBand<D>,
  yScale: D3ScaleLinear<D>,
  xKey: D3StringKey<D>,
  yKey: D3NumberKey<D>,
  dataJoinKey?: keyof D | (keyof D)[]
}

class Bar<
D extends Record<string, unknown>,
> {
  private chart: Selection<SVGGElement, unknown, null, undefined>;
  private xScale: D3ScaleBand<D>;
  private yScale: D3ScaleLinear<D>;
  private bars!: Selection<BaseType, D3DataCatgAndLinear<D>, SVGGElement, unknown>;
  private data: D3DataCatgAndLinear<D>[];
  private yKey: D3NumberKey<D>;
  private xKey: D3StringKey<D>;
  private dataJoinKey?: (keyof D)[];

  constructor({
    chart,
    data,
    xScale,
    yScale,
    xKey,
    yKey,
    dataJoinKey,
  }: ID3Bar<D>) {
    this.chart = chart;
    this.xScale = xScale;
    this.yScale = yScale;
    this.yKey = yKey;
    this.xKey = xKey;
    this.data = data;
    this.dataJoinKey = dataJoinKey
      ? [dataJoinKey].flat() as (keyof D)[]
      : undefined;
    this.update(data);
  }

  set keys({
    xKey,
    yKey,
  }: {
    xKey?: D3StringKey<D>,
    yKey?: D3NumberKey<D>
  }) {
    if (xKey) this.xKey = xKey;
    if (yKey) this.yKey = yKey;
  }

  update(newData: D3DataCatgAndLinear<D>[]) {
    this.data = newData;
    this.bars = this.chart
      .selectAll('rect')
      .data(this.data, (d, i) => {
        if (this.dataJoinKey) return this.dataJoinKey.map((k) => `${(d as any)[k]}`).join('-');
        return i;
      });

    this.exit();
    this.enter();
  }

  enter() {
    this.bars
      .enter()
      .append('rect')
      .attr('class', D3Classes.chartElements.bar.bar)
      .attr('x', (d) => Number(this.xScale.getScale()(d[this.xKey])))
      .attr('width', this.xScale.getScale().bandwidth())
      .attr('fill', 'grey')
      .attr('y', this.yScale.getScale()(0))
      .attr('height', 0)
      .transition()
      .duration(300)
      .attr('y', (d) => this.yScale.getScale()(d[this.yKey]))
      .attr('height', (d) => this.yScale.getScale()(0) - this.yScale.getScale()(d[this.yKey]));
    this.exit();
  }

  exit() {
    this.bars
      .exit()
      .attr('fill', 'red')
      .transition()
      .attr('height', 0)
      .attr('y', this.yScale.getScale()(0))
      .duration(300);
  }

  updateScales({
    x, y,
  }:{
    x: D3ScaleBand<D>,
    y: D3ScaleLinear<D>
  }) {
    this.xScale = x;
    this.yScale = y;

    this.bars
      .transition()
      .duration(500)
      .attr('y', (d) => this.yScale.getScale()(d[this.yKey]))
      .attr('x', (d) => Number(this.xScale.getScale()(d[this.xKey])))
      .attr('width', this.xScale.getScale().bandwidth())
      .attr('height', (d) => this.yScale.getScale()(0) - this.yScale.getScale()(d[this.yKey]))
      .attr('fill', 'grey');
  }
}

export default Bar;
