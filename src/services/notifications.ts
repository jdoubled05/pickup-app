import * as Notifications from 'expo-notifications';
import { Court } from './courts';

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Failed to request notification permissions:', error);
    return false;
  }
}

/**
 * Check if notification permissions have been granted
 */
export async function hasNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to check notification permissions:', error);
    return false;
  }
}

/**
 * Show a local notification for nearby check-in activity
 */
export async function showCheckInNotification(
  court: Court,
  playerCount: number
): Promise<void> {
  try {
    const hasPermissions = await hasNotificationPermissions();
    if (!hasPermissions) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🏀 Game On!',
        body: `${playerCount} player${playerCount > 1 ? 's' : ''} just checked in at ${court.name}`,
        data: { courtId: court.id },
        sound: true,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Failed to show check-in notification:', error);
  }
}

/**
 * Configure the notification handler for foreground notifications
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}
