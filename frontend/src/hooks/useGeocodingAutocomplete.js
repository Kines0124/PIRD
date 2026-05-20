import { useState, useEffect, useRef } from 'react';
import { MAPBOX_TOKEN } from '../utils/geocoding';

export function useGeocodingAutocomplete(query) {
  const [sugestoes, setSugestoes]         = useState([]);
  const [carregando, setCarregando]       = useState(false);
  const [semResultados, setSemResultados] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSemResultados(false);

    if (!query || query.trim().length < 3) {
      setSugestoes([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    timerRef.current = setTimeout(async () => {
      try {
        const encoded = encodeURIComponent(query);
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`
          + `?access_token=${MAPBOX_TOKEN}`
          + `&autocomplete=true&language=pt&country=BR`
          + `&types=address,neighborhood,locality,place&limit=5`;
        const res = await fetch(url);
        const data = await res.json();
        const features = data.features ?? [];
        setSugestoes(
          features.map(f => ({
            id: f.id,
            placeName: f.place_name,
            shortName: f.text,
            coordenadas: { lat: f.center[1], lng: f.center[0] },
          }))
        );
        setSemResultados(features.length === 0);
      } catch {
        setSugestoes([]);
        setSemResultados(false);
      } finally {
        setCarregando(false);
      }
    }, 300);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return { sugestoes, carregando, semResultados };
}
