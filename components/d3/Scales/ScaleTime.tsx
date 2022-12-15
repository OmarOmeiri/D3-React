import { isEqual } from 'lodash';
import {
  useEffect,
  useRef,
} from 'react';
import { ID3Axis } from '../../../d3/Axes/Axis';
import { D3DataTime } from '../../../d3/dataTypes';
import D3ScaleTime, {
  IScaleTimeNoData,
  IScaleTimeWithData,
} from '../../../d3/Scales/ScaleTime';
import { D3DateKey } from '../../../d3/types';
import { typedMemo } from '../../../utils/react/typedMemo';
import { useD3Context } from '../context/D3Context';

type ReactD3ScaleTimeProps<
D extends Record<string, unknown>,
> = Expand<
(PartialK<IScaleTimeWithData<D>, 'id'> | PartialK<IScaleTimeNoData, 'id'>)
& PartialK<Omit<ID3Axis, 'parent' | 'scale' | 'chart'>, 'id'>
>

const ReactD3ScaleTime = typedMemo(<
D extends Record<string, unknown>,
>({
    id,
    data,
    dataKey,
    domain,
    type,
    label,
    tickValues,
    ticks,
    tickFormat,
  }: ReactD3ScaleTimeProps<D>) => {
  const scaleId = useRef(id || 'time-scale');
  const {
    chart,
    scales,
    dims,
    getScale,
    addScale,
  } = useD3Context();

  useEffect(() => {
    if (chart) {
      const scale = new D3ScaleTime({
        id: scaleId.current,
        chart,
        type,
        data: data as D3DataTime<D>[],
        dataKey: dataKey as D3DateKey<D>,
        domain,
        tickValues,
        ticks,
        tickFormat,
      });
      addScale(scale);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  useEffect(() => {
    if (chart && scales.length) {
      const scale = getScale({ id: scaleId.current }) as D3ScaleTime<D>;
      scale.updateScale({
        chart,
        type,
        data: data as D3DataTime<D>[],
        dataKey: dataKey as D3DateKey<D>,
        domain,
      });
    }
  }, [
    chart,
    dims,
    scales,
    getScale,
    data,
    dataKey,
    domain,
    label,
    type,
  ]);

  return null;
}, (prev, next) => {
  const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)])) as (keyof ReactD3ScaleTimeProps<any>)[];
  for (const key of keys) {
    if (key === 'domain') {
      if (!isEqual(prev.domain, next.domain)) return false;
      continue;
    }

    if (key === 'dataKey') {
      if (!isEqual(prev.dataKey, next.dataKey)) return false;
      continue;
    }

    if (key === 'tickValues') {
      if (!isEqual(prev.tickValues, next.tickValues)) return false;
      continue;
    }

    if (prev[key] !== next[key]) {
      return false;
    }
  }

  return true;
});

export default ReactD3ScaleTime;
