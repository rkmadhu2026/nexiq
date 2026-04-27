import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("NexIQ render error", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="error-shell">
        <section className="error-card">
          <div className="brand-mark">NQ</div>
          <p>Workspace interrupted</p>
          <h1>NexIQ hit an unexpected UI error.</h1>
          <span>
            Your session is still safe. Reload the workspace to recover, or sign out and start a fresh demo session.
          </span>
          <button type="button" onClick={this.handleReload}>Reload workspace</button>
        </section>
      </main>
    );
  }
}
