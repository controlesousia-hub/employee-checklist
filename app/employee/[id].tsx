import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTasks } from '../../hooks/useTasks';
import TaskCard from '../../components/TaskCard';
import {
  Employee, EmployeeStatus,
  EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS, formatDate,
} from '../../components/EmployeeCard';

const STATUS_OPTIONS: EmployeeStatus[] = ['ONBOARDING', 'ACTIVE', 'OFFBOARDING', 'OFFBOARDED'];

export default function EmployeeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
      if (data) setEmployee(data as Employee);
      setLoadingEmployee(false);
    })();
  }, [id]);

  const { tasks, loading, changeStatus } = useTasks({
    employeeName: employee?.full_name,
    enabled: !!employee,
  });

  const progress = tasks.length === 0
    ? 0
    : Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100);

  const handleStatusChange = async (newStatus: EmployeeStatus) => {
    if (!employee) return;
    const previous = employee;
    setEmployee({ ...employee, status: newStatus });
    const { error } = await supabase.from('employees').update({ status: newStatus }).eq('id', employee.id);
    if (error) setEmployee(previous);
  };

  if (loadingEmployee) {
    return <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />;
  }

  if (!employee) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>Employé introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{employee.full_name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.name}>{employee.full_name}</Text>
          {employee.position ? <Text style={styles.info}>{employee.position}</Text> : null}
          {employee.email ? <Text style={styles.info}>{employee.email}</Text> : null}
          {employee.start_date ? <Text style={styles.info}>Arrivée le {formatDate(employee.start_date)}</Text> : null}

          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusChip,
                  employee.status === status && {
                    backgroundColor: EMPLOYEE_STATUS_COLORS[status],
                    borderColor: EMPLOYEE_STATUS_COLORS[status],
                  },
                ]}
                onPress={() => handleStatusChange(status)}
              >
                <Text style={[styles.statusChipText, employee.status === status && styles.statusChipTextActive]}>
                  {EMPLOYEE_STATUS_LABELS[status]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>Avancement onboarding</Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tâches ({tasks.length})</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : tasks.length === 0 ? (
          <Text style={styles.emptyText}>Aucune tâche pour cet employé pour le moment.</Text>
        ) : (
          tasks.map(task => <TaskCard key={task.id} task={task} onStatusChange={changeStatus} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  notFound: { textAlign: 'center', marginTop: 60, color: '#64748B' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  content: { padding: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  name: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  info: { fontSize: 14, color: '#475569', marginTop: 2 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  statusChip: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  statusChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  statusChipTextActive: { color: '#ffffff' },
  progressCard: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
  progressPercent: { fontSize: 14, fontWeight: '800', color: '#2563EB' },
  progressBar: { height: 10, backgroundColor: '#CBD5E1', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10 },
});