import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../providers/ThemeProvider";
import { ControlButton, ControlGroup } from "./ControlGroup";

/**
 * Sun / moon switch - the same two-button control the web-admin header uses.
 * `className` sets how it is displayed (and so where it is hidden): the header passes
 * "hidden sm:inline-flex" to keep it off phones, where it lives in the menu instead.
 */
export default function ThemeSwitch({ className }) {
  const { theme, setLightTheme, setDarkTheme } = useTheme();

  return (
    <ControlGroup label="Colour theme" className={className}>
      <ControlButton label="Light theme" active={theme === "light"} onClick={setLightTheme}>
        <Sun className="size-4.5" />
      </ControlButton>
      <ControlButton label="Dark theme" active={theme === "dark"} onClick={setDarkTheme}>
        <Moon className="size-4.5" />
      </ControlButton>
    </ControlGroup>
  );
}
