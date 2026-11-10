import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

function BaseSvg({ size = 18, className = '', children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconBus(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M8 6v6" />
      <path d="M15 6v6" />
      <path d="M2 12h19.6" />
      <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
      <circle cx="7" cy="18" r="2" />
      <path d="M9 18h5" />
      <circle cx="16" cy="18" r="2" />
    </BaseSvg>
  );
}

export function IconMapPin(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </BaseSvg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </BaseSvg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </BaseSvg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </BaseSvg>
  );
}

export function IconArrowLeftRight(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M8 3 4 7l4 4" />
      <path d="M4 7h16" />
      <path d="m16 21 4-4-4-4" />
      <path d="M20 17H4" />
    </BaseSvg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </BaseSvg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="m6 9 6 6 6-6" />
    </BaseSvg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="m9 18 6-6-6-6" />
    </BaseSvg>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="m15 18-6-6 6-6" />
    </BaseSvg>
  );
}

export function IconArrowUp(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="m18 15-6-6-6 6" />
    </BaseSvg>
  );
}

export function IconPhone(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </BaseSvg>
  );
}

export function IconMail(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </BaseSvg>
  );
}

export function IconShieldCheck(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </BaseSvg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </BaseSvg>
  );
}

export function IconTicket(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </BaseSvg>
  );
}

export function IconQrCode(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </BaseSvg>
  );
}

export function IconBarChart(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </BaseSvg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </BaseSvg>
  );
}

export function IconCheckCircle(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </BaseSvg>
  );
}

export function IconAlertTriangle(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </BaseSvg>
  );
}

export function IconXCircle(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </BaseSvg>
  );
}

export function IconUser(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </BaseSvg>
  );
}

export function IconCreditCard(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </BaseSvg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </BaseSvg>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </BaseSvg>
  );
}

export function IconMessageCircle(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </BaseSvg>
  );
}

export function IconHome(props: IconProps) {
  return (
    <BaseSvg {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </BaseSvg>
  );
}
