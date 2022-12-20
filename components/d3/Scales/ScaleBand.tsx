import { isEqual } from 'lodash';
import {
  useEffect,
  useRef,
} from 'react';
import { ID3Axis } from '../../../d3/Axes/Axis';
import { D3DataCatg } from '../../../d3/dataTypes';
import D3ScaleBand, {
  IScaleBandNoData,
  IScaleBandWithData,
} from '../../../d3/Scales/ScaleBand';
import { D3StringKey } from '../../../d3/types';
import { typedMemo } from '../../../utils/react/typedMemo';
import { useD3Context } from '../context/D3Context';

type ReactD3ScaleBandProps<
D extends Record<string, unknown>,
> = Expand<
(PartialK<IScaleBandWithData<D>, | 'id'> | PartialK<IScaleBandNoData, 'id'>)
& PartialK<Omit<ID3Axis, 'parent' | 'scale' | 'chart'>, 'id'>
>

const ReactD3ScaleBand = typedMemo(<
D extends Record<string, unknown>,
>({
    id,
    data,
    dataKey,
    domain,
    padding,
    type,
    label,
    tickValues,
    ticks,
    tickFormat,
  }: ReactD3ScaleBandProps<D>,
  ) => {
  const scaleId = useRef(id || 'band-scale');
  const {
    chart,
    scales,
    dims,
    getScale,
    addScale,
  } = useD3Context();
  useEffect(() => {
    if (chart) {
      const scale = new D3ScaleBand({
        id: scaleId.current,
        chart,
        type,
        data: data as D3DataCatg<D>[],
        dataKey: dataKey as D3StringKey<D>,
        domain,
        padding,
        ticks,
        tickFormat,
        tickValues,
      });
      addScale(scale);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  useEffect(() => {
    if (chart && scales.length) {
      const scale = getScale({ id: scaleId.current }) as D3ScaleBand<D>;
      scale.updateScale({
        chart,
        type,
        label,
        data: data as D3DataCatg<D>[],
        dataKey: dataKey as D3StringKey<D>,
        domain,
        padding,
      });
    }
  }, [
    chart,
    dims,
    scales,
    data,
    dataKey,
    domain,
    padding,
    type,
    label,
    getScale,
  ]);

  return null;
}, (prev, next) => {
  const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)])) as (keyof ReactD3ScaleBandProps<any>)[];
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

    if (key === 'tickFormat') {
      if (prev.tickFormat?.toString() !== next.tickFormat?.toString()) return false;
      continue;
    }

    if (prev[key] !== next[key]) {
      return false;
    }
  }

  return true;
});

(ReactD3ScaleBand as React.FC).displayName = 'ReactD3ScaleBand';

export default ReactD3ScaleBand;

