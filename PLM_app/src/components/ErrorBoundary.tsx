import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mb-3 text-warning" />
          <h2 className="text-lg font-medium text-foreground">Something went wrong</h2>
          <p className="text-sm mt-1">Please try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
