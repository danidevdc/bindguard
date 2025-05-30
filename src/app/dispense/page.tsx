
import AuthWrapper from '@/components/AuthWrapper';
import ScanForm from '@/components/scan/ScanForm'; // This is the multi-step dispensing form

export default function DispensePage() {
  return (
    <AuthWrapper>
      <div className="max-w-2xl mx-auto">
        {/* Title can be part of ScanForm or here, for now, ScanForm handles its own titles per step */}
        <ScanForm />
      </div>
    </AuthWrapper>
  );
}
