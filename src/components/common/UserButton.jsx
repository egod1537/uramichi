import { useEffect, useMemo, useRef, useState } from 'react'
import useUserStore from '../../stores/useUserStore'

function UserButton() {
  const isLoggedIn = useUserStore((state) => state.isLoggedIn)
  const displayName = useUserStore((state) => state.displayName)
  const email = useUserStore((state) => state.email)
  const avatarUrl = useUserStore((state) => state.avatarUrl)
  const logout = useUserStore((state) => state.logout)

  const [isDropdownOpen, setDropdownOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isDropdownOpen) return

    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }

    window.addEventListener('mousedown', handleOutsideClick)
    return () => window.removeEventListener('mousedown', handleOutsideClick)
  }, [isDropdownOpen])

  useEffect(() => {
    if (!toastMessage) return
    const toastTimeout = window.setTimeout(() => {
      setToastMessage('')
    }, 1800)

    return () => window.clearTimeout(toastTimeout)
  }, [toastMessage])

  const profileInitial = useMemo(() => {
    const safeName = displayName?.trim()
    if (!safeName) return '?'
    return safeName[0].toUpperCase()
  }, [displayName])

  const handleProfileButtonClick = () => {
    if (!isLoggedIn) {
      setToastMessage('로그인 기능 준비 중')
      return
    }

    setDropdownOpen((previousOpenState) => !previousOpenState)
  }

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
  }

  return (
    <div ref={containerRef} className="absolute top-3 right-3 z-30 flex items-start gap-2">
      {isLoggedIn && (
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
          aria-label="앱 메뉴"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
            {[5, 12, 19].flatMap((x) => [5, 12, 19].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />))}
          </svg>
        </button>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={handleProfileButtonClick}
          className="flex h-10 min-w-[40px] items-center justify-center overflow-hidden rounded-full border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-[0_1px_6px_rgba(60,64,67,0.3)] hover:bg-gray-50"
          aria-expanded={isDropdownOpen}
          aria-haspopup="menu"
        >
          {!isLoggedIn && <span>로그인</span>}
          {isLoggedIn && avatarUrl && <img src={avatarUrl} alt="프로필" className="h-full w-full object-cover" />}
          {isLoggedIn && !avatarUrl && (
            <span className="flex h-full w-full items-center justify-center bg-[#5f6368] text-sm font-semibold text-white">
              {profileInitial}
            </span>
          )}
        </button>

        {isLoggedIn && isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white py-2 shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-11 w-11 overflow-hidden rounded-full bg-[#5f6368] text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="프로필" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-base font-semibold">{profileInitial}</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{displayName || '사용자'}</p>
                <p className="truncate text-xs text-gray-500">{email || 'email@example.com'}</p>
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
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="absolute top-12 right-0 rounded-md bg-gray-900 px-3 py-2 text-xs font-medium text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </div>
  )
}

export default UserButton
