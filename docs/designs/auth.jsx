/* global React, I, useApp */
const { I, Icon, CLUSTERS, REPORTS, ACTIVITY, AppCtx, AppProvider, useApp } = window;
const { useState, useEffect, useMemo, useRef, createContext, useContext, Fragment } = React;

// ----- Shared brand mark for auth screens -----
function BrandMark({ size = 22 }) {
  const { setRoute } = useApp();
  return (
    <a
      onClick={() => setRoute('landing')}
      style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
    >
      <span style={{ color: 'var(--signal)' }}>{I.logo(size)}</span>
      <span
        style={{
          fontFamily: 'var(--serif)',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          fontSize: 18,
          color: 'var(--ink)',
        }}
      >
        Ilinga
      </span>
    </a>
  );
}

// ----- Decorative side panel — Adinkra-inspired ornament -----
function AuthArt({ caption, sub }) {
  return (
    <div className="auth-art-pane r-mobile-hide">
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
      {/* Decorative SVG */}
      <svg
        viewBox="0 0 600 800"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <pattern id="dots" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="rgba(31,27,22,0.18)" />
          </pattern>
        </defs>
        <rect width="600" height="800" fill="url(#dots)" />
        {/* Adinkra-inspired Gye Nyame mark, abstracted */}
        <g
          transform="translate(300,360)"
          stroke="#B8531C"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        >
          <circle r="160" />
          <path d="M -120 -10 q 0 -90 80 -90 t 80 90" />
          <path d="M -120 10 q 0 90 80 90 t 80 -90" />
          <circle r="6" fill="#B8531C" />
          <circle r="92" strokeDasharray="4 8" opacity="0.6" />
        </g>
        {/* Bottom geometry — kente-inspired bands */}
        <g transform="translate(0,640)">
          <rect width="600" height="6" y="0" fill="#B8531C" />
          <rect width="600" height="2" y="14" fill="#284B63" />
          <rect width="600" height="10" y="22" fill="#C58A2C" />
          <rect width="600" height="2" y="40" fill="#5B7A3A" />
          <rect width="600" height="4" y="48" fill="#B8531C" opacity="0.5" />
        </g>
        {/* Corner mark */}
        <g transform="translate(56,80)" fill="#1F1B16">
          <text
            fontFamily="JetBrains Mono, monospace"
            fontSize="11"
            letterSpacing="3"
            opacity="0.55"
          >
            ILINGA · STUDIO
          </text>
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 56, right: 56, bottom: 88, color: 'var(--ink)' }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          FROM ILINGA
        </div>
        <div
          className="serif"
          style={{
            fontSize: 28,
            lineHeight: 1.18,
            letterSpacing: '-0.01em',
            maxWidth: 380,
            fontWeight: 500,
          }}
        >
          {caption}
        </div>
        {sub && (
          <div style={{ marginTop: 14, color: 'var(--ink-mute)', fontSize: 13, maxWidth: 380 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SIGN IN — email + (magic link OR password) → optional OTP
// ============================================================
function SignIn() {
  const { setRoute, toast } = useApp();
  const [step, setStep] = useState(0); // 0 method, 1 password OR OTP, 2 sent confirmation
  const [mode, setMode] = useState('magic'); // magic | password
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [err, setErr] = useState('');
  const otpRefs = useRef([]);

  const submitEmail = (e) => {
    e && e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Use your work email.');
      return;
    }
    setErr('');
    if (mode === 'magic') setStep(2);
    else setStep(1);
  };
  const submitPassword = () => {
    if (pw.length < 4) {
      setErr('Password too short.');
      return;
    }
    setErr('');
    // simulate trusted-device step
    setStep(3);
  };
  const submitOtp = () => {
    if (otp.join('').length < 6) {
      setErr('Enter all 6 digits.');
      return;
    }
    toast('Welcome back, Ada.');
    setRoute('app');
  };
  const onOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const onOtpChange = (i, v) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    const next = [...otp];
    next[i] = d;
    setOtp(next);
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const onOtpPaste = (e) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t.length) {
      setOtp(t.padEnd(6, '').split('').slice(0, 6));
      otpRefs.current[Math.min(t.length, 5)]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="auth-split">
      <div className="auth-form-pane">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandMark />
          <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
            New here?{' '}
            <a
              onClick={() => setRoute('signup')}
              style={{ color: 'var(--signal)', cursor: 'pointer', fontWeight: 500 }}
            >
              Create a workspace
            </a>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 440,
            width: '100%',
            margin: '0 auto',
            padding: '40px 0',
          }}
        >
          {step === 0 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div>
                <div className="eyebrow">SIGN IN</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 40,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '10px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Welcome back.
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
                  Sign in to continue your venture.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn lg" style={{ flex: 1, justifyContent: 'center' }}>
                  {I.google} Google
                </button>
                <button className="btn lg" style={{ flex: 1, justifyContent: 'center' }}>
                  {I.lock} SSO
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  color: 'var(--ink-faint)',
                  fontSize: 11,
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.10em',
                }}
              >
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} /> OR EMAIL{' '}
                <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
              </div>

              <form
                onSubmit={submitEmail}
                style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div>
                  <label className="field-label">Work email</label>
                  <input
                    className={`input lg ${err ? 'shake' : ''}`}
                    placeholder="ada@northwind.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                  />
                  {err && (
                    <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{err}</div>
                  )}
                </div>

                {/* method toggle */}
                <div
                  className="card"
                  style={{ padding: 4, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}
                >
                  {[
                    { id: 'magic', l: 'Magic link', d: 'one-tap from your inbox' },
                    { id: 'password', l: 'Password', d: 'classic + 2FA prompt' },
                  ].map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 6,
                        textAlign: 'left',
                        background: mode === m.id ? 'var(--paper-2)' : 'transparent',
                        border: mode === m.id ? '1px solid var(--line-2)' : '1px solid transparent',
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{m.l}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                        {m.d}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="btn primary lg"
                  style={{ justifyContent: 'center', marginTop: 4 }}
                >
                  {mode === 'magic' ? 'Email me a link' : 'Continue'} {I.arrow}
                </button>
              </form>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                }}
              >
                <a onClick={() => setRoute('forgot')} style={{ cursor: 'pointer' }}>
                  Forgot password?
                </a>
                <a onClick={() => setRoute('forgot')} style={{ cursor: 'pointer' }}>
                  Use a recovery code
                </a>
              </div>
            </div>
          )}

          {/* Password step */}
          {step === 1 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <button
                className="btn sm ghost"
                style={{ alignSelf: 'flex-start', marginLeft: -8 }}
                onClick={() => setStep(0)}
              >
                {I.arrowLeft} Back
              </button>
              <div>
                <div className="eyebrow">PASSWORD</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 36,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '8px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Enter your password.
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0, fontSize: 13 }}>
                  Signing in as{' '}
                  <span className="mono" style={{ color: 'var(--ink)' }}>
                    {email}
                  </span>
                </p>
              </div>
              <div>
                <label className="field-label">Password</label>
                <input
                  className={`input lg ${err ? 'shake' : ''}`}
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoFocus
                />
                {err && (
                  <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{err}</div>
                )}
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <a
                    onClick={() => setRoute('forgot')}
                    style={{ color: 'var(--signal)', cursor: 'pointer' }}
                  >
                    Forgot password?
                  </a>
                </div>
              </div>
              <button
                className="btn primary lg"
                style={{ justifyContent: 'center' }}
                onClick={submitPassword}
              >
                Continue {I.arrow}
              </button>
            </div>
          )}

          {/* Magic-link sent confirmation */}
          {step === 2 && (
            <div
              className="fade-up"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                textAlign: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--signal-soft)',
                  color: 'var(--signal)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {I.mail}
              </div>
              <div>
                <div className="eyebrow">CHECK YOUR INBOX</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 36,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '8px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Magic link on the way.
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
                  We sent a one-tap sign-in link to
                </p>
                <p className="mono" style={{ marginTop: 4, fontSize: 14 }}>
                  {email}
                </p>
              </div>
              <div
                className="card"
                style={{
                  padding: 14,
                  textAlign: 'left',
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                  maxWidth: 360,
                }}
              >
                The link expires in <strong style={{ color: 'var(--ink)' }}>10 minutes</strong>.
                Didn’t get it? Check spam, or{' '}
                <a
                  onClick={() => {
                    toast('Link resent.');
                  }}
                  style={{ color: 'var(--signal)', cursor: 'pointer' }}
                >
                  resend
                </a>
                .
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setStep(0)}>
                  Use a different email
                </button>
                <button className="btn primary" onClick={() => setStep(4)}>
                  Enter code instead
                </button>
              </div>
            </div>
          )}

          {/* Trusted-device 2FA */}
          {step === 3 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div className="eyebrow">TWO-FACTOR</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 36,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '8px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Verify it’s you.
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
                  Enter the 6-digit code from your authenticator app.
                </p>
              </div>
              <OtpInput
                otp={otp}
                setOtp={setOtp}
                refs={otpRefs}
                onPaste={onOtpPaste}
                onKey={onOtpKey}
                onChange={onOtpChange}
                err={err}
              />
              {err && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</div>}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 12,
                }}
              >
                <a
                  onClick={() => setStep(0)}
                  style={{ color: 'var(--ink-mute)', cursor: 'pointer' }}
                >
                  Use a recovery code
                </a>
                <label
                  style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    color: 'var(--ink-mute)',
                  }}
                >
                  <input type="checkbox" /> Trust this device for 30 days
                </label>
              </div>
              <button
                className="btn primary lg"
                style={{ justifyContent: 'center' }}
                onClick={submitOtp}
              >
                Sign in {I.arrow}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <button
                className="btn sm ghost"
                style={{ alignSelf: 'flex-start', marginLeft: -8 }}
                onClick={() => setStep(2)}
              >
                {I.arrowLeft} Back
              </button>
              <div>
                <div className="eyebrow">EMAIL CODE</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 36,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '8px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Enter the 6-digit code.
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
                  Sent to{' '}
                  <span className="mono" style={{ color: 'var(--ink)' }}>
                    {email}
                  </span>
                </p>
              </div>
              <OtpInput
                otp={otp}
                setOtp={setOtp}
                refs={otpRefs}
                onPaste={onOtpPaste}
                onKey={onOtpKey}
                onChange={onOtpChange}
                err={err}
              />
              {err && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</div>}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                }}
              >
                <span>
                  Resend in <span className="mono">00:42</span>
                </span>
                <a
                  onClick={() => toast('Code resent.')}
                  style={{ color: 'var(--signal)', cursor: 'pointer' }}
                >
                  Resend now
                </a>
              </div>
              <button
                className="btn primary lg"
                style={{ justifyContent: 'center' }}
                onClick={submitOtp}
              >
                Sign in {I.arrow}
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--ink-faint)',
            fontFamily: 'var(--mono)',
            letterSpacing: '0.08em',
          }}
        >
          <span>ILINGA · ©2026</span>
          <span>SOC 2 · GDPR · POPIA</span>
        </div>
      </div>

      <AuthArt
        caption={
          <>
            <span style={{ fontStyle: 'italic' }}>“Nyansapo”</span> — wisdom knot. Untangle the
            strategy, one question at a time.
          </>
        }
        sub="Ilinga interviews founders with structured questions, then ships a source-ready report — billed by the credit, opinionated by design."
      />
    </div>
  );
}

// OTP component
function OtpInput({ otp, setOtp, refs, onPaste, onKey, onChange, err }) {
  return (
    <div
      onPaste={onPaste}
      className={err ? 'shake' : ''}
      style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}
    >
      {otp.map((v, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          className={`otp-cell ${v ? 'filled' : ''}`}
          value={v}
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ============================================================
// FORGOT PASSWORD — email → code → new password
// ============================================================
function ForgotPassword() {
  const { setRoute, toast } = useApp();
  const [step, setStep] = useState(0); // 0 email, 1 code, 2 reset, 3 done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [err, setErr] = useState('');
  const otpRefs = useRef([]);

  const onOtpChange = (i, v) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    const n = [...otp];
    n[i] = d;
    setOtp(n);
    if (d && i < 5) otpRefs.current[i + 1]?.focus();
  };
  const onOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const onOtpPaste = (e) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t.length) {
      setOtp(t.padEnd(6, '').split('').slice(0, 6));
      otpRefs.current[Math.min(t.length, 5)]?.focus();
      e.preventDefault();
    }
  };

  const submitEmail = (e) => {
    e && e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setErr('Use a valid email.');
      return;
    }
    setErr('');
    setStep(1);
  };

  const strength = useMemo(() => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s; // 0-4
  }, [pw]);
  const strengthLabel = ['Too short', 'Weak', 'Okay', 'Strong', 'Excellent'][strength];
  const strengthColor = [
    'var(--danger)',
    'var(--danger)',
    'var(--ochre)',
    'var(--green)',
    'var(--green)',
  ][strength];

  const submitReset = () => {
    if (pw.length < 8) {
      setErr('At least 8 characters.');
      return;
    }
    if (pw !== pw2) {
      setErr('Passwords don’t match.');
      return;
    }
    setErr('');
    setStep(3);
  };

  return (
    <div className="auth-split">
      <div className="auth-form-pane">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <BrandMark />
          <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
            Remembered it?{' '}
            <a
              onClick={() => setRoute('signin')}
              style={{ color: 'var(--signal)', cursor: 'pointer', fontWeight: 500 }}
            >
              Sign in
            </a>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            maxWidth: 440,
            width: '100%',
            margin: '0 auto',
            padding: '40px 0',
          }}
        >
          {/* Progress */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 3,
                  borderRadius: 2,
                  background: i <= Math.min(step, 2) ? 'var(--signal)' : 'var(--paper-2)',
                  transition: 'background 320ms',
                }}
              />
            ))}
          </div>

          {step === 0 && (
            <form
              onSubmit={submitEmail}
              className="fade-up"
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              <div>
                <div className="eyebrow">RESET PASSWORD · 1 OF 3</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 40,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '10px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Forgot your password?
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
                  Enter your work email — we’ll send a 6-digit code.
                </p>
              </div>
              <div>
                <label className="field-label">Work email</label>
                <input
                  className={`input lg ${err ? 'shake' : ''}`}
                  placeholder="ada@northwind.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
                {err && (
                  <div style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{err}</div>
                )}
              </div>
              <button type="submit" className="btn primary lg" style={{ justifyContent: 'center' }}>
                Send code {I.arrow}
              </button>
              <a
                onClick={() => setRoute('signin')}
                style={{
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Back to sign in
              </a>
            </form>
          )}

          {step === 1 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div className="eyebrow">RESET PASSWORD · 2 OF 3</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 40,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '10px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Enter the code.
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
                  Sent to{' '}
                  <span className="mono" style={{ color: 'var(--ink)' }}>
                    {email}
                  </span>
                </p>
              </div>
              <OtpInput
                otp={otp}
                setOtp={setOtp}
                refs={otpRefs}
                onPaste={onOtpPaste}
                onKey={onOtpKey}
                onChange={onOtpChange}
                err={err}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                }}
              >
                <span>
                  Code expires in <span className="mono">09:42</span>
                </span>
                <a
                  onClick={() => toast('Code resent.')}
                  style={{ color: 'var(--signal)', cursor: 'pointer' }}
                >
                  Resend
                </a>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn lg" onClick={() => setStep(0)}>
                  {I.arrowLeft} Back
                </button>
                <button
                  className="btn primary lg"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setStep(2)}
                >
                  Verify {I.arrow}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div className="eyebrow">RESET PASSWORD · 3 OF 3</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 40,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '10px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Choose a new password.
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
                  You’ll be signed out of all other devices.
                </p>
              </div>
              <div>
                <label className="field-label">New password</label>
                <input
                  className="input lg"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  autoFocus
                />
                {/* strength */}
                <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: i < strength ? strengthColor : 'var(--paper-2)',
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    fontFamily: 'var(--mono)',
                    color: 'var(--ink-mute)',
                    letterSpacing: '0.08em',
                  }}
                >
                  STRENGTH ·{' '}
                  <span style={{ color: pw ? strengthColor : 'var(--ink-faint)' }}>
                    {pw ? strengthLabel.toUpperCase() : '—'}
                  </span>
                </div>
              </div>
              <div>
                <label className="field-label">Confirm password</label>
                <input
                  className={`input lg ${err && pw !== pw2 ? 'shake' : ''}`}
                  type="password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                />
              </div>
              {err && <div style={{ color: 'var(--danger)', fontSize: 12 }}>{err}</div>}
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--ink-mute)',
                }}
              >
                <Rule ok={pw.length >= 8}>At least 8 characters</Rule>
                <Rule ok={/[A-Z]/.test(pw)}>One uppercase letter</Rule>
                <Rule ok={/[0-9]/.test(pw)}>One number</Rule>
                <Rule ok={/[^A-Za-z0-9]/.test(pw)}>One symbol</Rule>
              </ul>
              <button
                className="btn primary lg"
                style={{ justifyContent: 'center' }}
                onClick={submitReset}
              >
                Reset password {I.arrow}
              </button>
            </div>
          )}

          {step === 3 && (
            <div
              className="fade-up"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                textAlign: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'var(--green-soft)',
                  color: 'var(--green)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {I.check}
              </div>
              <div>
                <div className="eyebrow">ALL SET</div>
                <h1
                  className="r-h-1"
                  style={{
                    fontFamily: 'var(--serif)',
                    fontSize: 40,
                    fontWeight: 500,
                    letterSpacing: '-0.025em',
                    margin: '8px 0 6px',
                    lineHeight: 1.05,
                  }}
                >
                  Password updated.
                </h1>
                <p style={{ color: 'var(--ink-mute)', margin: 0 }}>
                  You’ve been signed out of all other devices.
                </p>
              </div>
              <button
                className="btn primary lg"
                style={{ justifyContent: 'center' }}
                onClick={() => setRoute('signin')}
              >
                Sign in now {I.arrow}
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--ink-faint)',
            fontFamily: 'var(--mono)',
            letterSpacing: '0.08em',
          }}
        >
          <span>ILINGA · ©2026</span>
          <span>SOC 2 · GDPR · POPIA</span>
        </div>
      </div>

      <AuthArt
        caption={
          <>
            <span style={{ fontStyle: 'italic' }}>“Sankofa”</span> — go back and fetch it. Reset,
            recover, return stronger.
          </>
        }
        sub="Codes expire in 10 minutes. We never store passwords in plaintext, and we sign you out of every device on reset."
      />
    </div>
  );
}

function Rule({ ok, children }) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: ok ? 'var(--green)' : 'var(--ink-mute)',
      }}
    >
      <span style={{ width: 14, height: 14, display: 'grid', placeItems: 'center' }}>
        {ok ? (
          I.check
        ) : (
          <span
            style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-faint)' }}
          />
        )}
      </span>
      {children}
    </li>
  );
}

window.SignIn = SignIn;
window.ForgotPassword = ForgotPassword;
Object.assign(window, { SignIn, ForgotPassword, BrandMark, AuthArt, OtpInput });
