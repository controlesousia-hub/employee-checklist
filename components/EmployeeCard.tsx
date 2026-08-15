import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type EmployeeStatus = 'ONBOARDING' | 'ACTIVE' | 'OFFBOARDING' | 'OFFBOARDED';

export interface Employee {
  id: string;
  organization_id?: string | null;
  full_name: string;
  position: string | null;
  email: string | null;
  start_date: string | null;
  status: EmployeeStatus;
}

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ONBOARDING: 'Onboarding',
  ACTIVE: 'Actif',
  OFFBOARDING: 'Offboarding',
  OFFBOARDED: 'Parti',
};

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  ONBOARDING: '#2563EB',
  ACTIVE: '#4CAF50',
  OFFBOARDING: '#FFC107',
  OFFBOARDED: '#94A3B8',
};

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

interface EmployeeCardProps {
  employee: Employee;
  onPress: (id: string) => void;
}

export default function EmployeeCard({ employee, onPress }: EmployeeCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(employee.id)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{employee.full_name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{employee.full_name}</Text>
        <Text style={styles.position} numberOfLines={1}>
          {employee.position ?? 'Poste non défini'}
          {employee.start_date ? ` · Arrivée le ${formatDate(employee.start_date)}` : ''}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: EMPLOYEE_STATUS_COLORS[employee.status] }]}>
        <Text style={styles.badgeText}>{EMPLOYEE_STATUS_LABELS[employee.status]}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#2563EB' },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  position: { fontSize: 12, color: '#64748B', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginRight: 6 },
  badgeText: { color: '#ffffff', fontSize: 11, fontWeight: '700' },
});