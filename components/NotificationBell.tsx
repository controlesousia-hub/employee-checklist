import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);
    
    if (!error) {
      setUnread(count ?? 0);
    }
  }, []);

  useEffect(() => {
    load();
    
    // Subscription en temps réel avec Supabase Realtime
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  return (
    <TouchableOpacity style={styles.bell} onPress={() => router.push('/notifications')}>
      <Ionicons name="notifications-outline" size={22} color="#0F172A" />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bell: { position: 'relative', padding: 4 },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
});
