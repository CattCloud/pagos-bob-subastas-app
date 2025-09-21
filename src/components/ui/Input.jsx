import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label,
  error,
  helperText,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  className = '',
  containerClassName = '',
  ...props 
}, ref) => {
  
  const inputClasses = `
    w-full px-3 py-2 border rounded-md transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-0
    disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-tertiary
    ${error 
      ? 'border-error focus:border-error focus:ring-error/20 text-error' 
      : 'border-border focus:border-primary-500 focus:ring-primary-500/20 text-text-primary'
    }
    ${className}
  `.trim();
  
  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <p className="text-sm text-error flex items-center ">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-text-secondary">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;