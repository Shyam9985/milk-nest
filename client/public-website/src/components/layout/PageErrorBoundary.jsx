import { Component } from "react";

/**
 * Catches a page that fails to render or to load (a broken lazy chunk after a deploy, a
 * runtime error inside one page) and shows `fallback` in its place, so the header and
 * footer stay usable instead of the whole site going blank. It resets when the route
 * changes, so navigating away and back retries the page.
 */
export default class PageErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("[page] failed to render:", error);
  }

  componentDidUpdate(previousProps) {
    if (this.state.failed && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ failed: false });
    }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
