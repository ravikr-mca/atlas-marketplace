import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '../mock/auth';
import { useAppSelector } from '../hooks/useTypedRedux';
import { decide, type Actor, type Decision, type Permission, type Resource } from './permissions';

export const MY_KEY = ['me'] as const;

/**
 * Who is signed in. The token is Redux; the identity behind it is server state, so it's a
 * query — which also means an approval (accreditation change) takes effect as soon as it
 * is invalidated, with no page reload.
 */
export function useSession() {
  const token = useAppSelector((s) => s.session.token);
  const me = useQuery({ queryKey: MY_KEY, queryFn: fetchMe, enabled: !!token, staleTime: 60_000 });

  const user = token ? me.data?.user : undefined;
  const organization = token ? me.data?.organization : undefined;
  const status = !token ? 'anonymous' : user ? 'authenticated' : me.isError ? 'anonymous' : 'loading';

  const actor = useMemo<Actor | null>(
    () => (user && organization ? { userId: user.id, role: user.role, organizationId: organization.id, accreditation: organization.accreditation } : null),
    [user, organization],
  );

  return {
    status: status as 'anonymous' | 'loading' | 'authenticated',
    user,
    organization,
    /** Same rule table the mock API enforces — the UI uses it to explain, the API to refuse. */
    decide: (permission: Permission, resource?: Resource): Decision =>
      actor ? decide(actor, permission, resource) : { allowed: false, code: 'ROLE', reason: 'Sign in to continue.' },
    can: (permission: Permission, resource?: Resource) => (actor ? decide(actor, permission, resource).allowed : false),
  };
}
