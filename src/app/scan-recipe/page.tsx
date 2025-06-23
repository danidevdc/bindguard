
import AuthWrapper from '@/components/AuthWrapper';
import ScanRecipeClient from '@/components/scan/ScanRecipeClient';

export default function ScanRecipePage() {
  return (
    <AuthWrapper>
      <ScanRecipeClient />
    </AuthWrapper>
  );
}
