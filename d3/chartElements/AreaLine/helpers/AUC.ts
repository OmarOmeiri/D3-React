import {
  sortObjArrayByArrayAndKey,
  windowArray,
} from 'lullo-utils/Arrays';
import { trapezoidArea } from 'lullo-utils/Math';

import type { D3NumberStringOrDateKey } from '../../../types';
import type { ID3AreaLineSerie } from '../AreaLine';

export const D3AreaUnderCurve = <
T extends Record<string, unknown>,
K extends keyof T
>(
    data: Array<T>,
    keys: TypeOrArrayOfType<K>,
    approxCoef = data.length / 5,
  ) => {
  const ks = [keys].flat() as K[];
  const areas = Object.fromEntries(
    ks.map((k) => [k, 0]),
  ) as {[k in K]: number};

  for (const chunk of windowArray(data, Math.floor(approxCoef))) {
    for (const k of ks) {
      const kArea = trapezoidArea(
        Math.floor(approxCoef - 1),
        Number(chunk[0][k]) || 0,
        Number(chunk[1][k]) || 0,
      );
      areas[k] += kArea;
    }
  }
  return areas;
};

export const sortSeriesByAUC = <
T extends Record<string, unknown>,
>(
    data: Array<T>,
    series: ID3AreaLineSerie<T>[],
    keys: D3NumberStringOrDateKey<T>[],
    approxCoef = data.length / 5,
  ) => {
  const AUCs = D3AreaUnderCurve(data, keys, approxCoef);
  const sortingKeys = (Object.entries(AUCs) as Entries<typeof AUCs>)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k);

  return sortObjArrayByArrayAndKey(
    series,
    sortingKeys,
    'yKey',
  );
};
