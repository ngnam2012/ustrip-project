import { Link } from 'react-router-dom';

export function LogoMark({ size = 40, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#logo-grad)" />
      {/* Stylized airplane */}
      <path
        d="M34.5 14.5L20 22l-6-2.5L12 21l6 3.5 3.5 6 1.5-2L20.5 22l12-5.5c1-.5 2.5.5 2 1.5l-8 16.5-2 1-1.5-4.5-5-3-1 2 4 2.5 1.5 5c.3.8 1.2 1.2 2 .8l3.5-2 9.5-19.5c.8-1.5-.5-3.5-2.5-2.8z"
        fill="white"
        opacity="0.95"
      />
      {/* Globe arc lines */}
      <path
        d="M10 32c2-1 4.5-1.5 7-1"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M10 35.5c1.5-.8 3.5-1.2 5.5-.8"
        stroke="white"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  );
}

export function Logo({ size = 40, to = '/app', className = '' }) {
  return (
    <Link to={to} className={`flex items-center gap-2.5 text-xl font-extrabold text-travel no-underline transition-opacity hover:opacity-80 ${className}`}>
      <LogoMark size={size} />
      <span className="tracking-tight">UsTrip</span>
    </Link>
  );
}

export function LogoFull({ size = 44, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 text-xl font-extrabold text-travel ${className}`}>
      <LogoMark size={size} />
      <span className="tracking-tight">UsTrip</span>
    </div>
  );
}

export function LogoWhite({ size = 40, to, className = '' }) {
  const content = (
    <>
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="14" fill="rgba(255,255,255,0.15)" />
        <path
          d="M34.5 14.5L20 22l-6-2.5L12 21l6 3.5 3.5 6 1.5-2L20.5 22l12-5.5c1-.5 2.5.5 2 1.5l-8 16.5-2 1-1.5-4.5-5-3-1 2 4 2.5 1.5 5c.3.8 1.2 1.2 2 .8l3.5-2 9.5-19.5c.8-1.5-.5-3.5-2.5-2.8z"
          fill="white"
          opacity="0.95"
        />
        <path d="M10 32c2-1 4.5-1.5 7-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <path d="M10 35.5c1.5-.8 3.5-1.2 5.5-.8" stroke="white" strokeWidth="1.2" strokeLinecap="round" opacity="0.25" />
      </svg>
      <span className="tracking-tight">UsTrip</span>
    </>
  );

  if (to) {
    return <Link to={to} className={`flex items-center gap-2.5 text-2xl font-extrabold text-white no-underline transition-opacity hover:opacity-80 ${className}`}>{content}</Link>;
  }
  return <div className={`flex items-center gap-2.5 text-2xl font-extrabold text-white ${className}`}>{content}</div>;
}
