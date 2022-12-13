import {
  useMemo,
  useRef,
} from 'react';
import D3Scatter from '../../d3/views/ScatterPlot';
import D3ReactNode from '../ReactNode';

const D3ReactScatter = <
Data extends Record<string, unknown>,
Keys extends keyof Data,
>({
    data,
    xKey,
    yKey,
    rKey,

  }: Omit<ConstructorArgs<typeof D3Scatter<Data, Keys>>[number], 'ref'>) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const Chart = useMemo(() => {
    if (data && ref) {
      return (
        new D3Scatter({
          ref,
          data,
          xKey,
          yKey,
          rKey,
        })
      );
    }
  }, [data, ref, rKey, xKey, yKey]);

  return (
    <D3ReactNode
      data={data}
      Chart={Chart}
      ref={ref}
    />
  );
};

export default D3ReactScatter;
