import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, S, SP, R, Shadows } from './ui';
import { api } from './api';
import MobileMap from './MobileMap';

import { useNavigation } from '@react-navigation/native';

const validCoord = (x) => Number.isFinite(Number(x?.latitude)) && Number.isFinite(Number(x?.longitude));

export function TopAppBar({ title, subtitle, trip }) {
  const navigation = useNavigation();
  
  return (
    <View style={[S.between, { paddingHorizontal: SP.lg, paddingVertical: SP.md, backgroundColor: C.surface, ...Shadows.ambient, zIndex: 50 }]}>
      <View style={S.row}>
        <View style={{ width: 32, height: 32, borderRadius: R.full, backgroundColor: C.blueLight, alignItems: 'center', justifyContent: 'center', marginRight: SP.sm }}>
          <Ionicons name="people" size={18} color={C.blueDark} />
        </View>
        <View>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: C.blue }}>{title}</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: C.muted }}>{subtitle}</Text>
        </View>
      </View>
      <View style={S.row}>
        {trip && (
          <Pressable 
            style={{ padding: SP.xs, marginRight: SP.sm }}
            onPress={() => navigation.navigate('Chat', { trip })}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={24} color={C.blue} />
          </Pressable>
        )}
        <Pressable style={{ padding: SP.xs }}>
          <Ionicons name="settings-outline" size={24} color={C.muted} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ItineraryScreen({ route, navigation }) {
  const trip = route.params.trip;
  const [activities, setActivities] = useState(null);
  const [selectedDate, setSelectedDate] = useState(trip.start_date);

  useEffect(() => {
    api(`/trips/${trip.id}/activities`).then(setActivities).catch(console.error);
  }, [trip.id]);

  if (!activities) return <View style={S.center}><ActivityIndicator size="large" color={C.blue} /></View>;

  // Generate days between start_date and end_date
  const startDate = new Date(trip.start_date);
  const endDate = new Date(trip.end_date);
  const days = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d).toISOString().split('T')[0]);
  }

  const filteredActivities = activities.filter(a => a.activity_date === selectedDate || !a.activity_date);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <TopAppBar title={trip.name} subtitle={`${trip.start_date} → ${trip.end_date}`} trip={trip} />
      
      <ScrollView contentContainerStyle={{ padding: SP.lg, paddingBottom: 100 }}>
        {/* Horizontal Dates */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: SP.lg }}>
          {days.map((dateStr, index) => {
            const isSelected = dateStr === selectedDate;
            const dateObj = new Date(dateStr);
            const dayNum = dateObj.getDate();
            return (
              <Pressable 
                key={dateStr} 
                onPress={() => setSelectedDate(dateStr)}
                style={{ 
                  width: 72, height: 64, 
                  backgroundColor: isSelected ? C.blue : C.surfaceContainer, 
                  borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', 
                  marginRight: SP.sm, 
                  ...(isSelected ? Shadows.kinetic : {}) 
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 11, color: isSelected ? C.white : C.muted, textTransform: 'uppercase', opacity: isSelected ? 0.9 : 1 }}>Day {index + 1}</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: isSelected ? C.white : C.ink }}>{dayNum}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Map */}
        {filteredActivities.some(validCoord) && (
          <View style={{ marginBottom: SP.lg }}>
             <Text style={[S.h2, { marginBottom: SP.md }]}>Bản đồ</Text>
             <MobileMap activities={filteredActivities} />
          </View>
        )}

        {/* Timeline */}
        <Text style={[S.h2, { marginBottom: SP.md }]}>Lịch trình</Text>
        <View style={{ paddingLeft: SP.lg }}>
          {/* Vertical Line */}
          <View style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, backgroundColor: C.line }} />
          
          {filteredActivities.length === 0 ? (
            <Text style={[S.emptyText, { marginTop: SP.xl }]}>Chưa có hoạt động nào trong ngày này.</Text>
          ) : (
            filteredActivities.map((act, index) => (
              <View key={act.id || index} style={{ marginBottom: SP.md, position: 'relative' }}>
                {/* Dot */}
                <View style={{ position: 'absolute', left: -SP.lg - 11, top: 6, width: 24, height: 24, backgroundColor: C.bg, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: index === 0 ? C.blue : C.border, borderRadius: R.full, borderWidth: 4, borderColor: index === 0 ? C.blueLight : C.surfaceVariant }} />
                </View>

                {/* Card */}
                <View style={{ backgroundColor: C.surface, borderRadius: R.xl, padding: SP.md, ...Shadows.ambient, borderWidth: 1, borderColor: C.surfaceContainer }}>
                  <View style={[S.between, { alignItems: 'flex-start' }]}>
                    <View style={[S.row, { flex: 1 }]}>
                      <View style={{ width: 48, height: 48, backgroundColor: index % 2 === 0 ? C.orangeLight : C.blueSoft, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', marginRight: SP.md }}>
                        <Ionicons name={index % 2 === 0 ? "restaurant" : "location"} size={24} color={index % 2 === 0 ? C.orangeDark : C.blueDark} />
                      </View>
                      <View style={{ flex: 1, paddingRight: SP.sm }}>
                        <Text style={[S.h2, { marginBottom: 2 }]}>{act.title}</Text>
                        <View style={S.row}>
                          <Ionicons name="time-outline" size={14} color={C.muted} style={{ marginRight: 4 }} />
                          <Text style={S.body}>{act.start_time?.slice(0,5) || 'Cả ngày'}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <Pressable 
                      style={{ backgroundColor: C.blueSoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: R.sm, ...S.row }}
                      onPress={() => navigation.navigate('AddExpense', { trip, activity: act })}
                    >
                      <Ionicons name="receipt-outline" size={14} color={C.blue} style={{ marginRight: 4 }} />
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.blue }}>Ghi bill</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable 
        style={{ position: 'absolute', bottom: 100, right: 24, width: 56, height: 56, backgroundColor: C.blue, borderRadius: R.xl, alignItems: 'center', justifyContent: 'center', ...Shadows.kinetic, zIndex: 100 }}
        onPress={() => navigation.navigate('AddActivity', { trip })}
      >
        <Ionicons name="add" size={32} color={C.white} />
      </Pressable>
    </SafeAreaView>
  );
}
