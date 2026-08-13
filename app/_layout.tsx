import { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function RootLayout() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();

  // Redirection automatique selon l'état d'auth
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      // Pas connecté → rediriger vers login
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Connecté mais sur la page login → rediriger vers l'app
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  // Écran de chargement pendant la restauration de session
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});