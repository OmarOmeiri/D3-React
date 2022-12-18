import { schemeCategory10 } from 'd3';
import dayjs from 'dayjs';
import dayjsFormat from 'dayjs/plugin/customParseFormat';
import { update } from 'lodash';
import {
  pickRandom,
  range,
} from 'lullo-utils/Arrays';
import { isDate } from 'lullo-utils/Date';
import { linearRegression } from 'lullo-utils/Math';
import { groupBy } from 'lullo-utils/Objects';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactD3Chart from '../components/d3/Chart/Chart';
import ReactD3Area from '../components/d3/components/Area';
import ReactD3Bar from '../components/d3/components/Bar';
import D3ChartOverlay, { D3ChartOverlayElement } from '../components/d3/components/ChartOverlay';
import ReactD3Circle from '../components/d3/components/Circle';
import ReactD3Legend, { D3LegendItem } from '../components/d3/components/Legend';
import ReactD3Line from '../components/d3/components/Line';
import ReactD3Title from '../components/d3/components/Title';
import ReactD3TooltipMulti from '../components/d3/components/Tooltip/TooltipMulti';
import ReactD3TooltipSingle from '../components/d3/components/Tooltip/TooltipSingle';
import TooltipTabledKeyValuePair from '../components/d3/components/Tooltip/TooltipTabledKeyValuePair';
import ReactD3Violin from '../components/d3/components/Violin';
import ReactD3ScaleBand from '../components/d3/Scales/ScaleBand';
import ReactD3ScaleColorSequential from '../components/d3/Scales/ScaleColorSequential';
import ReactD3ScaleLinear from '../components/d3/Scales/ScaleLinear';
import ReactD3ScaleLog from '../components/d3/Scales/ScaleLog';
import ReactD3ScaleOrdinal from '../components/d3/Scales/ScaleOrdinal';
import ReactD3ScaleTime from '../components/d3/Scales/ScaleTime';
import { TabledkeyValuePair } from '../components/TabledKeyValue/TabledKeyValuePair';
import { ID3AreaLineSerie } from '../d3/chartElements/AreaLine/AreaLine';
import { ID3ViolinSerie } from '../d3/chartElements/Violin/Violin';
import { D3DataLinear } from '../d3/dataTypes';
import { D3LinearDomain } from '../d3/Scales/types';
import {
  D3NumberKey,
  ID3TooltipDataMulti,
  ID3TooltipDataSingle,
} from '../d3/types';
import coins from '../data/coins.json';
import gapmnder from '../data/gapminder.json';
import { IRIS } from '../data/iris';
import { revenues } from '../data/revenues';
import timeValue from '../data/timeValue.json';
import { Gapminder } from '../data/types';
import styles from '../styles/Home.module.css';
import { formatCurrency } from '../utils/format';

dayjs.extend(dayjsFormat);

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

type TimeValue = {
  year: string,
  value: number,
  value2: number,
}

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

// export type Player = {
//   id: number;
//   ego: number;
//   x: number;
//   y: number;
// }

// const rand = (min: number, max: number) => (
//   min + Math.round(Math.random() * max)
// );

// const createPlayer = (id: number): Player => ({
//   id,
//   ego: rand(10, 20),
//   x: rand(1, 99),
//   y: rand(1, 49),
// });

// const Scatter = () => {
//   const [players, setPlayers] = useState<Player[]>([]);
//   const [cut, setCut] = useState<Player[]>([]);

//   const updatePlayers = () => {
//     if (players.length === 11) {
//       setCut(players.splice(rand(1, 5), rand(1, 5)));
//     } else {
//       cut.forEach((p) => players.push(p));
//     }
//     const temp = players.map((d) => createPlayer(d.id));
//     shuffle(temp);
//     setPlayers(temp);
//   };

//   useEffect(() => {
//     const init = [];
//     for (let i = 0; i < 11; i++) {
//       init.push(createPlayer(i + 1));
//     }
//     setPlayers(init);
//   }, []);

//   // useEffect(() => {
//   //   if (players.length) {
//   //     setInterval(() => {
//   //       updatePlayers();
//   //     }, 2000);
//   //   }
//   // }, [players]);

//   return (
//     <D3ReactScatter
//       data={players}
//       xKey='x'
//       yKey='y'
//       rKey='ego'
//     />
//   );
// };

const Bar = () => {
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

function Scatter() {
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
              {/* {
                tooltipState
                  ? (
                    <>
                      <div>
                        {`País: ${tooltipState.data.country}`}
                      </div>
                      <div>
                        {`PIB per Capita: ${formatCurrency(Number(tooltipState.data.income), 'en-US', 'USD')}`}
                      </div>
                      <div>
                        {`PIB: ${formatCurrency(tooltipState.data.income * tooltipState.data.population, 'en-US', 'USD')}`}
                      </div>
                      <div>
                        {`Expectativa de vida: ${tooltipState.data.life_exp}`}
                      </div>
                      <div>
                        {`População: ${Intl.NumberFormat('pt-BR').format(tooltipState.data.population)}`}
                      </div>
                    </>
                  )
                  : null
              } */}
            </ReactD3TooltipSingle>
            <ReactD3Legend
              colorScaleId='color-scale'
              type='dot'
              items={legendItems}
              onClick={onLegendClick}
              style={{ marginTop: '5em' }}
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
}

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

const Line = () => {
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
              style={{ marginTop: '5em' }}
            />
            <D3ChartOverlay>
              <D3ChartOverlayElement position={{ x: 'inner-right', y: 'inner-center' }} xScaleId='x-scale' yScaleId="y-scale">
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

const Area = () => {
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
              style={{ marginTop: '5em' }}
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};

interface Coins {
  bitcoin: Coin[];
  bitcoin_cash: Coin[];
  ethereum: Coin[];
  litecoin: Coin[];
  ripple: Coin[];
}

type Coin = {
  '24h_vol': number;
  date: Date;
  market_cap: null | number;
  price_usd: null | number;
  id: string,
}

type CoinsMerge = {
  date: Date,
  price_bitcoin: number | null,
  price_bitcoin_cash: number | null,
  price_ethereum: number | null,
  price_litecoin: number | null,
  price_ripple: number | null,
}

const coinsArray = (Object.entries(coins as unknown as Coins) as Entries<Coins>)
  .reduce((coinsFiltered, [key, coin]) => ([
    ...coinsFiltered,
    ...coin.filter((c) => c.date)
      .map((c) => ({
        date: dayjs(c.date, 'D/M/YYYY').toDate(),
        market_cap: parseFloat(String(c.market_cap)) || null,
        price_usd: parseFloat(String(c.price_usd)) || null,
        '24h_vol': parseFloat(String(c['24h_vol'])) || null,
        id: key,
      })).filter((c) => isDate(c.date)) as Coin[],
  ]), [] as Coin[]);

const coinsByDate = groupBy(coinsArray, (d) => String(d.date.getTime()));

const coinData = ((Object.values(coinsByDate))
  .flatMap((vals) => vals.reduce((byDate, v) => ({
    ...byDate,
    date: v.date,
    [`price_${v.id}`]: v.price_usd || null,
  }), {} as CoinsMerge)));

const coinsSeries: ID3AreaLineSerie<CoinsMerge>[] = [
  {
    name: 'Bitcoin',
    xKey: 'date',
    yKey: 'price_bitcoin',
    stroke: 'green',
  },
  {
    name: 'Bitcoin Cash',
    xKey: 'date',
    yKey: 'price_bitcoin_cash',
    stroke: 'red',
  },
  {
    name: 'Ethereum',
    xKey: 'date',
    yKey: 'price_ethereum',
    stroke: 'yellow',
  },
  {
    name: 'Litecoin',
    xKey: 'date',
    yKey: 'price_litecoin',
    stroke: 'blue',
  },
  {
    name: 'Ripple',
    xKey: 'date',
    yKey: 'price_ripple',
    stroke: 'orange',
  },
];

const coinsLegends = [
  { id: 'price_bitcoin', name: 'Bitcoin', color: 'green', active: true },
  { id: 'price_bitcoin_cash', name: 'Bitcoin Cash', color: 'red', active: true },
  { id: 'price_ethereum', name: 'Ethereum', color: 'yellow', active: true },
  { id: 'price_litecoin', name: 'Litecoin', color: 'blue', active: true },
  { id: 'price_ripple', name: 'Ripple', color: 'orange', active: true },
];

const Coins = () => {
  const [data, setData] = useState(coinData);
  const [series, setSeries] = useState<ID3AreaLineSerie<CoinsMerge>[]>(coinsSeries);
  const [tooltipState, setTooltipState] = useState<ID3TooltipDataMulti<CoinsMerge> | null>(null);
  const [legendItems, setLegendItems] = useState(coinsLegends);
  const [keys, setKeys] = useState<D3NumberKey<CoinsMerge>[]>([
    'price_bitcoin',
    'price_bitcoin_cash',
    'price_ethereum',
    'price_litecoin',
    'price_ripple',
  ]);

  const onLegendClick = useCallback((item: D3LegendItem) => {
    setLegendItems((state) => {
      const ix = state.findIndex((s) => s.id === item.id);
      if (ix < 0) return state;
      const copy = [...state];
      copy[ix].active = !(copy[ix].active);
      return copy;
    });
  }, []);

  const setTooltipValue = useCallback((d: ID3TooltipDataMulti<CoinsMerge>) => {
    setTooltipState(d || null);
  }, []);

  const removeTooltipValue = useCallback(() => {
    setTooltipState(null);
  }, []);

  const tickFormatter = useCallback((t: any) => Intl.DateTimeFormat('pt-BR').format(t), []);

  useEffect(() => {
    const active = coinsLegends.filter((li) => li.active).map((li) => li.id);

    setSeries(coinsSeries.filter((l) => active.includes(l.yKey)));
    setKeys(active as any);
  }, [legendItems]);

  return (
    <>
      <div className={styles.container}>
        <div className={`${styles.wrapper} ${styles.rotateTicks}`}>
          <ReactD3Chart margin={chartMargin}>
            <ReactD3ScaleLinear
              data={data}
              type='left'
              dataKey={keys}
              domain={['dataMin-0.5%', 'dataMax+0.5%']}
              label="USD"
            />
            <ReactD3ScaleTime
              data={data}
              dataKey='date'
              type='bottom'
              label="Date"
              tickFormat={tickFormatter}
            />
            <ReactD3Line
              data={data}
              series={series}
              mouseMove={setTooltipValue}
              mouseOut={removeTooltipValue}
              withDots={false}
              crosshair
            />
            <ReactD3TooltipMulti
              data={tooltipState}
              labelFormatter={(val) => Intl.DateTimeFormat('pt-BR').format(new Date(val))}
            />
            <ReactD3Legend
              type='line'
              items={coinsLegends}
              onClick={onLegendClick}
              style={{ marginTop: '5em' }}
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};

const violinSeriesByType: ID3ViolinSerie<typeof IRIS[number]>[] = [
  {
    name: 'Sepal Length',
    yKey: 'Sepal_Length',
    fill: 'green',
  },
  {
    name: 'Petal Length',
    yKey: 'Petal_Length',
    fill: 'red',
  },
  {
    name: 'Petal Width',
    yKey: 'Petal_Width',
    fill: 'yellow',
  },
  {
    name: 'Sepal Width',
    yKey: 'Sepal_Width',
    fill: 'blue',
  },
];

const violinSeriesBySpecies: ID3ViolinSerie<typeof IRIS[number]>[] = [
  {
    name: 'Setosa',
    yKey: 'Sepal_Length',
    fill: 'green',
    filterFn(value) {
      return value.Species === 'setosa';
    },
  },
  {
    name: 'Virginica',
    yKey: 'Sepal_Length',
    fill: 'red',
    filterFn(value) {
      return value.Species === 'virginica';
    },
  },
  {
    name: 'Versicolor',
    yKey: 'Sepal_Length',
    fill: 'yellow',
    filterFn(value) {
      return value.Species === 'versicolor';
    },
  },
];

const Violin = () => {
  const [data, setData] = useState<typeof IRIS>(IRIS);
  const [series, setSeries] = useState<ID3ViolinSerie<typeof IRIS[number]>[]>(violinSeriesByType);
  const [domain, setDomain] = useState(series.map((s) => s.name));
  const [dataKeys, setDataKeys] = useState(series.map((s) => s.yKey));
  const [species, setSpecies] = useState(Array.from(new Set(IRIS.map((i) => i.Species))));
  const [type, setType] = useState<'specie' | 'type'>('type');
  useEffect(() => {
    setDomain(series.map((s) => s.name));
  }, [series]);

  useEffect(() => {
    const newSeries = (type === 'specie' ? violinSeriesBySpecies : violinSeriesByType);
    setDomain(newSeries.map((s) => s.name));
    setSeries(newSeries);
    setData(IRIS);
  }, [type]);

  const onOptionChg = useCallback((e: React.ChangeEvent) => {
    const { value } = e.target as HTMLSelectElement;
    if (type === 'type') {
      setData(value ? IRIS.filter((i) => i.Species === value) : IRIS);
    }
  }, [type]);

  const onTypeChg = useCallback((e: React.ChangeEvent) => {
    const { value } = e.target as HTMLSelectElement;
    if (value) {
      setType(value as any);
    }
  }, []);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <option></option>
        <select onChange={onOptionChg}>
          {
                species.map((s) => (
                  <option key={s}>{s}</option>
                ))
              }
        </select>
        <select onChange={onTypeChg}>
          <option value='type'>Caract.</option>
          <option value='specie'>Espécie</option>
        </select>
      </div>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <ReactD3Chart margin={chartMargin}>
            <ReactD3ScaleLinear
              data={data}
              dataKey={dataKeys}
              type='left'
              label="Value"
              id='y-scale'
            />
            <ReactD3ScaleBand
              domain={domain}
              type='bottom'
              label="Year"
              id='x-scale'
            />
            <ReactD3Violin
              data={data}
              series={series}
              crosshair
              disableZoom
            />
            <D3ChartOverlay>
              <D3ChartOverlayElement position={{ x: domain[1], y: 5 }} xScaleId='x-scale' yScaleId="y-scale">
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

export default function Home() {
  return (
    <>
      <Violin/>
      <Bar/>
      <Line/>
      <Area/>
      {/* <Coins/> */}
      <Scatter/>
    </>
  );
}
