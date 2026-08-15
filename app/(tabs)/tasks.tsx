import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskCard, { Task, TaskStatus, Department } from '../../components/TaskCard';
import { supabase } from '../../lib/supabase';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | Department>('ALL');
  const [loading, setLoading] = useState(true);

  const [isModalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [department, setDepartment] = useState<Department>('IT');
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setTasks(data as Task[]);
      }
    } catch (err) {
      console.error('Erreur de chargement :', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (activeFilter === 'ALL') {
      setFilteredTasks(tasks);
    } else {
      setFilteredTasks(tasks.filter(t => t.department === activeFilter));
    }
  }, [activeFilter, tasks]);

  const handleStatusChange = async (id: string, newStatus: TaskStatus) => {
    setTasks(current =>
      current.map(task => (task.id === id ? { ...task, status: newStatus } : task))
    );

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      console.error('Erreur mise à jour :', error);
      fetchTasks();
    }
  };

  const handleAddTask = async () => {
    if (!title.trim() || !employeeName.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('tasks').insert([
      {
        title: title.trim(),
        employee_name: employeeName.trim(),
        department,
        status: 'TODO',
      },
    ]);

    if (!error) {
      try {
        await supabase.functions.invoke('notify-make', {
          body: {
            type: 'INSERT',
            record: {
              title: title.trim(),
              employee_name: employeeName.trim(),
              department,
            },
          },
        });
      } catch (err) {
        console.log("Erreur lors de l'envoi du webhook :", err);
      }
    }

    setSubmitting(false);

    if (error) {
      Alert.alert('Erreur', 'Impossible de créer la tâche');
    } else {
      setTitle('');
      setEmployeeName('');
      setModalVisible(false);
      fetchTasks();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.title}>Gestion des Tâches</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          {(['ALL', 'HR', 'IT', 'MANAGER'] as const).map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterChip,
                activeFilter === filter && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter === 'ALL' ? 'Tous' : filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TaskCard task={item} onStatusChange={handleStatusChange} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Tâche</Text>

            <Text style={styles.label}>Nom de l'employé</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Jean Dupont"
              value={employeeName}
              onChangeText={setEmployeeName}
            />

            <Text style={styles.label}>Intitulé de la tâche</Text>
            <TextInput
              style={styles.input}
              placeholder="ex: Création compte VPN"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Service responsable</Text>
            <View style={styles.deptRow}>
              {(['RH', 'IT', 'MANAGER'] as const).map(dept => {
                const deptKey = dept === 'RH' ? 'HR' : dept;
                return (
                  <TouchableOpacity
                    key={deptKey}
                    style={[
                      styles.deptButton,
                      department === deptKey && styles.deptButtonActive,
                    ]}
                    onPress={() => setDepartment(deptKey as Department)}
                  >
                    <Text
                      style={[
                        styles.deptText,
                        department === deptKey && styles.deptTextActive,
                      ]}
                    >
                      {dept}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddTask}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  addButton: {
    backgroundColor: '#2563EB',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#0F172A',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    fontSize: 14,
  },
  deptRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  deptButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    alignItems: 'center',
  },
  deptButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  deptText: {
    fontWeight: '600',
    color: '#475569',
  },
  deptTextActive: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    color: '#64748B',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});