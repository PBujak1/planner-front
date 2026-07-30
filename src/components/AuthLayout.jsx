import React from "react";
import "./styles/AuthLayout.css";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-icon">
                        <Icon aria-hidden="true" />
                    </div>

                    <h1>{title}</h1>

                    {subtitle && (
                        <p className="auth-subtitle">
                            {subtitle}
                        </p>
                    )}
                </div>

                <div className="auth-card">
                    {children}
                </div>

                {footer && (
                    <p className="auth-footer">
                        {footer}
                    </p>
                )}
            </div>
        </div>
    );
}