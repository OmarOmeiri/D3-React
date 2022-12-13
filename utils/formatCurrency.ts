export const formatCurrency = (
  value: number,
  locale = 'pt-BR',
  currency = 'BRL',
) => (
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value)
);
