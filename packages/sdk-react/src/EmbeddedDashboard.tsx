import React, { useRef, useEffect } from 'react';
import type { ThemeConfig } from '@loomina/shared';

export interface EmbeddedDashboardProps {
  token: string;
  dashboardId?: string;
  apiHost?: string;
  theme?: ThemeConfig;
  allowCustomization?: boolean;
  className?: string;
  onActionTriggered?: (actionId: string, payload: unknown) => void;
}

export const EmbeddedDashboard: React.FC<EmbeddedDashboardProps> = ({
  token,
  dashboardId: _dashboardId,
  apiHost: _apiHost = 'http://localhost:4000',
  theme,
  allowCustomization: _allowCustomization = false,
  className = '',
  onActionTriggered: _onActionTriggered,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!shadowRootRef.current) {
      shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' });
    }

    const shadow = shadowRootRef.current;
    const isDark = theme?.mode !== 'light';

    const styles = `
      :host {
        display: block;
        width: 100%;
        min-height: 400px;
        font-family: ${theme?.fontFamily || 'Inter, -apple-system, sans-serif'};
        background-color: ${theme?.colors?.background || (isDark ? '#09090b' : '#ffffff')};
        color: ${theme?.colors?.textPrimary || (isDark ? '#fafafa' : '#09090b')};
      }
      .loomina-card {
        background: ${theme?.colors?.surface || (isDark ? '#18181b' : '#f4f4f5')};
        border: 1px solid ${theme?.colors?.surfaceBorder || (isDark ? '#27272a' : '#e4e4e7')};
        border-radius: ${theme?.radius || '0.75rem'};
        padding: 1.25rem;
      }
      .loomina-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .loomina-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
      }
      .loomina-badge {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 9999px;
        background: ${theme?.colors?.primary || '#6366f1'};
        color: #ffffff;
      }
    `;

    shadow.innerHTML = `
      <style>${styles}</style>
      <div class="loomina-card">
        <div class="loomina-header">
          <h2 class="loomina-title">Interactive Analytics</h2>
          <span class="loomina-badge">Sub-50ms</span>
        </div>
        <p style="font-size: 0.875rem; color: ${isDark ? '#a1a1aa' : '#71717a'}; margin: 0;">
          Ready to render Apache ECharts inside Shadow DOM.
        </p>
      </div>
    `;
  }, [theme, token]);

  return <div ref={containerRef} className={`loomina-embed-container ${className}`} />;
};
