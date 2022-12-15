import AreaLine, { ID3AreaLine } from '../AreaLine/AreaLine';

class Area<
D extends Record<string, unknown>,
> extends AreaLine<D> {
  constructor(params: Omit<ID3AreaLine<D>, 'type'>) {
    super({
      ...params,
      type: 'area',
    });
  }
}

export default Area;
