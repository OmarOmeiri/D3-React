import { ScaleBand } from 'd3';
import {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { D3Scales } from '../../../d3/Scales/types';
import { PortalByRef } from '../../../hoc/PortalByRef';
import { validateChildProps } from '../../../utils/react/validateChildProps';
import {
  D3ContextGetScales,
  useD3Context,
} from '../context/D3Context';

import type D3Chart from '../../../d3/Chart';
import type { D3Dimensions } from '../../../d3/Dimensions';

type ChartOverlayPositionH =
| 'left'
| 'right'
| 'center'
| 'inner-left'
| 'inner-right'
| 'inner-center'
| number;
type ChartOverlayPositionV =
| 'top'
| 'bottom'
| 'center'
| 'inner-top'
| 'inner-bottom'
| 'inner-center'
| number;

type ChartOverlayPositionScaled = number | Date | string;

interface ID3ChartOverlay {
  children: React.ReactElement<any>
}

type TD3ChartOverlayElementXYScaled = {
  position: {
    x: ChartOverlayPositionH | ChartOverlayPositionScaled,
    y: ChartOverlayPositionV | ChartOverlayPositionScaled,
  },
  xScaleId: string,
  yScaleId: string,
  children: React.ReactNode,
}

type TD3ChartOverlayElementYScaled = {
  position: {
    x: ChartOverlayPositionH,
    y: ChartOverlayPositionV | ChartOverlayPositionScaled,
  },
  xScaleId?: undefined,
  yScaleId: string,
  children: React.ReactNode,
}

type TD3ChartOverlayElementXScaled = {
  position: {
    x: ChartOverlayPositionH | ChartOverlayPositionScaled,
    y: ChartOverlayPositionV,
  },
  xScaleId: string,
  yScaleId?: undefined,
  children: React.ReactNode,
}

type TD3ChartOverlayElementUnScaled = {
  position: {
    x: ChartOverlayPositionH,
    y: ChartOverlayPositionV,
  },
  xScaleId?: undefined,
  yScaleId?: undefined,
  children: React.ReactNode,
}

type TD3ChartOverlayElement = {
  position: {
    x: ChartOverlayPositionH | ChartOverlayPositionScaled,
    y: ChartOverlayPositionV | ChartOverlayPositionScaled,
  },
  xScaleId?: string,
  yScaleId?: string,
  children: React.ReactNode,
}

const chartOverlayElementStyle: React.CSSProperties = {
  overflow: 'visible',
  position: 'absolute',
  opacity: '0',
};

const clampPosition = (
  value: number,
  dims: D3Dimensions,
  node: HTMLDivElement,
  type: 'left' | 'top',
) => (
  type === 'left'
    ? `${Math.min(Math.max(value, 0), (dims.width - node.offsetWidth - 5))}px`
    : `${Math.min(Math.max(value, 0), (dims.height - node.offsetHeight))}px`
);

const getScaledValue = ({
  value,
  scale,
  node,
  type,
  chart,
}:{
  value: number | Date | string,
  scale: D3Scales<any>,
  node: HTMLDivElement,
  type: 'left' | 'top',
  chart: D3Chart,
}) => {
  const offset = (type === 'left'
    ? node.offsetWidth
    : node.offsetHeight) / 2;

  const margin = type === 'left'
    ? chart.dims.margin.left
    : chart.dims.margin.top;

  const scl = scale.getScale();
  const bandWidth = (('bandwidth' in scl)
    ? (scl as ScaleBand<any>).bandwidth()
    : 0) / 2;

  return Number(scl(value as any))
  + margin
  + bandWidth
  - offset;
};

const getPositionLeft = ({
  x,
  node,
  chart,
  scale,
}:{
  x: ChartOverlayPositionH | ChartOverlayPositionScaled,
  node: HTMLDivElement,
  chart: D3Chart,
  scale?: D3Scales<any>
}) => {
  if (typeof x === 'number' && !scale) {
    return clampPosition(x, chart.dims, node, 'left');
  }
  let left = 0;
  switch (x) {
    case 'left':
      left = 0;
      break;
    case 'inner-left':
      left = chart.dims.margin.left;
      break;
    case 'right':
      left = chart.dims.width;
      break;
    case 'inner-right':
      left = chart.dims.width - chart.dims.margin.right - node.offsetWidth;
      break;
    case 'center':
      left = (chart.dims.width / 2) - (node.offsetWidth / 2);
      break;
    case 'inner-center':
      left = (chart.dims.innerDims.width / 2) + chart.dims.margin.left - (node.offsetWidth / 2);
      break;
    default: {
      if (scale) {
        return clampPosition(
          getScaledValue({
            value: x,
            scale,
            chart,
            node,
            type: 'left',
          }),
          chart.dims,
          node,
          'left',
        );
      }
      throw new Error(`XScale not found: ${x}`);
    }
  }
  return clampPosition(left, chart.dims, node, 'left');
};

const getPositionTop = ({
  y,
  node,
  chart,
  scale,
}:{
  y: ChartOverlayPositionV | ChartOverlayPositionScaled,
  node: HTMLDivElement,
  scale?: D3Scales<any>,
  chart: D3Chart
}) => {
  if (typeof y === 'number' && !scale) {
    return clampPosition(y, chart.dims, node, 'top');
  }

  let top = 0;
  switch (y) {
    case 'top':
      top = 0;
      break;
    case 'inner-top':
      top = chart.dims.margin.top;
      break;
    case 'bottom':
      top = chart.dims.height;
      break;
    case 'inner-bottom':
      top = chart.dims.height - chart.dims.margin.bottom - node.offsetHeight;
      break;
    case 'center':
      top = (chart.dims.height / 2) - (node.offsetHeight / 2);
      break;
    case 'inner-center':
      top = (chart.dims.innerDims.height / 2) + chart.dims.margin.top - (node.offsetHeight / 2);
      break;
    default: {
      if (scale) {
        return clampPosition(
          getScaledValue({
            value: y,
            scale,
            chart,
            node,
            type: 'top',
          }),
          chart.dims,
          node,
          'top',
        );
      }
      throw new Error(`yScale not found: ${y}`);
    }
  }
  return clampPosition(top, chart.dims, node, 'top');
};

const getElementPosition = ({
  node,
  getScale,
  chart,
  xScaleId,
  yScaleId,
  position,
}:{
  node: HTMLDivElement,
  getScale: D3ContextGetScales,
  xScaleId: string | undefined,
  yScaleId: string | undefined,
  chart: D3Chart,
  position: {
    x: string | number | Date;
    y: string | number | Date;
  }
}): {top: string, left: string, opacity: string} => {
  const xScale = xScaleId
    ? getScale({
      id: xScaleId,
      type: 'x',
    })
    : undefined;

  const yScale = yScaleId
    ? getScale({
      id: yScaleId,
      type: 'y',
    })
    : undefined;

  return {
    top: getPositionTop({ y: position.y, node, chart, scale: yScale }),
    left: getPositionLeft({ x: position.x, node, chart, scale: xScale }),
    opacity: '1',
  };
};

export function D3ChartOverlayElement(params: TD3ChartOverlayElementXYScaled): JSX.Element | null
export function D3ChartOverlayElement(params: TD3ChartOverlayElementYScaled): JSX.Element | null
export function D3ChartOverlayElement(params: TD3ChartOverlayElementXScaled): JSX.Element | null
export function D3ChartOverlayElement(params: TD3ChartOverlayElementUnScaled): JSX.Element | null
export function D3ChartOverlayElement({
  position,
  xScaleId,
  yScaleId,
  children,
}: TD3ChartOverlayElement) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { dims, getScale, chart } = useD3Context();

  const refCb = useCallback((node: HTMLDivElement | null) => {
    if (node && dims && chart) {
      ref.current = node;
      const {
        top,
        left,
        opacity,
      } = getElementPosition({
        node,
        getScale,
        xScaleId,
        yScaleId,
        chart,
        position,
      });
      node.style.top = top;
      node.style.left = left;
      node.style.opacity = opacity;
    }
  }, [
    position,
    dims,
    chart,
    getScale,
    yScaleId,
    xScaleId,
  ]);

  useEffect(() => {
    if (ref.current && dims && chart) {
      const {
        top,
        left,
        opacity,
      } = getElementPosition({
        node: ref.current,
        getScale,
        xScaleId,
        yScaleId,
        chart,
        position,
      });
      ref.current.style.top = top;
      ref.current.style.left = left;
      ref.current.style.opacity = opacity;
    }
  }, [
    position,
    dims,
    chart,
    getScale,
    yScaleId,
    xScaleId,
  ]);

  if (!dims) return null;

  return (
    <div
      ref={refCb}
      style={chartOverlayElementStyle}>
      {children}
    </div>
  );
}

export default function D3ChartOverlay({
  children,
}: ID3ChartOverlay) {
  const { chartOverlayRef } = useD3Context();
  useEffect(() => {
    validateChildProps(children, ['position']);
  }, [children]);

  if (!chartOverlayRef.current) return null;

  return (
    <PortalByRef container={chartOverlayRef.current}>
      {children}
    </PortalByRef>
  );
}
