import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_ICONS: Record<string, { name: IconName; color: string }> = {
  ONBOARDING_STARTED: { name: 'person-add-outline', color: '#2563EB' },
  ONBOARDING_COMPLETED: { name: 'checkmark-circle-outline', color: '#4CAF50' },
  OFFBOARDING_STARTED: { name: 'exit-outline', color: '#B45309' },
  OFFBOARDING_COMPLETED: { name: 'flag-outline', color: '#94A3B8' },
  TASK_CREATED: { name: 'checkbox-outline', color: '#2563EB' },
  INFO: { name: 'information-circle-outline', color: '#64748B' },
};

export default function NotificationsScreen() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setItems(data as NotificationItem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    setItems(current => current.map(n => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    setItems(current => current.map(n => ({ ...n, read: true })));
    await supabase.from('notifications').update({ read: true }).eq('read', false);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAll}>Tout lire</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>Aucune notification</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={({ item }) => {
            const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.INFO;
            return (
              <TouchableOpacity
                style={[styles.row, !item.read && styles.rowUnread]}
                onPress={() => markRead(item.id)}
              >
                <Ionicons name={icon.name} size={22} color={icon.color} />
                <View style={styles.rowContent}>
                  <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}>
                    {item.title}
                  </Text>
                  {item.message ? <Text style={styles.rowMessage}>{item.message}</Text> : null}
                  <Text style={styles.rowDate}>{formatDate(item.created_at)}</Text>
                </View>
                {!item.read && <View style={styles.dot} />}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  markAll: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  list: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 14, color: '#64748B', marginTop: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', padding: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10,
  },
  rowUnread: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  rowContent: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  rowTitleUnread: { fontWeight: '800' },
  rowMessage: { fontSize: 13, color: '#475569', marginTop: 2 },
  rowDate: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
});