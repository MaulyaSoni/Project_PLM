import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmptyState({
  message = 'No data found',
  icon: Icon = FileQuestion,
  actionLabel,
  onAction,
}: {
  message?: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
      {actionLabel && onAction && (
        <Button className="mt-4" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
