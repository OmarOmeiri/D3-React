import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { D3DataCatgAndLinear } from '../../d3/dataTypes';
import D3Bar from '../../d3/views/BarPlot';
import D3ReactNode from '../ReactNode';

const D3ReactBar = <
Data extends Record<string, unknown>,
CatgKey extends KeysOfType<Data, string>,
NumKey extends KeysOfType<Data, number>,
>({
    data,
    xKey,
    yKey,
  }: Omit<ConstructorArgs<typeof D3Bar<Data, CatgKey, NumKey>>[number], 'ref'>) => {
  const chartInstance = useRef<D3Bar<Data, CatgKey, NumKey> | null>(null);
  const [init, setInit] = useState(false);

  const onInit = () => {
    setInit(true);
  };

  const getChart = useCallback((
    ref: HTMLDivElement,
    d: D3DataCatgAndLinear<Data, CatgKey, NumKey>[],
  ) => {
    chartInstance.current = new D3Bar({
      ref,
      data: d,
      xKey,
      yKey,
    });
    return chartInstance.current;
  }, [xKey, yKey]);

  useEffect(() => {
    if (chartInstance.current && init) {
      chartInstance.current.keys = {
        xKey,
        yKey,
      };
    }
  }, [xKey, yKey, init]);

  return (
    <D3ReactNode
      data={data}
      Chart={getChart}
      onInit={onInit}
    />
  );
};

export default D3ReactBar;
