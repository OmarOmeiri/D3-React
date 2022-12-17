import type D3Chart from '../../../../../d3/Chart';
import { ID3TooltipAttrs } from '../../../../../d3/types';
import { colorToRgba } from '../../../../../utils/Color/colorFuncs';
import classes from '../../css/Tooltip.module.css';

export type D3TooltipArrow = 'top' | 'left' | 'under' | 'right';
export type D3TooltipColorKey = 'fill' | 'stroke';

export const getTooltipY = (
  tip: HTMLDivElement,
  chart: D3Chart,
  y: number,
  dy: number,
) => {
  const tooltipHeight = tip.clientHeight;

  if (tooltipHeight >= (chart.dims.innerDims.height / 2) * 0.9) {
    return y;
  }

  const tooltipBottom = y + tooltipHeight;
  const maxTop = (
    chart.dims.innerDims.height
    + chart.dims.innerDims.top
    + chart.dims.top
  );

  let adjustedY = y;
  if (tooltipBottom >= maxTop) {
    adjustedY = y - tooltipHeight - dy - 10;
  }

  return adjustedY;
};

export const getTooltipX = (
  tip: HTMLDivElement,
  chart: D3Chart,
  x: number,
  dx: number,
) => {
  const tooltipWidth = tip.clientWidth;

  if (tooltipWidth >= (chart.dims.innerDims.width / 2) * 0.9) {
    return x;
  }

  const tooltipLeft = x + tooltipWidth;
  const maxLeft = (
    chart.dims.innerDims.width
    + chart.dims.innerDims.left
    + chart.dims.left
  );

  let adjustedX = x;
  if (tooltipLeft >= maxLeft) {
    adjustedX = x - tooltipWidth - dx - 10;
  }

  return adjustedX;
};

export const getArrowOffset = (type?: D3TooltipArrow) => {
  switch (type) {
    case 'left':
      return { left: 6, top: 0 };
    case 'top':
      return { left: 0, top: 6 };
    case 'right':
      return { left: -6, top: 0 };
    case 'under':
      return { left: 0, top: -6 };
    default:
      return { left: 0, top: 0 };
  }
};

export const getArrowClass = (type?: D3TooltipArrow) => {
  switch (type) {
    case 'left':
      return classes.TooltipArrowLeft;
    case 'top':
      return classes.TooltipArrowTop;
    case 'right':
      return classes.TooltipArrowRight;
    case 'under':
      return classes.TooltipArrowUnder;
    default:
      return undefined;
  }
};

export const setTooltipPositioning = ({
  position,
  node,
  chart,
  arrow,
  mouseFollow,
  x,
  y,
  dx,
  dy,
}:{
  position?: {x: number, y: number} | null,
  node: HTMLDivElement,
  chart: D3Chart,
  arrow?: D3TooltipArrow,
  mouseFollow: boolean
  x: number,
  y: number,
  dx: number,
  dy: number
}) => {
  const arrowOffset = getArrowOffset(arrow);
  const arrowClass = getArrowClass(arrow);
  if (arrowClass) node.classList.add(arrowClass);
  if (position && !mouseFollow) {
    node.style.visibility = 'visible';
    node.style.top = `${position.y + chart.dims.margin.top - node.offsetHeight + arrowOffset.top}px`;
    node.style.left = `${position.x + chart.dims.margin.left - (node.offsetWidth / 2) + arrowOffset.left}px`;
    return;
  }
  const tooltipY = getTooltipY(
    node,
    chart,
    y,
    dy,
  );

  const tooltipX = getTooltipX(
    node,
    chart,
    x,
    dx,
  );

  node.style.visibility = 'visible';
  node.style.top = `${tooltipY}px`;
  node.style.left = `${tooltipX}px`;
};

const omitColorNone = (
  color: string | undefined,
  fallback: string | undefined = undefined,
) => {
  if (!color) return fallback;
  if (color.trim() === 'none') return fallback;
  return color;
};

export const getTooltipColor = (
  attrs?: ID3TooltipAttrs<any>,
  colorKey?: D3TooltipColorKey,
) => {
  if (!attrs) return 'inherit';
  let color: string | undefined;
  let opacity: string;
  if (colorKey) {
    color = omitColorNone(attrs[colorKey]);
    opacity = (
      colorKey === 'fill'
        ? omitColorNone(attrs.fillOpacity)
        : omitColorNone(attrs.strokeOpacity)
    ) || '1';
  } else {
    color = omitColorNone(attrs.stroke) || omitColorNone(attrs.fill);
    opacity = (
      attrs.stroke
        ? omitColorNone(attrs.strokeOpacity)
        : omitColorNone(attrs.fillOpacity)
    ) || '1';
  }

  if (!color) return 'inherit';

  return colorToRgba(color, { a: opacity }).toString();
};
