// First-mission tutorial steps and one-shot contextual hints, rendered as
// small dismissible toasts over the HUD. The stack takes no pointer events
// except on its own buttons, never pauses the sim, and every printed key
// comes from the live binding table, so remaps rename the prompts.
import { HINTS, TUTORIAL_STEPS, bindingKeys, currentStep } from '../game/tutorial'
import { useTutorialStore } from '../state/tutorialStore'
import { uiClick } from './sound'

export default function TutorialToasts() {
  const seen = useTutorialStore((s) => s.seen)
  const hints = useTutorialStore((s) => s.hints)
  const dismissStep = useTutorialStore((s) => s.dismissStep)
  const skipTutorial = useTutorialStore((s) => s.skipTutorial)
  const dismissHint = useTutorialStore((s) => s.dismissHint)

  const step = currentStep(seen)
  if (!step && hints.length === 0) return null
  const stepNo = step ? TUTORIAL_STEPS.indexOf(step) + 1 : 0

  return (
    <div className="hud-toasts">
      {step && (
        <div className="hud-toast corners" role="status">
          <div className="hud-toast-head">
            <b>
              TUTORIAL {stepNo}/{TUTORIAL_STEPS.length} // {step.title}
            </b>
            <span className="hud-toast-ctl">
              <button
                type="button"
                className="hud-toast-btn"
                aria-label="Skip the whole tutorial"
                onClick={() => {
                  uiClick()
                  skipTutorial()
                }}
              >
                SKIP TUTORIAL
              </button>
              <button
                type="button"
                className="hud-toast-btn"
                aria-label={'Dismiss tutorial step ' + step.title}
                onClick={() => {
                  uiClick()
                  dismissStep(step.id)
                }}
              >
                X
              </button>
            </span>
          </div>
          <div className="hud-toast-body">{step.body(bindingKeys)}</div>
        </div>
      )}
      {hints.map((id) => (
        <div key={id} className="hud-toast hint corners" role="status">
          <div className="hud-toast-head">
            <b>ADVISORY // {HINTS[id].title}</b>
            <span className="hud-toast-ctl">
              <button
                type="button"
                className="hud-toast-btn"
                aria-label={'Dismiss advisory ' + HINTS[id].title}
                onClick={() => {
                  uiClick()
                  dismissHint(id)
                }}
              >
                X
              </button>
            </span>
          </div>
          <div className="hud-toast-body">{HINTS[id].body(bindingKeys)}</div>
        </div>
      ))}
    </div>
  )
}
