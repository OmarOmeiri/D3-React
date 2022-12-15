import { D3DataLinear } from '../../dataTypes';
import { D3NumberKey } from '../../types';
import { D3LinearDomain } from '../types';

const isDomainNumber = (value: unknown): value is [number, number] => {
  if (!Array.isArray(value)) return false;
  if (
    typeof value[0] === 'number'
    && typeof value[1] === 'number'
  ) return true;
  return false;
};

const getDomainNumber = (
  domain: number | D3LinearDomain,
  d: number[],
  roundDomain?: boolean,
) => {
  if (typeof domain === 'number') {
    return domain;
  }

  const domainTrimmed = domain.trim();
  const maxVal = Math.max(...d);
  const minVal = Math.min(...d);
  if (domainTrimmed === 'dataMax') {
    return maxVal;
  }
  if (domainTrimmed === 'dataMin') {
    return minVal;
  }

  const isMin = domainTrimmed.startsWith('dataMin');
  const isMax = domainTrimmed.startsWith('dataMax');
  const isPercent = domainTrimmed.endsWith('%');
  const isSum = /[+]/.test(domainTrimmed);
  const isSubtraction = /[-]/.test(domainTrimmed);
  const value = isMin ? minVal : maxVal;

  if (!isSum && !isSubtraction) {
    throw new RangeError(`Invalid domain operator: ${domainTrimmed}`);
  }

  if (!isMin && !isMax) {
    throw new RangeError(`Invalid domain value: ${domainTrimmed}`);
  }

  const domainSplit = domainTrimmed.split(/[+|-]/);
  const offsetValue = isPercent
    ? Number(domainSplit[1].replace(/[^0-9.]/, '')) / 100
    : Number(domainSplit[1].replace(/[^0-9.]/, ''));

  if (Number.isNaN(offsetValue)) {
    throw new RangeError(`Invalid domain offset: ${offsetValue}`);
  }
  if (isSum) {
    if (isPercent) {
      return roundDomain
        ? Math.ceil(value + (value * offsetValue))
        : value + (value * offsetValue);
    }
    return roundDomain
      ? Math.ceil(value + offsetValue)
      : value + offsetValue;
  }

  if (isSubtraction) {
    if (isPercent) {
      return roundDomain
        ? Math.floor(value - (value * offsetValue))
        : value - (value * offsetValue);
    }
    return roundDomain
      ? Math.floor(value - offsetValue)
      : value - offsetValue;
  }

  throw new RangeError(`Invalid domain: ${domainTrimmed}.`);
};

export const D3GetDomainNumber = <
D extends Record<string, unknown>,
>({
    data,
    domain,
    dataKey,
    roundDomain,
  }:{
  data?: D3DataLinear<D>[],
  domain?: [number, number] | [number | D3LinearDomain, number | D3LinearDomain],
  dataKey?: (TypeOrArrayOfType<D3NumberKey<D>> & D3NumberKey<D>[]),
  roundDomain?: boolean,
}): [number, number] => {
  if (
    domain
    && isDomainNumber(domain)
  ) {
    return domain;
  }
  if (data && data.length && dataKey) {
    const d = data.reduce((vals, d) => [
      ...vals,
      ...dataKey.map((k) => d[k]).filter((d) => typeof d === 'number') as number[],
    ], [] as number[]);

    if (!domain) {
      return [
        Math.min(...d),
        Math.max(...d),
      ];
    }

    return [
      getDomainNumber(domain[0], d, roundDomain),
      getDomainNumber(domain[1], d, roundDomain),
    ];
  }
  if (!dataKey) {
    throw new Error('DataKey missing.');
  }
  throw new RangeError('No domain or data was passed.');
};
