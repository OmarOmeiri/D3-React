import AreaLine, { ID3AreaLine } from '../AreaLine/AreaLine';

class Line<
D extends Record<string, unknown>,
> extends AreaLine<D> {
  constructor(params: Omit<ID3AreaLine<D>, 'type'>) {
    super({
      ...params,
      type: 'line',
    });
  }
}

export default Line;
