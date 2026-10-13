import { queryClient, queryKeys } from '../../lib/queryClient';
import { getSessionUser } from '../auth/currentUser';
import { supabase } from '../../lib/supabase';
import { handleNewUserEmailList } from '../integrations/emailListService';

// Separate acquisition channel from referral codes (services/user/referralService.ts) --
// this is a direct grant to an already-authenticated user, not a code redemption. The
// two channels coordinate only through users.free_month_granted_at, so a user can't
// stack a free month from both this popup and a landing-page referral code.

export const shouldShowFreeMonthOffer = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await getSessionUser();
    if (!user) return false;

    const { data } = await supabase
      .from('users')
      .select('free_month_offer_shown_at')
      .eq('id', user.id)
      .single();

    return !data?.free_month_offer_shown_at;
  } catch (error) {
    console.error('Error checking free month offer visibility:', error);
    return false;
  }
};

export const markFreeMonthOfferShown = async (): Promise<void> => {
  try {
    const { data: { user } } = await getSessionUser();
    if (!user) return;

    await supabase
      .from('users')
      .update({ free_month_offer_shown_at: new Date().toISOString() })
      .eq('id', user.id)
      .is('free_month_offer_shown_at', null);
  } catch (error) {
    console.error('Error marking free month offer as shown:', error);
  }
};

export const grantFreeMonthOffer = async (
  email: string
): Promise<{ success: boolean; alreadyGranted?: boolean; message: string }> => {
  try {
    const { data: { user }, error: userError } = await getSessionUser();
    if (userError || !user) {
      return { success: false, message: 'You need to be signed in to claim this offer.' };
    }

    const { data: userData } = await supabase
      .from('users')
      .select('subscription_source, is_pro, free_month_granted_at')
      .eq('id', user.id)
      .single();

    // Real subscriptions always win -- never touch a real subscriber's account.
    if (userData?.subscription_source === 'superwall' && userData?.is_pro) {
      return { success: false, alreadyGranted: true, message: "You're already a Pro subscriber!" };
    }

    // One comp/promo grant per account, regardless of channel.
    if (userData?.free_month_granted_at) {
      return { success: false, alreadyGranted: true, message: 'You already have Pro access!' };
    }

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_pro: true,
        referral_subscription_type: 'monthly',
        pro_expires_at: expiresAt.toISOString(),
        free_month_granted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error granting free month offer:', updateError);
      return { success: false, message: 'Something went wrong. Please try again.' };
    }

    await queryClient.invalidateQueries({ queryKey: queryKeys.proStatus });

    // Best-effort, non-blocking -- matches the pattern used elsewhere for Resend
    // email-list sync (e.g. services/auth/auth.ts). The typed email is only used
    // here, for the mailing list -- the grant above always targets the
    // authenticated session's user id, never a lookup by this email.
    setTimeout(async () => {
      try {
        await handleNewUserEmailList({ email, sendWelcome: false });
      } catch (emailError) {
        console.error('Error syncing free-month email to mailing list:', emailError);
      }
    }, 0);

    return { success: true, message: "🎉 You've got 1 month of Keystone Pro, free!" };
  } catch (error) {
    console.error('Error in grantFreeMonthOffer:', error);
    return { success: false, message: 'Something went wrong. Please try again.' };
  }
};
