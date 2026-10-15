import { addToEmailList, sendWelcomeEmail } from './resendService';

export interface UserEmailListOptions {
  sendWelcome?: boolean;
}

export const handleNewUserEmailList = async (options: UserEmailListOptions = {}) => {
  const { sendWelcome = true } = options;

  try {
    await addToEmailList();

    if (sendWelcome) {
      await sendWelcomeEmail();
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling new user email list operations');
    return { success: false, error };
  }
};
