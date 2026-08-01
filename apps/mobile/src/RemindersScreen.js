import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { C, S, SP, R, Shadows } from './ui';
import { api, money } from './api';

export default function RemindersScreen({ route, navigation }) {
  const trip = route.params.trip;
  const [members, setMembers] = useState(null);
  const [reminders, setReminders] = useState(null);
  const [sending, setSending] = useState({});

  const fetchData = async () => {
    try {
      const [mems, rems] = await Promise.all([
        api(`/trips/${trip.id}/members`),
        api(`/trips/${trip.id}/reminders`)
      ]);
      setMembers(mems);
      setReminders(rems);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [trip.id])
  );

  const sendReminder = async (member) => {
    setSending(prev => ({ ...prev, [member.id]: true }));
    try {
      await api(`/trips/${trip.id}/reminders`, {
        method: 'POST',
        body: {
          recipient_id: member.user_id,
          message: `Nhắc ${member.profile?.full_name || 'bạn'} hoàn tất khoản đóng góp ${money(member.remaining_amount)}.`
        }
      });
      await fetchData();
      Alert.alert('Thành công', 'Đã gửi nhắc nhở.');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSending(prev => ({ ...prev, [member.id]: false }));
    }
  };

  if (!members || !reminders) return <View style={S.center}><ActivityIndicator size="large" color={C.blue} /></View>;

  const unpaidMembers = members.filter(m => m.contribution_status !== 'paid');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={S.content}>
        <View style={{ marginBottom: 24 }}>
          <Text style={S.title}>Nhắc thanh toán</Text>
          <Text style={S.subtitle}>{trip.name}</Text>
        </View>

        <Text style={[S.h2, { marginBottom: SP.sm }]}>Cần nhắc nhở</Text>
        {unpaidMembers.length === 0 ? (
          <Text style={[S.body, { color: C.muted, marginBottom: SP.lg }]}>Tất cả thành viên đã hoàn thành đóng góp.</Text>
        ) : (
          <View style={{ marginBottom: SP.lg, gap: SP.md }}>
            {unpaidMembers.map(m => (
              <View key={m.id} style={{ backgroundColor: C.surface, padding: SP.md, borderRadius: R.lg, ...Shadows.ambient, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[S.h2, { fontSize: 16 }]}>{m.profile?.full_name}</Text>
                  <Text style={[S.body, { color: C.red }]}>Còn thiếu {money(m.remaining_amount)}</Text>
                </View>
                <Pressable 
                  style={{ backgroundColor: C.blue, paddingHorizontal: 12, paddingVertical: 8, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', opacity: sending[m.id] ? 0.7 : 1 }}
                  onPress={() => sendReminder(m)}
                  disabled={sending[m.id]}
                >
                  {sending[m.id] ? (
                    <ActivityIndicator size="small" color={C.white} />
                  ) : (
                    <>
                      <Ionicons name="send" size={14} color={C.white} style={{ marginRight: 6 }} />
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.white, fontSize: 13 }}>Gửi nhắc</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Text style={[S.h2, { marginBottom: SP.sm, marginTop: SP.md }]}>Lịch sử nhắc</Text>
        {reminders.length === 0 ? (
          <Text style={[S.body, { color: C.muted }]}>Chưa có lịch sử gửi nhắc nhở.</Text>
        ) : (
          <View style={{ gap: SP.sm }}>
            {reminders.map(r => (
              <View key={r.id} style={{ backgroundColor: C.surface, padding: SP.md, borderRadius: R.lg, ...Shadows.ambient }}>
                <Text style={[S.h2, { fontSize: 15 }]}>{r.recipient?.full_name || 'Khách'}</Text>
                <Text style={[S.body, { color: C.subtle, marginTop: 4 }]}>
                  {r.message} · {new Date(r.sent_at).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
