import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-header__title">Create Account</h1>
          <p className="auth-header__subtitle">Choose a username and password. An email is optional, but useful for recovery.</p>
        </div>
        <div className="auth-form-card clerk-auth-shell">
          {/* Clerk's prebuilt flow includes Smart CAPTCHA when bot protection is enabled. */}
          <SignUp signInUrl="/login" fallbackRedirectUrl="/dashboard" />
          <p className="auth-footer__text clerk-auth-back"><Link href="/">← Back to Home</Link></p>
        </div>
      </div>
    </div>
  );
}
