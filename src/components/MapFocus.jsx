import { useEffect } from "react";
import { useMap } from "react-map-gl";

/**
 * Voa suavemente para as coordenadas fornecidas.
 * Deve ser renderizado dentro de um <Map> do react-map-gl.
 *
 * @param {Object}  props
 * @param {[number, number]} props.coords  [latitude, longitude]
 * @param {number}  [props.zoom=15]
 * @param {string}  [props.mapId]          ID do mapa pai (necessário quando há múltiplos mapas na página)
 */
export default function MapFocus({ coords, zoom = 15, mapId }) {
  const maps = useMap();
  const map = mapId ? maps[mapId] : maps.current;

  useEffect(() => {
    if (!map || !coords) return;
    map.flyTo({
      center: [coords[1], coords[0]], // Mapbox usa [lng, lat]
      zoom,
      duration: 1200,
      essential: true,
    });
  }, [map, coords, zoom]);

  return null;
}
