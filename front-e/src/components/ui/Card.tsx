import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  headerRight?: ReactNode;
}

export default function Card({
  children,
  className = '',
  title,
  onClick,
  headerRight
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white
        rounded-xl
        border border-gray-200
        shadow-sm
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
    >
      {/* Header */}
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-6 py-4 border-b">
          {title && (
            <h3 className="text-base font-semibold text-gray-800">
              {title}
            </h3>
          )}
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}

      {/* Body */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
