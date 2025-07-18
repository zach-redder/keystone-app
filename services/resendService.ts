import { Resend } from 'resend';

const resend = new Resend(process.env.EXPO_PUBLIC_RESEND_API_KEY);

export interface AddToEmailListOptions {
  email: string;
  audienceId?: string;
}

export const addToEmailList = async (options: AddToEmailListOptions) => {
  try {
    const { email, audienceId } = options;
    
    // Use the provided audienceId or fall back to default
    const targetAudienceId = audienceId || process.env.EXPO_PUBLIC_RESEND_AUDIENCE_ID;
    
    if (!targetAudienceId) {
      throw new Error('No audience ID provided and no default audience ID configured');
    }

    const contact = {
      email,
      unsubscribed: false,
    };

    const result = await resend.contacts.create({
      audienceId: targetAudienceId,
      ...contact,
    });

    console.log('Successfully added contact to Resend email list:', result);
    return result;
  } catch (error) {
    console.error('Error adding contact to Resend email list:', error);
    throw error;
  }
};

export const removeFromEmailList = async (email: string, audienceId?: string) => {
  try {
    const targetAudienceId = audienceId || process.env.EXPO_PUBLIC_RESEND_AUDIENCE_ID;
    
    if (!targetAudienceId) {
      throw new Error('No audience ID provided and no default audience ID configured');
    }

    const result = await resend.contacts.remove({
      audienceId: targetAudienceId,
      email,
    });

    console.log('Successfully removed contact from Resend email list:', result);
    return result;
  } catch (error) {
    console.error('Error removing contact from Resend email list:', error);
    throw error;
  }
};

export const updateEmailListContact = async (
  email: string,
  updates: Partial<AddToEmailListOptions>,
  audienceId?: string
) => {
  try {
    const targetAudienceId = audienceId || process.env.EXPO_PUBLIC_RESEND_AUDIENCE_ID;
    
    if (!targetAudienceId) {
      throw new Error('No audience ID provided and no default audience ID configured');
    }

    const result = await resend.contacts.update({
      audienceId: targetAudienceId,
      email,
      unsubscribed: false,
    });

    console.log('Successfully updated contact in Resend email list:', result);
    return result;
  } catch (error) {
    console.error('Error updating contact in Resend email list:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email: string) => {
  try {
    const result = await resend.emails.send({
      to: email,
      from: '"Zach from Keystone" <zach@thekeystoneapp.com>',
      subject: 'Welcome to Keystone',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hey!</p>
          <p style="font-size: 16px; margin-bottom: 20px;">It's Zach here, the creator of Keystone. Thanks for signing up for my app!</p>
          <p style="font-size: 16px; margin-bottom: 20px;">I'm excited to share this journey with you. We'll keep you updated on the app, new features, and more.</p>
          <p style="font-size: 16px; margin-bottom: 20px;">You can also join our <a href="https://discord.me/thealignedcore" style="color: #007bff; text-decoration: none;">Discord</a> community to connect with other app users and receive rewards!</p>
          <p style="font-size: 16px; margin-bottom: 20px;">If you join, I'd love to hear what brought you to Keystone!</p>
          <p style="font-size: 16px; margin-top: 30px;">Best,<br/>Zach</p>
        </div>
      `
    });

    console.log('Successfully sent welcome email:', result);
    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};