import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { api } from './api';

const PUSH_TOKEN_KEY = 'ustrip_expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export async function registerForPushNotifications() {
  if (Platform.OS === 'web') return { status: 'unsupported' };

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'UsTrip',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default'
    });
  }

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return { status: 'denied' };

  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  if (!projectId || projectId === 'your_eas_project_id') return { status: 'missing-project-id' };

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  await api('/notifications/push-token', {
    method: 'PUT',
    body: { token, platform: Platform.OS }
  });
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  return { status: 'ready', token };
}

export async function unregisterPushNotifications() {
  const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
  if (!token) return;
  try {
    await api('/notifications/push-token', { method: 'DELETE', body: { token } });
  } finally {
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  }
}

export function addPushNotificationListeners(onUpdate) {
  const received = Notifications.addNotificationReceivedListener(onUpdate);
  const responded = Notifications.addNotificationResponseReceivedListener(onUpdate);
  return () => {
    received.remove();
    responded.remove();
  };
}

export async function setPushBadgeCount(count) {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Some simulators and launchers do not support app icon badges.
  }
}
