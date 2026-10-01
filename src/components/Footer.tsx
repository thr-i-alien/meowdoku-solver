import React from 'react';
import { ExternalLink } from 'lucide-react';
import { GithubIcon, CatIcon } from './icons';
import { useI18n } from '../i18n';

export const Footer: React.FC = () => {
  const { t } = useI18n();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-brand-meta">
          <div className="footer-brand-title">
            <CatIcon size={16} />
            <span>Meowdoku Solver</span>
          </div>
          <span className="footer-divider">•</span>
          <span className="footer-note">{t.footer.madeWithLove}</span>
        </div>

        <div className="footer-links">
          <a
            href="https://github.com/thr-i-alien/meowdoku-solver"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-github-btn"
            title={t.footer.githubRepo}
            aria-label="GitHub Repository: thr-i-alien/meowdoku-solver"
          >
            <GithubIcon size={18} />
            <span className="footer-github-text">thr-i-alien/meowdoku-solver</span>
            <ExternalLink size={13} className="footer-ext-icon" />
          </a>
        </div>
      </div>
    </footer>
  );
};
