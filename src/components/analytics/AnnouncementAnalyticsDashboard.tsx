"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import type { AnnouncementAnalyticsData } from "@/lib/announcement-analytics";

type Envelope = {
  success: boolean;
  data?: AnnouncementAnalyticsData;
  message?: string;
};

export function AnnouncementAnalyticsDashboard({
  endpoint,
  title,
  description,
}: {
  endpoint: string;
  title: string;
  description: string;
}) {
  const [days, setDays] = React.useState(30);
  const range = React.useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 86_400_000);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [days]);
  const query = useQuery({
    queryKey: ["announcement-analytics", endpoint, range],
    queryFn: async () => {
      const response = await api.get<Envelope>(endpoint, { params: range });
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || "Failed to load analytics");
      }
      return response.data.data;
    },
  });
  const data = query.data;
  const cards = data
    ? [
        ["Posts", data.kpis.posts],
        ["Eligible recipients", data.kpis.eligibleRecipients],
        ["Total views", data.kpis.totalViews],
        ["Unique viewers", data.kpis.uniqueViewers],
        ["Reach rate", `${data.kpis.reachRate}%`],
        ["Average views/post", data.kpis.averageViewsPerPost],
      ]
    : [];

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={days === value ? "default" : "outline"}
              onClick={() => setDays(value)}
            >
              {value} days
            </Button>
          ))}
        </div>
      </header>

      {query.isPending ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : query.error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {query.error.message}
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {cards.map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{value}</p>
              </div>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border bg-card p-4">
              <h2 className="font-semibold">Publication frequency</h2>
              <p className="text-xs text-muted-foreground">Posts published per day</p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.daily ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={24} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="posts" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-card p-4">
              <h2 className="font-semibold">Views and unique reach</h2>
              <p className="text-xs text-muted-foreground">Authenticated engagement trend</p>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.daily ?? []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={24} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#7f1d4e" strokeWidth={2} />
                    <Line type="monotone" dataKey="unique" stroke="#1e3a5f" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card">
            <div className="border-b p-4">
              <h2 className="font-semibold">Top announcements</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Announcement</th>
                    <th className="px-4 py-3">Recipients</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-4 py-3">Unique</th>
                    <th className="px-4 py-3">Reach</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.top.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{row.title}</td>
                      <td className="px-4 py-3">{row.recipients}</td>
                      <td className="px-4 py-3">{row.totalViews}</td>
                      <td className="px-4 py-3">{row.uniqueViewers}</td>
                      <td className="px-4 py-3">{row.reachRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
