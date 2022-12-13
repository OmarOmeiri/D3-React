import { D3AxisTypes } from '../../Axes/types';
import { D3Dimensions } from '../../Dimensions';

export const D3GetScaleRange = (type: D3AxisTypes, dims: D3Dimensions) => {
  switch (type) {
    case 'bottom':
      return [0, dims.innerDims.width] as [number, number];
    case 'top':
      return [0, dims.innerDims.width] as [number, number];
    case 'left':
      return [dims.innerDims.height, 0] as [number, number];
    case 'right':
      return [dims.innerDims.height, 0] as [number, number];
    default:
      throw new Error(`Unknown axis type ${type}`);
  }
};
