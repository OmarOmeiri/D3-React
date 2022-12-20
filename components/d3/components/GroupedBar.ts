import { isEqual } from 'lodash';
import {
  useEffect,
  useRef,
} from 'react';
import GroupedBar, { ID3GroupedBar } from '../../../d3/chartElements/GroupedBar/GroupedBar';
import D3ScaleBand from '../../../d3/Scales/ScaleBand';
import { typedMemo } from '../../../utils/react/typedMemo';
import {
  D3ContextGetScales,
  useD3Context,
} from '../context/D3Context';

import type D3ScaleOrdinal from '../../../d3/Scales/ScaleOrdinal';
import type { D3AxedScales } from '../../../d3/Scales/types';

type ReactGBarProps<
D extends Record<string, unknown>,
> = Expand<Omit<
ID3GroupedBar<D>
, 'xScale' | 'colorScale' | 'yScale' | 'chart'
> & {
  yAxisId?: string,
  xAxisId?: string,
  colorScaleId?: string,
}>

const getGBarScales = (
  {
    yAxisId,
    xAxisId,
    colorScaleId,
  }:{
    yAxisId?: string,
    xAxisId?: string,
    colorScaleId?: string
  },
  getScale: D3ContextGetScales,
) => {
  const yScale = getScale({
    id: yAxisId,
    type: 'y',
  }) as unknown as D3AxedScales<any>;
  const xScale = getScale({
    id: xAxisId,
    type: 'x',
  }) as unknown as D3ScaleBand<any>;

  const colorScale = getScale({
    id: colorScaleId,
    mightNotExist: true,
  })as D3ScaleOrdinal<any>;

  return {
    xScale,
    yScale,
    colorScale,
  };
};

const ReactD3GroupedBar = typedMemo(<
D extends Record<string, unknown>,
>({
    data,
    colorKey,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    transitionMs,
    yAxisId,
    xAxisId,
    colorScaleId,
    groupPadding,
    strokeOpacity,
    series,
    groupKey,
    disableZoom,
    crosshair,
    formatCrosshair,
    filter,
    mouseOut,
    mouseMove,
    mouseOver,
  }: ReactGBarProps<D>) => {
  const gBar = useRef<GroupedBar<D> | null>(null);
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
        colorScale,
      } = getGBarScales({
        xAxisId,
        yAxisId,
        colorScaleId,
      }, getScale);

      gBar.current = new GroupedBar({
        chart,
        data,
        xScale,
        yScale,
        colorScale,
        colorKey,
        groupPadding,
        fill,
        fillOpacity,
        stroke,
        strokeWidth,
        transitionMs,
        strokeOpacity,
        series,
        groupKey,
        disableZoom,
        crosshair,
        formatCrosshair,
        filter,
        mouseOut,
        mouseMove,
        mouseOver,
      });
    }
  }, [
    chart,
    data,
    colorKey,
    groupPadding,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    transitionMs,
    strokeOpacity,
    series,
    groupKey,
    disableZoom,
    crosshair,
    formatCrosshair,
    scales,
    xAxisId,
    yAxisId,
    colorScaleId,
    getScale,
    filter,
    mouseOut,
    mouseMove,
    mouseOver,
  ]);

  useEffect(() => {
    if (chart && scales.length && gBar.current && dims) {
      gBar.current.update().all();
    }
  }, [
    chart,
    scales,
    dims,
    margin,
  ]);

  return null;
}, (prev, next) => {
  const keys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)])) as (keyof ReactGBarProps<any>)[];
  for (const key of keys) {
    if (key === 'formatCrosshair') {
      if (
        prev?.formatCrosshair?.x?.toString() !== next?.formatCrosshair?.x?.toString()
        || prev?.formatCrosshair?.y?.toString() !== next?.formatCrosshair?.y?.toString()
      ) return false;
      continue;
    }

    if (prev[key] !== next[key]) {
      return false;
    }
  }

  return true;
});

(ReactD3GroupedBar as React.FC).displayName = 'ReactD3GroupedBar';
export default ReactD3GroupedBar;
