import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, S, SP, R, Shadows } from './ui';
import { api, money } from './api';
import { TopAppBar } from './ItineraryScreen';

export default function FundScreen({ route, navigation }) {
  const trip = route.params.trip;
  const [data, setData] = useState(null);
  const [members, setMembers] = useState(null);

  useEffect(() => {
    Promise.all([
      api(`/trips/${trip.id}/financial-summary`),
      api(`/trips/${trip.id}/members`)
    ]).then(([summary, mems]) => {
      setData(summary);
      setMembers(mems);
    }).catch(console.error);
  }, [trip.id]);

  if (!data || !members) return <View style={S.center}><ActivityIndicator size="large" color={C.blue} /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <TopAppBar title="UsTrip" subtitle="Quản lý quỹ" trip={trip} />
      
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 100 }}>
        {/* Balance Card */}
        <View style={{ backgroundColor: C.surface, borderRadius: R.xl, padding: SP.lg, ...Shadows.ambient, alignItems: 'center', marginBottom: SP.lg, overflow: 'hidden' }}>
          {/* Decorative blurs (simplified for React Native without complex SVG) */}
          <View style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, backgroundColor: C.blueLight, borderRadius: R.full, opacity: 0.5 }} />
          <View style={{ position: 'absolute', bottom: -40, left: -40, width: 100, height: 100, backgroundColor: C.orangeLight, borderRadius: R.full, opacity: 0.3 }} />
          
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Số dư hiện tại</Text>
          
          <View style={[S.row, { alignItems: 'flex-start', marginBottom: SP.lg }]}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 40, color: C.blue, letterSpacing: -1 }}>
              {data.remaining_fund ? data.remaining_fund.toLocaleString('vi-VN') : '0'}
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 20, color: C.blueLight, marginTop: 4, marginLeft: 4 }}>VNĐ</Text>
          </View>
          
          <View style={[S.row, { width: '100%', gap: SP.md }]}>
            <Pressable style={{ flex: 1, backgroundColor: C.blue, paddingVertical: 12, borderRadius: R.lg, ...S.row, justifyContent: 'center', ...Shadows.kinetic }} onPress={() => navigation.navigate('AddContribution', { trip })}>
              <Ionicons name="add" size={20} color={C.white} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.white }}>Nạp thêm</Text>
            </Pressable>
            <Pressable style={{ flex: 1, backgroundColor: C.blueSoft, paddingVertical: 12, borderRadius: R.lg, ...S.row, justifyContent: 'center' }} onPress={() => navigation.navigate('Contributions', { trip })}>
              <Ionicons name="time-outline" size={20} color={C.blue} style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.blue }}>Lịch sử</Text>
            </Pressable>
          </View>
        </View>

        {/* Member List */}
        <View style={[S.between, { marginBottom: SP.md }]}>
          <Text style={S.h2}>Thành viên ({members.length})</Text>
          <Text style={S.body}>Tiến độ: {members.filter(m => m.paid_amount >= data.fund_per_person).length}/{members.length}</Text>
        </View>

        <View style={{ backgroundColor: C.surface, borderRadius: R.xl, ...Shadows.ambient }}>
          {members.map((m, index) => {
            const hasPaid = m.paid_amount >= data.fund_per_person;
            return (
              <View key={m.id} style={{ padding: SP.md, borderBottomWidth: index < members.length - 1 ? 1 : 0, borderBottomColor: C.surfaceContainer, ...S.between }}>
                <View style={S.row}>
                  <View style={{ width: 48, height: 48, borderRadius: R.full, backgroundColor: C.surfaceVariant, marginRight: SP.md, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                     {m.avatar_url ? (
                       <Image source={{ uri: m.avatar_url }} style={{ width: 48, height: 48 }} />
                     ) : (
                       <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.muted }}>{m.full_name[0]}</Text>
                     )}
                  </View>
                  <View>
                    <Text style={[S.h2, { fontSize: 16 }]}>{m.full_name}</Text>
                    <Text style={[S.body, { color: C.subtle }]}>{money(m.paid_amount || 0)}</Text>
                  </View>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 4, backgroundColor: hasPaid ? C.mintLight : C.redLight, borderRadius: R.full, ...S.row, marginBottom: 4 }}>
                    <Ionicons name={hasPaid ? "checkmark-circle" : "alert-circle"} size={14} color={hasPaid ? C.mint : C.red} style={{ marginRight: 4 }} />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: hasPaid ? C.mint : C.red }}>
                      {hasPaid ? "Đã đóng" : "Chưa đóng"}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <Pressable 
          style={{ width: '100%', marginTop: SP.lg, backgroundColor: C.orangeLight, paddingVertical: 16, borderRadius: R.lg, ...S.row, justifyContent: 'center', ...Shadows.ambient }}
          onPress={() => navigation.navigate('Reminders', { trip })}
        >
          <Ionicons name="notifications-outline" size={20} color={C.orangeDark} style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.orangeDark }}>Nhắc nhở đóng quỹ</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
