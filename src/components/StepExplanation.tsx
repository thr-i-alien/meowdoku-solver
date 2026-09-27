import React from 'react';
import type { DeductionStep, RegionColor } from '../types/game';
import { CheckCircle2, Sparkles, AlertCircle, Compass, Layers } from 'lucide-react';
import { useI18n } from '../i18n';
import { ColoredText } from './ColoredText';

interface StepExplanationProps {
  currentStep?: DeductionStep;
  totalSteps: number;
  currentStepIndex: number;
  totalCatsTarget: number;
  isPureLogic: boolean;
  hasMultipleSolutions?: boolean;
  colors?: RegionColor[];
}

export const StepExplanation: React.FC<StepExplanationProps> = ({
  currentStep,
  totalSteps,
  currentStepIndex,
  totalCatsTarget,
  isPureLogic,
  hasMultipleSolutions,
  colors,
}) => {
  const { lang, t, interpolate } = useI18n();

  if (!currentStep) {
    return (
      <div className="explanation-card">
        <div className="step-badge-row">
          <span className="rule-badge">
            <Compass size={14} /> {t.solverPanel.stepReadyBadge}
          </span>
        </div>
        <h3 className="step-title">{t.solverPanel.stepReadyTitle}</h3>
        <p className="step-body">
          {t.solverPanel.stepReadyDesc}
        </p>
      </div>
    );
  }

  const getBadgeIcon = () => {
    switch (currentStep.ruleType) {
      case 'COMPLETED':
        return <CheckCircle2 size={14} color="#3b9e59" />;
      case 'BACKTRACK_SEARCH':
        return <AlertCircle size={14} color="#e47535" />;
      case 'SUBSET_COUNTING':
        return <Layers size={14} color="#6366f1" />;
      default:
        return <Sparkles size={14} />;
    }
  };

  const getRuleLabel = (ruleType: string) => {
    const rules = t.solverPanel.rules as Record<string, string>;
    return rules[ruleType] || ruleType;
  };

  const displayTitle = lang === 'en' && currentStep.titleEn ? currentStep.titleEn : currentStep.title;
  const displayExplanation =
    lang === 'en' && currentStep.explanationEn ? currentStep.explanationEn : currentStep.explanation;

  return (
    <div className="explanation-card">
      <div className="step-badge-row">
        <span className="rule-badge">
          {getBadgeIcon()} {getRuleLabel(currentStep.ruleType)}
        </span>
        <span className="step-counter">
          {interpolate(t.solverPanel.stepCounter, {
            current: currentStepIndex + 1,
            total: totalSteps,
          })}
        </span>
      </div>

      <h3 className="step-title">
        <ColoredText text={displayTitle} colors={colors} />
      </h3>

      <div className="step-body">
        <ColoredText text={displayExplanation} colors={colors} />
      </div>

      <div className="step-stats-bar">
        <div>
          {t.solverPanel.catsPlacedCount}{' '}
          <span style={{ color: 'var(--accent-orange)', fontSize: '1.05rem', fontWeight: 900 }}>
            {currentStep.catsCount}
          </span>{' '}
          / {totalCatsTarget} {t.solverPanel.catsTargetUnit}
        </div>
        <div>
          {t.solverPanel.logicQuality}{' '}
          <span style={{ color: isPureLogic ? '#2e7d32' : '#d97724', fontWeight: 800 }}>
            {isPureLogic ? t.solverPanel.pureLogic : t.solverPanel.heuristicLogic}
          </span>
        </div>
        {hasMultipleSolutions !== undefined && (
          <div>
            {t.solverPanel.solutionUniqueness}{' '}
            <span style={{ color: hasMultipleSolutions ? '#d97724' : '#2e7d32', fontWeight: 800 }}>
              {hasMultipleSolutions ? t.solverPanel.multipleSolutions : t.solverPanel.singleSolution}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

