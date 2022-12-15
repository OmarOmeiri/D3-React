import {
  useEffect,
  useRef,
} from 'react';
import Violin, { ID3Violin } from '../../../d3/chartElements/Violin/Violin';
import {
  D3ContextGetScales,
  useD3Context,
} from '../context/D3Context';

import type { D3ScaleLinear } from '../../../d3/Scales';
import type D3ScaleBand from '../../../d3/Scales/ScaleBand';

type ReactD3ViolinProps<
D extends Record<string, unknown>,
> = Expand<Omit<
ID3Violin<D>
, 'xScale' | 'colorScale' | 'yScale' | 'chart'
> & {
  yAxisId?: string,
  xAxisId?: string,
}>

const getViolinScales = (
  {
    yAxisId,
    xAxisId,
  }:{
    yAxisId?: string,
    xAxisId?: string,
  },
  getScale: D3ContextGetScales,
) => {
  const yScale = getScale({
    id: yAxisId,
    type: 'y',
  }) as D3ScaleLinear<any>;
  const xScale = getScale({
    id: xAxisId,
    type: 'x',
  }) as D3ScaleBand<any>;

  return {
    xScale,
    yScale,
  };
};

const ReactD3Violin = <
D extends Record<string, unknown>,
>({
    data,
    filter,
    series,
    yAxisId,
    xAxisId,
    disableZoom,
    transitionMs,
    crosshair,
  }: ReactD3ViolinProps<D>) => {
  const violin = useRef<Violin<D> | null>(null);
  const {
    chart,
    dims,
    scales,
    margin,
    getScale,
  } = useD3Context();

  useEffect(() => {
    if (chart && scales.length) {
      const {
        yScale,
        xScale,
      } = getViolinScales({
        xAxisId,
        yAxisId,
      }, getScale);

      violin.current = new Violin<D>({
        chart,
        yScale,
        xScale,
        data,
        filter,
        series,
        crosshair,
        disableZoom,
        transitionMs,
      });
    }
  }, [
    chart,
    scales,
    data,
    xAxisId,
    yAxisId,
    series,
    disableZoom,
    crosshair,
    transitionMs,
    filter,
    getScale,
  ]);

  useEffect(() => {
    if (chart && scales.length && violin.current) {
      violin.current.updateScales();
    }
  }, [
    chart,
    scales,
    dims,
    margin,
    yAxisId,
    xAxisId,
  ]);

  return null;
};

export default ReactD3Violin;
