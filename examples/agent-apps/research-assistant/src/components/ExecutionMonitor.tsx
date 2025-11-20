/**
 * Execution Monitor Component
 */

'use client';

import { useState, useEffect } from 'react';

export function ExecutionMonitor() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepName, setStepName] = useState('Initializing...');

  const steps = [
    'Web Search',
    'Content Analysis',
    'Section Generation',
    'Citation Generation',
    'Summary Generation',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev >= 5 ? 5 : prev + 1;
        setStepName(steps[next - 1] || 'Completing...');
        return next;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Execution Progress</h3>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-blue-500 text-white animate-pulse' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-600' : ''}
                `}
              >
                {isCompleted ? '✓' : stepNumber}
              </div>
              <div className="flex-1">
                <p
                  className={`
                    font-medium
                    ${isCurrent ? 'text-blue-600' : ''}
                    ${isCompleted ? 'text-green-600' : ''}
                    ${!isCompleted && !isCurrent ? 'text-gray-400' : ''}
                  `}
                >
                  {step}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{Math.round((currentStep / 5) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
