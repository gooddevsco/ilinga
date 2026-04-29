import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';

function Marketing() {
  return (
    <main>
      <h1>Ilinga</h1>
      <p>Venture-cycle synthesis for early-stage operators.</p>
      <nav>
        <ul>
          <li>
            <Link to="/pricing">Pricing</Link>
          </li>
          <li>
            <Link to="/help">Help</Link>
          </li>
          <li>
            <Link to="/legal/terms">Terms</Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}

function Pricing() {
  return (
    <main>
      <h1>Pricing</h1>
      <p>Free, Studio, Pro, Firm, Enterprise.</p>
      <Link to="/">Back home</Link>
    </main>
  );
}

function Help() {
  return (
    <main>
      <h1>Help</h1>
      <p>Documentation lands in Phase 4.</p>
      <Link to="/">Back home</Link>
    </main>
  );
}

function Legal() {
  return (
    <main>
      <h1>Terms of service</h1>
      <p>Placeholder — fully written in Phase 4.</p>
      <Link to="/">Back home</Link>
    </main>
  );
}

function NotFound() {
  return (
    <main data-testid="not-found">
      <h1>404</h1>
      <p>Route not found.</p>
      <Link to="/">Back home</Link>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Marketing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/help" element={<Help />} />
        <Route path="/legal/terms" element={<Legal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
