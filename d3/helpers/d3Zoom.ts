import { zoom as d3Zoom } from 'd3';
import { D3isMouseWithinBounds } from '../chartElements/Mouse/helpers/isMouseWithin';
import { D3Scales } from '../Scales/types';

import type D3Chart from '../Chart';

const D3ZoomHelper = (e: any, scale: D3Scales<any>) => {
  if ('zoomRescale' in scale) {
    return scale.zoomRescale(e);
  }
  throw new Error(`Scale should have an "zoomRescale" method. ${scale.constructor.name} does not.`);
};

export const D3IsZoomed = (e: any) => {
  if ('transform' in e) return e.transform.k !== 1;
  if ('k' in e) return e.k !== 1;
  throw new Error('Unknown D3 zoom object.');
};

export const D3Zoom = ({
  zoomExtent = [0, 0],
  scaleExtent = [1, 15],
  chart,
  xScale,
  yScale,
  onZoom,
}:{
  zoomExtent?: [number, number]
  scaleExtent?: [number, number]
  chart: D3Chart,
  xScale: D3Scales<any>
  yScale: D3Scales<any>
  onZoom: (e: any) => void
}) => {
  const zoom = d3Zoom<SVGSVGElement, unknown>()
    .scaleExtent(scaleExtent)
    .extent([zoomExtent, [
      chart.dims.innerDims.width,
      chart.dims.innerDims.height,
    ]])
    .translateExtent([[0, 0], [chart.dims.innerDims.width, chart.dims.innerDims.height]])
    .filter((e) => {
      if (!D3isMouseWithinBounds(e, chart)) {
        return false;
      }
      return (!e.ctrlKey || e.type === 'wheel') && !e.button;
    })
    .on('zoom', (e) => {
      D3ZoomHelper(e, xScale);
      D3ZoomHelper(e, yScale);
      onZoom(e);
    });

  chart.svg
    .call(zoom);
};

