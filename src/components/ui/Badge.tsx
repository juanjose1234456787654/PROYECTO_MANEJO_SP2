import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'admin' | 'cooperativa' | 'oficinista' | 'usuario' | 'chofer' | 'success' | 'warning' | 'danger' | 'neutral';
}

export function Badge({
  className = '',
  variant = 'neutral',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    cooperativa: 'bg-blue-100 text-blue-800 border-blue-200',
    oficinista: 'bg-teal-100 text-teal-800 border-teal-200',
    usuario: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    chofer: 'bg-amber-100 text-amber-800 border-amber-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
