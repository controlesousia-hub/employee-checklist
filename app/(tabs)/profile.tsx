import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      // L'Auth Guard (app/_layout.tsx) redirige automatiquement vers /login
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de se déconnecter');
      setIsLoggingOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color="#2563EB" />
        </View>
        <Text style={styles.email}>{user?.email ?? 'Utilisateur'}</Text>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <ActivityIndicator color="#DC2626" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  content: { flex: 1, padding: 20, alignItems: 'center' },
  avatar: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: '#EFF6FF',
    justifyContent: 'center', alignItems: 'center', marginTop: 40, marginBottom: 16,
  },
  email: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 40 },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 12,
    width: '100%', gap: 8, borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
});