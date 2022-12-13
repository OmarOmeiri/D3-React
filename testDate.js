const dayjs = require('dayjs');
const { randomDate, isDate } = require('lullo-utils/Date')

const getDomain = (
  domain,
  d,
) => {
  if (isDate(domain)) {
    return domain;
  }

  const domainTrimmed = domain.trim();
  const maxVal = new Date(Math.max(...d));
  const minVal = new Date(Math.min(...d));
  if (domainTrimmed === 'dataMax') {
    return maxVal;
  }
  if (domainTrimmed === 'dataMin') {
    return minVal;
  }

  const isMin = domainTrimmed.startsWith('dataMin');
  const isMax = domainTrimmed.startsWith('dataMax');
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
  const offsetValue = Number(domainSplit[1].replace(/[^0-9.]/g, ''));
  const offsetMagnitude = domainSplit[1].replace(/[^a-z]/g, '');

  if (Number.isNaN(offsetValue)) {
    throw new RangeError(`Invalid domain offset: ${offsetValue}`);
  }

  if (isSum) {
    return dayjs(value).add(offsetValue, offsetMagnitude).toDate();
  }

  if (isSubtraction) {
    return dayjs(value).subtract(offsetValue, offsetMagnitude).toDate();
  }

  throw new RangeError(`Invalid domain: ${domainTrimmed}.`);
}

const offset = 5;
const getData = () => Array.from({ length: 40 }, () => randomDate({yearRng: [2020, 2020]}));
const data = getData();
console.log('data: ', data.sort((a, b) => a.getTime() - b.getTime()));

console.log('dataMin', getDomain('dataMin', data));
console.log(`dataMin+${offset}days`, getDomain(`dataMin+${offset}days`, data));
console.log(`dataMin+${offset}months`, getDomain(`dataMin+${offset}months`, data));
console.log(`dataMin-${offset}years`, getDomain(`dataMin-${offset}years`, data));
// console.log(`dataMin-${offset}%`, getDomain(`dataMin-${offset}%`, data));

console.log('dataMax', getDomain('dataMax', data));
console.log(`dataMax+${offset}`, getDomain(`dataMax+${offset}days`, data));
console.log(`dataMax+${offset}months`, getDomain(`dataMax+${offset}months`, data));
console.log(`dataMax-${offset}years`, getDomain(`dataMax-${offset}years`, data));
// console.log(`dataMax-${offset}%`, getDomain(`dataMax-${offset}%`, data));
