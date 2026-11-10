import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'admin'
    | 'cooperativa'
    | 'oficinista'
    | 'usuario'
    | 'chofer'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral';
}

export function Badge({
  className = '',
  variant = 'neutral',
  children,
  ...props
}: BadgeProps) {
  // Roles: marca y neutros. Estados: solo colores semánticos, iguales en todo el sitio.
  const variants = {
    admin: 'bg-brand-100 text-brand-800 border-brand-200',
    cooperativa: 'bg-neutral-100 text-neutral-800 border-neutral-300',
    oficinista: 'bg-accent-100 text-accent-800 border-accent-200',
    usuario: 'bg-white text-neutral-700 border-neutral-300',
    chofer: 'bg-neutral-900 text-white border-neutral-800',
    success: 'bg-success-50 text-success-800 border-success-200',
    warning: 'bg-warning-50 text-warning-800 border-warning-200',
    danger: 'bg-danger-50 text-danger-800 border-danger-200',
    info: 'bg-info-50 text-info-800 border-info-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
