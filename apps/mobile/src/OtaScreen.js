import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Image, FlatList, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { api, money } from './api';
import { C, S, SP } from './ui';
import Animated, { FadeInDown } from 'react-native-reanimated';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'food', label: 'Ăn uống' },
  { id: 'accommodation', label: 'Lưu trú' },
  { id: 'transport', label: 'Di chuyển' },
  { id: 'activity', label: 'Vui chơi' }
];

export default function OtaScreen({ route }) {
  const trip = route.params.trip;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    api(`/trips/${trip.id}/mock-ota/services`)
      .then(setData)
      .catch(e => Alert.alert('Lỗi', e.message))
      .finally(() => setLoading(false));
  }, [trip.id]);

  const filteredData = useMemo(() => {
    if (activeCategory === 'all') return data;
    return data.filter(item => item.category === activeCategory);
  }, [data, activeCategory]);

  const book = async (item) => {
    if (booking) return;
    setBooking(item.id);
    const qty = quantities[item.id] || 1;
    try {
      const res = await api(`/trips/${trip.id}/mock-ota/book`, {
        method: 'POST',
        body: { service_id: item.id, quantity: qty }
      });
      if (res.expense?.payment_source === 'shared_fund') {
        Alert.alert('Thành công', 'Đặt dịch vụ thành công! Đã thanh toán từ quỹ chung.');
      } else {
        Alert.alert('Thành công', 'Quỹ chung không đủ! Đã ghi nhận bạn ứng trước tiền và tự động chia đều công nợ cho nhóm.');
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setBooking(null);
    }
  };

  const renderItem = ({ item, index }) => {
    const qty = quantities[item.id] || 1;
    return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()} style={[S.card, { padding: 0, overflow: 'hidden' }]}>
      <View style={{ position: 'relative' }}>
        <Image source={{ uri: item.image }} style={{ width: '100%', height: 160, backgroundColor: '#E5E7EB' }} />
        <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.blue, textTransform: 'capitalize' }}>
            {item.category === 'food' ? 'Ăn uống' : item.category === 'transport' ? 'Di chuyển' : item.category === 'accommodation' ? 'Lưu trú' : 'Vui chơi'}
          </Text>
        </View>
      </View>
      
      <View style={{ padding: SP.md }}>
        <Text style={S.h2} numberOfLines={2}>{item.title}</Text>
        <Text style={[S.subtitle, { marginTop: 4, flex: 1 }]} numberOfLines={2}>{item.description}</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SP.lg, borderTopWidth: 1, borderTopColor: C.line, paddingTop: SP.md }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.blue }}>{money(item.price * qty)}</Text>
            <Text style={{ fontSize: 11, color: C.muted }}>{money(item.price)}/vé</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8, overflow: 'hidden' }}>
              <Pressable onPress={() => setQuantities({...quantities, [item.id]: Math.max(1, qty - 1)})} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, margin: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: C.ink }}>-</Text>
              </Pressable>
              <Text style={{ width: 24, textAlign: 'center', fontSize: 13, fontWeight: '700', color: C.ink }}>{qty}</Text>
              <Pressable onPress={() => setQuantities({...quantities, [item.id]: qty + 1})} style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white, margin: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: C.ink }}>+</Text>
              </Pressable>
            </View>
            <Pressable 
              style={[S.button, { paddingVertical: 8, paddingHorizontal: 16, minHeight: 0 }]}
              onPress={() => book(item)}
              disabled={booking === item.id}
            >
              {booking === item.id ? (
                <ActivityIndicator color={C.white} size="small" />
              ) : (
                <Text style={[S.buttonText, { fontSize: 13 }]}>Đặt</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
  }

  return (
    <View style={S.screen}>
      <FlatList
        data={filteredData}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={S.content}
        ListHeaderComponent={
          <View style={{ marginBottom: SP.lg }}>
            <Text style={S.title}>Dịch vụ OTA</Text>
            <Text style={S.subtitle}>Khám phá và Đặt trước</Text>
            
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: SP.md, marginHorizontal: -SP.lg }} contentContainerStyle={{ paddingHorizontal: SP.lg }}>
              {CATEGORIES.map(t => (
                <Pressable
                  key={t.id}
                  onPress={() => setActiveCategory(t.id)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                    backgroundColor: activeCategory === t.id ? C.blue : C.white,
                    borderWidth: 1,
                    borderColor: activeCategory === t.id ? C.blue : C.line,
                  }}
                >
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: activeCategory === t.id ? C.white : C.muted
                  }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={loading ? <ActivityIndicator color={C.blue} style={{ marginTop: 40 }} /> : null}
      />
    </View>
  );
}
