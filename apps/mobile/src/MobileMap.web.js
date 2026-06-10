import React from 'react';
import { Text, View } from 'react-native';
import { S } from './ui';

export default function MobileMap({ height = 280 }) {
  return <View style={[S.card, { height, alignItems: 'center', justifyContent: 'center' }]}>
    <Text style={S.subtitle}>Bản đồ tương tác hiển thị trong ứng dụng Android/iOS.</Text>
  </View>;
}
