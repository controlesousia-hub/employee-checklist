import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import EmployeeCard, { Employee } from '../../components/EmployeeCard';
import type { Department } from '../../components/TaskCard';
import { supabase } from '../../lib/supabase';

interface TemplateOption {
  id: string;
  name: string;
}

export default function EmployeesScreen() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('NONE');

  const [isModalVisible, setModalVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Erreur de chargement :', error);
    if (data) setEmployees(data as Employee[]);
    setLoading(false);
  }, []);

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase
      .from('templates')
      .select('id, name')
      .order('created_at');

    if (data && data.length > 0) {
      setTemplates(data as TemplateOption[]);
      setSelectedTemplateId(data[0].id);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchTemplates();
  }, [fetchEmployees, fetchTemplates]);

  const handleAddEmployee = async () => {
    if (!fullName.trim()) {
      Alert.alert('Erreur', "Le nom de l'employé est obligatoire");
      return;
    }
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Erreur', 'Date invalide (format AAAA-MM-JJ)');
      return;
    }

    setSubmitting(true);

    const { data: emp, error } = await supabase
      .from('employees')
      .insert([
        {
          full_name: fullName.trim(),
          position: position.trim() || null,
          email: email.trim() || null,
          start_date: startDate || null,
        },
      ])
      .select()
      .maybeSingle();

    if (error || !emp) {
      setSubmitting(false);
      Alert.alert('Erreur', "Impossible de créer l'employé");
      return;
    }

    // Génération automatique des tâches depuis le template choisi
    let generated = 0;
    if (selectedTemplateId !== 'NONE') {
      const { data: items } = await supabase
        .from('template_items')
        .select('title, department, sort_order')
        .eq('template_id', selectedTemplateId)
        .order('sort_order');

      if (items && items.length > 0) {
        const tasksToInsert = items.map(it => ({
          title: it.title,
          department: it.department as Department,
          employee_name: emp.full_name,
          status: 'TODO' as const,
        }));

        const { error: tasksError } = await supabase.from('tasks').insert(tasksToInsert);
        if (!tasksError) generated = tasksToInsert.length;
      }
    }

    setSubmitting(false);
    setFullName('');
    setPosition('');
    setEmail('');
    setStartDate('');
    setModalVisible(false);
    fetchEmployees();
    Alert.alert(
      'Succès',
      generated > 0
        ? `Employé créé • ${generated} tâches générées automatiquement`
        : 'Employé créé'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Employés</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : employees.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="people-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Aucun employé</Text>
          <Text style={styles.emptyText}>Ajoute ton premier employé pour démarrer un onboarding.</Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <EmployeeCard employee={item} onPress={id => router.push(`/employee/${id}`)} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nouvel Employé</Text>

              <Text style={styles.label}>Nom complet *</Text>
              <TextInput style={styles.input} placeholder="ex: Alex Martin" value={fullName} onChangeText={setFullName} />

              <Text style={styles.label}>Poste</Text>
              <TextInput style={styles.input} placeholder="ex: Développeur web" value={position} onChangeText={setPosition} />

              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="ex: alex@entreprise.fr" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

              <Text style={styles.label}>Date d'arrivée (AAAA-MM-JJ)</Text>
              <TextInput style={styles.input} placeholder="ex: 2025-09-01" value={startDate} onChangeText={setStartDate} />

              <Text style={styles.label}>Template de checklist</Text>
              <ScrollView horizontal showsVerticalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={styles.templateRow}>
                  <TouchableOpacity
                    style={[styles.templateChip, selectedTemplateId === 'NONE' && styles.templateChipActive]}
                    onPress={() => setSelectedTemplateId('NONE')}
                  >
                    <Text style={[styles.templateChipText, selectedTemplateId === 'NONE' && styles.templateChipTextActive]}>
                      Sans template
                    </Text>
                  </TouchableOpacity>
                  {templates.map(t => (
                    <TouchableOpacity
                      key={t.id}
                      style={[styles.templateChip, selectedTemplateId === t.id && styles.templateChipActive]}
                      onPress={() => setSelectedTemplateId(t.id)}
                    >
                      <Text style={[styles.templateChipText, selectedTemplateId === t.id && styles.templateChipTextActive]}>
                        {t.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddEmployee} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Créer</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  addButton: {
    backgroundColor: '#2563EB', width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  list: { padding: 16 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 12 },
  emptyText: { fontSize: 14, color: '#64748B', textAlign: 'center', marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#0F172A' },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14, fontSize: 14,
  },
  templateRow: { flexDirection: 'row', gap: 8 },
  templateChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#CBD5E1',
  },
  templateChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  templateChipText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  templateChipTextActive: { color: '#ffffff' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: '#64748B', fontWeight: '600' },
  saveButton: { backgroundColor: '#2563EB', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#ffffff', fontWeight: '600' },
});