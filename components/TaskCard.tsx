import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type Department = 'HR' | 'IT' | 'MANAGER';

export interface Task {
  id: string;
  title: string;
  department: Department;
  status: TaskStatus;
  employee_name: string;
  workflow?: 'ONBOARDING' | 'OFFBOARDING' | 'CUSTOM';
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, newStatus: TaskStatus) => void;
}

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'DONE': return '#4CAF50';
      case 'IN_PROGRESS': return '#FFC107';
      case 'TODO': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'DONE': return 'Terminé';
      case 'IN_PROGRESS': return 'En cours';
      case 'TODO': return 'À faire';
      default: return status;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{task.title}</Text>
        <View style={[styles.badge, { backgroundColor: getStatusColor(task.status) }]}>
          <Text style={styles.badgeText}>{getStatusLabel(task.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.subtitle}>Employé : {task.employee_name}</Text>
      <Text style={styles.department}>Service responsable : {task.department}</Text>

      <View style={styles.actions}>
        {task.status !== 'TODO' && (
          <TouchableOpacity style={styles.button} onPress={() => onStatusChange(task.id, 'TODO')}>
            <Text style={styles.buttonText}>À faire</Text>
          </TouchableOpacity>
        )}
        {task.status !== 'IN_PROGRESS' && (
          <TouchableOpacity style={styles.button} onPress={() => onStatusChange(task.id, 'IN_PROGRESS')}>
            <Text style={styles.buttonText}>En cours</Text>
          </TouchableOpacity>
        )}
        {task.status !== 'DONE' && (
          <TouchableOpacity style={[styles.button, styles.buttonDone]} onPress={() => onStatusChange(task.id, 'DONE')}>
            <Text style={styles.buttonTextDone}>Terminer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  department: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
    marginBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonDone: {
    backgroundColor: '#38A169',
  },
  buttonText: {
    color: '#2D3748',
    fontWeight: '600',
    fontSize: 12,
  },
  buttonTextDone: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
});
