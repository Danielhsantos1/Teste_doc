import clsx from "clsx";

interface WizardStepperProps {
  steps: string[];
  currentStep: number; // 0-indexed
}

export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  const percent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-gray-900">
          Etapa {currentStep + 1} de {steps.length}
        </span>
        <span className="text-muted">{percent}%</span>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-start justify-between">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center text-center">
            <div
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                i === currentStep
                  ? "bg-accent text-white"
                  : i < currentStep
                    ? "bg-accent/20 text-accent"
                    : "bg-gray-200 text-gray-500"
              )}
            >
              {i + 1}
            </div>
            <span
              className={clsx(
                "mt-2 max-w-[6.5rem] text-xs",
                i === currentStep ? "font-medium text-accent" : "text-muted"
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
