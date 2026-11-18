import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message || 'Terjadi kendala saat memuat halaman.',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let friendlyMsg = 'Mohon maaf, terjadi gangguan sementara saat memproses data.';
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed?.error) {
          friendlyMsg = `Gangguan koneksi database: ${parsed.error}`;
        }
      } catch {
        // Non-JSON error message
      }

      return (
        <div className="min-h-screen bg-[#fffbeb] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-lg border-2 border-[#fde047] text-center">
            <div className="text-5xl mb-4" aria-hidden="true">🌈</div>
            <h2 className="font-display text-2xl font-bold text-slate-900 mb-2">
              Ups, Ada Gangguan Sebentar
            </h2>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">{friendlyMsg}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-full bg-[#facc15] hover:bg-[#eab308] text-slate-900 font-bold text-sm transition-transform active:scale-95 cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
