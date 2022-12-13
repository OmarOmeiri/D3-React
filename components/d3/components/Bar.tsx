import {
  useEffect,
  useRef,
} from 'react';
import Bar, { ID3Bar } from '../../../d3/chartElements/Bar/Bar';
import { D3StringKey } from '../../../d3/types';
import { useD3Context } from '../context/D3Context';

import type { D3ScaleLinear } from '../../../d3/Scales';
import type D3ScaleBand from '../../../d3/Scales/ScaleBand';
type ReactBarProps<
D extends Record<string, unknown>,
> = Expand<Omit<ID3Bar<D>, 'xScale' | 'yScale' | 'chart'> & {
  yAxisId?: string,
  xAxisId?: string
}>

const ReactD3Bar = <
D extends Record<string, unknown>,
>({
    data,
    xKey,
    yKey,
    dataJoinKey,
    yAxisId,
    xAxisId,
  }: ReactBarProps<D>,
  ) => {
  const bar = useRef<Bar<D> | null>(null);
  const {
    chart,
    dims,
    scales,
    margin,
    getScale,
  } = useD3Context();

  useEffect(() => {
    if (chart && scales.length) {
      const yScale = getScale({
        id: yAxisId,
        type: 'y',
      }) as D3ScaleLinear<D>;
      const xScale = getScale({
        id: xAxisId,
        type: 'x',
      }) as D3ScaleBand<D>;

      bar.current = new Bar({
        data,
        xKey,
        yKey,
        dataJoinKey,
        chart: chart.chart,
        xScale,
        yScale,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, scales]);

  useEffect(() => {
    if (chart && bar.current) {
      const yScale = getScale({
        id: yAxisId,
        type: 'y',
      }) as D3ScaleLinear<D>;
      const xScale = getScale({
        id: xAxisId,
        type: 'x',
      }) as D3ScaleBand<D>;
      bar.current.keys = {
        xKey,
        yKey,
      };
      bar.current.update(data);
      bar.current.updateScales({
        x: xScale,
        y: yScale,
      });
    }
  }, [
    chart,
    data,
    xAxisId,
    xKey,
    yAxisId,
    yKey,
    dims,
    margin,
    getScale,
  ]);

  return null;
};

export default ReactD3Bar;
