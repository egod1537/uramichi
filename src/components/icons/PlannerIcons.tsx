export function PinEditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20s-5-4.8-5-9a5 5 0 1 1 10 0c0 4.2-5 9-5 9Z" />
      <circle cx="12" cy="11" r="1.75" />
      <path d="m17.5 5.5 2-2" />
    </svg>
  );
}

export function TransitRouteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="4.5" width="12" height="11" rx="3.2" />
      <path d="M9 16.5 7.5 19M15 16.5 16.5 19M9 9h6M9 12h6" />
      <circle cx="9" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function BudgetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 7.5h15v9h-15z" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <circle cx="12" cy="12" r="1.9" />
      <path d="M4.5 10.5h2M17.5 13.5h2" />
    </svg>
  );
}

export function AiChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 8.5h9M7.5 12h6" />
      <path d="M5.5 5.5h13a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 3v-3h-2a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <path d="M15.5 3.5v4M13.5 5.5h4" />
    </svg>
  );
}

export function GeminiIcon() {
  const gradientId = 'gemini-icon-gradient';

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5b8cff" />
          <stop offset="0.5" stopColor="#7b6dff" />
          <stop offset="1" stopColor="#34d3c9" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.75c.53 3.52 1.17 5.2 2.25 6.28s2.76 1.72 6.25 2.25c-3.49.53-5.17 1.17-6.25 2.25S12.53 16.29 12 19.75c-.53-3.46-1.17-5.14-2.25-6.22S6.99 11.81 3.5 11.28c3.49-.53 5.17-1.17 6.25-2.25S11.47 6.27 12 2.75Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M18.2 4.2c.23 1.48.49 2.22.95 2.68s1.2.72 2.68.95c-1.48.23-2.22.49-2.68.95s-.72 1.2-.95 2.68c-.23-1.48-.49-2.22-.95-2.68s-1.2-.72-2.68-.95c1.48-.23 2.22-.49 2.68-.95s.72-1.2.95-2.68Z"
        fill={`url(#${gradientId})`}
        opacity="0.88"
      />
    </svg>
  );
}

export function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M12 2.9a5.65 5.65 0 0 0-5.65 5.65c0 4.6 4.36 8.93 5.14 9.66a.73.73 0 0 0 1.02 0c.78-.73 5.14-5.06 5.14-9.66A5.65 5.65 0 0 0 12 2.9Z"
        fill="currentColor"
      />
      <circle cx="12" cy="8.55" r="2.08" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 20 4.1-.8L18.3 9a1.9 1.9 0 0 0 0-2.7l-.6-.6a1.9 1.9 0 0 0-2.7 0L4.8 15.9 4 20Z" />
      <path d="m13.7 7 3.3 3.3" />
    </svg>
  );
}

export function CameraIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 8.5h3l1.5-2h5L16 8.5h3A1.5 1.5 0 0 1 20.5 10v7A1.5 1.5 0 0 1 19 18.5H5A1.5 1.5 0 0 1 3.5 17v-7A1.5 1.5 0 0 1 5 8.5Z" />
      <circle cx="12" cy="13" r="3.1" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 7.5h15" />
      <path d="M9.5 4.5h5l.5 2.5h-6l.5-2.5Z" />
      <path d="M7.5 7.5 8.2 19h7.6l.7-11.5" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function MagicWandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4.5 19.5 9-9" />
      <path d="m12 4.5 1 2.5 2.5 1-2.5 1L12 11.5l-1-2.5-2.5-1 2.5-1 1-2.5Z" />
      <path d="m15.5 12.5 1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1 1.1-2.4Z" />
    </svg>
  );
}
