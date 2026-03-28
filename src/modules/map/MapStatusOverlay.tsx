interface MapStatusOverlayProps {
  status: 'loading' | 'ready' | 'missing-key' | 'error';
  errorMessage: string;
}

export default function MapStatusOverlay({
  status,
  errorMessage,
}: MapStatusOverlayProps) {
  if (status === 'ready') {
    return null;
  }

  const title =
    status === 'loading'
      ? '지도를 불러오는 중입니다.'
      : status === 'missing-key'
        ? 'API 키를 넣으면 지도가 표시됩니다.'
        : '지도를 불러오지 못했습니다.';

  const description =
    status === 'loading'
      ? 'Google Maps 스크립트를 초기화하는 중입니다. 오래 걸리면 네트워크 연결이나 API 키 도메인 허용 설정을 확인해 주세요.'
      : status === 'missing-key'
        ? '`.env` 파일의 `VITE_GOOGLE_MAPS_API_KEY` 값을 실제 Google Maps API 키로 교체한 뒤 개발 서버를 다시 시작하세요.'
        : errorMessage ||
          'API 키 권한, Maps JavaScript API 활성화 여부, 도메인 허용 설정을 확인해 주세요.';

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white/28 px-6 text-center backdrop-blur-sm">
      <div className="max-w-md rounded-[1.5rem] border border-[var(--color-line)] bg-white/92 p-6 shadow-2xl shadow-slate-300/40">
        <p className="text-lg font-semibold text-[var(--color-ink)]">{title}</p>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
      </div>
    </div>
  );
}
