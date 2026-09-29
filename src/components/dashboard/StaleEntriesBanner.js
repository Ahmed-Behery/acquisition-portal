import Banner from '@/components/common/Banner';
import { useActions } from '@/hooks/useActions';
import { STALE_ENTRY_DAYS } from '@/constants/pipeline';

/**
 * Prompt on the leadership dashboards when entries have gone quiet.
 * The reminder sweep runs automatically every Monday in production; the button
 * triggers a manual run so the behaviour can be demonstrated.
 */
export default function StaleEntriesBanner({ staleCount, today }) {
  const actions = useActions();
  if (staleCount === 0) return null;

  return (
    <Banner
      tone="warn"
      action={
        <button type="button" className="btn btn-primary" onClick={() => actions.admin.runWeeklyReminders(today)}>
          🔄 Run weekly reminder check
        </button>
      }
    >
      <b>
        {staleCount} pipeline {staleCount === 1 ? 'entry has' : 'entries have'} not been updated in{' '}
        {STALE_ENTRY_DAYS}+ days.
      </b>{' '}
      Weekly reminders are normally sent automatically every Monday. You can trigger a manual run now.
    </Banner>
  );
}
