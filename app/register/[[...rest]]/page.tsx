import Link from 'next/link';
import { ArrowLeftIcon } from '@/components/Icons';
import { AuthSignUpForm } from '@/components/AuthSignUpForm';

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-header__title">Create Account</h1>
          <p className="auth-header__subtitle">Email is optional. Add it for account and password recovery.</p>
        </div>
        <div className="auth-form-card auth-form-card--register clerk-auth-shell">
          <div className="auth-back-link-wrap">
            <Link href="/" className="auth-back-link"><span className="auth-back-link__arrow" aria-hidden="true"><ArrowLeftIcon className="icon-sm" /></span> Back to home</Link>
          </div>
          <AuthSignUpForm />
        </div>
      </div>
    </div>
  );
}
