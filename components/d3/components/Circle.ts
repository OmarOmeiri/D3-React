import {
  useEffect,
  useRef,
} from 'react';
import Circle, { ID3Circle } from '../../../d3/chartElements/Circle/Circle';
import useRenderTrace from '../../../hooks/useRenderTrace';
import {
  D3ContextGetScales,
  useD3Context,
} from '../context/D3Context';

import type D3ScaleOrdinal from '../../../d3/Scales/ScaleOrdinal';
import type { D3ScaleLinear } from '../../../d3/Scales';
import type D3ScaleBand from '../../../d3/Scales/ScaleBand';

type ReactCircleProps<
D extends Record<string, unknown>,
> = Expand<Omit<
ID3Circle<D>
, 'xScale' | 'colorScale' | 'yScale' | 'chart'
> & {
  yAxisId?: string,
  xAxisId?: string,
  colorScaleId?: string,
}>

const getCircleScales = (
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
  }) as D3ScaleLinear<any> | D3ScaleBand<any>;
  const xScale = getScale({
    id: xAxisId,
    type: 'x',
  }) as D3ScaleLinear<any> | D3ScaleBand<any>;

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

const ReactD3Circle = <
D extends Record<string, unknown>,
>({
    data,
    filter,
    colorKey,
    xKey,
    yKey,
    rKey,
    radius,
    radiusNorm,
    dataJoinKey,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    transitionMs,
    mouseOut,
    mouseMove,
    mouseOver,
    yAxisId,
    xAxisId,
    colorScaleId,
  }: ReactCircleProps<D>) => {
  const circle = useRef<Circle<D> | null>(null);
  const {
    chart,
    dims,
    scales,
    margin,
    getScale,
  } = useD3Context();

  // useRenderTrace('circle', {
  //   chart,
  //   scales,
  //   dims,
  //   margin,
  //   colorKey,
  //   data,
  //   xKey,
  //   yKey,
  //   rKey,
  //   radius,
  //   radiusNorm,
  //   dataJoinKey,
  //   fill,
  //   stroke,
  //   strokeWidth,
  //   yAxisId,
  //   xAxisId,
  //   colorScaleId,
  //   transitionMs,
  //   getScale,

  // });

  useEffect(() => {
    if (chart && scales.length) {
      const {
        yScale,
        xScale,
        colorScale,
      } = getCircleScales({
        xAxisId,
        yAxisId,
        colorScaleId,
      }, getScale);

      circle.current = new Circle({
        chart,
        xScale,
        yScale,
        colorScale,
        colorKey,
        data,
        filter,
        xKey,
        yKey,
        rKey,
        radius,
        radiusNorm,
        fillOpacity,
        dataJoinKey,
        fill,
        stroke,
        strokeWidth,
        transitionMs,
        mouseOut,
        mouseMove,
        mouseOver,
      });
    }
  }, [
    chart,
    scales,
    data,
    colorKey,
    filter,
    xKey,
    yKey,
    rKey,
    radius,
    radiusNorm,
    dataJoinKey,
    fill,
    fillOpacity,
    stroke,
    strokeWidth,
    yAxisId,
    xAxisId,
    colorScaleId,
    transitionMs,
    getScale,
    mouseOut,
    mouseMove,
    mouseOver,
  ]);

  useEffect(() => {
    if (chart && scales.length && circle.current) {
      circle.current.updateScales();
    }
  }, [
    chart,
    scales,
    dims,
    margin,
    yAxisId,
    xAxisId,
    colorScaleId,
  ]);

  return null;
};

export default ReactD3Circle;
