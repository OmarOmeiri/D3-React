import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { D3isMouseWithinBounds } from '../../../../d3/chartElements/Mouse/helpers/isMouseWithin';
import Tooltip from '../../../../d3/chartElements/Tooltip/Tooltip';
import { D3Classes } from '../../../../d3/consts/classes';
import { ID3TooltipDataMulti } from '../../../../d3/types';
import { useD3Context } from '../../context/D3Context';
import classes from '../css/Tooltip.module.css';
import {
  D3TooltipArrow,
  setTooltipPositioning,
} from './helpers/tooltip';
import TooltipTabledKeyValuePair from './TooltipTabledKeyValuePair';

type Props<D extends Record<string, unknown>> = {
  dy?: number,
  dx?: number,
  data: ID3TooltipDataMulti<D> | null,
  arrow?: D3TooltipArrow,
  mouseFollow?: boolean,
  labelFormatter?: (label: string) => string,
  valueFormatter?: (value: unknown) => unknown,
  colorKey?: 'fill' | 'stroke'
}

const styles: React.CSSProperties = {
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
};

const ReactD3TooltipMulti = <D extends Record<string, unknown>>({
  dy = 15,
  dx = 20,
  data,
  mouseFollow = true,
  labelFormatter,
  valueFormatter,
  colorKey,
  arrow,
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

  const onMouseMove = useCallback((e: any, x: number, y: number) => {
    if (elemRef.current && chart && refInit && data) {
      if (!D3isMouseWithinBounds(e, chart)) {
        elemRef.current.style.visibility = 'hidden';
        return;
      }
      setTooltipPositioning({
        node: elemRef.current,
        position: data.position,
        mouseFollow,
        chart,
        arrow,
        x,
        y,
        dx,
        dy,
      });
    }
  }, [
    chart,
    arrow,
    dx,
    dy,
    data,
    refInit,
    mouseFollow,
  ]);

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
    refInit,
    dx,
    dy,
    ref,
    onMouseMove,
    onMouseOut,
  ]);

  if (!data || !data.attrs || !data.data) return null;
  return (
    <div style={styles} ref={setRef} className={`${D3Classes.tooltip} ${classes.TooltipWrapper}`}>
      {
        TooltipTabledKeyValuePair({
          data,
          colorKey,
          labelFormatter,
          valueFormatter,
        })
      }
    </div>
  );
};

export default ReactD3TooltipMulti;
