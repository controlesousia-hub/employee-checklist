import { supabase } from './supabase';

export type NotificationType =
  | 'ONBOARDING_STARTED'
  | 'ONBOARDING_COMPLETED'
  | 'OFFBOARDING_STARTED'
  | 'OFFBOARDING_COMPLETED'
  | 'TASK_CREATED'
  | 'INFO';

/** Point d'entrée unique des notifications (email/push pourront être ajoutés ici plus tard) */
export async function createNotification(
  type: NotificationType,
  title: string,
  message?: string
) {
  const { error } = await supabase.from('notifications').insert([
    { type, title, message: message ?? null },
  ]);
  if (error) console.error('Erreur notification :', error);
}