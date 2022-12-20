import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import ReactD3Chart from '../components/d3/Chart/Chart';
import D3ChartOverlay, { D3ChartOverlayElement } from '../components/d3/components/ChartOverlay';
import ReactD3Violin from '../components/d3/components/Violin';
import ReactD3ScaleBand from '../components/d3/Scales/ScaleBand';
import ReactD3ScaleLinear from '../components/d3/Scales/ScaleLinear';
import { ID3ViolinSerie } from '../d3/chartElements/Violin/Violin';
import { IRIS } from '../data/iris';
import styles from '../styles/Home.module.css';

const chartMargin = {
  bottom: 120,
  left: 80,
  top: 80,
  right: 80,
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

export const ViolinChart = () => {
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
