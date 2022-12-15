import type D3Chart from '../../Chart';

export interface ID3ChartOverlay {
  chart: D3Chart
}

class ChartOverlay {
  private chart: D3Chart;
  constructor({
    chart,
  }: ID3ChartOverlay) {
    this.chart = chart;
  }
}

export default ChartOverlay;
