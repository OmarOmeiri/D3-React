import {
  useMemo,
  useRef,
} from 'react';
import D3Violin from '../../d3/views/ViolinPlot';
import D3ReactNode from '../ReactNode';

const D3ReactViolin = <
Data extends Record<string, unknown>,
Keys extends keyof Data,
>({
    data,
    xKey,
    yKey,

  }: Omit<ConstructorArgs<typeof D3Violin<Data, Keys, Keys>>[number], 'ref'>) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const Chart = useMemo(() => {
    if (data && ref) {
      return (
        new D3Violin({
          ref,
          data,
          xKey,
          yKey,
        })
      );
    }
  }, [data, ref, xKey, yKey]);

  if (!Chart) return null;

  return (
    <D3ReactNode
      data={data}
      Chart={Chart}
      ref={ref}
    />
  );
};

export default D3ReactViolin;
