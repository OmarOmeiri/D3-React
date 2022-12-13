import { Selection } from 'd3';
import { D3Classes } from '../../consts/classes';
import {
  d3AppendIfNotExists,
  d3ReplaceIfExists,
} from '../../helpers/d3Exists';

import type D3Chart from '../../Chart';

type EvtHandlers = (e: any) => void;

interface ID3MouseEvts {
  mouseMove?: EvtHandlers;
  mouseOver?: EvtHandlers;
  mouseOut?: EvtHandlers;
}

class D3MouseRect {
  public mouseG!: Selection<SVGGElement, unknown, null, undefined>;
  constructor(
    private chart: D3Chart,
    private withLine: boolean = true,
  ) {}

  appendMouseRect({
    mouseMove = () => {},
    mouseOut = () => {},
    mouseOver = () => {},
  }: ID3MouseEvts = {}) {
    this.appendGroup();
    if (this.withLine) this.appendLine();

    const mouseRect = d3ReplaceIfExists(
      this.mouseG.select(`.${D3Classes.events.mouseRect}`),
      () => (
        this.mouseG
          .append('rect')
          .attr('class', D3Classes.events.mouseRect)
          .attr('width', this.chart.dims.innerDims.width)
          .attr('height', this.chart.dims.innerDims.height)
          .attr('fill', 'none')
          .attr('pointer-events', 'all')
          .attr('transform', `translate(${this.chart.dims.margin.left}, ${this.chart.dims.margin.top})`)
      ),
      { createIfNotExist: true },
    );

    mouseRect
      .on('mouseout', mouseOut)
      .on('mouseover', mouseOver)
      .on('mousemove', mouseMove);
  }

  updateRect() {
    this.mouseG
      .select(`.${D3Classes.events.mouseRect}`)
      .attr('class', D3Classes.events.mouseRect)
      .attr('width', this.chart.dims.innerDims.width)
      .attr('height', this.chart.dims.innerDims.height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .attr('transform', `translate(${this.chart.dims.margin.left}, ${this.chart.dims.margin.top})`);
  }

  private appendGroup() {
    this.mouseG = d3AppendIfNotExists(
      this.chart.svg.select<SVGGElement>(`.${D3Classes.events.mouseEventsGroup}`),
      () => (
        this.chart.svg
          .append('g')
          .attr('class', D3Classes.events.mouseEventsGroup)
      ),
    );
  }

  private appendLine() {
    d3AppendIfNotExists(
      this.chart.chart.select(`.${D3Classes.events.mouseVerticalLine}`),
      () => (
        this.chart.chart
          .append('line') // create vertical line to follow mouse
          .attr('class', D3Classes.events.mouseVerticalLine)
          .style('stroke', '#A9A9A9')
          .style('stroke-width', 3)
          .style('opacity', '1')
      ),
    );
  }
}

export default D3MouseRect;
