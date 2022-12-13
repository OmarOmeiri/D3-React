import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import Tooltip from '../../../d3/chartElements/Tooltip/Tooltip';
import { D3Classes } from '../../../d3/consts/classes';
import { ID3TooltipData } from '../../../d3/types';
import { colorToRgba } from '../../../utils/Color/colorFuncs';
import { useD3Context } from '../context/D3Context';

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
  dy = 30,
  dx = 15,
  data,
  labelFormatter,
  valueFormatter,
  colorKey,
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

  if (!data || !data.attrs || !data.data) return null;
  return (
    <div style={styles} ref={elemRef} className={D3Classes.tooltip}>
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
