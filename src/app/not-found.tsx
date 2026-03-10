import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-2 border border-border flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-text-muted" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-text-primary mb-2">
          Not Found
        </h2>
        <p className="text-text-secondary text-sm max-w-sm">
          We couldn't find this ticker or page. Make sure you've entered a valid stock symbol.
        </p>
      </div>
      <Link href="/dashboard" className="btn-primary">
        Back to Dashboard
      </Link>
    </div>
  )
}
