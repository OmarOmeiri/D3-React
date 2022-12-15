import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Tooltip from '../../../d3/chartElements/Tooltip/Tooltip';
import { D3Classes } from '../../../d3/consts/classes';
import { useD3Context } from '../context/D3Context';
import {
  getArrowClass,
  getArrowOffset,
  getTooltipX,
  getTooltipY,
} from './helpers/tooltip';

type Props = {
  dy?: number,
  dx?: number,
  children: React.ReactNode
  position?: {x: number, y: number} | null,
  arrow?: 'top' | 'left' | 'right' | 'under'
}

const styles: React.CSSProperties = {
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
};

const ReactD3CustomTooltip = ({
  dy = 30,
  dx = 15,
  position,
  children,
  arrow,
}: Props) => {
  const tooltip = useRef<Tooltip | null>(null);
  const elemRef = useRef<null | HTMLDivElement>(null);
  const [refInit, setRefInit] = useState(false);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      elemRef.current = node;
      setRefInit(true);
    }
  }, []);

  const {
    chart,
    ref,
  } = useD3Context();

  const onMouseMove = useCallback((_: any, x: number, y: number) => {
    if (elemRef.current && chart && refInit) {
      const arrowClass = getArrowClass(arrow);
      if (arrowClass) elemRef.current.classList.add(arrowClass);
      const arrowOffset = getArrowOffset(arrow);
      if (position) {
        elemRef.current.style.visibility = 'visible';
        elemRef.current.style.top = `${position.y + (elemRef.current.offsetHeight / 2) + arrowOffset.top}px`;
        elemRef.current.style.left = `${position.x + chart.dims.margin.left - (elemRef.current.offsetWidth / 2) + arrowOffset.left}px`;
        return;
      }
      const tooltipY = getTooltipY(
        elemRef.current,
        chart,
        y,
        dy,
      );

      const tooltipX = getTooltipX(
        elemRef.current,
        chart,
        x,
        dx,
      );

      elemRef.current.style.visibility = 'visible';
      elemRef.current.style.top = `${tooltipY}px`;
      elemRef.current.style.left = `${tooltipX}px`;
    }
  }, [chart, dx, dy, refInit, position, arrow]);

  const onMouseOut = useCallback(() => {
    if (elemRef.current) {
      elemRef.current.style.visibility = 'hidden';
    }
  }, []);

  useEffect(() => {
    if (chart && ref.current && refInit) {
      tooltip.current = new Tooltip({
        chart,
        dx,
        dy,
        onMouseMove,
        onMouseOut,
      });
    }
  }, [
    chart,
    dx,
    dy,
    onMouseMove,
    onMouseOut,
    ref,
    refInit,
  ]);

  if (!children) return null;
  return (
    <div style={styles} ref={setRef} className={D3Classes.tooltip}>
      {children}
    </div>
  );
};

export default ReactD3CustomTooltip;
