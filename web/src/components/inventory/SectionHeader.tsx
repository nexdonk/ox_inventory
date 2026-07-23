import React from 'react';
import { LuScale } from 'react-icons/lu';

interface Props {
  icon?: React.ReactNode;
  tone?: string;
  title: string;
  subtitle?: string;
  weight?: { current: number; max: number };
}

const SectionHeader: React.FC<Props> = ({ icon, tone, title, subtitle, weight }) => {
  const headerClass = 'section-header' + (tone ? ` section-header--${tone}` : '');
  const iconClass = 'section-header-icon' + (tone ? ` section-header-icon--${tone}` : '');

  return (
    <div className={headerClass}>
      <div className="section-header-left">
        {icon && <span className={iconClass}>{icon}</span>}
        <div className="section-header-text">
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {weight && (
        <div className="section-header-right">
          <div className="section-header-weight">
            <span className="weight-label">Weight</span>
            <span className="weight-row">
              <span className="weight-num">{(weight.current / 1000).toFixed(3)}</span>
              <span className="dim">/</span>
              <span className="weight-num">{(weight.max / 1000).toFixed(0)}kg</span>
            </span>
          </div>
          <div className="section-header-badge" title="Weight">
            <LuScale size={12} strokeWidth={2.2} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
