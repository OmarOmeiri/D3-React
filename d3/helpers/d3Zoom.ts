import { D3Scales } from '../Scales/types';

export const D3ZoomHelper = (e: any, scale: D3Scales<any>) => {
  if ('zoomRescale' in scale) {
    return scale.zoomRescale(e);
  }
  throw new Error(`Scale should have an "axis" property. ${scale.constructor.name} does not.`);
};

export const D3IsZoomed = (e: any) => {
  if ('transform' in e) return e.transform.k !== 1;
  if ('k' in e) return e.k !== 1;
  throw new Error('Unknown D3 zoom object.');
};
