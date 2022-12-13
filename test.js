// type D3Domain =
// | 'dataMax'
// | 'dataMin'
// | `dataMax+${number}`
// | `dataMax-${number}`
// | `dataMax+${number}%`
// | `dataMax-${number}`
// | `dataMin+${number}`
// | `dataMin-${number}`
// | `dataMin+${number}%`
// | `dataMin-${number}`

const getDomain = (
  domain, // : number | D3Domain,
  d, // : any[],
) => {
  const domainTrimmed = domain.trim();
  if (typeof domainTrimmed === 'number') {
    return domainTrimmed;
  }

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
    if (isPercent) return value + (value * offsetValue);
    return value + offsetValue;
  }

  if (isSubtraction) {
    if (isPercent) return value - (value * offsetValue);
    return value - offsetValue;
  }

  throw new RangeError(`Invalid domain: ${domainTrimmed}.`);
};

const offset = 200;
const getData = () => Array.from({ length: 40 }, () => Math.floor(Math.random() * 100));
const data = getData();
console.log('data: ', data.sort((a, b) => a - b));

console.log('dataMin', getDomain('dataMin', data));
console.log(`dataMin+${offset}`, getDomain(`dataMin+${offset}`, data));
console.log(`dataMin+${offset}%`, getDomain(`dataMin+${offset}%`, data));
console.log(`dataMin-${offset}`, getDomain(`dataMin-${offset}`, data));
console.log(`dataMin-${offset}%`, getDomain(`dataMin-${offset}%`, data));

console.log('dataMax', getDomain('dataMax', data));
console.log(`dataMax+${offset}`, getDomain(`dataMax+${offset}`, data));
console.log(`dataMax+${offset}%`, getDomain(`dataMax+${offset}%`, data));
console.log(`dataMax-${offset}`, getDomain(`dataMax-${offset}`, data));
console.log(`dataMax-${offset}%`, getDomain(`dataMax-${offset}%`, data));
