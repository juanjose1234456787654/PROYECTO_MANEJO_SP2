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
    | 'neutral';
}

export function Badge({
  className = '',
  variant = 'neutral',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    admin: 'bg-brand-50 text-brand-800 border-brand-200',
    cooperativa: 'bg-zinc-100 text-zinc-800 border-zinc-300',
    oficinista: 'bg-amber-50 text-amber-800 border-amber-200',
    usuario: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    chofer: 'bg-zinc-900 text-white border-zinc-800',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-red-800 border-red-200',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
