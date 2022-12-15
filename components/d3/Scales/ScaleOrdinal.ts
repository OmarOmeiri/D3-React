import { isEqual } from 'lodash';
import {
  useEffect,
  useRef,
} from 'react';
import D3ScaleOrdinal, { IScaleOrdinal } from '../../../d3/Scales/ScaleOrdinal';
import { typedMemo } from '../../../utils/react/typedMemo';
import { useD3Context } from '../context/D3Context';

const ReactD3ScaleOrdinal = typedMemo(<
D extends Record<string, unknown>,
>({
    id,
    data,
    dataKey,
    scheme,
    domain,
  }: IScaleOrdinal<D>) => {
  const scaleId = useRef(id || 'ordinal-scale');
  const {
    chart,
    scales,
    getScale,
    addScale,
  } = useD3Context();
  useEffect(() => {
    if (chart) {
      const scale = new D3ScaleOrdinal({
        id: scaleId.current,
        data,
        dataKey,
        scheme,
        domain,
      });
      addScale(scale);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  useEffect(() => {
    if (chart && scales.length) {
      const scale = getScale({ id: scaleId.current }) as D3ScaleOrdinal<D>;
      scale.updateScale({
        id: scaleId.current,
        data,
        dataKey,
        scheme,
        domain,
      });
    }
  }, [
    chart,
    scales,
    id,
    data,
    dataKey,
    scheme,
    domain,
    getScale,
  ]);

  return null;
}, (prev, next) => {
  const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)])) as (keyof IScaleOrdinal<any>)[];
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

export default ReactD3ScaleOrdinal;
