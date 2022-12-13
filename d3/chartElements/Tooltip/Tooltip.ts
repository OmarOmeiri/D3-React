import { pointer } from 'd3';

import type D3Chart from '../../Chart';

export interface ID3Tooltip {
  chart: D3Chart
  dx?: number,
  dy?: number,
  onMouseMove: (e: any, x: number, y: number) => void
  onMouseOut: (e: any) => void
  onMouseOver?: (e: any) => void
}

class Tooltip {
  private chart: D3Chart;
  private dx: number;
  private dy: number;
  private onMouseMove: (e: any, x: number, y: number) => void;
  private onMouseOut: (e: any) => void;
  private onMouseOver: (e: any) => void;

  constructor({
    chart,
    dx = 15,
    dy = 35,
    onMouseMove,
    onMouseOut,
    onMouseOver = () => {},
  }: ID3Tooltip) {
    this.chart = chart;
    this.dy = dy;
    this.dx = dx;
    this.onMouseMove = onMouseMove;
    this.onMouseOut = onMouseOut;
    this.onMouseOver = onMouseOver;
    this.init();
  }

  init() {
    this.chart.svg
      .on('mousemove', (e) => {
        const [x, y] = pointer(e);
        this.onMouseMove(e, x + this.dx, y + this.dy);
      })
      .on('mouseover', this.onMouseOver)
      .on('mouseout', this.onMouseOut);
  }
}

export default Tooltip;
