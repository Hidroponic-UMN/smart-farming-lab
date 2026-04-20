"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  content: ReactNode;
  /** If true, the "Next" button is disabled until this step is explicitly completed */
  requiresAction?: boolean;
  /** Controlled by parent: whether this step's action is completed */
  actionCompleted?: boolean;
}

interface CalibrationWizardProps {
  title: string;
  subtitle: string;
  steps: WizardStep[];
  onComplete: () => void;
  onCancel: () => void;
  /** Accent color for the wizard (CSS color) */
  accentColor?: string;
}

export function CalibrationWizard({
  title,
  subtitle,
  steps,
  onComplete,
  onCancel,
  accentColor = "#10b981",
}: CalibrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const canProceed = step.requiresAction ? step.actionCompleted : true;

  function handleNext() {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Cancel
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {steps.map((s, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;

            return (
              <div key={s.id} className="flex items-center gap-2 flex-1">
                {/* Step indicator */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      transition-all duration-300
                      ${
                        isCompleted
                          ? "text-white shadow-lg"
                          : isActive
                          ? "border-2 text-white shadow-lg"
                          : "bg-muted text-muted-foreground border border-border"
                      }
                    `}
                    style={{
                      backgroundColor: isCompleted || isActive ? accentColor : undefined,
                      borderColor: isActive ? accentColor : undefined,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:inline transition-colors ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>

                {/* Connector line */}
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-0.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: isCompleted ? "100%" : "0%",
                        backgroundColor: accentColor,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: accentColor }}>{step.icon}</span>
            <h3 className="text-lg font-semibold text-foreground">
              {step.title}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">{step.description}</p>
        </div>

        {/* Step-specific content */}
        <div className="mt-6">{step.content}</div>
      </div>

      {/* Footer Navigation */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Step {currentStep + 1} of {steps.length}
          </Badge>
          {step.requiresAction && !step.actionCompleted && (
            <Badge
              variant="outline"
              className="text-xs text-amber-500 border-amber-500/30 bg-amber-500/10"
            >
              Action required
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleNext}
            disabled={!canProceed}
            className="text-white shadow-lg transition-all"
            style={{
              backgroundColor: canProceed ? accentColor : undefined,
            }}
          >
            {isLastStep ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Save Calibration
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
