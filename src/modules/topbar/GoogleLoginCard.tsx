import React from 'react';
import type { GoogleUser } from '../../models/Plan';
import { loadGoogleIdentityServices } from '../../services/GoogleIdentityLoader';
import {
  readStoredGoogleUser,
  writeStoredGoogleUser,
} from '../../services/GoogleUserSession';

interface GoogleLoginCardProps {
  onUserChange?: (user: GoogleUser | null) => void;
}

interface GoogleLoginCardState {
  user: GoogleUser | null;
  status: 'loading' | 'ready' | 'authenticated' | 'missing-client-id' | 'error';
  errorMessage: string;
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
const hasConfiguredClientId = Boolean(clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID');

function decodeJwtPayload(token: string) {
  const payload = token.split('.')[1];

  if (!payload) {
    throw new Error('Invalid credential payload.');
  }

  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = window.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return JSON.parse(new TextDecoder().decode(bytes));
}

class GoogleLoginCard extends React.Component<GoogleLoginCardProps, GoogleLoginCardState> {
  static defaultProps = {
    onUserChange: undefined,
  };

  private buttonRef = React.createRef<HTMLDivElement>();

  private hasInitialized = false;

  constructor(props: GoogleLoginCardProps) {
    super(props);
    const user = readStoredGoogleUser();

    this.state = {
      user,
      status: user ? 'authenticated' : hasConfiguredClientId ? 'loading' : 'missing-client-id',
      errorMessage: '',
    };
  }

  componentDidMount() {
    this.props.onUserChange?.(this.state.user);
    this.initializeGoogleIdentity();
  }

  componentDidUpdate(
    prevProps: GoogleLoginCardProps,
    prevState: GoogleLoginCardState,
  ) {
    if (prevState.user !== this.state.user) {
      this.props.onUserChange?.(this.state.user);
      this.initializeGoogleIdentity();
    }
  }

  private initializeGoogleIdentity() {
    const { user } = this.state;

    if (user) {
      if (this.state.status !== 'authenticated') {
        this.setState({ status: 'authenticated' });
      }
      return;
    }

    if (!hasConfiguredClientId) {
      if (this.state.status !== 'missing-client-id') {
        this.setState({ status: 'missing-client-id' });
      }
      return;
    }

    loadGoogleIdentityServices()
      .then(() => {
        if (!this.buttonRef.current) {
          return;
        }

        if (!this.hasInitialized) {
          window.google?.accounts.id.initialize({
            client_id: clientId,
            callback: (response: { credential?: string }) => {
              if (!response.credential) {
                this.setState({
                  status: 'error',
                  errorMessage: 'Google에서 로그인 응답을 받지 못했습니다.',
                });
                return;
              }

              try {
                const payload = decodeJwtPayload(response.credential);
                const nextUser: GoogleUser = {
                  id: payload.sub,
                  name: payload.name,
                  email: payload.email,
                  imageUrl: payload.picture,
                };

                writeStoredGoogleUser(nextUser);
                this.setState({
                  user: nextUser,
                  errorMessage: '',
                  status: 'authenticated',
                });
              } catch {
                this.setState({
                  status: 'error',
                  errorMessage: 'Google 사용자 정보를 해석하지 못했습니다.',
                });
              }
            },
          });

          this.hasInitialized = true;
        }

        this.buttonRef.current.innerHTML = '';
        window.google?.accounts.id.renderButton(this.buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 280,
          logo_alignment: 'left',
        });

        if (this.state.status !== 'ready') {
          this.setState({ status: 'ready' });
        }
      })
      .catch(() => {
        this.setState({
          status: 'error',
          errorMessage: 'Google Identity Services 스크립트를 불러오지 못했습니다.',
        });
      });
  }

  private handleLogout = () => {
    window.google?.accounts?.id.disableAutoSelect();
    writeStoredGoogleUser(null);
    this.setState({
      user: null,
      errorMessage: '',
      status: hasConfiguredClientId ? 'ready' : 'missing-client-id',
    });
  };

  render() {
    const { user, status, errorMessage } = this.state;

    return (
      <section className="rounded-[1.6rem] border border-[var(--color-line)] bg-white p-4 shadow-sm shadow-slate-200/70">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Google Login
            </p>
            <p className="mt-1 text-lg font-semibold">계정 연결</p>
          </div>
          <span className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-muted)]">
            {status}
          </span>
        </div>

        {user ? (
          <div className="mt-4 rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center gap-3">
              {user.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt={user.name}
                  className="h-12 w-12 rounded-full border border-white object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-sm font-semibold text-[var(--color-accent)]">
                  {user.name?.slice(0, 1) ?? 'G'}
                </div>
              )}

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                  {user.name}
                </p>
                <p className="truncate text-sm text-[var(--color-muted)]">{user.email}</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
              현재 브라우저에서 로그인 상태를 보존합니다. 실제 인증 세션이 필요하면 ID 토큰을
              백엔드로 보내 검증해야 합니다.
            </p>

            <button
              type="button"
              onClick={this.handleLogout}
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[var(--color-line)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-[1.4rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              Google Cloud Console에서 웹용 OAuth 클라이언트 ID를 만든 뒤 `.env`의
              `VITE_GOOGLE_CLIENT_ID`에 넣으면 이 버튼으로 로그인할 수 있습니다.
            </p>

            <div className="mt-4 flex min-h-12 items-center">
              {hasConfiguredClientId ? <div ref={this.buttonRef} /> : null}
            </div>

            {!hasConfiguredClientId ? (
              <p className="mt-3 text-sm text-[var(--color-accent)]">
                클라이언트 ID가 아직 설정되지 않았습니다.
              </p>
            ) : null}

            {errorMessage ? <p className="mt-3 text-sm text-[#d9485f]">{errorMessage}</p> : null}
          </div>
        )}
      </section>
    );
  }
}

export default GoogleLoginCard;
