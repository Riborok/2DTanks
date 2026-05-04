import React from 'react';

export type PlayFlowStepperScreen = 'tankSelection' | 'lobby' | 'game';

interface PlayFlowStepperProps {
    screen: PlayFlowStepperScreen;
    onBackToHub: () => void;
}

const STEPS = [
    { id: 'tank', label: 'Танк' },
    { id: 'lobby', label: 'Лобби' },
    { id: 'fight', label: 'Бой' }
] as const;

function stepIndex(screen: PlayFlowStepperScreen): number {
    if (screen === 'tankSelection') return 0;
    if (screen === 'lobby') return 1;
    return 2;
}

const PlayFlowStepper: React.FC<PlayFlowStepperProps> = ({ screen, onBackToHub }) => {
    const active = stepIndex(screen);

    return (
        <nav className="play-flow-stepper" aria-label="Этапы матча">
            <button type="button" className="play-flow-stepper-back" onClick={onBackToHub}>
                К комнатам
            </button>
            <ol className="play-flow-stepper-track">
                {STEPS.map((s, i) => (
                    <li
                        key={s.id}
                        className={`play-flow-step${i < active ? ' play-flow-step--done' : ''}${
                            i === active ? ' play-flow-step--active' : ''
                        }${i > active ? ' play-flow-step--todo' : ''}`}
                    >
                        <span className="play-flow-step-label">{s.label}</span>
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default PlayFlowStepper;
