import { pointer } from 'd3';

import type D3Chart from '../../Chart';

export const D3GetMousePosition = (e: any, chart: D3Chart): [number, number] => {
  const [x, y] = pointer(e);
  return [
    x - chart.dims.margin.left,
    y - chart.dims.margin.top,
  ];
};
