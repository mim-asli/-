import React from 'react';

interface ChoiceButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const ChoiceButton: React.FC<ChoiceButtonProps> = ({ children, onClick, disabled, className, style }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group text-lg font-bold text-[var(--color-text-secondary)] transition-all duration-300
        focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
        hover:enabled:scale-[1.03] hover:enabled:text-[var(--color-text-primary)]
        ${className || ''}
      `}
      style={style}
    >
      <div className="choice-button-content">
        <div className="choice-button-inner-bg px-6 py-3">
          <span className="relative z-10 transition-all group-hover:enabled:text-shadow-[0_0_8px_var(--color-text-primary)]">
            {children}
          </span>
        </div>
      </div>
    </button>
  );
};

export default ChoiceButton;