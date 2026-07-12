'use client'

import { cn } from '@/lib/utils'

// Consistent section/page heading used at the top of every view's content.
export function PageHeading({
  title, subtitle, action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[#8A8478] text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// White card with rounded-2xl + soft shadow — the base surface everywhere.
export function Card({
  className, children, dark, ...props
}: React.HTMLAttributes<HTMLDivElement> & { dark?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 sm:p-6',
        dark
          ? 'bg-[#1A1A1A] text-[#F4F1EA] shadow-sidebar'
          : 'bg-white border border-[#E5E1D7] shadow-soft',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Lime "pill" badge for accents (Popular, active, etc.)
export function LimeBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-[#C5F82A] text-[#1A1A1A]',
      className,
    )}>
      {children}
    </span>
  )
}

// Stat card — big number + label + optional % change badge
export function StatCard({
  label, value, sub, change, icon,
}: {
  label: string
  value: string
  sub?: string
  change?: number // positive or negative percentage
  icon?: React.ReactNode
}) {
  const isUp = (change ?? 0) >= 0
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm text-[#8A8478] font-medium">{label}</div>
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[#F4F1EA] flex items-center justify-center text-[#1A1A1A]">
            {icon}
          </div>
        )}
      </div>
      <div className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{value}</div>
      <div className="flex items-center gap-2 mt-2">
        {change !== undefined && (
          <span className={cn(
            'inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-semibold',
            isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700',
          )}>
            {isUp ? '↑' : '↓'} {Math.abs(change)}%
          </span>
        )}
        {sub && <span className="text-xs text-[#8A8478]">{sub}</span>}
      </div>
    </Card>
  )
}

// Skeleton placeholder card
export function CardSkeleton({ className }: { className?: string }) {
  return <div className={cn('rounded-2xl bg-white border border-[#E5E1D7] animate-pulse h-32', className)} />
}
