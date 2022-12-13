import {
  area,
  BaseType,
  curveCatmullRom,
  scaleLinear,
  ScaleLinear,
  Selection,
} from 'd3';
import { groupBy } from 'lullo-utils/Objects';
import { D3Classes } from '../../consts/classes';
import { D3DataCatgAndLinear } from '../../dataTypes';
import { D3ScaleLinear } from '../../Scales';
import D3ScaleBand from '../../Scales/ScaleBand';
import {
  D3NumberKey,
  D3StringKey,
} from '../../types';
import KDE from './helpers/kde';

const getBins = <
D extends Record<string, unknown>,
>(
    yScale: ScaleLinear<number, number, never>,
    data: D3DataCatgAndLinear<D>[],
    xKey: D3StringKey<D>,
    yKey: D3NumberKey<D>,
  ) => {
  let maxNum = 0;
  const kde = KDE(0.2, yScale.ticks(50));
  const bins = Object.entries(groupBy(data, xKey))
    .reduce((st, [key, values]) => {
      const bins = kde(values.map((g) => g[yKey] as number));
      maxNum = Math.max(maxNum, ...bins.map((v) => v[1]));
      return [
        ...st,
        {
          key,
          bins,
        },
      ];
    }, [] as {key: string, bins: [number, number][]}[]);
  return {
    bins,
    maxNum,
  };
};

export interface ID3Violin<
D extends Record<string, unknown>,
CatgKey extends KeysOfType<D, string>,
NumKey extends KeysOfType<D, number>
> {
  id: string,
  chart: Selection<SVGGElement, unknown, null, undefined>
  data: D3DataCatgAndLinear<D, CatgKey, NumKey>[],
  xScale: D3ScaleBand<D, CatgKey>,
  yScale: D3ScaleLinear<D, NumKey>,
  xKey: CatgKey,
  yKey: NumKey,
}

class Violin<
D extends Record<string, unknown>,
CatgKey extends KeysOfType<D, string>,
NumKey extends KeysOfType<D, number>
> {
  private id: string;
  private chart: Selection<SVGGElement, unknown, null, undefined>;
  private xScale: D3ScaleBand<D, CatgKey>;
  private xScaleNum!: ScaleLinear<number, number, never>;
  private yScale: D3ScaleLinear<D, NumKey>;
  private group!: Selection<BaseType, {key: string, bins: [number, number][]}, SVGGElement, unknown>;
  private data: D3DataCatgAndLinear<D, CatgKey, NumKey>[];
  private yKey: NumKey;
  private xKey: CatgKey;

  constructor({
    id,
    chart,
    data,
    xScale,
    yScale,
    xKey,
    yKey,
  }: ID3Violin<D, CatgKey, NumKey>) {
    this.id = id;
    this.chart = chart;
    this.xScale = xScale;
    this.yScale = yScale;
    this.yKey = yKey;
    this.xKey = xKey;
    this.data = data;
    this.updateData(data);
  }

  updateData(newData: D3DataCatgAndLinear<D, CatgKey, NumKey>[]) {
    this.data = newData;

    const {
      bins,
      maxNum,
    } = getBins(this.yScale.scale, this.data, this.xKey, this.yKey);

    this.xScaleNum = scaleLinear()
      .domain([-maxNum, maxNum])
      .range([0, this.xScale.scale.bandwidth()]);

    this.group = this.chart
      .selectAll(`.${D3Classes.chartElements.violin.violinGroup}`)
      .data(bins);

    this.group
      .select('path')
      .transition()
      .duration(1000)
      .attr('fill', 'orange')
      .style('stroke', 'none')
      .attr('d', area()
        .x0((d) => (this.xScaleNum(-d[1])))
        .x1((d) => (this.xScaleNum(d[1])))
        .y((d) => (this.yScale.scale(d[0])))
        .curve(curveCatmullRom));

    this.group
      .transition()
      .duration(1000)
      .attr('transform', (d) => (`translate(${this.xScale.scale(d.key)} ,0)`));

    this.group
      .enter()
      .append('g')
      .attr('transform', (d) => (`translate(${this.xScale.scale(d.key)} ,0)`))
      .append('path')
      .datum((d) => (d.bins))
      .style('stroke', 'none')
      .style('fill', '#69b3a2')
      .attr('d', area()
        .x0((d) => (this.xScaleNum(-d[1])))
        .x1((d) => (this.xScaleNum(d[1])))
        .y((d) => (this.yScale.scale(d[0])))
        .curve(curveCatmullRom));

    // this.enter();
  }

  enter() {
    // const nodes = this.group
    //   .enter()
    //   .append('g')
    //   .attr('class', VIOLIN_GROUP_CLASS)
    //   .attr('transform', (d) => (`translate(${this.xScale.scale(d.key)} ,0)`))
    //   .append('path')
    //   .datum((d) => (d.bins)) // So now we are working density per density
    //   .style('stroke', 'none')
    //   .style('fill', '#69b3a2')
    //   .attr('d', area()
    //     .x0((d) => { console.log(d); return (this.xScaleNum(-d[1])); })
    //     .x1((d) => (this.xScaleNum(d[1])))
    //     .y((d) => (this.yScale.scale(d[0])))
    //     .curve(curveCatmullRom));

    // nodes
    //   .append('path')
    //   .attr('opacity', '0.7')
    //   .attr('fill', 'green')
    //   .attr('stroke', 'black')
    //   .transition()
    //   .duration(1000);

    this.exit();
  }

  exit() {
    this.group
      .exit()
      .select('path')
      .transition()
      .duration(1000)
      .attr('fill', 'red')
      .attr('r', 0);

    this.group
      .exit()
      .transition()
      .duration(1000)
      .remove();
  }

  updateScales({
    x, y,
  }:{
    x: D3ScaleBand<D, CatgKey>,
    y: D3ScaleLinear<D, NumKey>
  }) {
    this.xScale = x;
    this.yScale = y;

    this.group
      .transition()
      .duration(500)
      .attr('transform', (d) => `translate(${
        this.xScale.scale(d.key)
      }, 0)`);
  }
}

export default Violin;
