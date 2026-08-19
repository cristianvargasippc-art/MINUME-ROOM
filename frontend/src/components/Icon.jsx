import React from 'react';

/**
 * Set de iconos propio (SVG en línea, sin dependencias externas).
 * Trazo de 1.8 con `currentColor`, así heredan color y tamaño del contexto.
 */
const shapes = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  tasks: (
    <>
      <rect x="8" y="2" width="8" height="4" rx="1.2" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16.5h4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  menu: <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.2M12 19.8V22M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2 12h2.2M19.8 12H22M6.2 17.8l-1.6 1.6M19.4 4.6l-1.6 1.6" />
    </>
  ),
  moon: <path d="M21 12.9A9 9 0 1 1 11.1 3a7 7 0 0 0 9.9 9.9z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4.5" />
      <path d="m16 16.5 4.5-4.5L16 7.5" />
      <path d="M20.5 12H9" />
    </>
  ),
  chevronLeft: <path d="m14.5 18-6-6 6-6" />,
  chevronRight: <path d="m9.5 18 6-6-6-6" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M20 6.5 9.5 17 4 11.5" />,
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.3 12.4 2.6 2.6 4.8-5.4" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5" />
      <path d="m16.5 8 -4.5-4.5L7.5 8" />
      <path d="M12 3.5V16" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4.5" width="18" height="17" rx="2.2" />
      <path d="M16 2.5v4M8 2.5v4M3 10h18" />
    </>
  ),
  file: (
    <>
      <path d="M14 2.5H6.5a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z" />
      <path d="M14 2.5V8h5.5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4.5 12h15" />
      <path d="m13 5.5 6.5 6.5-6.5 6.5" />
    </>
  ),
  arrowLeft: (
    <>
      <path d="M19.5 12h-15" />
      <path d="m11 5.5-6.5 6.5L11 18.5" />
    </>
  ),
  user: (
    <>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H5.5a2 2 0 0 0-2 2v12.5a2 2 0 0 0 2 2H18a2 2 0 0 0 2-2V13" />
      <path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.3l3.2 2" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18.5 15.2l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2.5H20v19H6.5A2.5 2.5 0 0 1 4 19V5a2.5 2.5 0 0 1 2.5-2.5z" />
    </>
  ),
  video: (
    <>
      <path d="m22 8.5-5 3.5 5 3.5v-7z" />
      <rect x="2" y="6" width="13" height="12" rx="2.2" />
    </>
  ),
  message: (
    <path d="M21 11.6a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5A8.4 8.4 0 0 1 4 11.6 8.5 8.5 0 0 1 12.4 3 8.4 8.4 0 0 1 21 11.6z" />
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" />
    </>
  ),
  shield: <path d="M12 21.5s7.5-3.7 7.5-9.5V5.2L12 2.5 4.5 5.2v6.8c0 5.8 7.5 9.5 7.5 9.5z" />,
  chart: (
    <>
      <path d="M3.5 3.5v17h17" />
      <path d="m7.5 15 3.5-3.8 3 2.8 4.5-6" />
    </>
  ),
  trendUp: (
    <>
      <path d="m3.5 16.5 6-6 4 4 7-7.5" />
      <path d="M15.5 7h5v5" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
      <path d="M12 9.5v4M12 17.3h.01" />
    </>
  ),
  inbox: (
    <>
      <path d="M22 12.5h-5.5l-2 3h-5l-2-3H2" />
      <path d="M5.5 5.1 2 12.5V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.5l-3.5-7.4A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2.5 9 4.8-9 4.8-9-4.8 9-4.8z" />
      <path d="m3 12 9 4.8 9-4.8" />
      <path d="m3 16.7 9 4.8 9-4.8" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="8.5" r="5.5" />
      <path d="m8.4 13.6-1.1 7.9 4.7-2.8 4.7 2.8-1.1-7.9" />
    </>
  ),
  link: (
    <>
      <path d="M10.3 13.2a4.7 4.7 0 0 0 7.1.5l2.8-2.8a4.7 4.7 0 0 0-6.7-6.7l-1.6 1.6" />
      <path d="M13.7 10.8a4.7 4.7 0 0 0-7.1-.5l-2.8 2.8a4.7 4.7 0 0 0 6.7 6.7l1.6-1.6" />
    </>
  ),
  download: (
    <>
      <path d="M21 15.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5" />
      <path d="m7.5 11 4.5 4.5L16.5 11" />
      <path d="M12 15V3" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1z" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M10.7 6.2A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16.5 16.5 0 0 1-2.8 3.5" />
      <path d="M6.4 7.9A16.4 16.4 0 0 0 2.5 12s3.5 6 9.5 6a9.4 9.4 0 0 0 4-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </>
  ),
  building: (
    <>
      <path d="M4 21V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15" />
      <path d="M14 10h4a2 2 0 0 1 2 2v9" />
      <path d="M2 21h20M7.5 8h3M7.5 12h3M7.5 16h3M17 14.5h.01M17 18h.01" />
    </>
  )
};

const Icon = ({ name, size, className = '', title, ...rest }) => {
  const shape = shapes[name];

  if (!shape) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {shape}
    </svg>
  );
};

export default Icon;
