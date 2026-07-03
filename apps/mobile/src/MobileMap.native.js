import React, { useRef, useEffect } from 'react';
import { Text, View } from 'react-native';
import MapView, { Callout, Marker, Polyline, UrlTile } from 'react-native-maps';
import { C } from './ui';

const osmTileUrl = process.env.EXPO_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const validCoord = (value) =>
  Number.isFinite(Number(value?.latitude)) && Number.isFinite(Number(value?.longitude));

export default function MobileMap({ activities = [], onPick, height = 280 }) {
  const mapRef = useRef(null);
  const places = activities.filter(validCoord);
  const first = places[0] || { latitude: 10.7769, longitude: 106.7009 };

  // Auto-zoom to fit all markers when multiple places exist
  useEffect(() => {
    if (places.length > 1 && mapRef.current) {
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          places.map((p) => ({
            latitude: Number(p.latitude),
            longitude: Number(p.longitude)
          })),
          {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true
          }
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [places.length]);

  return <View style={{ height, borderRadius: 20, overflow: 'hidden' }}>
    <MapView
      ref={mapRef}
      mapType="none"
      style={{ height }}
      initialRegion={{
        latitude: Number(first.latitude),
        longitude: Number(first.longitude),
        latitudeDelta: places.length > 1 ? .5 : .12,
        longitudeDelta: places.length > 1 ? .5 : .12
      }}
      onPress={(event) => onPick?.(event.nativeEvent.coordinate)}
    >
      <UrlTile urlTemplate={osmTileUrl} maximumZ={19}/>
      {places.map((place, index) => <Marker
        key={place.id || index}
        coordinate={{ latitude: Number(place.latitude), longitude: Number(place.longitude) }}
        pinColor={index === 0 ? C.blue : C.orange}
      >
        <Callout tooltip={false}>
          <View style={{ minWidth: 140, padding: 4 }}>
            <Text style={{ fontWeight: '800', fontSize: 14, color: C.ink }}>{place.title || `Điểm ${index + 1}`}</Text>
            {(place.location_name || place.location) ? <Text style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{place.location_name || place.location}</Text> : null}
            {place.start_time ? <Text style={{ fontSize: 11, color: C.blue, marginTop: 3 }}>{place.start_time?.slice(0, 5)}</Text> : null}
          </View>
        </Callout>
      </Marker>)}
      {places.length > 1 && <Polyline
        coordinates={places.map((place) => ({ latitude: Number(place.latitude), longitude: Number(place.longitude) }))}
        strokeColor={C.blue}
        strokeWidth={4}
        lineDashPattern={[8, 4]}
      />}
    </MapView>
    <Text style={{ position: 'absolute', right: 5, bottom: 4, backgroundColor: '#FFFFFFCC', paddingHorizontal: 5, fontSize: 9, color: C.muted }}>
      © OpenStreetMap contributors
    </Text>
  </View>;
}
