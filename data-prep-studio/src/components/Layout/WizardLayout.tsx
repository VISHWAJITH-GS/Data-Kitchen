import React, { ReactNode } from 'react';
import './WizardLayout.css';

interface WizardLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
}

export function WizardLayout({ sidebar, content }: WizardLayoutProps) {
  return (
    <div className="wizard-layout">
      <div className="wizard-sidebar">
        {sidebar}
      </div>
      <div className="wizard-content">
        {content}
      </div>
    </div>
  );
}
