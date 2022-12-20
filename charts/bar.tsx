import dayjs from 'dayjs';
import dayjsFormat from 'dayjs/plugin/customParseFormat';
import React, {
  useCallback,
  useRef,
  useState,
} from 'react';
import ReactD3Chart from '../components/d3/Chart/Chart';
import ReactD3Bar from '../components/d3/components/Bar';
import ReactD3TooltipSingle from '../components/d3/components/Tooltip/TooltipSingle';
import ReactD3ScaleBand from '../components/d3/Scales/ScaleBand';
import ReactD3ScaleColorSequential from '../components/d3/Scales/ScaleColorSequential';
import ReactD3ScaleLinear from '../components/d3/Scales/ScaleLinear';
import { ID3TooltipDataSingle } from '../d3/types';
import { revenues } from '../data/revenues';
import styles from '../styles/Home.module.css';
import { formatCurrency } from '../utils/format';

dayjs.extend(dayjsFormat);

export const BarChart = () => {
  const [label, setLabel] = useState('Lucro');
  const [data, setData] = useState(revenues);
  const flag = useRef(true);
  const [yKey, setYkey] = useState<'profit' | 'revenue'>('profit');
  const [tooltipState, setTooltipState] = useState<ID3TooltipDataSingle<typeof data[number]> | null>(null);

  const changeK = () => {
    // setYkey((k) => {
    //   if (k === 'profit') return 'revenue';
    //   return 'profit';
    // });
    flag.current = !flag.current;
    setData(
      flag.current
        ? revenues
        : revenues.slice(1),
    );
  };

  const setTooltipData = useCallback((d: ID3TooltipDataSingle<typeof data[number]>) => {
    setTooltipState(d);
  }, []);

  const removeTooltipData = useCallback(() => {
    setTooltipState(null);
  }, []);

  return (
    <>
      <button onClick={changeK}>Change</button>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <ReactD3Chart margin={{
            bottom: 120,
            left: 80,
            top: 80,
            right: 80,
          }}>
            <ReactD3ScaleLinear
              id='y-linear'
              data={data}
              dataKey={yKey}
              type='left'
              domain={[0, 'dataMax+5%']}
              label={yKey}
            />
            <ReactD3ScaleBand
              id='x-band'
              data={data}
              dataKey='month'
              type='bottom'
              label='Mês'
            />
            <ReactD3ScaleColorSequential
              data={data}
              id='colorScale'
              dataKey={yKey}
              domain={['dataMin', 'dataMax']}
              range={['red', 'blue']}
            />
            <ReactD3Bar
              data={data}
              xKey='month'
              yKey={yKey}
              dataJoinKey={(d) => `${d.month}-${d[yKey]}`}
              colorScaleId='colorScale'
              colorKey={yKey}
              mouseOver={setTooltipData}
              mouseOut={removeTooltipData}
            />
            <ReactD3TooltipSingle
              data={tooltipState}
              arrow='under'
              mouseFollow={false}
              valueFormatter={(v) => formatCurrency(Number(v))}
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};

