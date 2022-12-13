import {
  axisBottom,
  axisLeft,
  axisRight,
  axisTop,
} from 'd3';
import { D3AxisTypes } from '../types';

import type { D3Dimensions } from '../../Dimensions';

export const D3GetAxis = (type: D3AxisTypes) => {
  switch (type) {
    case 'bottom':
      return axisBottom;
    case 'top':
      return axisTop;
    case 'left':
      return axisLeft;
    case 'right':
      return axisRight;
    default:
      throw new Error(`Unknown axis type ${type}`);
  }
};

export const D3GetAxisTickSize = (type: D3AxisTypes, dims: D3Dimensions) => {
  switch (type) {
    case 'bottom':
      return -dims.innerDims.height;
    case 'top':
      return dims.innerDims.height;
    case 'left':
      return -dims.innerDims.width;
    case 'right':
      return dims.innerDims.width;
    default:
      throw new Error(`Unknown axis type ${type}`);
  }
};

export const D3GetAxisTransforms = (type: D3AxisTypes, dims: D3Dimensions): null | [string, string] => {
  switch (type) {
    case 'bottom':
      return ['transform', `translate(0, ${dims.innerDims.height})`];
    case 'top':
      return null;
    case 'left':
      return null;
    case 'right':
      return ['transform', `translate(${dims.innerDims.width}, 0)`];
    default:
      throw new Error(`Unknown axis type ${type}`);
  }
};
