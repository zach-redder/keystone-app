import { useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { fetchUnreviewedMessages, markChatRowsReviewed } from '../services/features/affirmationService';
import { proposeKeyChanges, applyKeyChange } from '../services/features/keyProposalService';
import { fetchIdentityKeys } from '../services/user/userKeys';
import { checkUserProStatus } from '../services/subscription/subscriptionService';
import { maybeRequestReview } from '../services/features/reviewPromptService';
import { PRO_ONLY_CATEGORIES } from '../constants/keyCategories';

// Matches the service's review cap; older unreviewed rows are marked reviewed without being sent
const MAX_REVIEW_MESSAGES = 100;

/** The "Review keys" flow, shared by the chat and voice screens. */
export default function useKeyReview(mode) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [changes, setChanges] = useState([]);
  const [applying, setApplying] = useState(false);
  const rowIds = useRef([]);
  const ready = useRef(false);

  const open = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVisible(true);
    setLoading(true);
    setError(null);
    setChanges([]);
    ready.current = false;
    try {
      const unreviewed = await fetchUnreviewedMessages(mode);
      rowIds.current = [...new Set(unreviewed.map(message => message.rowId))];
      if (!unreviewed.some(message => message.role === 'user')) {
        ready.current = true;
        return;
      }

      const [keys, isPro] = await Promise.all([fetchIdentityKeys(), checkUserProStatus()]);
      const proposals = await proposeKeyChanges(keys || [], unreviewed.slice(-MAX_REVIEW_MESSAGES));
      // Free users can't hold pro-only categories, so don't offer them
      setChanges(isPro ? proposals : proposals.filter(change => !PRO_ONLY_CATEGORIES.includes(change.category)));
      ready.current = true;
    } catch (e) {
      console.error('Error reviewing keys:', e);
      setError('Could not review your conversation right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Dismissing a finished review counts as reviewed so the same messages aren't proposed again
  const close = async () => {
    setVisible(false);
    if (ready.current) {
      ready.current = false;
      await markChatRowsReviewed(rowIds.current);
    }
  };

  const apply = async (selectedChanges) => {
    setApplying(true);
    let failed = 0;
    for (const change of selectedChanges) {
      try {
        await applyKeyChange(change);
      } catch (e) {
        console.error('Error applying key change:', e);
        failed += 1;
      }
    }
    setApplying(false);
    if (failed > 0) {
      Alert.alert('Some changes failed', `${failed} of ${selectedChanges.length} changes could not be applied.`);
    }
    await close();
    // Having just watched their keys update is a good moment; a partly failed review is not
    if (failed === 0 && selectedChanges.length > 0) maybeRequestReview();
  };

  return { visible, loading, error, changes, applying, open, close, apply };
}
