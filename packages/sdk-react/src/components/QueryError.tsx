import React from 'react';

interface QueryErrorProps {
  message?: string;
  onRetry?: () => void;
}

export const QueryError: React.FC<QueryErrorProps> = ({
  message = 'Failed to load analytical dataset',
  onRetry,
}) => {
  return (
    <div className="card query-error-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div className="error-icon-circle">!</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f87171' }}>
            Query Execution Failure
          </div>
          <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.2rem' }}>
            {message}
          </div>
        </div>
        {onRetry && (
          <button type="button" className="action-btn" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
};
