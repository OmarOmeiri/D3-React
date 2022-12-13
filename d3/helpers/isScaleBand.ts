import {
  AxisScale,
  ScaleBand,
} from 'd3';

export const D3IsScaleBand = (value: AxisScale<any>) : value is ScaleBand<string> => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if ('bandwidth' in value && value.bandwidth!() > 0) {
    return true;
  }
  return false;
};
