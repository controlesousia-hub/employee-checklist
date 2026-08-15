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

  const enabled = options?.enabled ?? true;
  const employeeName = options?.employeeName ?? null;
  const employeeId = options?.employeeId ?? null;

  const fetchTasks = useCallback(async () => {
    if (!enabled) return;
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });

    if (employeeId || employeeName) {
      const conditions = [
        employeeId ? `employee_id.eq.${employeeId}` : null,
        employeeName ? `employee_name.eq.${employeeName}` : null,
      ].filter(Boolean).join(',');
      query = query.or(conditions);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erreur de chargement des tâches :', error);
    } else if (data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, [enabled, employeeName, employeeId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const changeStatus = async (id: string, newStatus: TaskStatus) => {
    setTasks(current => current.map(t => (t.id === id ? { ...t, status: newStatus } : t)));
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    if (error) {
      console.error('Erreur mise à jour :', error);
      fetchTasks();
    }
  };

  return { tasks, loading, refresh: fetchTasks, changeStatus };
}