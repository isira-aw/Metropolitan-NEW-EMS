import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

export default function Card({ children, className = '', title, onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 ${className}`}
      onClick={onClick}
    >
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
}
