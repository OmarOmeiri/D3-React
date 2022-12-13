import { ScaleOrdinal } from 'd3';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import Dot from '@icons/dot.svg';
import LineDot from '@icons/line-dot.svg';
import D3ScaleOrdinal from '../../../d3/Scales/ScaleOrdinal';
import { useD3Context } from '../context/D3Context';
import classes from './css/Legend.module.css';

export type D3LegendItem = {
  id: string,
  name: string,
  active: boolean,
  color?: string
};

type Props = {
  colorScaleId: string
  items: D3LegendItem[]
  type: 'line' | 'dot',
  style?: React.CSSProperties
  onClick: (item: D3LegendItem) => void
} | {
  colorScaleId?: undefined
  items: Required<D3LegendItem>[]
  type: 'line' | 'dot',
  style?: React.CSSProperties
  onClick: (item: D3LegendItem) => void
}

const Icon = ({ type }: {type: Props['type']}) => {
  switch (type) {
    case 'dot':
      return <Dot/>;
    case 'line':
      return <LineDot/>;
    default:
      return null;
  }
};

const getLegendItem = (
  items: D3LegendItem[],
  type: Props['type'],
  onClick: Props['onClick'],
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

const ReactD3Legend = ({
  colorScaleId,
  type,
  items,
  style,
  onClick,
}: Props) => {
  const [colorScale, setColorScale] = useState<ScaleOrdinal<string, unknown, never> | null>(null);

  const {
    getScale,
    scales,
  } = useD3Context();

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
    <div style={style}>
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

export default ReactD3Legend;
