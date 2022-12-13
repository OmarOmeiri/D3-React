import { isEqual } from 'lodash';
import {
  useEffect,
  useRef,
} from 'react';
import uniqid from 'uniqid';
import { D3DataLinear } from '../../../d3/dataTypes';
import D3ScaleLinear, {
  IScaleLinearNoData,
  IScaleLinearWithData,
} from '../../../d3/Scales/ScaleLinear';
import { D3NumberKey } from '../../../d3/types';
import useRenderTrace from '../../../hooks/useRenderTrace';
import { typedMemo } from '../../../utils/react/typedMemo';
import { useD3Context } from '../context/D3Context';

import type { ID3Axis } from '../../../d3/Axes/Axis';

type ReactD3ScaleLinearProps<
D extends Record<string, unknown>,
> = Expand<
(PartialK<IScaleLinearWithData<D>, 'id'> | PartialK<IScaleLinearNoData, 'id'>)
& PartialK<Omit<ID3Axis, 'parent' | 'scale' | 'chart'>, 'id'>
>

const ReactD3ScaleLinear = typedMemo(<
D extends Record<string, unknown>,
>({
    id,
    data,
    dataKey,
    domain,
    roundDomain,
    type,
    label,
    tickValues,
    ticks,
    tickFormat,
  }: ReactD3ScaleLinearProps<D>) => {
  const scaleId = useRef(id || uniqid());
  const {
    chart,
    dims,
    scales,
    getScale,
    addScale,
  } = useD3Context();

  useRenderTrace('scaleLinear', {
    chart,
    scales,
    getScale,
    addScale,
    id,
    data,
    dataKey,
    domain,
    roundDomain,
    type,
    label,
    tickValues,
    tickFormat,
  });

  useEffect(() => {
    if (chart) {
      const scale = new D3ScaleLinear({
        id: scaleId.current,
        chart,
        data: data as D3DataLinear<D>[],
        dataKey: dataKey as D3NumberKey<D>,
        domain,
        roundDomain,
        type,
        label,
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
      const scale = getScale({ id: scaleId.current }) as D3ScaleLinear<D>;
      scale.updateScale({
        chart,
        type,
        label,
        data: data as D3DataLinear<D>[],
        dataKey: dataKey as D3NumberKey<D>,
        domain,
      });
    }
  }, [
    chart,
    dims,
    scales,
    data,
    dataKey,
    domain,
    label,
    type,
    getScale,
  ]);

  return null;
}, (prev, next) => {
  const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)])) as (keyof ReactD3ScaleLinearProps<any>)[];
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

export default ReactD3ScaleLinear;
