import { useEffect } from 'react';
import { SuperwallAdapter as SW } from './superwallAdapter';

export function useSuperwallAnalytics() {
  useEffect(() => {
    let unsubscribers: Array<() => void> = [];
    (async () => {
      unsubscribers.push(await SW.on('paywall_opened', (e) => console.log('SW paywall_opened', e)));
      unsubscribers.push(await SW.on('cta_clicked', (e) => console.log('SW cta_clicked', e)));
      unsubscribers.push(await SW.on('purchase_started', (e) => console.log('SW purchase_started', e)));
      unsubscribers.push(await SW.on('purchase_failed', (e) => console.log('SW purchase_failed', e)));
      unsubscribers.push(await SW.on('paywall_closed', (e) => console.log('SW paywall_closed', e)));
    })();

    return () => {
      unsubscribers.forEach((u) => {
        try { u(); } catch {}
      });
    };
  }, []);
}

