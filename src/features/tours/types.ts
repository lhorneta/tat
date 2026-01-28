// Базові сутності
export type Country = { id: string; name: string; flag: string };
export type City = { id: number; name: string; countryId: string };
export type Hotel = {
  id: number;
  name: string;
  img: string;
  cityId: number;
  cityName: string;
  countryId: string;
  countryName: string;
  countryFlag: string;
};

// Колекції у вигляді словників
export type CountriesMap = Record<string, Country>;
export type HotelsMap = Record<string, Hotel>;

// Пошук цін (оффер)
export type PriceOffer = {
  id: string;           // UUID
  amount: number;       // 1500–4000
  currency: "usd";      // нижній регістр за поточною реалізацією
  startDate: string;    // YYYY-MM-DD (сьогодні +2..5)
  endDate: string;      // YYYY-MM-DD (start +4..7)
  hotelID?: string;     // додається в результатах пошуку цін
};

// Відповідь пошуку цін (готові результати)
export type PricesMap = Record<string, PriceOffer>;

// Підказки гео-пошуку
export type GeoEntity =
  | (Country & { type: "country" })
  | (City & { type: "city" })
  | (Hotel & { type: "hotel" });

export type GeoResponse = Record<string, GeoEntity>;

// Уніфікована помилка
export type ErrorResponse = {
  code: number;           // 400, 404, 425
  error: true;
  message: string;
  waitUntil?: string;     // ISO для 425
};

// Успішні спеціальні відповіді
export type StartSearchResponse = {
  token: string;
  waitUntil: string;      // ISO коли можна питати результати
};

export type GetSearchPricesResponse = {
  prices: PricesMap;
};

export type StopSearchResponse = {
  status: "cancelled";
  message: string;
};

export type Tour = PriceOffer & GeoEntity & Hotel & { countryFlag: string }
