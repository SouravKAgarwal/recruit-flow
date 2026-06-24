"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

export function ActivityChart({ data }: { data: { date: string; count: number }[] }) {
  // Format dates for display
  const formattedData = data.map((d) => {
    const dateObj = new Date(d.date);
    return {
      ...d,
      displayDate: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
          <XAxis 
            dataKey="displayDate" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} 
            dy={10}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} 
            allowDecimals={false}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--color-card)", 
              borderColor: "var(--color-border)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              fontSize: "12px",
              color: "var(--color-text)"
            }}
            itemStyle={{ color: "var(--color-primary)", fontWeight: 600 }}
            cursor={{ stroke: 'var(--color-border)', strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            name="Emails Sent"
            stroke="var(--color-primary)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCount)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: "var(--color-primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PipelineChart({ data }: { data: { status: string; count: number; color: string; label: string }[] }) {
  return (
    <div className="h-[250px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" opacity={0.5} />
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
            allowDecimals={false}
          />
          <YAxis 
            dataKey="label" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: "var(--color-text)", fontWeight: 500 }}
            width={80}
          />
          <Tooltip 
            cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
            contentStyle={{ 
              backgroundColor: "var(--color-card)", 
              borderColor: "var(--color-border)",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              fontSize: "12px"
            }}
            formatter={(value) => [value, 'Recruiters']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
