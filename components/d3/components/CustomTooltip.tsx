import {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import Tooltip from '../../../d3/chartElements/Tooltip/Tooltip';
import { D3Classes } from '../../../d3/consts/classes';
import { useD3Context } from '../context/D3Context';

type Props<D extends Record<string, unknown>> = {
  dy?: number,
  dx?: number,
  children: React.ReactNode
}

const styles: React.CSSProperties = {
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
};

const ReactD3CustomTooltip = <D extends Record<string, unknown>>({
  dy = 30,
  dx = 15,
  children,
}: Props<D>) => {
  const tooltip = useRef<Tooltip | null>(null);
  const elemRef = useRef<null | HTMLDivElement>(null);

  const {
    chart,
    ref,
  } = useD3Context();

  const onMouseMove = useCallback((_: any, x: number, y: number) => {
    if (elemRef.current && chart) {
      const tooltipWidth = elemRef.current.clientWidth;
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
      elemRef.current.style.visibility = 'visible';
      elemRef.current.style.top = `${y}px`;
      elemRef.current.style.left = `${adjustedX}px`;
    }
  }, [chart, dx]);

  const onMouseOut = useCallback(() => {
    if (elemRef.current) {
      elemRef.current.style.visibility = 'hidden';
    }
  }, []);

  useEffect(() => {
    if (chart && ref.current) {
      tooltip.current = new Tooltip({
        chart,
        dx,
        dy,
        onMouseMove,
        onMouseOut,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart]);

  if (!children) return null;
  return (
    <div style={styles} ref={elemRef} className={D3Classes.tooltip}>
      {children}
    </div>
  );
};

export default ReactD3CustomTooltip;
