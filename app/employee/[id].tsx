import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
      if (data) setEmployee(data as Employee);
      setLoadingEmployee(false);
    })();
  }, [id]);

  const { tasks, loading, changeStatus, refresh } = useTasks({
    employeeName: employee?.full_name,
    enabled: !!employee,
  });

  const isOffboarding = employee?.status === 'OFFBOARDING' || employee?.status === 'OFFBOARDED';

  const visibleTasks = tasks.filter(t =>
    isOffboarding ? t.workflow === 'OFFBOARDING' : t.workflow !== 'OFFBOARDING'
  );

  const progress = visibleTasks.length === 0
    ? 0
    : Math.round((visibleTasks.filter(t => t.status === 'DONE').length / visibleTasks.length) * 100);

  const allDone = visibleTasks.length > 0 && visibleTasks.every(t => t.status === 'DONE');

  const updateEmployeeStatus = async (newStatus: EmployeeStatus) => {
    if (!employee) return;
    const previous = employee;
    setEmployee({ ...employee, status: newStatus });
    const { error } = await supabase.from('employees').update({ status: newStatus }).eq('id', employee.id);
    if (error) setEmployee(previous);
  };

  const handleValidate = () => {
    if (!employee) return;
    if (employee.status === 'ONBOARDING') {
      Alert.alert("Valider l'onboarding", 'Passer cet employé en "Actif" ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Valider', onPress: () => updateEmployeeStatus('ACTIVE') },
      ]);
    } else if (employee.status === 'OFFBOARDING') {
      Alert.alert('Valider le départ', 'Marquer cet employé comme "Parti" ?', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Valider', onPress: () => updateEmployeeStatus('OFFBOARDED') },
      ]);
    }
  };

  const handleStartOffboarding = () => {
    if (!employee) return;
    Alert.alert(
      "Démarrer l'offboarding",
      'Générer la checklist de départ et passer l\'employé en "Offboarding" ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: async () => {
            setGenerating(true);
            try {
              const { data: tpl } = await supabase
                .from('templates')
                .select('id')
                .eq('type', 'OFFBOARDING')
                .limit(1)
                .maybeSingle();

              if (tpl) {
                const { data: items } = await supabase
                  .from('template_items')
                  .select('title, department, sort_order')
                  .eq('template_id', tpl.id)
                  .order('sort_order');

                if (items && items.length > 0) {
                  await supabase.from('tasks').insert(
                    items.map(it => ({
                      title: it.title,
                      department: it.department,
                      employee_name: employee.full_name,
                      status: 'TODO',
                      workflow: 'OFFBOARDING',
                    }))
                  );
                }
              }

              await updateEmployeeStatus('OFFBOARDING');
              refresh();
            } finally {
              setGenerating(false);
            }
          },
        },
      ]
    );
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
                onPress={() => updateEmployeeStatus(status)}
              >
                <Text style={[styles.statusChipText, employee.status === status && styles.statusChipTextActive]}>
                  {EMPLOYEE_STATUS_LABELS[status]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {isOffboarding && (
          <View style={styles.workflowBanner}>
            <Ionicons name="exit-outline" size={18} color="#B45309" />
            <Text style={styles.workflowBannerText}>Workflow Offboarding en cours</Text>
          </View>
        )}

        <View style={styles.progressCard}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressLabel}>
              {isOffboarding ? 'Avancement offboarding' : 'Avancement onboarding'}
            </Text>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {isOffboarding ? 'Checklist de départ' : 'Tâches'} ({visibleTasks.length})
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" />
        ) : visibleTasks.length === 0 ? (
          <Text style={styles.emptyText}>Aucune tâche pour cet employé pour le moment.</Text>
        ) : (
          visibleTasks.map(task => <TaskCard key={task.id} task={task} onStatusChange={changeStatus} />)
        )}

        <View style={styles.actions}>
          {employee.status === 'ONBOARDING' && allDone && (
            <TouchableOpacity style={styles.validateButton} onPress={handleValidate}>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.validateText}>Valider l'onboarding → Actif</Text>
            </TouchableOpacity>
          )}

          {employee.status === 'OFFBOARDING' && allDone && (
            <TouchableOpacity style={styles.validateButton} onPress={handleValidate}>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
              <Text style={styles.validateText}>Valider le départ → Parti</Text>
            </TouchableOpacity>
          )}

          {(employee.status === 'ACTIVE' || employee.status === 'ONBOARDING') && (
            <TouchableOpacity
              style={styles.offboardingButton}
              onPress={handleStartOffboarding}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator color="#DC2626" />
              ) : (
                <>
                  <Ionicons name="exit-outline" size={20} color="#DC2626" />
                  <Text style={styles.offboardingText}>Démarrer l'offboarding</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
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
  workflowBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF3C7', borderRadius: 12, padding: 12, marginBottom: 12,
  },
  workflowBannerText: { fontSize: 13, fontWeight: '600', color: '#B45309' },
  progressCard: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, marginBottom: 16 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: '600', color: '#475569' },
  progressPercent: { fontSize: 14, fontWeight: '800', color: '#2563EB' },
  progressBar: { height: 10, backgroundColor: '#CBD5E1', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#2563EB', borderRadius: 5 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 10 },
  actions: { marginTop: 20, gap: 10 },
  validateButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12,
  },
  validateText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  offboardingButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    paddingVertical: 14, borderRadius: 12,
  },
  offboardingText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
});