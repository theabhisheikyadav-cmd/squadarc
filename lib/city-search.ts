import "server-only";
import { fold } from "./text";

type City = { name: string; key: string; population: number };
type RawCity = { name: string; country: string; population: number };


// Old or informal names people commonly type, mapped to the dataset's name. The dataset has no alt names.
const ALIASES: Record<string, Record<string, string>> = {
  IN: {
    bangalore: "Bengaluru", bombay: "Mumbai", calcutta: "Kolkata", madras: "Chennai",
    gurugram: "Gurgaon", trivandrum: "Thiruvananthapuram", benares: "Varanasi", poona: "Pune",
  },
  US: { nyc: "New York City", "new york": "New York City", sf: "San Francisco", "washington dc": "Washington" },
  UA: { kiev: "Kyiv" },
  CN: { peking: "Beijing" },
  VN: { saigon: "Ho Chi Minh City" },
};

function alias(country: string, key: string) {
  return ALIASES[country]?.[key];
}

let byCountry: Map<string, City[]> | null = null;

// ~135k cities (population > 1000, GeoNames via all-the-cities). Built once per server.
async function index() {
  if (byCountry) return byCountry;
  const { default: all } = (await import("all-the-cities")) as { default: RawCity[] };
  const map = new Map<string, Map<string, City>>();
  for (const c of all) {
    let cities = map.get(c.country);
    if (!cities) map.set(c.country, (cities = new Map()));
    // Same name twice in one country (e.g. Springfield, US): keep the biggest.
    const prev = cities.get(c.name);
    if (!prev || prev.population < c.population) {
      cities.set(c.name, { name: c.name, key: fold(c.name), population: c.population });
    }
  }
  byCountry = new Map(
    [...map].map(([code, cities]) => [
      code,
      [...cities.values()].sort((a, b) => b.population - a.population),
    ]),
  );
  return byCountry;
}

/** Top matches for a country, biggest cities first; prefix matches rank above substring matches. */
export async function searchCities(country: string, query: string, limit = 8): Promise<string[]> {
  const cities = (await index()).get(country) ?? [];
  const q = fold(query);
  if (!q) return cities.slice(0, limit).map((c) => c.name);
  const aliased = alias(country, q);
  const starts: string[] = aliased ? [aliased] : [];
  const contains: string[] = [];
  for (const c of cities) {
    if (c.name === aliased) continue;
    if (c.key.startsWith(q)) starts.push(c.name);
    else if (contains.length < limit && c.key.includes(q)) contains.push(c.name);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Returns the dataset's spelling if the city exists in that country. */
export async function findCity(country: string, name: string): Promise<string | null> {
  const key = fold(name);
  return alias(country, key) ?? (await index()).get(country)?.find((c) => c.key === key)?.name ?? null;
}
