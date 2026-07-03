import { useState } from 'react';
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { currency } from '../lib/api';

const osmTileUrl = import.meta.env.VITE_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const nominatimUrl = (import.meta.env.VITE_NOMINATIM_URL || 'https://nominatim.openstreetmap.org').replace(/\/$/, '');

const markerIcon = L.divIcon({
  className: 'ustrip-marker',
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#2563EB;border:4px solid white;box-shadow:0 4px 15px rgba(37,99,235,0.35);transform:rotate(-45deg)"><div style="width:7px;height:7px;border-radius:50%;background:white;margin:6px"></div></div>',
  iconSize: [28, 28], iconAnchor: [14, 28]
});

const coords = (activity) => [Number(activity.latitude), Number(activity.longitude)];
const valid = (activity) => Number.isFinite(Number(activity.latitude)) && Number.isFinite(Number(activity.longitude));

function Picker({ onPick }) {
  useMapEvents({ click: (event) => onPick?.({ latitude: event.latlng.lat, longitude: event.latlng.lng }) });
  return null;
}

export function MapLoadingState() {
  return <div className="grid h-80 animate-shimmer place-items-center rounded-2xl bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%] text-sm font-semibold text-slate-400">Đang tải bản đồ...</div>;
}

export function MapErrorState({ message = 'Không thể hiển thị bản đồ.' }) {
  return <div className="grid h-80 place-items-center rounded-2xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600">{message}</div>;
}

export function RoutePreview({ activities }) {
  const points = activities.filter(valid).map(coords);
  return points.length > 1 ? <Polyline positions={points} pathOptions={{ color: '#2563EB', weight: 4, dashArray: '8 8' }}/> : null;
}

export function ActivityMarker({ activity }) {
  return <Marker position={coords(activity)} icon={markerIcon}><Popup><div className="min-w-44"><b>{activity.title}</b><p>{activity.start_time?.slice(0, 5)} · {activity.location_name || activity.location}</p><p>{currency(activity.estimated_cost)}</p></div></Popup></Marker>;
}

export function MapView({ activities = [], selected, onPick, height = 360 }) {
  const places = activities.filter(valid);
  const center = selected && valid(selected) ? coords(selected) : places.length ? coords(places[0]) : [10.7769, 106.7009];
  try {
    return <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-card" style={{ height }}>
      <MapContainer center={center} zoom={places.length ? 13 : 6} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url={osmTileUrl}/>
        <RoutePreview activities={places}/>
        {places.map((activity) => <ActivityMarker key={activity.id || `${activity.latitude}-${activity.longitude}`} activity={activity}/>)}
        <Picker onPick={onPick}/>
      </MapContainer>
    </div>;
  } catch {
    return <MapErrorState/>;
  }
}

export function LocationSearchInput({ value, onChange, onSelect }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const search = async () => {
    if (!value?.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`${nominatimUrl}/search?format=jsonv2&limit=5&q=${encodeURIComponent(value)}`);
      setResults(await response.json());
    } finally { setLoading(false); }
  };
  return <div className="relative">
    <div className="flex gap-2"><input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Tìm địa điểm thật..."/><button type="button" className="btn-secondary shrink-0" onClick={search}>{loading ? 'Đang tìm' : 'Tìm'}</button></div>
    {results.length > 0 && <div className="absolute z-[1001] mt-2 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-modal">
      {results.map((result) => <button type="button" key={result.place_id} onClick={() => { onSelect({ location: result.display_name.split(',')[0], location_name: result.name || result.display_name.split(',')[0], address: result.display_name, latitude: Number(result.lat), longitude: Number(result.lon), place_id: String(result.place_id), map_provider: 'openstreetmap' }); setResults([]); }} className="block w-full rounded-lg p-3 text-left text-sm transition hover:bg-blue-50">
        <b>{result.name || result.display_name.split(',')[0]}</b>
        <span className="mt-1 block text-xs text-slate-500">{result.display_name}</span>
      </button>)}
    </div>}
  </div>;
}
