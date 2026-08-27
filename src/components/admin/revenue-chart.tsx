"use client"

import { useFormatter } from "next-intl"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { MrrPoint } from "@/lib/metrics"

/**
 * Recurring revenue over the last weeks, on the admin panel.
 *
 * Colours come from the theme variables rather than literals, so the chart
 * follows a swapped theme and reads correctly in both light and dark. Amounts
 * arrive in the smallest currency unit, the way Stripe stores them, and are
 * divided here at the edge where they become text.
 */
export function RevenueChart({ data, label }: { data: MrrPoint[]; label: string }) {
  const format = useFormatter()

  const shortDate = (iso: string) =>
    format.dateTime(new Date(iso), { month: "short", day: "numeric" })

  const money = (cents: number) =>
    format.number(cents / 100, { style: "currency", currency: "USD", maximumFractionDigits: 0 })

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="mrr-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={money}
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />

          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            content={({ active, payload, label: at }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="rounded-[var(--radius)] border border-border bg-card px-3 py-2 shadow-soft">
                  <p className="text-xs text-muted-foreground">{shortDate(String(at))}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {money(Number(payload[0].value))} <span className="font-normal text-muted-foreground">{label}</span>
                  </p>
                </div>
              )
            }}
          />

          <Area
            type="monotone"
            dataKey="mrr"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#mrr-fill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--primary)", stroke: "var(--card)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
