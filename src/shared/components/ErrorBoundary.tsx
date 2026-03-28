import React, { type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static defaultProps = {};

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  componentDidCatch() {
    this.setState({ hasError: true });
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="flex min-h-screen items-center justify-center bg-[var(--color-app)] px-6">
          <div className="max-w-md rounded-[1.6rem] border border-[var(--color-line)] bg-white p-6 text-center shadow-xl shadow-slate-200/60">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Planner Error
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
              화면을 다시 불러와 주세요.
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
              컴포넌트 렌더링 중 오류가 발생했습니다. 개발 중이라면 최근 리팩토링된 모듈의
              상태 초기화 로직을 먼저 확인하는 편이 정확합니다.
            </p>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
