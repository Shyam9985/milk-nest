// runs before every test file (wired up via vite.config.js -> test.setupFiles).
// adds the dom matchers: toBeInTheDocument, toHaveValue, toBeDisabled and friends
import '@testing-library/jest-dom';
