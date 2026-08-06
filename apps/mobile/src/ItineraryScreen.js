import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, SafeAreaView, ActivityIndicator, Alert, Modal, PanResponder } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, S, SP, R, Shadows } from './ui';
import { api } from './api';
import MobileMap from './MobileMap';

import { useNavigation } from '@react-navigation/native';

const validCoord = (x) => Number.isFinite(Number(x?.latitude)) && Number.isFinite(Number(x?.longitude));
const validDuration = (activity) => {
  if (!activity?.activity_date || !activity?.start_time || !activity?.end_time) return false;
  const start = new Date(`${activity.activity_date}T${activity.start_time}`);
  const end = new Date(`${activity.end_date || activity.activity_date}T${activity.end_time}`);
  return Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end > start;
};

function DragHandle({ disabled, onStart, onMove, onEnd, onInvalid }) {
  const active = useRef(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const handlers = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      if (disabled) return;
      timer.current = setTimeout(() => {
        active.current = true;
        onStart();
      }, 350);
    },
    onPanResponderMove: (_, gesture) => {
      if (!active.current && (Math.abs(gesture.dx) > 10 || Math.abs(gesture.dy) > 10)) {
        clearTimeout(timer.current);
      }
      if (active.current) onMove(gesture.moveX, gesture.moveY);
    },
    onPanResponderRelease: (_, gesture) => {
      clearTimeout(timer.current);
      if (disabled) onInvalid();
      if (active.current) onEnd(gesture.moveX, gesture.moveY);
      active.current = false;
    },
    onPanResponderTerminate: () => {
      clearTimeout(timer.current);
      if (active.current) onEnd(null, null);
      active.current = false;
    },
  }), [disabled, onEnd, onInvalid, onMove, onStart]);

  return <View {...handlers.panHandlers} style={{ width: 38, height: 38, marginRight: SP.sm, borderRadius: R.md, backgroundColor: disabled ? C.redLight : C.blueSoft, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name="reorder-three" size={24} color={disabled ? C.red : C.blue} />
  </View>;
}

function SheetModal({ visible, title, onClose, children }) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' }}>
      <View style={{ maxHeight: '78%', backgroundColor: C.surface, borderTopLeftRadius: R.xl, borderTopRightRadius: R.xl, padding: SP.lg }}>
        <View style={[S.between, { marginBottom: SP.md }]}><Text style={[S.h2, { fontSize: 19 }]}>{title}</Text><Pressable onPress={onClose} hitSlop={12}><Ionicons name="close" size={24} color={C.muted} /></Pressable></View>
        {children}
      </View>
    </View>
  </Modal>;
}

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
          <>
            <Pressable 
              style={{ padding: SP.xs, marginRight: SP.sm }}
              onPress={() => navigation.getParent()?.navigate('AI', { trip })}
            >
              <Ionicons name="sparkles" size={24} color={C.orange} />
            </Pressable>
            <Pressable 
              style={{ padding: SP.xs, marginRight: SP.sm }}
              onPress={() => navigation.getParent()?.navigate('Chat', { trip })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={C.blue} />
            </Pressable>
          </>
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
  const [movePicker, setMovePicker] = useState(null);
  const [conflict, setConflict] = useState(null);
  const [moving, setMoving] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
  const dateNodes = useRef({});
  const dateTargets = useRef({});

  const loadActivities = async () => {
    const rows = await api(`/trips/${trip.id}/activities`);
    setActivities(rows);
    return rows;
  };

  useEffect(() => {
    loadActivities().catch(console.error);
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
  // Expand multi-day activities into per-day occurrences
  const occurrences = [];
  for (const act of activities) {
    const start = new Date(act.activity_date);
    const end = act.end_date ? new Date(act.end_date) : new Date(act.activity_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = new Date(d).toISOString().split('T')[0];
      const isFirst = dateStr === (act.activity_date || dateStr);
      const isLast = dateStr === (act.end_date || act.activity_date || dateStr);
      let occStart = null;
      let occEnd = null;
      if (isFirst) {
        occStart = act.start_time?.slice(0,5) || null;
        occEnd = isLast ? (act.end_time?.slice(0,5) || null) : '23:59';
      } else if (isLast) {
        occStart = '00:00';
        occEnd = act.end_time?.slice(0,5) || null;
      } else {
        occStart = '00:00';
        occEnd = '23:59';
      }
      occurrences.push({
        ...act,
        original_id: act.id,
        activity_date: dateStr,
        start_time: occStart,
        end_time: occEnd,
        is_continuation: !isFirst,
      });
    }
  }

  const filteredOccurrences = occurrences.filter(o => o.activity_date === selectedDate);

  const originalActivity = (occurrence) => activities.find(item => item.id === (occurrence.original_id || occurrence.id)) || occurrence;
  const measureDateTargets = () => {
    Object.entries(dateNodes.current).forEach(([dateStr, node]) => {
      node?.measureInWindow?.((x, y, width, height) => {
        dateTargets.current[dateStr] = { x, y, width, height };
      });
    });
  };
  const dateAtPoint = (x, y) => {
    if (x == null || y == null) return null;
    return Object.entries(dateTargets.current).find(([, box]) => x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height)?.[0] || null;
  };

  const moveActivity = async (occurrence, sourceDate, targetDate, startTimeOverride = null) => {
    const original = originalActivity(occurrence);
    if (!validDuration(original)) {
      Alert.alert('Cần sửa thời gian', 'Giờ kết thúc phải sau giờ bắt đầu trước khi có thể di chuyển.', [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Chỉnh sửa', onPress: () => navigation.getParent()?.navigate('AddActivity', { trip, activityId: original.id }) },
      ]);
      return;
    }
    setMoving(true);
    try {
      await api(`/activities/${original.id}/move`, {
        method: 'POST',
        body: {
          source_occurrence_date: sourceDate,
          target_occurrence_date: targetDate,
          ...(startTimeOverride ? { start_time_override: startTimeOverride } : {}),
        },
      });
      setConflict(null);
      setMovePicker(null);
      setSelectedDate(targetDate);
      await loadActivities();
      Alert.alert('Đã di chuyển', `Hoạt động đã được chuyển sang ${targetDate}.`);
    } catch (error) {
      if (error.code === 'schedule_conflict') {
        setConflict({ activity: occurrence, sourceDate, targetDate, ...error.data });
        setMovePicker(null);
      } else if (error.code === 'invalid_duration') {
        Alert.alert('Cần sửa thời gian', error.message);
      } else {
        Alert.alert('Không thể di chuyển', error.message);
      }
    } finally {
      setMoving(false);
    }
  };

  const startDragging = (occurrence) => {
    measureDateTargets();
    setDragging({ activity: occurrence, sourceDate: occurrence.activity_date });
  };
  const updateDragging = (x, y) => setHoverDate(dateAtPoint(x, y));
  const finishDragging = (occurrence, x, y) => {
    const targetDate = dateAtPoint(x, y);
    setDragging(null);
    setHoverDate(null);
    if (targetDate && targetDate !== occurrence.activity_date) {
      moveActivity(occurrence, occurrence.activity_date, targetDate);
    }
  };

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
            const isDropTarget = hoverDate === dateStr;
            return (
              <Pressable 
                key={dateStr} 
                ref={(node) => { dateNodes.current[dateStr] = node; }}
                onLayout={measureDateTargets}
                onPress={() => setSelectedDate(dateStr)}
                style={{ 
                  width: 72, height: 64, 
                  backgroundColor: isDropTarget ? C.orangeLight : isSelected ? C.blue : C.surfaceContainer,
                  borderWidth: isDropTarget ? 2 : 0,
                  borderColor: isDropTarget ? C.orange : 'transparent',
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
             <MobileMap key={selectedDate} activities={filteredActivities} />
          </View>
        )}

        {/* Timeline */}
        <Text style={[S.h2, { marginBottom: SP.md }]}>Lịch trình</Text>
        <View style={{ paddingLeft: SP.lg }}>
          {/* Vertical Line */}
          <View style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, backgroundColor: C.line }} />
          
          {filteredOccurrences.length === 0 ? (
            <Text style={[S.emptyText, { marginTop: SP.xl }]}>Chưa có hoạt động nào trong ngày này.</Text>
          ) : (
            filteredOccurrences.map((act, index) => {
              const original = originalActivity(act);
              const canMove = validDuration(original) && !moving;
              return <Pressable key={`${act.original_id || act.id}-${act.activity_date}`} onPress={() => navigation.getParent()?.navigate('ActivityDetail', { item: { id: act.original_id || act.id }, trip })} style={{ marginBottom: SP.md, position: 'relative', opacity: dragging?.activity?.id === act.id ? 0.45 : 1 }}>
                {/* Dot */}
                <View style={{ position: 'absolute', left: -SP.lg - 11, top: 6, width: 24, height: 24, backgroundColor: C.bg, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <View style={{ width: 12, height: 12, backgroundColor: index === 0 ? C.blue : C.border, borderRadius: R.full, borderWidth: 4, borderColor: index === 0 ? C.blueLight : C.surfaceVariant }} />
                </View>

                {/* Card */}
                <View style={{ backgroundColor: C.surface, borderRadius: R.xl, padding: SP.md, ...Shadows.ambient, borderWidth: 1, borderColor: C.surfaceContainer }}>
                  <View style={[S.between, { alignItems: 'flex-start' }]}>
                    <View style={[S.row, { flex: 1 }]}>
                      <DragHandle
                        disabled={!canMove}
                        onStart={() => startDragging(act)}
                        onMove={updateDragging}
                        onEnd={(x, y) => finishDragging(act, x, y)}
                        onInvalid={() => Alert.alert('Cần sửa thời gian', 'Giờ kết thúc phải sau giờ bắt đầu trước khi có thể di chuyển.', [
                          { text: 'Đóng', style: 'cancel' },
                          { text: 'Chỉnh sửa', onPress: () => navigation.getParent()?.navigate('AddActivity', { trip, activityId: original.id }) },
                        ])}
                      />
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
                    
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      <Pressable 
                        style={{ backgroundColor: C.blueSoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.sm, ...S.row }}
                        onPress={() => navigation.navigate('AddExpense', { trip, activity: { id: act.original_id || act.id } })}
                      >
                        <Ionicons name="receipt-outline" size={14} color={C.blue} style={{ marginRight: 4 }} />
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.blue }}>Ghi bill</Text>
                      </Pressable>
                      <Pressable
                        style={{ backgroundColor: '#E6F0FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.sm }}
                        onPress={() => navigation.navigate('AddActivity', { trip, activityId: act.original_id || act.id })}
                      >
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.blue }}>Chỉnh sửa</Text>
                      </Pressable>
                      <Pressable
                        style={{ backgroundColor: '#FFECEC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.sm }}
                        onPress={() => {
                          const id = act.original_id || act.id;
                          if (!id) return;
                          Alert.alert('Xóa hoạt động', 'Bạn có chắc muốn xóa hoạt động này?', [
                            { text: 'Hủy', style: 'cancel' },
                            { text: 'Xóa', style: 'destructive', onPress: async () => {
                                try {
                                  await api(`/activities/${id}`, { method: 'DELETE' });
                                  const refreshed = await api(`/trips/${trip.id}/activities`);
                                  setActivities(refreshed);
                                } catch (e) {
                                  Alert.alert('Lỗi', e.message);
                                }
                              }
                            }
                          ]);
                        }}
                      >
                        <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.red }}>Xóa</Text>
                      </Pressable>
                    </View>
                  </View>
                  {act.is_continuation && <Text style={[S.caption, { marginTop: SP.sm, color: C.blue }]}>Tiếp tục từ ngày trước</Text>}
                  {!canMove && <Pressable onPress={() => navigation.getParent()?.navigate('AddActivity', { trip, activityId: original.id })}><Text style={{ marginTop: SP.sm, fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.red }}>Cần sửa thời gian trước khi di chuyển</Text></Pressable>}
                  {(act.location_name || act.location) && <View style={[S.row, { marginTop: SP.sm }]}>
                    <Ionicons name="location-outline" size={14} color={C.muted} style={{ marginRight: 4 }} />
                    <Text style={[S.body, { color: C.muted, flex: 1 }]} numberOfLines={1}>{act.location_name || act.location}</Text>
                  </View>}
                  <Pressable
                    disabled={!canMove}
                    onPress={() => setMovePicker({ activity: act, sourceDate: act.activity_date })}
                    style={{ marginTop: SP.md, borderRadius: R.md, borderWidth: 1, borderColor: canMove ? C.blue : C.border, paddingVertical: 9, alignItems: 'center', opacity: canMove ? 1 : 0.45 }}
                  ><Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: canMove ? C.blue : C.subtle }}>Di chuyển sang ngày khác</Text></Pressable>
                </View>
              </Pressable>
            })
          )}
        </View>
      </ScrollView>

      {dragging && <View pointerEvents="none" style={{ position: 'absolute', top: 76, left: SP.lg, right: SP.lg, zIndex: 200, borderRadius: R.lg, backgroundColor: C.orangeLight, padding: SP.md, ...Shadows.kinetic }}>
        <Text style={{ fontFamily: 'Inter_700Bold', color: C.orangeDark }}>Đang kéo: {dragging.activity.title}</Text>
        <Text style={{ marginTop: 3, fontFamily: 'Inter_400Regular', fontSize: 12, color: C.orangeDark }}>{hoverDate ? `Thả để chuyển sang ${hoverDate}` : 'Kéo lên một ô ngày phía trên'}</Text>
      </View>}

      <SheetModal visible={Boolean(movePicker)} title="Di chuyển hoạt động" onClose={() => setMovePicker(null)}>
        <Text style={[S.body, { color: C.subtle, marginBottom: SP.md }]}>Chọn ngày mới. Giờ và toàn bộ thời lượng sẽ được giữ nguyên.</Text>
        <ScrollView style={{ maxHeight: 430 }}>
          {days.map((dateStr, index) => <Pressable
            key={dateStr}
            disabled={moving || dateStr === movePicker?.sourceDate}
            onPress={() => moveActivity(movePicker.activity, movePicker.sourceDate, dateStr)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: C.line, borderRadius: R.md, padding: SP.md, marginBottom: SP.sm, opacity: dateStr === movePicker?.sourceDate ? 0.35 : 1 }}
          ><View style={S.row}><Ionicons name="calendar-outline" size={18} color={C.blue} style={{ marginRight: SP.sm }} /><Text style={{ fontFamily: 'Inter_600SemiBold', color: C.ink }}>Ngày {index + 1} · {dateStr}</Text></View>{moving ? <ActivityIndicator size="small" color={C.blue} /> : <Ionicons name="arrow-forward" size={18} color={C.muted} />}</Pressable>)}
        </ScrollView>
      </SheetModal>

      <SheetModal visible={Boolean(conflict)} title="Xung đột thời gian" onClose={() => setConflict(null)}>
        <View style={{ borderRadius: R.md, backgroundColor: C.redLight, padding: SP.md }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: C.red }}>Không thể chuyển {conflict?.activity?.title} sang {conflict?.targetDate} vì đang trùng lịch.</Text>
        </View>
        <Text style={[S.label, { marginTop: SP.lg }]}>HOẠT ĐỘNG ĐANG TRÙNG</Text>
        {conflict?.conflicts?.map(item => <View key={item.id} style={[S.between, { paddingVertical: SP.sm, borderBottomWidth: 1, borderBottomColor: C.line }]}><Text style={[S.body, { flex: 1, fontFamily: 'Inter_600SemiBold' }]}>{item.title}</Text><Text style={S.caption}>{item.activity_date} · {item.start_time?.slice(0, 5)}–{item.end_time?.slice(0, 5)}</Text></View>)}
        <Text style={[S.label, { marginTop: SP.lg }]}>KHUNG GIỜ TRỐNG GẦN NHẤT</Text>
        {!conflict?.suggestions?.length ? <Text style={[S.body, { borderRadius: R.md, backgroundColor: C.goldLight, color: C.gold, padding: SP.md }]}>Không có khung giờ phù hợp trong ngày này. Hãy chọn ngày khác.</Text> : conflict.suggestions.map(item => <Pressable
          key={`${item.activity_date}-${item.start_time}`}
          disabled={moving}
          onPress={() => moveActivity(conflict.activity, conflict.sourceDate, conflict.targetDate, item.start_time?.slice(0, 5))}
          style={{ flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: C.blue, borderRadius: R.md, padding: SP.md, marginBottom: SP.sm }}
        ><Text style={{ fontFamily: 'Inter_600SemiBold', color: C.blue }}>{item.activity_date}</Text><Text style={{ fontFamily: 'Inter_700Bold', color: C.blue }}>{item.start_time?.slice(0, 5)}–{item.end_time?.slice(0, 5)}</Text></Pressable>)}
      </SheetModal>

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
