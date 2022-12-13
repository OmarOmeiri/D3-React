import AreaLine, { ID3AreaLine } from '../AreaLine/AreaLine';

class Area<
D extends Record<string, unknown>,
> extends AreaLine<D> {
  constructor({
    chart,
    data,
    filter,
    xScale,
    yScale,
    series,
    alpha,
    transitionMs,
    withDots,
    mouseOut,
    mouseMove,
    mouseOver,
  }: ID3AreaLine<D>) {
    super({
      chart,
      data,
      filter,
      xScale,
      yScale,
      series,
      alpha,
      transitionMs,
      withDots,
      mouseOut,
      mouseMove,
      mouseOver,
      type: 'area',
    });
  }
}

export default Area;
