import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { C, S, SP, R, Shadows } from './ui';
import { api, money } from './api';

export default function SettlementsScreen({ route }) {
  const trip = route.params.trip;
  const [tab, setTab] = useState('detailed');
  const [detailed, setDetailed] = useState(null);
  const [optimized, setOptimized] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [det, opt] = await Promise.all([
        api(`/trips/${trip.id}/settlements`),
        api(`/trips/${trip.id}/optimized-settlements`)
      ]);
      setDetailed(det);
      setOptimized(opt);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [trip.id])
  );

  const handleSettleDetailed = async (split) => {
    try {
      await api(`/splits/${split.id}/settled`, {
        method: 'PATCH',
        body: { is_settled: true }
      });
      fetchData();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const handleOptimizedPayment = (settlement) => {
    Alert.alert(
      'Xác nhận thanh toán',
      `Xác nhận ${settlement.debtor_profile?.full_name} đã chuyển ${money(settlement.amount)} cho ${settlement.creditor_profile?.full_name}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Ghi nhận', 
          onPress: async () => {
            try {
              await api(`/trips/${trip.id}/expenses`, {
                method: 'POST',
                body: {
                  title: `Thanh toán nợ tối ưu`,
                  amount: settlement.amount,
                  category: 'other',
                  payment_source: 'personal',
                  paid_by: settlement.debtor_id,
                  participants: [settlement.creditor_id],
                  expense_date: new Date().toISOString().slice(0, 10),
                }
              });
              Alert.alert('Thành công', 'Đã ghi nhận thanh toán.');
              fetchData();
            } catch (e) {
              Alert.alert('Lỗi', e.message);
            }
          }
        }
      ]
    );
  };

  if (!detailed || !optimized) return <View style={S.center}><ActivityIndicator size="large" color={C.blue} /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={S.content}>
        <View style={{ marginBottom: SP.lg }}>
          <Text style={S.title}>Chia tiền (Settlements)</Text>
          <Text style={S.subtitle}>Hoàn tiền cho thành viên trả hộ</Text>
        </View>

        {/* Tabs */}
        <View style={[S.row, { marginBottom: SP.lg, borderBottomWidth: 1, borderBottomColor: C.surfaceContainer }]}>
          <Pressable 
            style={{ flex: 1, paddingVertical: SP.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: tab === 'detailed' ? C.blue : 'transparent' }}
            onPress={() => setTab('detailed')}
          >
            <Text style={{ fontFamily: tab === 'detailed' ? 'Inter_700Bold' : 'Inter_500Medium', color: tab === 'detailed' ? C.blue : C.subtle }}>Chi tiết</Text>
          </Pressable>
          <Pressable 
            style={{ flex: 1, paddingVertical: SP.md, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: tab === 'optimized' ? C.blue : 'transparent' }}
            onPress={() => setTab('optimized')}
          >
            <Text style={{ fontFamily: tab === 'optimized' ? 'Inter_700Bold' : 'Inter_500Medium', color: tab === 'optimized' ? C.blue : C.subtle }}>Gợi ý chuyển khoản</Text>
          </Pressable>
        </View>

        {loading && <ActivityIndicator style={{ marginBottom: SP.md }} color={C.blue} />}

        {tab === 'detailed' ? (
          <View style={{ gap: SP.md }}>
            <Text style={[S.body, { color: C.subtle, marginBottom: SP.sm }]}>Chỉ khoản chi do thành viên trả hộ mới xuất hiện ở đây. Chi từ quỹ chung không tạo công nợ.</Text>
            {detailed.length === 0 && !loading ? (
              <Text style={{ textAlign: 'center', color: C.muted, marginTop: SP.xl }}>Không có công nợ chi tiết nào.</Text>
            ) : detailed.map(split => (
              <View key={split.id} style={{ backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, ...Shadows.ambient }}>
                <View style={[S.row, { justifyContent: 'space-between', marginBottom: SP.sm }]}>
                  <View style={[S.row, { flex: 1 }]}>
                    <View style={{ width: 40, height: 40, borderRadius: R.full, backgroundColor: split.is_settled ? C.mintLight : C.redLight, alignItems: 'center', justifyContent: 'center', marginRight: SP.md }}>
                      <Ionicons name={split.is_settled ? "checkmark" : "cash-outline"} size={20} color={split.is_settled ? C.mint : C.red} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.h2, { fontSize: 15 }]} numberOfLines={1}>
                        {split.profile.full_name} <Ionicons name="arrow-forward" size={12} color={C.muted} /> {split.owed_to.full_name}
                      </Text>
                      <Text style={[S.body, { color: C.subtle, fontSize: 13, marginTop: 2 }]} numberOfLines={1}>{split.expense_title}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.ink, marginBottom: 8 }}>{money(split.amount_owed)}</Text>
                  <Pressable 
                    style={{ width: '100%', paddingVertical: 10, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', backgroundColor: split.is_settled ? C.mintLight : C.blueSoft, opacity: split.is_settled ? 0.7 : 1 }}
                    onPress={() => handleSettleDetailed(split)}
                    disabled={split.is_settled}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: split.is_settled ? C.mint : C.blue }}>{split.is_settled ? "✓ Đã hoàn tiền" : "Đánh dấu đã hoàn"}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ gap: SP.md }}>
            <View style={{ backgroundColor: C.blueLight + '20', padding: SP.md, borderRadius: R.md, marginBottom: SP.sm }}>
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.blueDark, marginBottom: 4 }}>Tối ưu hoá (Simplify Debts)</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', color: C.blueDark, fontSize: 13, lineHeight: 18 }}>Hệ thống đã gộp các khoản nợ chéo. Nhấn "Ghi nhận" để tạo một khoản cấn trừ tự động, giúp triệt tiêu nợ mà không cần đánh dấu từng khoản chi tiết.</Text>
            </View>
            {optimized.length === 0 && !loading ? (
              <Text style={{ textAlign: 'center', color: C.muted, marginTop: SP.xl }}>Tuyệt vời! Không còn khoản nợ nào cần thanh toán.</Text>
            ) : optimized.map((settlement, index) => (
              <View key={index} style={{ backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, ...Shadows.ambient }}>
                <View style={[S.row, { justifyContent: 'space-between', marginBottom: SP.sm }]}>
                  <View style={[S.row, { flex: 1 }]}>
                    <View style={{ width: 40, height: 40, borderRadius: R.full, backgroundColor: C.orangeLight, alignItems: 'center', justifyContent: 'center', marginRight: SP.md }}>
                      <Ionicons name="sparkles" size={20} color={C.orangeDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.h2, { fontSize: 15 }]} numberOfLines={1}>
                        {settlement.debtor_profile?.full_name} <Ionicons name="arrow-forward" size={12} color={C.muted} /> {settlement.creditor_profile?.full_name}
                      </Text>
                      <Text style={[S.body, { color: C.subtle, fontSize: 13, marginTop: 2 }]}>Chuyển khoản gộp tối ưu</Text>
                    </View>
                  </View>
                </View>
                <View style={[S.row, { justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }]}>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.blue }}>{money(settlement.amount)}</Text>
                  <Pressable 
                    style={[S.button, { marginTop: 0, paddingVertical: 8, paddingHorizontal: 16 }]}
                    onPress={() => handleOptimizedPayment(settlement)}
                  >
                    <Text style={[S.buttonText, { fontSize: 13 }]}>Ghi nhận</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
