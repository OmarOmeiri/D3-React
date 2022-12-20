import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactD3Chart from '../components/d3/Chart/Chart';
import ReactD3Area from '../components/d3/components/Area';
import D3ChartOverlay, { D3ChartOverlayElement } from '../components/d3/components/ChartOverlay';
import ReactD3Legend, { D3LegendItem } from '../components/d3/components/Legend';
import ReactD3Line from '../components/d3/components/Line';
import ReactD3TooltipMulti from '../components/d3/components/Tooltip/TooltipMulti';
import ReactD3ScaleBand from '../components/d3/Scales/ScaleBand';
import ReactD3ScaleLinear from '../components/d3/Scales/ScaleLinear';
import { ID3AreaLineSerie } from '../d3/chartElements/AreaLine/AreaLine';
import { ID3TooltipDataMulti } from '../d3/types';
// @ts-ignore
import timeValue from '../data/timeValue.json';
import styles from '../styles/Home.module.css';
import { formatCurrency } from '../utils/format';

type TimeValue = {
  year: string,
  value: number,
  value2: number,
}

const chartMargin = {
  bottom: 120,
  left: 80,
  top: 80,
  right: 80,
};

const timeValueSeries: ID3AreaLineSerie<TimeValue>[] = [
  {
    name: 'value',
    xKey: 'year',
    yKey: 'value',
    stroke: 'green',
  },
  {
    name: 'value2',
    xKey: 'year',
    yKey: 'value2',
    stroke: 'red',
  },
];

const timeValueLegends = [
  { id: 'value', name: 'Value', color: 'green', active: true },
  { id: 'value2', name: 'Value2', color: 'red', active: true },
];

export const TimeValueChart = () => {
  const [data, setData] = useState<TimeValue[]>(timeValue);
  const [series, setSeries] = useState<ID3AreaLineSerie<TimeValue>[]>(timeValueSeries);
  const [tooltipState, setTooltipState] = useState<ID3TooltipDataMulti<TimeValue> | null>(null);
  const [legendItems, setLegendItems] = useState(timeValueLegends);
  const dataJoinKey = useRef<['year']>(['year']);
  const [test, setTest] = useState(false);
  const [domainKeys, setDomainKeys] = useState<['value', 'value2']>(['value', 'value2']);

  const onLegendClick = useCallback((item: D3LegendItem) => {
    setLegendItems((state) => {
      const ix = state.findIndex((s) => s.id === item.id);
      if (ix < 0) return state;
      const copy = [...state];
      copy[ix].active = !(copy[ix].active);
      return copy;
    });
  }, []);

  // useEffect(() => {
  //   setInterval(() => {
  //     setTest((t) => !t);
  //   }, 1000);
  // }, []);

  const setTooltipValue = useCallback((d: ID3TooltipDataMulti<TimeValue>) => {
    setTooltipState(d || null);
  }, []);

  const removeTooltipValue = useCallback(() => {
    setTooltipState(null);
  }, []);

  useEffect(() => {
    const active = legendItems.filter((li) => li.active).map((li) => li.id);
    setSeries(timeValueSeries.filter((l) => active.includes(l.name)));
    setDomainKeys(active as any);
  }, [legendItems]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <ReactD3Chart margin={chartMargin}>
            <ReactD3ScaleLinear
              data={data}
              dataKey={domainKeys}
              type='left'
              domain={['dataMin-0.5%', 'dataMax+0.5%']}
              label="Value"
              id='y-scale'
            />
            <ReactD3ScaleBand
              data={data}
              dataKey='year'
              type='bottom'
              label="Year"
              id='x-scale'
            />
            <ReactD3Line
              data={data}
              series={series}
              mouseMove={setTooltipValue}
              mouseOut={removeTooltipValue}
              withDots
              crosshair
            />
            <ReactD3TooltipMulti data={tooltipState} valueFormatter={(val) => formatCurrency(Number(val))}/>
            <ReactD3Legend
              type='line'
              items={timeValueLegends}
              onClick={onLegendClick}
            />
            <D3ChartOverlay>
              <D3ChartOverlayElement position={{ x: '4', y: 'inner-center' }} xScaleId='x-scale' yScaleId="y-scale">
                <div>
                  Hello world
                </div>
              </D3ChartOverlayElement>
            </D3ChartOverlay>
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};

export const AreaChart = () => {
  const [data, setData] = useState<TimeValue[]>(timeValue);
  const [series, setSeries] = useState<ID3AreaLineSerie<TimeValue>[]>(timeValueSeries);
  const [tooltipState, setTooltipState] = useState<ID3TooltipDataMulti<TimeValue> | null>(null);
  const [legendItems, setLegendItems] = useState(timeValueLegends);
  const dataJoinKey = useRef<['year']>(['year']);
  const [test, setTest] = useState(false);
  const [domainKeys, setDomainKeys] = useState<['value', 'value2']>(['value', 'value2']);

  const onLegendClick = useCallback((item: D3LegendItem) => {
    setLegendItems((state) => {
      const ix = state.findIndex((s) => s.id === item.id);
      if (ix < 0) return state;
      const copy = [...state];
      copy[ix].active = !(copy[ix].active);
      return copy;
    });
  }, []);

  // useEffect(() => {
  //   setInterval(() => {
  //     setTest((t) => !t);
  //   }, 1000);
  // }, []);

  const setTooltipValue = useCallback((d: ID3TooltipDataMulti<TimeValue>) => {
    setTooltipState(d || null);
  }, []);

  const removeTooltipValue = useCallback(() => {
    setTooltipState(null);
  }, []);

  useEffect(() => {
    const active = legendItems.filter((li) => li.active).map((li) => li.id);
    setSeries(timeValueSeries.filter((l) => active.includes(l.name)));
    setDomainKeys(active as any);
  }, [legendItems]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <ReactD3Chart margin={chartMargin}>
            <ReactD3ScaleLinear
              data={data}
              dataKey={domainKeys}
              type='left'
              domain={['dataMin-0.5%', 'dataMax+0.5%']}
              label="Value"
            />
            <ReactD3ScaleBand
              data={data}
              dataKey='year'
              type='bottom'
              label="Year"
            />
            <ReactD3Area
              data={data}
              series={series}
              mouseMove={setTooltipValue}
              mouseOut={removeTooltipValue}
              withDots={true}
            />
            <ReactD3TooltipMulti data={tooltipState} valueFormatter={(val) => formatCurrency(Number(val))}/>
            <ReactD3Legend
              type='line'
              items={timeValueLegends}
              onClick={onLegendClick}
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};
