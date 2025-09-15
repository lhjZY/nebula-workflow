import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return (
    <div className="glass rounded-2xl p-6">
      <h1 className="text-2xl font-semibold">欢迎来到 workflow</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        当前只实现 Todo 功能。点击下方进入。
      </p>
      <div className="mt-4">
        <Link to="/todo" className="inline-flex items-center rounded-lg bg-black/80 px-4 py-2 text-white hover:bg-black">
          打开 Todo
        </Link>
      </div>
    </div>
  )
}


