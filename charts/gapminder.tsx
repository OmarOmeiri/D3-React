import { schemeCategory10 } from 'd3';
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactD3Chart from '../components/d3/Chart/Chart';
import ReactD3Circle from '../components/d3/components/Circle';
import ReactD3Legend, { D3LegendItem } from '../components/d3/components/Legend';
import ReactD3Title from '../components/d3/components/Title';
import ReactD3TooltipSingle from '../components/d3/components/Tooltip/TooltipSingle';
import TooltipTabledKeyValuePair from '../components/d3/components/Tooltip/TooltipTabledKeyValuePair';
import ReactD3ScaleLinear from '../components/d3/Scales/ScaleLinear';
import ReactD3ScaleLog from '../components/d3/Scales/ScaleLog';
import ReactD3ScaleOrdinal from '../components/d3/Scales/ScaleOrdinal';
import { ID3TooltipDataSingle } from '../d3/types';
// @ts-ignore
import gapmnder from '../data/gapminder.json';
import { Gapminder } from '../data/types';
import styles from '../styles/Home.module.css';
import { formatCurrency } from '../utils/format';

type Countries = {
  continent: string;
  country: string;
  income: number;
  life_exp: number;
  population: number;
}

type GPM = {
  countries: Countries[];
  year: number;
}

const chartMargin = {
  bottom: 120,
  left: 80,
  top: 80,
  right: 80,
};

const gapMinderLegend = [
  { id: 'africa', name: 'Africa', active: true },
  { id: 'americas', name: 'Americas', active: true },
  { id: 'asia', name: 'Asia', active: true },
  { id: 'europe', name: 'Europe', active: true },
];

const gapminder = (gapmnder as Gapminder).reduce((data, value) => {
  const yrNum = parseFloat(value.year);
  if (Number.isNaN(yrNum)) return data;
  const countries = value.countries.map((c) => ({
    ...c,
    income: parseFloat(`${c.income}`),
    life_exp: parseFloat(`${c.life_exp}`),
    population: parseFloat(`${c.population}`),
  })).filter((c) => (
    !Number.isNaN(c.income)
    && !Number.isNaN(c.life_exp)
    && !Number.isNaN(c.population)));

  return [
    ...data,
    {
      countries,
      year: yrNum,
    },
  ];
}, [] as GPM[]).sort((a, b) => a.year - b.year);

const continents = Array.from(new Set(
  gapminder.flatMap((g) => g.countries.map((c) => c.continent)),
));

export const GapminderChart = () => {
  const [data, setData] = useState<Countries[]>(gapminder[0].countries);
  const index = useRef(0);
  const timer = useRef<NodeJS.Timer | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [tooltipState, setTooltipState] = useState<ID3TooltipDataSingle<Countries> | null>(null);
  const [legendItems, setLegendItems] = useState(gapMinderLegend);
  const [year, setYear] = useState(gapminder[0].year);

  const dataFilterCallback = useCallback((items: typeof legendItems) => {
    const activeItems = items.filter((li) => li.active).map((li) => li.id);
    if (activeItems.length === items.length) return undefined;
    return (d: Countries) => activeItems.includes(d.continent);
  }, []);

  const dataFilter = useMemo(() => (
    dataFilterCallback(legendItems)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [legendItems]);

  const play = () => {
    if (inputRef.current && !timer.current) {
      const value = Number(inputRef.current.value) || 50;
      timer.current = setInterval(() => {
        index.current += 1;
        if (index.current === gapminder.length) index.current = 0;
        setYear(gapminder[index.current].year);
        setData(gapminder[index.current].countries);
      }, value);
    }
  };

  const pause = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  const rev = () => {
    index.current -= 1;
    if (index.current < 0) index.current = gapminder.length - 1;
    setYear(gapminder[index.current].year);
    setData(gapminder[index.current].countries);
  };

  const fwd = () => {
    index.current += 1;
    if (index.current > gapminder.length - 1) index.current = 0;
    setYear(gapminder[index.current].year);
    setData(gapminder[index.current].countries);
  };

  const onLegendClick = useCallback((item: D3LegendItem) => {
    setLegendItems((state) => {
      const ix = state.findIndex((s) => s.id === item.id);
      if (ix < 0) return state;
      const copy = [...state];
      copy[ix].active = !(copy[ix].active);
      return copy;
    });
  }, []);

  const setTooltipValue = useCallback((d?: ID3TooltipDataSingle<Countries>) => {
    setTooltipState(d || null);
  }, []);

  const removeTooltipValue = useCallback(() => {
    setTooltipState(null);
  }, []);

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '1em',
      }}>
        <button onClick={rev}>{'<'}</button>
        <button onClick={play}>Play</button>
        <button onClick={pause}>Pause</button>
        <button onClick={fwd}>{'>'}</button>
        <input ref={inputRef} placeholder='time' defaultValue='100'/>
      </div>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <ReactD3Chart margin={chartMargin}>
            <ReactD3Title title={String(year)}/>
            <ReactD3ScaleLinear
              data={data}
              dataKey='life_exp'
              type='left'
              domain={[0, 100]}
              label="Life Expectancy"
            />
            <ReactD3ScaleLog
              data={data}
              dataKey='income'
              type='bottom'
              domain={[142, 200000]}
              label='GDP per capita'
              tickFormat={(value) => formatCurrency(Number(value), 'en-US', 'USD')}
              tickValues={[500, 4000, 40000]}
            />
            <ReactD3ScaleOrdinal
              id="color-scale"
              data={data}
              dataKey='continent'
              domain={continents}
              scheme={schemeCategory10}
            />
            <ReactD3Circle
              data={data}
              xKey='income'
              yKey='life_exp'
              rKey='population'
              fillOpacity='0.7'
              dataJoinKey={(d) => d.country}
              colorScaleId='color-scale'
              colorKey='continent'
              filter={dataFilter}
              mouseOver={setTooltipValue}
              mouseOut={removeTooltipValue}
            />
            <ReactD3TooltipSingle data={tooltipState}>
              {
                tooltipState
                  ? (
                    <TooltipTabledKeyValuePair data={tooltipState} keyLabel='continent'/>
                  )
                  : null
              }
            </ReactD3TooltipSingle>
            <ReactD3Legend
              colorScaleId='color-scale'
              type='dot'
              items={legendItems}
              onClick={onLegendClick}
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};
