import D3ScaleBand from '../ScaleBand';
import D3ScaleLinear from '../ScaleLinear';
import D3ScaleTime from '../ScaleTime';

export type D3ScaleInverter = ((v: number) => number) | ((v: number) => string) | ((v: number) => Date)

export const D3InvertScale = (
  scale: D3ScaleLinear<any> | D3ScaleBand<any> | D3ScaleTime<any>,
): D3ScaleInverter => {
  if (scale instanceof D3ScaleLinear) {
    return (v: number) => scale.getScale().invert(v);
  }
  if (scale instanceof D3ScaleTime) {
    return (v: number) => scale.getScale().invert(v);
  }
  const domain = scale.getScale().domain();
  const paddingOuter = Number(scale.getScale()(domain[0])) || 0;
  const eachBand = scale.getScale().step();
  return function (v: number) {
    const index = Math.floor(((v - paddingOuter) / eachBand));
    return domain[Math.max(0, Math.min(index, domain.length - 1))];
  };
};
