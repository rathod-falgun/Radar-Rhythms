import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Radar Rhythms Caught Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-[#14213d] border border-[#e5e5e5]/20 rounded p-6 text-center space-y-4">
            <div className="w-10 h-10 rounded bg-black text-[#fca311] border border-[#fca311]/40 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-editorial text-white font-semibold">
                Radar View Component Notice
              </h3>
              <p className="text-xs text-[#e5e5e5]/70 font-mono mt-1">
                {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded bg-[#fca311] text-black font-mono text-xs font-semibold uppercase tracking-wider hover:bg-white transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Radar Monitor</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

