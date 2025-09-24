import React from 'react';
import { clsx } from 'clsx';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
  onDismiss?: () => void;
}

/**
 * Alert component for displaying messages, errors, and notifications
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  className,
  onDismiss,
}) => {
  const variantConfig = {
    success: {
      icon: CheckCircle,
      classes: 'bg-green-50 border-green-200 text-green-800',
      iconClasses: 'text-green-500',
    },
    error: {
      icon: XCircle,
      classes: 'bg-red-50 border-red-200 text-red-800',
      iconClasses: 'text-red-500',
    },
    warning: {
      icon: AlertCircle,
      classes: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      iconClasses: 'text-yellow-500',
    },
    info: {
      icon: Info,
      classes: 'bg-blue-50 border-blue-200 text-blue-800',
      iconClasses: 'text-blue-500',
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className={clsx(
      'border rounded-md p-4 flex items-start gap-3',
      config.classes,
      className
    )}>
      <Icon className={clsx('h-5 w-5 flex-shrink-0 mt-0.5', config.iconClasses)} />
      <div className="flex-1 text-sm">{children}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
