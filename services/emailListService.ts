import { addToEmailList, removeFromEmailList, sendWelcomeEmail } from './resendService';

export interface UserEmailListOptions {
  email: string;
  sendWelcome?: boolean;
}

export const handleNewUserEmailList = async (options: UserEmailListOptions) => {
  const { email, sendWelcome = true } = options;
  
  try {
    // Add to email list
    await addToEmailList({
      email,
    });
    
    // Send welcome email if requested
    if (sendWelcome) {
      await sendWelcomeEmail(email);
    }
    
    console.log('Successfully handled new user email list operations for:', email);
    return { success: true };
  } catch (error) {
    console.error('Error handling new user email list operations:', error);
    return { success: false, error };
  }
};

export const handleUserDeletion = async (email: string) => {
  try {
    await removeFromEmailList(email);
    
    console.log('Successfully removed user from email list:', email);
    return { success: true };
  } catch (error) {
    console.error('Error removing user from email list:', error);
    return { success: false, error };
  }
};
