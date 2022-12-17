import type D3Chart from '../../Chart';
import { D3GetMousePosition } from '../Mouse/helpers/getMousePosition';

export interface ID3Tooltip {
  chart: D3Chart
  dx?: number,
  dy?: number,
  position?: {x: number, y: number}
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
      .on('mousemove.tooltip', (e) => {
        const [x, y] = D3GetMousePosition(e, this.chart);
        this.onMouseMove(
          e,
          x + this.dx + this.chart.dims.margin.left,
          y + this.dy + this.chart.dims.margin.top,
        );
      })
      .on('mouseover.tooltip', this.onMouseOver)
      .on('mouseout.tooltip', this.onMouseOut);
  }
}

export default Tooltip;
