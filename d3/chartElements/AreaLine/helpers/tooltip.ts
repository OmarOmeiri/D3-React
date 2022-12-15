import dayjs from 'dayjs';
import { D3DataCatgAndLinear } from '../../../dataTypes';
import {
  ID3AllAttrs,
  ID3Attrs,
  ID3ShapeAttrs,
  ID3TooltipData,
} from '../../../types';

import type {
  AreaLineData,
  ID3AreaLineSerie,
} from '../AreaLine';

let tooltipTimeout: NodeJS.Timeout | null = null;

const getTooltipAttributes = <D extends Record<string, unknown>>(
  d: D3DataCatgAndLinear<D>,
  i: number,
  attrs: ID3AreaLineSerie<D>,
) => Object.fromEntries(
  (Object.entries(attrs) as Entries<Required<ID3AreaLineSerie<D>>>)
    .map(([k, v]) => {
      if (typeof v === 'function') return [k, v(d, i)];
      return [k, v];
    }),
) as {[A in keyof ID3AllAttrs<D>]?: string};

export const filterAreaLineTooltipValues = <D extends Record<string, unknown>>(
  data: AreaLineData<D>[],
  xVal: string | number | Date | null,
  defaultAttrs: ID3ShapeAttrs<D> | ID3Attrs<D>,
): ID3TooltipData<D> | undefined => {
  if (!tooltipTimeout) {
    const tooltipData = data.reduce((merged, dt) => {
      const dataWithAttributes = dt.data.reduce((values, d, i) => {
        let isMatch = false;
        if (typeof xVal === 'object' && (xVal as any).getTime) {
          isMatch = dayjs(d[dt.attrs.xKey]).isSame(xVal, 'day');
        } else {
          isMatch = d[dt.attrs.xKey] === xVal;
        }

        if (!isMatch) return values;
        return {
          data: {
            ...values.data,
            ...d,
          },
          attrs: {
            ...values.attrs,
            [dt.attrs.yKey]: {
              ...defaultAttrs,
              ...getTooltipAttributes(d, i, dt.attrs),
            },
          },
        };
      }, {} as ID3TooltipData<D>);

      return {
        data: {
          ...merged.data,
          ...dataWithAttributes.data,
        },
        attrs: {
          ...merged.attrs,
          ...dataWithAttributes.attrs,
        },
      };
    }, {} as ID3TooltipData<D>);

    tooltipTimeout = setTimeout(() => {
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
      }
      tooltipTimeout = null;
    }, 100);
    return tooltipData;
  }
};
