import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("StoryAtlas crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg text-text-primary font-sans flex-col gap-4 p-8 text-center">
          <div className="text-4xl opacity-50">&#9888;</div>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-text-muted text-sm max-w-md">
            StoryAtlas encountered an unexpected error. Your data is safe on the
            server.
          </p>
          {this.state.error && (
            <pre className="text-xs text-danger bg-danger/10 p-3 rounded-md max-w-lg overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-accent-dim border border-accent/40 text-accent px-6 py-2 rounded-full cursor-pointer text-sm font-semibold font-sans"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
