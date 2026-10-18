export function Button({ href, variant = 'primary', className = '', children, ...props }) {
    const Element = href ? 'a' : 'button';

    return (
        <Element
            className={`button button--${variant} ${className}`}
            {...(href ? { href } : { type: 'button' })}
            {...props}
        >
            {children}
        </Element>
    );
}
