import dayjs from 'dayjs';
import dayjsFormat from 'dayjs/plugin/customParseFormat';
import { isDate } from 'lullo-utils/Date';
import { groupBy } from 'lullo-utils/Objects';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import ReactD3Chart from '../components/d3/Chart/Chart';
import ReactD3Legend, { D3LegendItem } from '../components/d3/components/Legend';
import ReactD3Line from '../components/d3/components/Line';
import ReactD3TooltipMulti from '../components/d3/components/Tooltip/TooltipMulti';
import ReactD3ScaleLinear from '../components/d3/Scales/ScaleLinear';
import ReactD3ScaleTime from '../components/d3/Scales/ScaleTime';
import { ID3AreaLineSerie } from '../d3/chartElements/AreaLine/AreaLine';
import {
  D3NumberKey,
  ID3TooltipDataMulti,
} from '../d3/types';
import coins from '../data/coins.json';
import styles from '../styles/Home.module.css';

dayjs.extend(dayjsFormat);

const chartMargin = {
  bottom: 120,
  left: 80,
  top: 80,
  right: 80,
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

export const CoinsChart = () => {
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
            />
          </ReactD3Chart>
        </div>
      </div>
    </>
  );
};
