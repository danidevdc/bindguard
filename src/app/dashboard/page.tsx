import AuthWrapper from '@/components/AuthWrapper';
import DashboardClient from '@/components/dashboard/DashboardClient';

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <DashboardClient />
    </AuthWrapper>
  );
}
