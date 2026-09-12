import { WorkTask } from '@/types';

export const getStoredSlackWebhook = (): string => {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('media_ops_slack_webhook_v1') || '';
    } catch {}
  }
  return '';
};

export const setStoredSlackWebhook = (url: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('media_ops_slack_webhook_v1', url.trim());
    } catch {}
  }
};

export async function sendSlackCreativeNotification(
  task: WorkTask,
  submittedBy: string = 'Yzah (Creative)',
  isTest: boolean = false
): Promise<{ ok: boolean; simulated?: boolean; message: string }> {
  try {
    const customWebhookUrl = getStoredSlackWebhook();

    const res = await fetch('/api/slack/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task,
        submittedBy,
        customWebhookUrl,
        isTest,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to send Slack alert' };
  }
}
