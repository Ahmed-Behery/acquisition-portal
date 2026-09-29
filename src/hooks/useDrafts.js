import { useCallback, useEffect, useState } from 'react';
import { deleteDraft, readDrafts, upsertDraft } from '@/services/draftStorage';

/**
 * Reads the current user's drafts from browser storage.
 *
 * Deliberately starts empty and fills in after mount: `localStorage` does not exist
 * on the server, so reading it during render would produce different markup on the
 * server and the client.
 */
export function useDrafts(userId) {
  const [drafts, setDrafts] = useState([]);

  const refresh = useCallback(() => setDrafts(readDrafts(userId)), [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const save = useCallback(
    (draft, options) => {
      const id = upsertDraft(userId, draft, options);
      refresh();
      return id;
    },
    [userId, refresh]
  );

  const remove = useCallback(
    (draftId) => {
      deleteDraft(userId, draftId);
      refresh();
    },
    [userId, refresh]
  );

  return { drafts, count: drafts.length, save, remove, refresh };
}
