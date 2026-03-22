import { useMap } from "react-leaflet";

export default function MapFocus({ coords }) {
  const map = useMap();
  if (coords) map.flyTo(coords, 16, { animate: true, duration: 1.2 });
  return null;
}
