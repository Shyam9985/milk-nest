import { usePreferences } from "../../providers/PreferencesProvider";
import { ControlButton, ControlGroup } from "./ControlGroup";

/**
 * A- / A / A+ : the text-size control, mirroring the web-admin header. The middle
 * button returns to the design size and is highlighted while that is in use.
 */
export default function FontScaleSwitch({ className }) {
  const {
    increaseFontScale,
    decreaseFontScale,
    resetFontScale,
    canIncreaseFontScale,
    canDecreaseFontScale,
    isDefaultFontScale,
  } = usePreferences();

  return (
    <ControlGroup label="Text size" className={className}>
      <ControlButton label="Smaller text" disabled={!canDecreaseFontScale} onClick={decreaseFontScale}>
        A<span className="text-[0.6em]">−</span>
      </ControlButton>
      <ControlButton label="Default text size" active={isDefaultFontScale} onClick={resetFontScale}>
        A
      </ControlButton>
      <ControlButton label="Larger text" disabled={!canIncreaseFontScale} onClick={increaseFontScale}>
        A<span className="text-[0.6em]">+</span>
      </ControlButton>
    </ControlGroup>
  );
}
