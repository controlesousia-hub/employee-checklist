import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskStatus } from '../components/TaskCard';

interface UseTasksOptions {
  employeeName?: string | null;
  employeeId?: string | null;
  enabled?: boolean;
}

export function useTasks(options?: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabled = options?.enabled ?? true;
  const employeeName = options?.employeeName ?? null;
  const employeeId = options?.employeeId ?? null;

  const fetchTasks = useCallback(async () => {
    if (!enabled) return;
    
    try {
      let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

      if (employeeId || employeeName) {
        const conditions = [
          employeeId ? `employee_id.eq.${employeeId}` : null,
          employeeName ? `employee_name.eq.${employeeName}` : null,
        ].filter(Boolean).join(',');
        query = query.or(conditions);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      if (data) {
        setTasks(data as Task[]);
        setError(null);
      }
    } catch (err) {
      console.error('Erreur de chargement des tâches :', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [enabled, employeeName, employeeId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const changeStatus = async (id: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks(current => current.map(t => (t.id === id ? { ...t, status: newStatus } : t)));
    
    try {
      const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erreur mise à jour :', err);
      // Rollback en cas d'erreur
      fetchTasks();
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(current => current.filter(t => t.id !== id));
    
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error('Erreur suppression :', err);
      fetchTasks();
    }
  };

  return { tasks, loading, error, refresh: fetchTasks, changeStatus, deleteTask };
}
