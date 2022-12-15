import {
  select,
  Selection,
} from 'd3';
import { D3Dimensions } from './Dimensions';
import { ID3Dimensions } from './Dimensions/Dimensions';
import { d3AppendIfNotExists } from './helpers/d3Exists';

class D3Chart {
  public svg: Selection<SVGSVGElement, unknown, null, undefined>;
  public chart!: Selection<SVGGElement, unknown, null, undefined>;
  public chartWrapper: Selection<HTMLDivElement, unknown, null, unknown>;
  public chartOverlay: Selection<HTMLDivElement, unknown, null, unknown>;
  public defs!: Selection<SVGDefsElement, unknown, null, undefined>;
  public dims: D3Dimensions;
  public id: string;
  public chartAreaClipId: string;
  private chartAreaRectClip!: Selection<SVGClipPathElement, unknown, null, undefined>;

  constructor({
    id,
    ref,
    dims,
  }: {
    id: string
    ref: HTMLDivElement,
    dims: ID3Dimensions
  }) {
    this.id = id;
    this.chartAreaClipId = `${this.id}-chart-clip`;
    this.chartWrapper = select(ref);
    this.chartOverlay = this.chartWrapper
      .select('.d3-chart-overlay');

    this.svg = d3AppendIfNotExists(
      this.chartWrapper
        .select('svg'),
      () => this.chartWrapper
        .append('svg'),
      // .style('pointer-events', 'none'),
    );

    this.svg
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('id', this.id);

    this.dims = new D3Dimensions(dims);

    this.appendChartArea();
    this.appendDefs();
  }

  appendChartArea() {
    this.chart = this.svg
      .append('g')
      .attr('class', 'd3-chart')
      .attr('transform', `translate(${this.dims.margin.left}, ${this.dims.margin.top})`)
      .attr('opacity', '0');
    this.chart
      .transition()
      .duration(200)
      .attr('opacity', 1);
  }

  appendDefs() {
    this.defs = this.chart
      .append('defs');

    this.chartAreaRectClip = this.defs
      .append('clipPath')
      .attr('id', this.chartAreaClipId);

    this.chartAreaRectClip
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.dims.innerDims.width)
      .attr('height', this.dims.innerDims.height);
  }

  updateDims(dims: ID3Dimensions) {
    if (dims) this.dims.setDims(dims);
    this.chart
      .attr('transform', `translate(${this.dims.margin.left}, ${this.dims.margin.top})`);

    this.chartAreaRectClip
      .select('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.dims.innerDims.width)
      .attr('height', this.dims.innerDims.height);
  }
}

export default D3Chart;
