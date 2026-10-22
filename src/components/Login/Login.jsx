import { useState } from 'react'
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { CircleAlert, LogIn } from 'lucide-react';
import logo from '../../assets/Image/servologo.png'
import Button from '../ui/Button'
import { Field, Input, PasswordInput } from '../ui/Field'
import { authApi } from '../../lib/services'
import { setToken } from '../../lib/api'
import { saveRole } from '../../lib/role'
import { notify } from '../../lib/notify'

const validationSchema = Yup.object().shape({
  email: Yup.string().trim().email("Enter a valid email address.").required("Email is required."),
  password: Yup.string().required("Password is required."),
})

export default function Login() {
  const [error, setError] = useState('')

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      setError('')
      const res = await authApi.login(values.email.trim(), values.password)
      if (res.status === 200 && res.data?.token) {
        setToken(res.data.token)
        saveRole(res.data.role)
        notify.success(res.data.message || 'Signed in.')
        window.location.assign('/layout')
        return
      }
      // Keep the entered email; show the backend's reason inline.
      setError(res.message || 'Sign-in failed. Please try again.')
    },
  })

  const fieldError = (name) => (formik.touched[name] && formik.errors[name]) || ''

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgb(var(--sky) / .55), transparent 65%)' }}
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <img src={logo} alt="" className="h-10 w-10 object-contain" />
          <span className="text-lg font-bold tracking-tight">Servo</span>
        </div>
        <div className="relative">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-sky">Reseller portal</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight">
            Activate customers and keep track of your credits.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Activate Servo on customer devices, follow up on expiring subscriptions, and manage your sub-resellers.
          </p>
        </div>
        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Servo</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <img src={logo} alt="Servo" className="mb-5 h-14 w-14 object-contain lg:hidden" />
            <h2 className="text-2xl font-bold tracking-tight text-fg">Sign in</h2>
            <p className="mt-1.5 text-sm text-muted">Use your Servo reseller account.</p>
          </div>

          <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
            {error && (
              <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-danger/25 bg-danger-soft px-3.5 py-3 text-[13px] font-medium text-danger">
                <CircleAlert size={17} className="mt-px shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}
            <Field label="Email" error={fieldError('email')}>
              {(p) => (
                <Input
                  {...p}
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="you@company.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              )}
            </Field>
            <Field label="Password" error={fieldError('password')}>
              {(p) => (
                <PasswordInput
                  {...p}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              )}
            </Field>
            <Button type="submit" icon={LogIn} loading={formik.isSubmitting} className="w-full justify-center">
              Sign in
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
