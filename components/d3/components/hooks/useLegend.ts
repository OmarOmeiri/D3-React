import {
  useCallback,
  useMemo,
} from 'react';
import { D3LegendItem } from '../Legend';

export const useD3LegendFilter = ({
  items,
  filter,
}:{
  items: D3LegendItem[],
  filter: <T>(d: T) => boolean
}) => {
  const dataFilterCallback = useCallback((items: D3LegendItem[]) => {
    const activeItems = items.filter((li) => li.active).map((li) => li.id);
    if (activeItems.length === items.length) return undefined;
    return filter;
  }, [filter]);

  const dataFilter = useMemo(() => (
    dataFilterCallback(items)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [items]);

  return dataFilter;
};
