import { FileQuestion } from 'lucide-react';

export function EmptyState({ message = 'No data found', icon: Icon = FileQuestion }: { message?: string; icon?: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon className="h-12 w-12 mb-3 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
