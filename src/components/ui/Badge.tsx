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
    admin: 'bg-red-100 text-red-800 border-red-200',
    cooperativa: 'bg-rose-100 text-rose-800 border-rose-200',
    oficinista: 'bg-amber-100 text-amber-800 border-amber-200',
    usuario: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    chofer: 'bg-zinc-900 text-white border-zinc-800',
    success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
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
