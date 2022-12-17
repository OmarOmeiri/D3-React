import type D3Chart from '../../../Chart';
import { D3GetMousePosition } from './getMousePosition';

export const D3isMouseWithinBounds = (e: any, chart: D3Chart) => {
  const [x, y] = D3GetMousePosition(e, chart);
  if (y <= 0 || y >= chart.dims.innerDims.height) return false;
  if (x <= 0 || x >= chart.dims.innerDims.width) return false;
  return true;
};
