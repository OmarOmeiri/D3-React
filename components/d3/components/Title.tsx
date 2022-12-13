import {
  useEffect,
  useRef,
} from 'react';
import Title from '../../../d3/chartElements/Title/Title';
import { useD3Context } from '../context/D3Context';

const ReactD3Title = ({ title }: {title: string}) => {
  const d3Title = useRef<Title | null>(null);
  const {
    chart,
    dims,
    scales,
  } = useD3Context();

  useEffect(() => {
    if (chart && scales.length) {
      d3Title.current = new Title({
        chart: chart.chart,
        dims: chart.dims,
        title,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart, scales]);

  useEffect(() => {
    if (chart && d3Title.current) {
      d3Title.current.updateTitle(chart.dims, title);
    }
  }, [
    chart,
    dims,
    title,
  ]);

  return null;
};

export default ReactD3Title;
