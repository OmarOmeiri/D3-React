import { D3Classes } from '../../consts/classes';
import { d3AppendIfNotExists } from '../../helpers/d3Exists';
import { D3isMouseWithinBounds } from './helpers/isMouseWithin';

import type D3Chart from '../../Chart';

interface ID3MouseEvts {
  mouseMove?: (e: any, positionCallback: (x: number, y: number) => void) => void;
}

class D3Mouse {
  constructor(
    private chart: D3Chart,
    private withLine: boolean = true,
  ) {}

  setEvents({
    mouseMove = () => {},
  }: ID3MouseEvts = {}) {
    if (this.withLine) this.appendLine();

    this.chart.svg
      .on('mouseout', () => {
        this.removeMouseElements();
      })
      .on('mouseover', () => {
        this.mouseOver();
      })
      .on('mousemove', (e) => mouseMove(e, (x, y) => {
        if (!D3isMouseWithinBounds(e, this.chart)) {
          this.removeMouseElements();
          return;
        }
        this.mouseMove(x, y);
      }));
  }

  private removeMouseElements() {
    this.chart.chart
      .select(`.${D3Classes.events.crossHairHorizontal}`)
      .style('opacity', '0');

    this.chart.chart
      .select(`.${D3Classes.events.crossHairVertical}`)
      .style('opacity', '0');

    this.chart.chart
      .select(`.${D3Classes.events.mouseVerticalLine}`)
      .style('opacity', '0');

    this.chart.chart.select(`.${D3Classes.axis.tooltip.y}`)
      .style('opacity', '0');

    this.chart.chart.select(`.${D3Classes.axis.tooltip.x}`)
      .style('opacity', '0');
  }

  private getAxisTooltipSize(type: 'x' | 'y') {
    const node = this.chart.chart
      .select<HTMLDivElement>(`.${D3Classes.axis.tooltip[type]}`)
      .node();
    return {
      width: node?.offsetWidth || 0,
      height: node?.offsetHeight || 0,
    };
  }

  private mouseOver() {
    this.chart.chart
      .select(`.${D3Classes.events.crossHairHorizontal}`)
      .style('opacity', '1');

    this.chart.chart
      .select(`.${D3Classes.events.crossHairVertical}`)
      .style('opacity', '1');

    this.chart.chart
      .select(`.${D3Classes.events.mouseVerticalLine}`)
      .style('opacity', '1');

    this.chart.chart.select(`.${D3Classes.axis.tooltip.y}`)
      .style('opacity', '1');

    this.chart.chart.select(`.${D3Classes.axis.tooltip.x}`)
      .style('opacity', '1');
  }

  private mouseMove(x: number, y: number) {
    this.chart.chart
      .select(`.${D3Classes.events.mouseVerticalLine}`)
      .attr('x1', x)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', this.chart.dims.innerDims.height);

    this.chart.chart
      .select(`.${D3Classes.events.crossHairVertical}`)
      .attr('x1', x)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', this.chart.dims.innerDims.height);

    this.chart.chart
      .select(`.${D3Classes.events.crossHairHorizontal}`)
      .attr('x1', 0)
      .attr('y1', y)
      .attr('x2', this.chart.dims.innerDims.width)
      .attr('y2', y);

    this.getAxisTooltipSize('x');

    this.chart.chart
      .select(`.${D3Classes.axis.tooltip.foreignObjectX}`)
      .attr('transform', `translate(${
        x - (this.getAxisTooltipSize('x').width / 2)
      }, ${
        this.chart.dims.innerDims.height + 6
      })`);

    const yTooltipSize = this.getAxisTooltipSize('y');
    this.chart.chart
      .select(`.${D3Classes.axis.tooltip.foreignObjectY}`)
      .attr('transform', `translate(${
        -yTooltipSize.height - 6
      }, ${y + (yTooltipSize.width / 2)}) rotate(-90)`);
  }

  private appendLine() {
    d3AppendIfNotExists(
      this.chart.chart.select(`.${D3Classes.events.mouseVerticalLine}`),
      () => (
        this.chart.chart
          .append('line')
          .attr('class', D3Classes.events.mouseVerticalLine)
          .style('stroke', '#A9A9A9')
          .style('stroke-width', 2)
          .style('opacity', '1')
          .attr('pointer-events', 'none')
      ),
    );
  }

  appendCrosshair() {
    d3AppendIfNotExists(
      this.chart.chart.select(`.${D3Classes.events.crossHairVertical}`),
      () => (
        this.chart.chart
          .append('line')
          .attr('class', D3Classes.events.crossHairVertical)
          .style('stroke', '#A9A9A9')
          .style('stroke-width', 1)
          .style('opacity', '1')
          .attr('stroke-dasharray', '6 4')
          .attr('pointer-events', 'none')
      ),
    );

    d3AppendIfNotExists(
      this.chart.chart.select(`.${D3Classes.events.crossHairHorizontal}`),
      () => (
        this.chart.chart
          .append('line')
          .attr('class', D3Classes.events.crossHairHorizontal)
          .style('stroke', '#A9A9A9')
          .style('stroke-width', 1)
          .style('opacity', '1')
          .attr('stroke-dasharray', '6 4')
          .attr('pointer-events', 'none')
      ),
    );

    d3AppendIfNotExists(
      this.chart.chart.select(`.${D3Classes.axis.tooltip.x}`),
      () => (
        this.chart.chart
          .append('foreignObject')
          .attr('class', D3Classes.axis.tooltip.foreignObjectX)
          .attr('width', '1')
          .attr('height', '1')
          .append('xhtml:div')
          .style('opacity', '0')
          .attr('class', D3Classes.axis.tooltip.x)
          .attr('pointer-events', 'none')
      ),
    );

    d3AppendIfNotExists(
      this.chart.chart.select(`.${D3Classes.axis.tooltip.y}`),
      () => (
        this.chart.chart
          .append('foreignObject')
          .attr('class', D3Classes.axis.tooltip.foreignObjectY)
          .attr('width', '1')
          .attr('height', '1')
          .append('xhtml:div')
          .style('opacity', '0')
          .attr('class', D3Classes.axis.tooltip.y)
          .attr('pointer-events', 'none')
      ),
    );
  }

  setCrosshairText(x: string, y: string) {
    this.chart.chart.select(`.${D3Classes.axis.tooltip.x}`)
      .html(`<span>${x}</span>`);

    this.chart.chart.select(`.${D3Classes.axis.tooltip.y}`)
      .html(`<span>${y}</span>`);
  }
}

export default D3Mouse;
