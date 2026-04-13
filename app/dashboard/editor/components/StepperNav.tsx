'use client';

const FONT = 'Montserrat, sans-serif';

export const STEPS = [
  { label: 'Choisir un modèle',        sub: 'Template · couleur · police' },
  { label: 'Importer mon CV',           sub: 'LinkedIn PDF ou formulaire' },
  { label: 'Vérifier mes informations', sub: 'Données · photo' },
  { label: 'Générer mon CV',            sub: 'Claude optimise pour les ATS' },
  { label: 'Prévisualiser',             sub: 'Aperçu final' },
  { label: 'Enregistrer / PDF',         sub: 'Sauvegarder · télécharger' },
];

interface Props {
  currentStep: number;
  onStepClick: (step: number) => void;
}

export function StepperNav({ currentStep, onStepClick }: Props) {
  return (
    <div style={{ padding: '20px 18px', fontFamily: FONT }}>
      {STEPS.map((s, i) => {
        const n = i + 1;
        const isActive = currentStep === n;
        const isDone = currentStep > n;

        return (
          <div
            key={n}
            style={{ display: 'flex', gap: 14, cursor: 'pointer' }}
            onClick={() => onStepClick(n)}
          >
            {/* Rond + connecteur */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                border: `2px solid ${isActive || isDone ? '#111' : '#ddd'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 900, fontFamily: FONT,
                color: isActive ? '#fff' : isDone ? '#111' : '#bbb',
                background: isActive ? '#111' : isDone ? '#F5C400' : '#fff',
                flexShrink: 0, transition: 'all .2s',
              }}>
                {isDone ? '✓' : n}
              </div>
              {n < 6 && (
                <div style={{
                  width: 2, flex: 1, minHeight: 32,
                  background: isDone ? '#111' : '#eee',
                  margin: '4px 0',
                }} />
              )}
            </div>

            {/* Label */}
            <div style={{ paddingBottom: n < 6 ? 22 : 0, flex: 1, paddingTop: 6 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 900,
                fontFamily: FONT,
                color: isActive ? '#111' : isDone ? '#111' : '#bbb',
                transition: 'color .2s',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}>
                {s.label}
              </div>
              {(isActive || isDone) && (
                <div style={{
                  fontSize: 11,
                  color: isActive ? '#666' : '#999',
                  fontFamily: FONT,
                  marginTop: 3,
                  fontWeight: 500,
                }}>
                  {s.sub}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}