export const D3Defined = (
  value: unknown,
) => {
  if (typeof value === 'object') {
    if (value === null) return false;
    return true;
  }
  return true;
};
