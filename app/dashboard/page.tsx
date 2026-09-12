import { cookies } from 'next/headers';
import DashboardClient from '@/components/DashboardClient';
import { FRESH_AUTH_COOKIE } from '@/lib/fresh-auth-navigation';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const skipInitialSkeleton = cookieStore.get(FRESH_AUTH_COOKIE)?.value === '1';

  return <DashboardClient skipInitialSkeleton={skipInitialSkeleton} />;
}
