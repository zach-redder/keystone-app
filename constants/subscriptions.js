export const SUBSCRIPTION_PLANS = [
  {
    id: 'monthly',
    productId: 'com.reddermedia.keystone.monthly',
    title: 'Keystone Pro Membership',
    lengthDescription: 'Monthly auto-renewing subscription',
    formattedPrice: '$19.99 / month',
    pricePerUnit: '≈ $0.66 per day after trial',
    trialDescription: '3-day free trial, then $19.99 billed monthly until canceled.',
  },
  {
    id: 'yearly',
    productId: 'com.reddermedia.keystone.yearly',
    title: 'Keystone Pro Yearly',
    lengthDescription: 'Yearly auto-renewing subscription',
    formattedPrice: '$119.99 / year',
    pricePerUnit: '≈ $9.99 per month after trial',
    trialDescription: '3-day free trial, then $119.99 billed yearly until canceled.',
  },
];

export const PRIMARY_SUBSCRIPTION = SUBSCRIPTION_PLANS[0];

export const AUTO_RENEW_NOTICE =
  'Subscription renews automatically unless canceled at least 24 hours before the end of the current period. Manage or cancel any time in your App Store account settings.';

export const BILLING_DISCLOSURE =
  'Payment will be charged to your Apple ID account after the free trial ends. Any unused portion of a free trial will be forfeited when you purchase a subscription.';

