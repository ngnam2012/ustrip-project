import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { C, S, SP, R, Shadows } from './ui';
import { api, money } from './api';

const categoryLabels = {
  food: 'Ăn uống', transport: 'Di chuyển', hotel: 'Lưu trú',
  ticket: 'Vui chơi', shopping: 'Mua sắm', other: 'Khác'
};

export default function ExpensesScreen({ route, navigation }) {
  const trip = route.params.trip;
  const [expenses, setExpenses] = useState(null);
  const [total, setTotal] = useState({ fund: 0, personal: 0 });

  useFocusEffect(
    useCallback(() => {
      api(`/trips/${trip.id}/expenses`).then(data => {
        setExpenses(data);
        const fund = data.filter(e => e.payment_source === 'shared_fund').reduce((s, e) => s + Number(e.amount || 0), 0);
        const personal = data.filter(e => e.payment_source === 'personal').reduce((s, e) => s + Number(e.amount || 0), 0);
        setTotal({ fund, personal });
      }).catch(() => {});
    }, [trip.id])
  );

  if (!expenses) return <View style={S.center}><ActivityIndicator size="large" color={C.blue} /></View>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 120 }}>
        <View style={{ marginBottom: SP.lg }}>
          <Text style={S.title}>Chi tiêu</Text>
          <Text style={S.subtitle}>{trip.name}</Text>
        </View>

        {/* Summary Cards */}
        <View style={[S.row, { gap: SP.md, marginBottom: SP.lg }]}>
          <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, ...Shadows.ambient }}>
            <Ionicons name="wallet-outline" size={20} color={C.blue} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.ink, marginTop: 6 }}>{money(total.fund)}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.subtle, marginTop: 2 }}>Quỹ chung</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, ...Shadows.ambient }}>
            <Ionicons name="people-outline" size={20} color={C.orange} />
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: C.ink, marginTop: 6 }}>{money(total.personal)}</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.subtle, marginTop: 2 }}>Trả hộ</Text>
          </View>
        </View>

        {/* Expense List */}
        <Text style={[S.h2, { marginBottom: SP.sm }]}>Lịch sử chi tiêu ({expenses.length})</Text>
        
        {expenses.length === 0 ? (
          <View style={{ backgroundColor: C.surface, borderRadius: R.lg, padding: SP.xl, alignItems: 'center', ...Shadows.ambient }}>
            <Ionicons name="receipt-outline" size={40} color={C.muted} />
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: C.muted, marginTop: SP.md }}>Chưa có khoản chi tiêu nào.</Text>
          </View>
        ) : (
          <View style={{ gap: SP.sm }}>
            {expenses.map(expense => {
              const isShared = expense.payment_source === 'shared_fund';
              const splits = expense.splits || [];
              return (
                <Pressable
                  key={expense.id}
                  onPress={() => navigation.navigate('ExpenseDetail', { trip, item: expense })}
                  style={{ backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, ...Shadows.ambient }}
                >
                  {/* Header row */}
                  <View style={[S.row, { justifyContent: 'space-between', marginBottom: 6 }]}>
                    <View style={{ flex: 1, marginRight: SP.md }}>
                      <Text style={[S.h2, { fontSize: 15 }]} numberOfLines={1}>{expense.title}</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.subtle, marginTop: 2 }}>
                        {categoryLabels[expense.category] || expense.category} · {new Date(expense.expense_date).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: C.ink }}>{money(expense.amount)}</Text>
                  </View>

                  {/* Source badge */}
                  <View style={[S.row, { marginTop: 4, gap: 8 }]}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.full, backgroundColor: isShared ? C.mintLight : C.blueSoft }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: isShared ? C.mint : C.blue }}>
                        {isShared ? 'Quỹ chung' : 'Trả hộ'}
                      </Text>
                    </View>
                    {!isShared && expense.payer && (
                      <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: C.subtle }}>
                        bởi {expense.payer.full_name}
                      </Text>
                    )}
                  </View>

                  {/* Splits - who owes whom */}
                  {!isShared && splits.length > 0 && (
                    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.surfaceContainer }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.subtle, marginBottom: 4 }}>Chia cho:</Text>
                      {splits.map(split => (
                        <View key={split.id} style={[S.row, { justifyContent: 'space-between', paddingVertical: 3 }]}>
                          <View style={S.row}>
                            <Ionicons 
                              name={split.is_settled ? "checkmark-circle" : "ellipse-outline"} 
                              size={14} 
                              color={split.is_settled ? C.mint : C.muted} 
                              style={{ marginRight: 6 }} 
                            />
                            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.ink }}>
                              {split.profile?.full_name || 'Thành viên'}
                            </Text>
                          </View>
                          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: split.is_settled ? C.mint : C.red }}>
                            {money(split.amount_owed)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Bill image thumbnail */}
                  {expense.bill_image_url ? (
                    <Image 
                      source={{ uri: expense.bill_image_url }} 
                      style={{ height: 120, borderRadius: R.md, marginTop: 8, backgroundColor: C.surfaceVariant }} 
                      resizeMode="cover" 
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB - Add Expense */}
      <Pressable
        style={{
          position: 'absolute', bottom: 24, right: 20,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center',
          ...Shadows.kinetic, elevation: 6
        }}
        onPress={() => navigation.navigate('AddExpense', { trip })}
      >
        <Ionicons name="add" size={28} color={C.white} />
      </Pressable>
    </SafeAreaView>
  );
}
