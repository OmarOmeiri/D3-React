import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Tooltip from '../../../../d3/chartElements/Tooltip/Tooltip';
import { D3Classes } from '../../../../d3/consts/classes';
import { ID3TooltipDataSingle } from '../../../../d3/types';
import { useD3Context } from '../../context/D3Context';
import classes from '../css/Tooltip.module.css';
import {
  D3TooltipArrow,
  D3TooltipColorKey,
  getTooltipColor,
  setTooltipPositioning,
} from './helpers/tooltip';

type Props<D extends Record<string, unknown>> = {
  dy?: number,
  dx?: number,
  arrow?: D3TooltipArrow,
  data: ID3TooltipDataSingle<D> | null | undefined,
  colorKey?: D3TooltipColorKey,
  children?: React.ReactNode
  mouseFollow?: boolean,
  labelFormatter?: (label: string) => string,
  valueFormatter?: (value: unknown) => unknown,
}

const styles: React.CSSProperties = {
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
};

const ReactD3TooltipSingle = <D extends Record<string, unknown>>({
  dy = 30,
  dx = 15,
  arrow,
  data,
  colorKey,
  children,
  mouseFollow = true,
  labelFormatter = (label) => label,
  valueFormatter = (value) => String(value),
}: Props<D>) => {
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
    if (elemRef.current && chart && refInit && data) {
      setTooltipPositioning({
        position: data.position,
        node: elemRef.current,
        mouseFollow,
        chart,
        arrow,
        x,
        y,
        dx,
        dy,
      });
    }
  }, [chart, dx, dy, refInit, data, arrow, mouseFollow]);

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

  if (!data && !children) return null;
  if (children === null) return null;
  if (children) {
    return (
      <div style={styles} ref={setRef} className={`${D3Classes.tooltip} ${classes.TooltipWrapper}`}>
        {children}
      </div>
    );
  }
  if (!data) return null;
  const value = data.data[data.attrs.yKey];
  if (!value && value !== 0) return null;
  return (
    <div style={styles} ref={setRef} className={`${D3Classes.tooltip} ${classes.TooltipWrapper}`}>
      {
      data.attrs.name
        ? (
          <div className={classes.TooltipLabel} style={{ color: getTooltipColor(data.attrs, colorKey) }}>
            {labelFormatter(data.attrs.name)}
          </div>
        )
        : null
       }
      <div className={classes.TooltipContent}>
        {
          String(valueFormatter(value))
        }
      </div>
    </div>
  );
};

export default ReactD3TooltipSingle;
