import { forwardRef } from 'react';

const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  ...props 
}, ref) => {
  
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500",
    secondary: "bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500", 
    success: "bg-success hover:bg-success/80 text-white focus:ring-success",
    warning: "bg-warning hover:bg-warning/80 text-white focus:ring-warning",
    error: "bg-error hover:bg-error/80 text-white focus:ring-error",
    outline: "border border-border hover:bg-bg-tertiary text-text-primary focus:ring-primary-500",
    ghost: "hover:bg-bg-tertiary text-text-primary focus:ring-primary-500",
    link: "text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline focus:ring-primary-500"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-md",
    md: "px-4 py-2 text-sm rounded-md", 
    lg: "px-6 py-3 text-base rounded-md",
    xl: "px-8 py-4 text-lg rounded-lg"
  };
  
  const buttonClasses = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${loading ? 'cursor-wait' : ''}
    ${className}
  `.trim();
  
  return (
    <button 
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClasses}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;