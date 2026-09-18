import { Component } from "react";
import { Button, ErrorState } from "./ui.jsx";

/**
 * Equivalent of Next's app/(app)/error.tsx — a render-time throw anywhere
 * below here shows this instead of a blank page. React still has no hook
 * form of this, so it stays a class component.
 */
export class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[route]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="py-12">
          <ErrorState
            title="This page didn't load"
            description={
              import.meta.env.DEV
                ? this.state.error.message
                : "Something broke on our side. Try again in a moment."
            }
            action={<Button onClick={this.reset}>Try again</Button>}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
