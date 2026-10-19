import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = '100%',
  height = '1rem',
  borderRadius = '0.375rem',
}) => {
  return (
    <div
      className={`loomina-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
      }}
    />
  );
};

export const KpiCardSkeleton: React.FC = () => {
  return (
    <div className="card skeleton-card">
      <Skeleton width="45%" height="0.8rem" borderRadius="4px" />
      <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
        <Skeleton width="65%" height="1.8rem" borderRadius="6px" />
      </div>
      <Skeleton width="35%" height="0.75rem" borderRadius="4px" />
    </div>
  );
};

export const ChartSkeleton: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => {
  return (
    <div className="card skeleton-card">
      <div className="card-header">
        <div>
          <span className="card-title">{title}</span>
          {subtitle && <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.15rem' }}>{subtitle}</p>}
        </div>
        <Skeleton width="60px" height="0.8rem" borderRadius="4px" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '240px', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', height: '140px', width: '85%' }}>
          <Skeleton width="18%" height="45%" borderRadius="4px 4px 0 0" />
          <Skeleton width="18%" height="70%" borderRadius="4px 4px 0 0" />
          <Skeleton width="18%" height="90%" borderRadius="4px 4px 0 0" />
          <Skeleton width="18%" height="60%" borderRadius="4px 4px 0 0" />
          <Skeleton width="18%" height="80%" borderRadius="4px 4px 0 0" />
        </div>
        <Skeleton width="85%" height="2px" borderRadius="1px" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="card skeleton-card">
      <div className="card-header">
        <Skeleton width="30%" height="1rem" borderRadius="4px" />
        <Skeleton width="80px" height="1.75rem" borderRadius="4px" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '1rem' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Skeleton width="30%" height="1.1rem" borderRadius="4px" />
            <Skeleton width="15%" height="1.1rem" borderRadius="4px" />
            <Skeleton width="15%" height="1.1rem" borderRadius="4px" />
            <Skeleton width="20%" height="1.1rem" borderRadius="4px" />
            <Skeleton width="20%" height="1.1rem" borderRadius="4px" />
          </div>
        ))}
      </div>
    </div>
  );
};
