
import AuthWrapper from '@/components/AuthWrapper';
import StockEntryForm from '@/components/stock/StockEntryForm';

export default function StockEntryPage() {
  return (
    <AuthWrapper>
      <div className="max-w-2xl mx-auto">
        <StockEntryForm />
      </div>
    </AuthWrapper>
  );
}
