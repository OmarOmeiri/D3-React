import { schemeCategory10 } from 'd3';
import React, {
  useCallback,
  useRef,
  useState,
} from 'react';
import ReactD3Chart from '../components/d3/Chart/Chart';
import ReactD3GroupedBar from '../components/d3/components/GroupedBar';
import ReactD3Legend from '../components/d3/components/Legend';
import ReactD3TooltipSingle from '../components/d3/components/Tooltip/TooltipSingle';
import ReactD3ScaleBand from '../components/d3/Scales/ScaleBand';
import ReactD3ScaleLinear from '../components/d3/Scales/ScaleLinear';
import ReactD3ScaleOrdinal from '../components/d3/Scales/ScaleOrdinal';
import { ID3GroupedBarSerie } from '../d3/chartElements/GroupedBar/GroupedBar';
import { ID3TooltipDataSingle } from '../d3/types';
import { cultivares } from '../data/stacked';
import styles from '../styles/Home.module.css';
import { formatCurrency } from '../utils/format';

export const GroupedBarChart = () => {
  const [data, setData] = useState(cultivares);
  const [tooltipState, setTooltipState] = useState<ID3TooltipDataSingle<typeof data[number]> | null>(null);
  const [series, setSeries] = useState<ID3GroupedBarSerie<typeof cultivares[number]>[]>([
    {
      id: 'nitrogen',
      name: 'Nitrogen',
      yKey: 'Nitrogen',
      active: true,
    },
    {
      id: 'stress',
      name: 'Stress',
      yKey: 'stress',
      active: true,
    },
    {
      id: 'normal',
      name: 'Normal',
      yKey: 'normal',
      active: true,
    },
  ]);
  const colorDomain = useRef(series.map((s) => s.id));

  const setTooltipData = useCallback((d: ID3TooltipDataSingle<typeof data[number]>) => {
    setTooltipState(d);
  }, []);

  const removeTooltipData = useCallback(() => {
    setTooltipState(null);
  }, []);

  const onLegendClick = useCallback((item: ID3GroupedBarSerie<typeof cultivares[number]>) => {
    setSeries((state) => {
      const ix = state.findIndex((s) => s.id === item.id);
      if (ix < 0) return state;
      const copy = [...state];
      copy[ix] = { ...copy[ix], active: !(copy[ix].active) };
      return copy;
    });
  }, []);

  // useEffect(() => {
  //   console.log(series);
  // }, [series]);

  return (
    <>
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
              dataKey={['Nitrogen', 'normal', 'stress']}
              type='left'
              domain={[0, 'dataMax+5%']}
            />
            <ReactD3ScaleBand
              id='x-band'
              data={data}
              dataKey='group'
              type='bottom'
              label='Cultivar'
            />
            <ReactD3ScaleOrdinal
              id='color-scale'
              data={data}
              scheme={schemeCategory10}
              domain={colorDomain.current}
            />
            <ReactD3GroupedBar
              data={data}
              series={series}
              groupKey='group'
              colorScaleId='color-scale'
              colorKey='group'
              mouseOver={setTooltipData}
              mouseOut={removeTooltipData}
            />
            <ReactD3Legend
              items={series}
              colorScaleId='color-scale'
              type='square'
              onClick={onLegendClick}
            />
            <ReactD3TooltipSingle
              data={tooltipState}
              arrow='under'
              mouseFollow={false}
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};

