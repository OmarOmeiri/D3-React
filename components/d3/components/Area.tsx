import {
  useEffect,
  useRef,
} from 'react';
import Area, { ID3Area } from '../../../d3/chartElements/Area/Area';
import useRenderTrace from '../../../hooks/useRenderTrace';
import {
  D3ContextGetScales,
  useD3Context,
} from '../context/D3Context';

import type { D3ScaleLinear } from '../../../d3/Scales';
import type D3ScaleBand from '../../../d3/Scales/ScaleBand';

type ReactAreaProps<
D extends Record<string, unknown>,
> = Expand<Omit<
ID3Area<D>
, 'xScale' | 'colorScale' | 'yScale' | 'chart'
> & {
  yAxisId?: string,
  xAxisId?: string,
  colorScaleId?: string,
}>

const getAreaScales = (
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

const ReactD3Area = <
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
  }: ReactAreaProps<D>) => {
  const area = useRef<Area<D> | null>(null);
  const {
    chart,
    dims,
    scales,
    margin,
    getScale,
  } = useD3Context();

  useRenderTrace('area', {
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
      } = getAreaScales({
        xAxisId,
        yAxisId,
      }, getScale);

      area.current = new Area({
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
    if (chart && scales.length && area.current) {
      area.current.updateScales();
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

export default ReactD3Area;
