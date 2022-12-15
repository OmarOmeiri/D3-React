import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Tooltip from '../../../d3/chartElements/Tooltip/Tooltip';
import { D3Classes } from '../../../d3/consts/classes';
import { ID3TooltipData } from '../../../d3/types';
import { colorToRgba } from '../../../utils/Color/colorFuncs';
import { useD3Context } from '../context/D3Context';
import {
  getTooltipX,
  getTooltipY,
} from './helpers/tooltip';

type Props<D extends Record<string, unknown>> = {
  dy?: number,
  dx?: number,
  data: ID3TooltipData<D> | null,
  labelFormatter?: (label: string) => string,
  valueFormatter?: (value: unknown) => string,
  colorKey?: 'fill' | 'stroke'
}

const styles: React.CSSProperties = {
  position: 'absolute',
  visibility: 'hidden',
  pointerEvents: 'none',
};

const getColor = (
  attrs?: ID3TooltipData<any>['attrs'][string],
  colorKey?: Props<any>['colorKey'],
) => {
  if (!attrs) return 'rgb(0,0,0)';
  let color: string;
  let opacity: string;
  if (colorKey) {
    color = attrs[colorKey] || '';
    opacity = (
      colorKey === 'fill'
        ? attrs.fillOpacity
        : attrs.strokeOpacity
    ) || '1';
  } else {
    color = attrs.stroke || attrs.fill || '#000000';
    opacity = (
      attrs.stroke
        ? attrs.strokeOpacity
        : attrs.fillOpacity
    ) || '1';
  }

  return colorToRgba(`${color}`, { a: opacity }).toString();
};

const getTooltipContent = <D extends Record<string, unknown>>(
  data: ID3TooltipData<D>,
  colorKey?: 'fill' | 'stroke',
  labelFormatter: Props<any>['labelFormatter'] = (label) => label,
  valueFormatter: Props<any>['valueFormatter'] = (value) => String(value),
) => {
  const xKeys = Array.from(new Set(Object.values(data.attrs).map((a) => a.xKey)));
  const label = xKeys.map((k) => labelFormatter(String(data.data[k]))).join(', ');

  return (
    <>
      <div>
        {label}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'max-content max-content',
      }}>
        {
          Object.entries(data.data)
            .reduce((vals, [key, value]) => {
              if (xKeys.includes(key)) return vals;
              if (String(value) === 'null') return vals;
              return ([
                ...vals,
                <Fragment key={key}>
                  <div style={{ color: getColor(data?.attrs?.[key], colorKey), paddingRight: '1em' }}>
                    {`${data?.attrs?.[key]?.name || key}: `}
                  </div>
                  <div>
                    {`${valueFormatter(value)}`}
                  </div>
                </Fragment>,
              ]);
            }, [] as JSX.Element[])
        }
      </div>
    </>
  );
};

const ReactD3Tooltip = <D extends Record<string, unknown>>({
  dy = 15,
  dx = 20,
  data,
  labelFormatter,
  valueFormatter,
  colorKey,
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
    if (elemRef.current && chart && refInit) {
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
  }, [chart, dx, dy, refInit]);

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
    <div style={styles} ref={setRef} className={D3Classes.tooltip}>
      {
        getTooltipContent(
          data,
          colorKey,
          labelFormatter,
          valueFormatter,
        )
      }
    </div>
  );
};

export default ReactD3Tooltip;
