import { BASE_URL } from '../../lib/apiConfig';
import { getAuthHeaders, ChatMessage } from './affirmationService';
import { addIdentityKey, updateIdentityKey, deleteIdentityKey } from '../user/userKeys';
import { assertAiConsent } from '../user/aiConsentService';

export type KeyChangeAction = 'add' | 'update' | 'delete';

export interface KeyChange {
  action: KeyChangeAction;
  category: string;
  keyId: string | null;
  oldText: string | null;
  newText: string | null;
  reason: string;
  evidenceQuote: string;
}

interface ExistingKey {
  id: string;
  category: string;
  description: string;
}

interface RawKeyChange {
  action: KeyChangeAction;
  category: string;
  key_id: string | null;
  old_text: string | null;
  new_text: string | null;
  reason: string;
  evidence_quote: string;
}

export const proposeKeyChanges = async (keys: ExistingKey[], messages: ChatMessage[]): Promise<KeyChange[]> => {
  await assertAiConsent();
  const response = await fetch(`${BASE_URL}/propose-key-changes`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify({
      keys: keys.map(({ id, category, description }) => ({ id, category, description })),
      messages: messages.map(({ role, content }) => ({ role, content })),
    }),
  });

  if (!response.ok) throw new Error('Key proposal backend error');
  const data: { changes: RawKeyChange[] } = await response.json();

  return (data.changes ?? []).map(change => ({
    action: change.action,
    category: change.category,
    keyId: change.key_id,
    oldText: change.old_text,
    newText: change.new_text,
    reason: change.reason,
    evidenceQuote: change.evidence_quote,
  }));
};

// Applies one accepted proposal under the user's own session; the backend never writes keys.
export const applyKeyChange = async (change: KeyChange) => {
  if (change.action === 'add' && change.newText) {
    return addIdentityKey(change.category, change.newText);
  }
  if (change.action === 'update' && change.keyId && change.newText) {
    return updateIdentityKey(change.keyId, { description: change.newText });
  }
  if (change.action === 'delete' && change.keyId) {
    return deleteIdentityKey(change.keyId);
  }
  throw new Error('Invalid key change');
};
