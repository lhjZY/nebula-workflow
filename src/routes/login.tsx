import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '../stores/auth'
import { LoginForm } from '@/components/login-form'

export const Route = createFileRoute('/login')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState()
    if (isAuthenticated) throw redirect({ to: '/todo' })
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-5xl xl:max-w-6xl">
        <LoginForm />
      </div>
    </div>
  )
}


