interface Step {
  id: number;
  title: string;
  subtitle: string;
}

interface Props {
  steps: Step[];
  activeStep: number;
}

export function StepIndicator({ steps, activeStep }: Props) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {steps.map((step, i) => {
        const done = step.id < activeStep;
        const active = step.id === activeStep;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold
                  transition-all duration-300
                  ${done ? 'bg-purple-500 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900' : ''}
                  ${active ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200 dark:shadow-purple-900 scale-110' : ''}
                  ${!done && !active ? 'border-2 border-gray-300 text-gray-400 dark:border-gray-600' : ''}
                `}
              >
                {done ? '✓' : step.id}
              </div>
              <div className="mt-1.5 text-center">
                <p className={`text-xs font-semibold ${active ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}>
                  {step.title}
                </p>
                <p className="hidden text-[10px] text-gray-400 sm:block">{step.subtitle}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-0.5 w-8 sm:w-16 transition-all duration-500 ${done ? 'bg-purple-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
