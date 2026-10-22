import { BASE_URL } from '../../lib/apiConfig';
import { getAuthHeaders } from '../features/affirmationService';

// The backend takes the address from the signed-in account rather than the request, so these calls
// only ever act on the current user and need no email in the body.

export const addToEmailList = async () => {
  const response = await fetch(`${BASE_URL}/add-to-email-list`, {
    method: "POST",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) throw new Error(`Email list request failed (${response.status})`);
  return response.json();
};

export const sendWelcomeEmail = async () => {
  const response = await fetch(`${BASE_URL}/send-welcome-email`, {
    method: "POST",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) throw new Error(`Welcome email request failed (${response.status})`);
  return response.json();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
