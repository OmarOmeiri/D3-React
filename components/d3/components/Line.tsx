import {
  useEffect,
  useRef,
} from 'react';
import { ID3AreaLine } from '../../../d3/chartElements/AreaLine/AreaLine';
import Line from '../../../d3/chartElements/Line/Line';
import { typedMemo } from '../../../utils/react/typedMemo';
import {
  D3ContextGetScales,
  useD3Context,
} from '../context/D3Context';

import type { D3ScaleLinear } from '../../../d3/Scales';
import type D3ScaleBand from '../../../d3/Scales/ScaleBand';

type ReactD3LineProps<
D extends Record<string, unknown>,
> = Expand<Omit<
ID3AreaLine<D>
, 'xScale' | 'colorScale' | 'yScale' | 'chart' | 'type'
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

const ReactD3Line = typedMemo(<
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
    disableZoom,
    crosshair,
    yAxisId,
    xAxisId,
    colorScaleId,
    formatCrosshair,
  }: ReactD3LineProps<D>) => {
  const line = useRef<Line<D> | null>(null);
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
        disableZoom,
        crosshair,
        formatCrosshair,
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
    formatCrosshair,
    transitionMs,
    disableZoom,
    crosshair,
    mouseOut,
    mouseMove,
    mouseOver,
    xAxisId,
    yAxisId,
    getScale,
  ]);

  useEffect(() => {
    if (chart && scales.length && line.current && dims) {
      line.current.update().all();
    }
  }, [
    chart,
    scales,
    dims,
    margin,
  ]);

  return null;
}, (prev, next) => {
  const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)])) as (keyof ReactD3LineProps<any>)[];
  for (const key of keys) {
    if (key === 'formatCrosshair') {
      if (
        prev?.formatCrosshair?.x !== next?.formatCrosshair?.x
        || prev?.formatCrosshair?.y !== next?.formatCrosshair?.y
      ) return false;
      continue;
    }

    if (prev[key] !== next[key]) {
      return false;
    }
  }

  return true;
});

export default ReactD3Line;
