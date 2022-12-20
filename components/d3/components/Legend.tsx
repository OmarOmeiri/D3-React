import { ScaleOrdinal } from 'd3';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Dot from '@icons/charts/dot.svg';
import LineDot from '@icons/charts/line-dot.svg';
import Square from '@icons/charts/square.svg';
import D3ScaleOrdinal from '../../../d3/Scales/ScaleOrdinal';
import { useD3Context } from '../context/D3Context';
import classes from './css/Legend.module.css';

export type D3LegendItem = {
  id: string,
  name: string,
  active: boolean,
  color?: string
};

type Props<T extends D3LegendItem> = {
  colorScaleId: string
  items: T[]
  type: 'line' | 'dot' | 'square',
  onClick: (item: T) => void
} | {
  colorScaleId?: undefined
  items: Required<T>[]
  type: 'line' | 'dot' | 'square',
  onClick: (item: T) => void
}

const style = {
  margin: '0 1em',
};

const Icon = <T extends D3LegendItem>({ type }: {type: Props<T>['type']}) => {
  switch (type) {
    case 'dot':
      return <Dot/>;
    case 'line':
      return <LineDot/>;
    case 'square':
      return <Square/>;
    default:
      return null;
  }
};

const getLegendItem = <T extends D3LegendItem>(
  items: T[],
  type: Props<T>['type'],
  onClick: Props<T>['onClick'],
  getColor: (item: D3LegendItem) => string,
) => (
    items.map((i) => (
      <button
      className={`${classes.LegendItem} ${i.active ? classes.LegendItemActive : ''}`}
      key={i.id}
      onClick={() => onClick(i)}
    >
        <span className={classes.LegendDot} style={{ color: getColor(i) || 'inherit' }}>
          <Icon type={type}/>
        </span>
        <span>{i.name}</span>
      </button>
    ))
  );

const ReactD3Legend = <T extends D3LegendItem>({
  colorScaleId,
  type,
  items,
  onClick,
}: Props<T>) => {
  const [colorScale, setColorScale] = useState<ScaleOrdinal<string, unknown, never> | null>(null);
  const legend = useRef<HTMLDivElement | null>(null);

  const {
    getScale,
    scales,
    chart,
    dims,
  } = useD3Context();

  useEffect(() => {
    if (dims && legend.current && chart) {
      legend.current.style.marginTop = `${chart.dims.margin.top}px`;
    }
  }, [dims, chart]);

  useEffect(() => {
    if (scales.length) {
      const colorScl = getScale({
        id: colorScaleId,
        mightNotExist: true,
      }) as D3ScaleOrdinal<any> | undefined;

      setColorScale(() => colorScl?.scale || null);
    }
  }, [
    colorScaleId,
    getScale,
    scales,
  ]);

  const getColor = useCallback((elem: D3LegendItem) => {
    if (colorScale) {
      return String(colorScale(elem.id));
    }
    return elem.color || 'inherit';
  }, [colorScale]);

  return (
    <div style={style} ref={legend}>
      {
        getLegendItem(
          items
            .filter((i) => i.active)
            .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
          type,
          onClick,
          getColor,
        )
      }
      {
        getLegendItem(
          items
            .filter((i) => !i.active)
            .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
          type,
          onClick,
          getColor,
        )
      }
    </div>
  );
};

(ReactD3Legend as React.FC).displayName = 'ReactD3Legend';
export default ReactD3Legend;
