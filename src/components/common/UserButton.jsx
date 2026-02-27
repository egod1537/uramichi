import React from 'react'
import useUserStore from '../../stores/useUserStore'

class UserButton extends React.Component {
  containerRef = React.createRef()

  googleSignInScriptPromise = null

  googleTokenClient = null

  isGoogleLoginPending = false

  state = {
    isDropdownOpen: false,
    toastMessage: '',
    isLoggedIn: useUserStore.getState().isLoggedIn,
    displayName: useUserStore.getState().displayName,
    email: useUserStore.getState().email,
    avatarUrl: useUserStore.getState().avatarUrl,
  }

  componentDidMount() {
    this.unsubscribeUserStore = useUserStore.subscribe((state) => {
      this.setState({
        isLoggedIn: state.isLoggedIn,
        displayName: state.displayName,
        email: state.email,
        avatarUrl: state.avatarUrl,
      })
    })
  }

  componentWillUnmount() {
    if (this.unsubscribeUserStore) {
      this.unsubscribeUserStore()
    }
    this.detachOutsideClickListener()
    this.clearToastTimeout()
  }

  componentDidUpdate(previousProps, previousState) {
    if (this.state.isDropdownOpen && !previousState.isDropdownOpen) {
      window.addEventListener('mousedown', this.handleOutsideClick)
    }
    if (!this.state.isDropdownOpen && previousState.isDropdownOpen) {
      this.detachOutsideClickListener()
    }

    if (this.state.toastMessage && !previousState.toastMessage) {
      this.toastTimeoutId = window.setTimeout(() => {
        this.setState({ toastMessage: '' })
        this.toastTimeoutId = null
      }, 1800)
    }
    if (!this.state.toastMessage && previousState.toastMessage) {
      this.clearToastTimeout()
    }
  }

  detachOutsideClickListener() {
    window.removeEventListener('mousedown', this.handleOutsideClick)
  }

  clearToastTimeout() {
    if (this.toastTimeoutId) {
      window.clearTimeout(this.toastTimeoutId)
      this.toastTimeoutId = null
    }
  }

  stopGoogleLoginFlow() {
    this.isGoogleLoginPending = false
  }

  loadGoogleSignInScript() {
    if (window.google?.accounts?.oauth2) {
      return Promise.resolve()
    }
    if (this.googleSignInScriptPromise) {
      return this.googleSignInScriptPromise
    }

    this.googleSignInScriptPromise = new Promise((resolve, reject) => {
      const existingScriptElement = document.querySelector('script[data-google-identity="true"]')
      if (existingScriptElement) {
        if (window.google?.accounts?.oauth2) {
          resolve()
          return
        }
        existingScriptElement.addEventListener('load', () => resolve(), { once: true })
        existingScriptElement.addEventListener('error', () => reject(new Error('Google script load failed')), { once: true })
        return
      }

      const googleScriptElement = document.createElement('script')
      googleScriptElement.src = 'https://accounts.google.com/gsi/client'
      googleScriptElement.async = true
      googleScriptElement.defer = true
      googleScriptElement.dataset.googleIdentity = 'true'
      googleScriptElement.onload = () => resolve()
      googleScriptElement.onerror = () => reject(new Error('Google script load failed'))
      document.head.appendChild(googleScriptElement)
    })

    return this.googleSignInScriptPromise
  }

  handleGoogleTokenResponse = async (tokenResponse) => {
    if (!tokenResponse?.access_token) {
      this.stopGoogleLoginFlow()
      this.setState({ toastMessage: 'Google 로그인에 실패했습니다' })
      return
    }

    try {
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      })

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch Google profile')
      }

      const profileData = await profileResponse.json()

      useUserStore.getState().login({
        provider: 'google',
        accessToken: tokenResponse.access_token,
        displayName: profileData.name || '',
        email: profileData.email || '',
        avatarUrl: profileData.picture || '',
      })
    } catch {
      this.setState({ toastMessage: 'Google 계정 정보를 읽지 못했습니다' })
    } finally {
      this.stopGoogleLoginFlow()
    }
  }

  initializeGoogleTokenClient() {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!googleClientId) {
      this.setState({ toastMessage: 'VITE_GOOGLE_CLIENT_ID 설정이 필요합니다' })
      return false
    }
    if (!window.google?.accounts?.oauth2) {
      this.setState({ toastMessage: 'Google 로그인 SDK를 불러오지 못했습니다' })
      return false
    }

    if (!this.googleTokenClient) {
      this.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        callback: this.handleGoogleTokenResponse,
        error_callback: () => {
          this.stopGoogleLoginFlow()
          this.setState({ toastMessage: 'Google 로그인 창을 닫았습니다' })
        },
      })
    }

    return true
  }

  handleGoogleLogin = async () => {
    if (this.isGoogleLoginPending) {
      return
    }

    try {
      await this.loadGoogleSignInScript()
      const isInitialized = this.initializeGoogleTokenClient()
      if (!isInitialized) return

      this.isGoogleLoginPending = true
      this.googleTokenClient.requestAccessToken({ prompt: 'consent' })
    } catch {
      this.stopGoogleLoginFlow()
      this.setState({ toastMessage: 'Google 로그인 창을 열지 못했습니다' })
    }
  }

  getProfileInitial() {
    const safeName = this.state.displayName?.trim()
    if (!safeName) return '?'
    return safeName[0].toUpperCase()
  }

  handleOutsideClick = (event) => {
    if (this.containerRef.current && !this.containerRef.current.contains(event.target)) {
      this.setState({ isDropdownOpen: false })
    }
  }

  handleProfileButtonClick = () => {
    if (!this.state.isLoggedIn) {
      this.handleGoogleLogin()
      return
    }

    this.setState((previousState) => ({
      isDropdownOpen: !previousState.isDropdownOpen,
    }))
  }

  handleLogout = () => {
    this.stopGoogleLoginFlow()
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect()
    }
    useUserStore.getState().logout()
    this.setState({ isDropdownOpen: false })
  }

  render() {
    const profileInitial = this.getProfileInitial()
    const profileButtonClassName = this.state.isLoggedIn
      ? 'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-[0_1px_6px_rgba(60,64,67,0.3)] hover:bg-gray-50'
      : 'flex h-10 min-w-[40px] items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-[0_1px_6px_rgba(60,64,67,0.3)] hover:bg-gray-50'

    return (
      <div ref={this.containerRef} className="absolute top-3 right-3 z-30 flex items-start">
        <div className="relative">
          <button
            type="button"
            onClick={this.handleProfileButtonClick}
            className={profileButtonClassName}
            aria-expanded={this.state.isDropdownOpen}
            aria-haspopup="menu"
          >
            {!this.state.isLoggedIn && <span>로그인</span>}
            {this.state.isLoggedIn && this.state.avatarUrl && (
              <img src={this.state.avatarUrl} alt="프로필" className="h-full w-full object-cover" />
            )}
            {this.state.isLoggedIn && !this.state.avatarUrl && (
              <span className="flex h-full w-full items-center justify-center bg-[#5f6368] text-sm font-semibold text-white">
                {profileInitial}
              </span>
            )}
          </button>

          {this.state.isLoggedIn && this.state.isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white py-2 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="h-11 w-11 overflow-hidden rounded-full bg-[#5f6368] text-white">
                  {this.state.avatarUrl ? (
                    <img src={this.state.avatarUrl} alt="프로필" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base font-semibold">{profileInitial}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{this.state.displayName || '사용자'}</p>
                  <p className="truncate text-xs text-gray-500">{this.state.email || 'email@example.com'}</p>
                </div>
              </div>

              <div className="my-2 h-px bg-gray-200" />

              <button type="button" className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                내 지도 목록
              </button>
              <button type="button" className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                설정
              </button>

              <div className="my-2 h-px bg-gray-200" />

              <button
                type="button"
                onClick={this.handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>

        {this.state.toastMessage && (
          <div className="absolute top-12 right-0 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
            {this.state.toastMessage}
          </div>
        )}
      </div>
    )
  }
}

export default UserButton
