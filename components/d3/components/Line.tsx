import {
  useEffect,
  useRef,
} from 'react';
import Line, { ID3Line } from '../../../d3/chartElements/Line/Line';
import useRenderTrace from '../../../hooks/useRenderTrace';
import {
  D3ContextGetScales,
  useD3Context,
} from '../context/D3Context';

import type { D3ScaleLinear } from '../../../d3/Scales';
import type D3ScaleBand from '../../../d3/Scales/ScaleBand';

type ReactLineProps<
D extends Record<string, unknown>,
> = Expand<Omit<
ID3Line<D>
, 'xScale' | 'colorScale' | 'yScale' | 'chart'
> & {
  yAxisId?: string,
  xAxisId?: string,
  colorScaleId?: string,
}>

const getLineScales = (
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
  }) as D3ScaleLinear<any> | D3ScaleBand<any>;
  const xScale = getScale({
    id: xAxisId,
    type: 'x',
  }) as D3ScaleLinear<any> | D3ScaleBand<any>;

  return {
    xScale,
    yScale,
  };
};

const ReactD3Line = <
D extends Record<string, unknown>,
>({
    data,
    filter,
    series,
    alpha = 0.5,
    transitionMs,
    withDots,
    mouseOut,
    mouseMove,
    mouseOver,
    yAxisId,
    xAxisId,
    colorScaleId,
  }: ReactLineProps<D>) => {
  const line = useRef<Line<D> | null>(null);
  const {
    chart,
    dims,
    scales,
    margin,
    getScale,
  } = useD3Context();

  useRenderTrace('line', {
    data,
    filter,
    series,
    alpha,
    transitionMs,
    withDots,
    mouseOut,
    mouseMove,
    mouseOver,
    yAxisId,
    xAxisId,
    colorScaleId,
    chart,
    dims,
    scales,
    margin,
    getScale,
  });

  useEffect(() => {
    if (chart && scales.length) {
      const {
        yScale,
        xScale,
      } = getLineScales({
        xAxisId,
        yAxisId,
      }, getScale);

      line.current = new Line({
        chart,
        xScale,
        yScale,
        data,
        alpha,
        series,
        withDots,
        filter,
        transitionMs,
        mouseOut,
        mouseMove,
        mouseOver,
      });
    }
  }, [
    chart,
    scales,
    alpha,
    data,
    series,
    filter,
    withDots,
    transitionMs,
    mouseOut,
    mouseMove,
    mouseOver,
    xAxisId,
    yAxisId,
    getScale,
  ]);

  useEffect(() => {
    if (chart && scales.length && line.current) {
      line.current.updateScales();
    }
  }, [
    chart,
    scales,
    dims,
    margin,
    series,
    yAxisId,
    xAxisId,
    colorScaleId,
  ]);

  return null;
};

export default ReactD3Line;
