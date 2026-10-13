import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { loadIdentityKeys } from '../services/user/userKeys';

export default function useIdentityKeys() {
  const query = useQuery({ queryKey: queryKeys.identityKeys, queryFn: loadIdentityKeys });
  return { keys: query.data ?? [], loaded: query.data !== undefined };
}
