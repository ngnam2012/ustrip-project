import React from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { C } from './ui';

const osmTileUrl = process.env.EXPO_PUBLIC_OSM_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

const validCoord = (value) =>
  Number.isFinite(Number(value?.latitude)) && Number.isFinite(Number(value?.longitude));

export default function MobileMap({ activities = [], onPick, height = 280 }) {
  const places = activities.filter(validCoord);
  const first = places[0] || { latitude: 10.7769, longitude: 106.7009 };
  return <View style={{ height, borderRadius: 20, overflow: 'hidden' }}>
    <MapView
      mapType="none"
      style={{ height }}
      initialRegion={{
        latitude: Number(first.latitude),
        longitude: Number(first.longitude),
        latitudeDelta: .12,
        longitudeDelta: .12
      }}
      onPress={(event) => onPick?.(event.nativeEvent.coordinate)}
    >
      <UrlTile urlTemplate={osmTileUrl} maximumZ={19}/>
      {places.map((place, index) => <Marker
        key={place.id || index}
        coordinate={{ latitude: Number(place.latitude), longitude: Number(place.longitude) }}
        title={place.title}
        description={place.location_name || place.location}
      />)}
      {places.length > 1 && <Polyline
        coordinates={places.map((place) => ({ latitude: Number(place.latitude), longitude: Number(place.longitude) }))}
        strokeColor={C.blue}
        strokeWidth={4}
      />}
    </MapView>
    <Text style={{ position: 'absolute', right: 5, bottom: 4, backgroundColor: '#FFFFFFCC', paddingHorizontal: 5, fontSize: 9, color: C.muted }}>
      © OpenStreetMap contributors
    </Text>
  </View>;
}
