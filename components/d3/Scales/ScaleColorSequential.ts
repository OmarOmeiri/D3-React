import { isEqual } from 'lodash';
import {
  useEffect,
  useRef,
} from 'react';
import { D3DataLinear } from '../../../d3/dataTypes';
import D3ScaleColorSequential, { IScaleColorSequential } from '../../../d3/Scales/ScaleColorSequential';
import { D3NumberKey } from '../../../d3/types';
import { typedMemo } from '../../../utils/react/typedMemo';
import { useD3Context } from '../context/D3Context';

const ReactD3ScaleColorSequential = typedMemo(<
D extends Record<string, unknown>,
>({
    id,
    data,
    dataKey,
    range,
    domain,
  }: IScaleColorSequential<D>) => {
  const scaleId = useRef(id || 'seq-color-scale');
  const {
    chart,
    scales,
    getScale,
    addScale,
  } = useD3Context();
  useEffect(() => {
    if (chart) {
      const scale = new D3ScaleColorSequential({
        id: scaleId.current,
        data: data as D3DataLinear<D>[],
        dataKey: dataKey as D3NumberKey<D>,
        range,
        domain,
      });
      addScale(scale);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  useEffect(() => {
    if (chart && scales.length) {
      const scale = getScale({ id: scaleId.current }) as D3ScaleColorSequential<D>;
      scale.updateScale({
        id: scaleId.current,
        data: data as D3DataLinear<D>[],
        dataKey: dataKey as D3NumberKey<D>,
        range,
        domain,
      });
    }
  }, [
    chart,
    scales,
    id,
    data,
    dataKey,
    range,
    domain,
    getScale,
  ]);

  return null;
}, (prev, next) => {
  const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)])) as (keyof IScaleColorSequential<any>)[];
  for (const key of keys) {
    if (key === 'domain') {
      if (!isEqual(prev.domain, next.domain)) return false;
      continue;
    }

    if (key === 'dataKey') {
      if (!isEqual(prev.dataKey, next.dataKey)) return false;
      continue;
    }

    if (prev[key] !== next[key]) {
      return false;
    }
  }

  return true;
});

(ReactD3ScaleColorSequential as React.FC).displayName = 'ReactD3ScaleColorSequential';
export default ReactD3ScaleColorSequential;
