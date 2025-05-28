import AuthWrapper from '@/components/AuthWrapper';
import ScanForm from '@/components/scan/ScanForm';

export default function ScanPage() {
  return (
    <AuthWrapper>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-semibold text-foreground mb-8 text-center">Medicine Scan & Entry</h2>
        <ScanForm />
      </div>
    </AuthWrapper>
  );
}
