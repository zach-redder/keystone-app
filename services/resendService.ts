const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const addToEmailList = async (options: { email: string; audienceId?: string }) => {
  const { email } = options;
  const response = await fetch(`${API_BASE_URL}/add-to-email-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const removeFromEmailList = async (options: { email: string; audienceId?: string }) => {
  const { email } = options;
  const response = await fetch(`${API_BASE_URL}/remove-from-email-list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const updateEmailListContact = async (options: { email: string; updates: any; audienceId?: string }) => {
  const { email, updates } = options;
  const response = await fetch(`${API_BASE_URL}/update-email-list-contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, updates }),
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const sendWelcomeEmail = async (email: string) => {
  const response = await fetch(`${API_BASE_URL}/send-welcome-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
