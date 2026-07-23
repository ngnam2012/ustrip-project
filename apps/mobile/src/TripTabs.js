import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, S, SP, R, Shadows } from './ui';
import ItineraryScreen from './ItineraryScreen';
import FundScreen from './FundScreen';
import OtaScreen from './OtaScreen';
import { View, Platform } from 'react-native';

const Tabs = createBottomTabNavigator();

// A placeholder for tabs that trigger navigation rather than showing a screen
const DummyScreen = () => <View />;

export default function TripTabs({ route, navigation }) {
  const trip = route.params.trip;
  
  return (
    <Tabs.Navigator
      screenOptions={({ route: tabRoute }) => ({
        headerShown: false,
        tabBarStyle: {
          height: 80,
          paddingTop: SP.sm,
          paddingBottom: Platform.OS === 'ios' ? SP.lg : SP.md,
          borderTopWidth: 0,
          backgroundColor: C.surface,
          ...Shadows.ambient,
          borderTopLeftRadius: R.xl,
          borderTopRightRadius: R.xl,
          position: 'absolute', // Floating effect
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
          letterSpacing: -0.1,
        },
        tabBarActiveTintColor: C.blue,
        tabBarInactiveTintColor: C.muted,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (tabRoute.name === 'ItineraryTab') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (tabRoute.name === 'FundTab') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (tabRoute.name === 'AddBillTab') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (tabRoute.name === 'SettlementTab') iconName = focused ? 'cash' : 'cash-outline';
          else if (tabRoute.name === 'OtaTab') iconName = focused ? 'compass' : 'compass-outline';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tabs.Screen 
        name="ItineraryTab" 
        component={ItineraryScreen} 
        initialParams={{ trip }} 
        options={{ title: 'Lịch trình' }}
      />
      <Tabs.Screen 
        name="FundTab" 
        component={FundScreen} 
        initialParams={{ trip }} 
        options={{ title: 'Quỹ chung' }}
      />
      <Tabs.Screen 
        name="AddBillTab" 
        component={DummyScreen}
        options={{ title: 'Thêm Bill' }}
        listeners={{
          tabPress: e => {
            e.preventDefault();
            navigation.navigate('AddExpense', { trip });
          },
        }}
      />
      <Tabs.Screen 
        name="SettlementTab" 
        component={DummyScreen}
        options={{ title: 'Chia tiền' }}
        listeners={{
          tabPress: e => {
            e.preventDefault();
            // DataList endpoint expects 'Settlements'
            navigation.navigate('Settlements', { trip });
          },
        }}
      />
      <Tabs.Screen 
        name="OtaTab" 
        component={OtaScreen} 
        initialParams={{ trip }} 
        options={{ title: 'Khám phá' }}
      />
    </Tabs.Navigator>
  );
}
