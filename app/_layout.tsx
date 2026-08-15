import { Stack } from 'expo-router';
      <Stack.Screen name="notifications" />

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="employee/[id]" />
    </Stack>
  );
}