import Link from 'next/link';
import { AuthSignInForm } from '@/components/AuthSignInForm';
import { ArrowLeftIcon } from '@/components/Icons';

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-header__title">Welcome Back</h1>
          <p className="auth-header__subtitle">Sign in with your username or email and password.</p>
        </div>
        <div className="auth-form-card auth-form-card--login">
          <div className="auth-back-link-wrap">
            <Link href="/" className="auth-back-link"><span className="auth-back-link__arrow" aria-hidden="true"><ArrowLeftIcon className="icon-sm" /></span> Back to home</Link>
          </div>
          <AuthSignInForm />
        </div>
      </div>
    </div>
  );
}
