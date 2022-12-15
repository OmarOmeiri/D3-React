import type D3Chart from '../../../../d3/Chart';
import classes from '../css/Tooltip.module.css';

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

export const getArrowOffset = (type?: 'top' | 'left' | 'under' | 'right') => {
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

export const getArrowClass = (type?: 'top' | 'left' | 'under' | 'right') => {
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
