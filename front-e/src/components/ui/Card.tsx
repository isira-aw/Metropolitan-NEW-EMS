import { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

// Utility-class collisions (e.g. the default `bg-white` here vs. a page's
// `bg-[#0F172A]` override) are resolved by Tailwind's internal stylesheet
// order, not by position in the class string - so a "later" override can
// silently lose and render invisible text. Only fall back to a default when
// the caller hasn't specified that concern at all.
function withDefaults(className: string) {
  const has = (pattern: RegExp) => pattern.test(className);
  const defaults = [
    !has(/(^|\s)bg-/) && 'bg-white',
    !has(/(^|\s)rounded/) && 'rounded-lg',
    !has(/(^|\s)shadow/) && 'shadow-md',
    !has(/(^|\s)(p|px|py)-/) && 'p-6',
  ].filter(Boolean);
  return [...defaults, className].join(' ');
}

export default function Card({ children, className = '', title, onClick, style }: CardProps) {
  return (
    <div
      className={withDefaults(className)}
      onClick={onClick}
      style={style}
    >
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
}
