import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskStatus } from '../components/TaskCard';

interface UseTasksOptions {
  employeeName?: string | null;
  enabled?: boolean;
}

export function useTasks(options?: UseTasksOptions) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const enabled = options?.enabled ?? true;
  const employeeName = options?.employeeName ?? null;

  const fetchTasks = useCallback(async () => {
    if (!enabled) return;
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (employeeName) {
      query = query.eq('employee_name', employeeName);
    }
    const { data, error } = await query;
    if (error) {
      console.error('Erreur de chargement des tâches :', error);
    } else if (data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  }, [enabled, employeeName]);

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