import { PreferencesProvider } from "./PreferencesProvider";
import { PublicStatsProvider } from "./PublicStatsProvider";
import { ThemeProvider } from "./ThemeProvider";

/**
 * Every context the page runs inside, in one place. Outer to inner: how the page
 * looks (theme, font size), then the data it shows.
 */
export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <PreferencesProvider>
        <PublicStatsProvider>{children}</PublicStatsProvider>
      </PreferencesProvider>
    </ThemeProvider>
  );
}
