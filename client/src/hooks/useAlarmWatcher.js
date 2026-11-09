import { useEffect, useState } from 'react';
import { getAlarms, recordActivity, toggleAlarm } from '../services/alarmService';
import { getReminders } from '../services/reminderService';

const makeSession = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const markMissed = alarms => {
  const now = new Date(), day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  for (const alarm of alarms) {
    if (!alarm.enabled || !(alarm.repeat?.length === 0 || alarm.repeat.includes('Every day') || alarm.repeat.includes(day))) continue;
    const [hours, minutes] = alarm.time.split(':').map(Number), scheduled = new Date(now);
    scheduled.setHours(hours, minutes, 0, 0);
    const late = now - scheduled, key = `jagriti-missed-${alarm._id}-${now.toDateString()}`, rang = `jagriti-rang-${alarm._id}-${now.toDateString()}-${alarm.time}`;
    if (late >= 600000 && late < 86400000 && !localStorage.getItem(key) && !localStorage.getItem(rang)) {
      localStorage.setItem(key, '1'); recordActivity(alarm._id, { status: 'missed', scheduledTime: scheduled.toISOString() });
      if (!alarm.repeat?.length) toggleAlarm(alarm._id);
    }
  }
};

export default function useAlarmWatcher() {
  const [ringing, setRinging] = useState(null), [snoozed, setSnoozed] = useState(null);
  useEffect(() => {
    let alarms = [], reminders = [];
    const refresh = () => Promise.all([getAlarms(), getReminders()]).then(([alarmResponse, reminderResponse]) => {
      alarms = alarmResponse.data.data; reminders = reminderResponse.data.data;
    }).catch(() => {});
    refresh();
    const timer = setInterval(() => {
      refresh(); markMissed(alarms);
      const now = new Date(), hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
      const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
      if (snoozed && Date.now() >= snoozed.until) { setRinging(snoozed.alarm); setSnoozed(null); return; }
      const due = alarms.find(alarm => alarm.enabled && alarm.time === `${hh}:${mm}` && (alarm.repeat?.length === 0 || alarm.repeat.includes('Every day') || alarm.repeat.includes(day)));
      if (due) {
        const key = `jagriti-rang-${due._id}-${now.toDateString()}-${hh}:${mm}`;
        if (!localStorage.getItem(key)) {
          localStorage.setItem(key, '1'); setRinging({ ...due, sessionId: makeSession() });
          if ('Notification' in window && Notification.permission === 'granted') new Notification(due.label || 'Jagriti alarm', { body: 'It’s time to start your day.' });
        }
      }
      let settings = {};
      try { settings = JSON.parse(localStorage.getItem('jagriti_user') || '{}').settings || {}; } catch {}
      if (settings.reminderNotifications !== false && 'Notification' in window && Notification.permission === 'granted') {
        const reminder = reminders.find(item => !item.completed && item.time === `${hh}:${mm}` && new Date(item.date).toDateString() === now.toDateString());
        if (reminder) {
          const key = `jagriti-reminder-${reminder._id}-${now.toDateString()}`;
          if (!localStorage.getItem(key)) { localStorage.setItem(key, '1'); new Notification(reminder.title, { body: reminder.description || 'Your reminder is due.' }); }
        }
      }
    }, 15000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [snoozed]);

  return {
    ringing,
    snooze: async () => {
      if (!ringing) return;
      await recordActivity(ringing._id, { status: 'snoozed', snoozes: 1, sessionId: ringing.sessionId });
      setSnoozed({ alarm: ringing, until: Date.now() + ringing.snoozeDuration * 60000 }); setRinging(null);
    },
    stop: async () => {
      if (!ringing) return;
      await recordActivity(ringing._id, { status: 'completed', sessionId: ringing.sessionId });
      if (!ringing.repeat?.length) await toggleAlarm(ringing._id);
      setRinging(null);
    }
  };
}
