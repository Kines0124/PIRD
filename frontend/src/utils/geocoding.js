const TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export const MAPBOX_TOKEN = TOKEN;

export async function geocodeAddress(address) {
  if (!MAPBOX_TOKEN) return null;
  try {
    const encoded = encodeURIComponent(`${address}, Brasil`);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`
      + `?access_token=${MAPBOX_TOKEN}&country=BR&language=pt&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}
