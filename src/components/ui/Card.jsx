import { forwardRef } from 'react';

const Card = forwardRef(({ 
  children,
  title,
  subtitle,
  header,
  footer,
  variant = 'default',
  padding = 'default',
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  ...props 
}, ref) => {
  
  const variants = {
    default: "bg-white shadow-md border border-border",
    elevated: "bg-white shadow-lg border border-border",
    outlined: "bg-white border-2 border-border shadow-none",
    ghost: "bg-transparent shadow-none border-none",
    success: "bg-success/5 border border-success/20 shadow-sm",
    warning: "bg-warning/5 border border-warning/20 shadow-sm", 
    error: "bg-error/5 border border-error/20 shadow-sm",
    info: "bg-info/5 border border-info/20 shadow-sm"
  };
  
  const paddings = {
    none: "",
    sm: "p-4",
    default: "p-6",
    lg: "p-8"
  };
  
  const cardClasses = `
    ${variants[variant]}
    ${paddings[padding]}
    rounded-lg
    ${className}
  `.trim();
  
  const headerContent = header || (title || subtitle) ? (
    <div className={`border-b border-border pb-4 mb-6 ${headerClassName}`}>
      {title && (
        <h3 className="text-xl font-semibold text-text-primary">
          {title}
        </h3>
      )}
      {subtitle && (
        <p className="text-text-secondary mt-1">
          {subtitle}
        </p>
      )}
      {header && header}
    </div>
  ) : null;
  
  return (
    <div ref={ref} className={cardClasses} {...props}>
      {headerContent}
      
      <div className={bodyClassName}>
        {children}
      </div>
      
      {footer && (
        <div className={`border-t border-border pt-4 mt-6 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

// Sub-componentes para uso más flexible
Card.Header = ({ children, className = '' }) => (
  <div className={`border-b border-border pb-4 mb-6 ${className}`}>
    {children}
  </div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={className}>
    {children}
  </div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`border-t border-border pt-4 mt-6 ${className}`}>
    {children}
  </div>
);

Card.Title = ({ children, className = '' }) => (
  <h3 className={`text-xl font-semibold text-text-primary ${className}`}>
    {children}
  </h3>
);

Card.Subtitle = ({ children, className = '' }) => (
  <p className={`text-text-secondary ${className}`}>
    {children}
  </p>
);

export default Card;