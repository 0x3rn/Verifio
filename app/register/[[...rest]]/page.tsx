import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-header__title">Create Account</h1>
          <p className="auth-header__subtitle">Email is optional. Add it for account and password recovery.</p>
        </div>
        <div className="auth-form-card clerk-auth-shell">
          {/* Clerk's prebuilt flow includes Smart CAPTCHA when bot protection is enabled. */}
          <SignUp path="/register" routing="path" signInUrl="/login" fallbackRedirectUrl="/dashboard" />
        </div>
      </div>
    </div>
  );
}
