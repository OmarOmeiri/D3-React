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

export const formatDate = (
  value: Date,
  locale = 'pt-BR',
) => (
  Intl.DateTimeFormat(locale).format(value)
);
