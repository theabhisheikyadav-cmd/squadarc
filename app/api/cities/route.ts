import { searchCities } from "@/lib/city-search";
import { isCountryCode } from "@/lib/countries";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const country = (params.get("country") ?? "").toUpperCase();
  const q = (params.get("q") ?? "").slice(0, 80);
  if (!isCountryCode(country)) return Response.json({ cities: [] }, { status: 400 });
  const cities = await searchCities(country, q);
  return Response.json(
    { cities },
    { headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" } },
  );
}
