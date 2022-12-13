export type Gapminder = {
  countries: {
    continent: string;
    country: string;
    income: number | null;
    life_exp: number | null;
    population: number | null | string;
  }[];
  year: string;
}[]

