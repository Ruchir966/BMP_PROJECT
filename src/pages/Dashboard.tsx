import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Activity, Gauge, LogOut, MapPin, RefreshCw, Zap, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Metric = {
  key: "current" | "voltage" | "power";
  label: string;
  unit: string;
  icon: LucideIcon;
  systemAverage: number;
  description: string;
};

const METRICS: Metric[] = [
  {
    key: "current",
    label: "Current",
    unit: "A",
    icon: Activity,
    systemAverage: 1.45,
    description: "Sensor draw across irrigation nodes",
  },
  {
    key: "voltage",
    label: "Voltage",
    unit: "V",
    icon: Gauge,
    systemAverage: 12.6,
    description: "Battery / solar bus voltage",
  },
  {
    key: "power",
    label: "Power",
    unit: "W",
    icon: Zap,
    systemAverage: 18.3,
    description: "Real-time energy consumption",
  },
];
const initialReadings = { current: 0, voltage: 0, power: 0 };
const formatInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const MetricCard = ({
  metric,
  reading,
}: {
  metric: Metric;
  reading: number;
}) => {
  const Icon = metric.icon;
  const isLow = reading < metric.systemAverage;
  const status = isLow ? "Low" : "Optimal";
  const diff = reading - metric.systemAverage;
  const diffPct = (diff / metric.systemAverage) * 100;

  return (
    <article className="group rounded-3xl border border-border/60 bg-card p-6 shadow-card transition-smooth hover:shadow-elevated hover:-translate-y-1">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{metric.label}</h3>
            <p className="text-xs text-muted-foreground">{metric.description}</p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold",
            isLow
              ? "bg-destructive/10 text-destructive"
              : "bg-success/15 text-success",
          )}
        >
          {status}
        </span>
      </header>

      <div className="mt-6 space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            My Reading
          </p>
          <p
            className={cn(
              "mt-1 font-display text-4xl font-extrabold tabular-nums tracking-tight transition-smooth",
              isLow ? "text-destructive" : "text-success",
            )}
          >
            {reading.toFixed(2)}
            <span className="ml-1 text-base font-semibold opacity-80">{metric.unit}</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {diff >= 0 ? "+" : ""}
            {diff.toFixed(2)} {metric.unit} ({diffPct >= 0 ? "+" : ""}
            {diffPct.toFixed(1)}%) vs average
          </p>
        </div>

        <div className="rounded-2xl bg-secondary/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            System Average
          </p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-foreground">
            {metric.systemAverage.toFixed(2)}
            <span className="ml-1 text-sm font-semibold text-muted-foreground">{metric.unit}</span>
          </p>
        </div>
      </div>
    </article>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [readings, setReadings] = useState(initialReadings);
  const [averages, setAverages] = useState({ current: 1.45, voltage: 12.6, power: 18.3 });
 useEffect(() => {
    if (!user) return;

    // 1. Fetch the Live Reading for THIS user
    const fetchRealData = async () => {
      const { data, error } = await supabase
        .from('BMP')
        .select('current, voltage, power')
        .eq('device_uid', user.id)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setReadings({
          current: data.current || 0,
          voltage: data.voltage || 0,
          power: data.power || 0,
        });
      }
    };

    // 2. Fetch ALL data and calculate the System Average
    const fetchSystemAverages = async () => {
      const { data, error } = await supabase
        .from('BMP')
        .select('current, voltage, power')
        .order('id', { ascending: false })
        .limit(500); // Grabs the last 500 readings across ALL users

      if (data && data.length > 0) {
        // Add up all the numbers
        const sum = data.reduce(
          (acc, row) => ({
            current: acc.current + (row.current || 0),
            voltage: acc.voltage + (row.voltage || 0),
            power: acc.power + (row.power || 0),
          }),
          { current: 0, voltage: 0, power: 0 }
        );

        // Divide by the number of rows to get the average!
        setAverages({
          current: sum.current / data.length,
          voltage: sum.voltage / data.length,
          power: sum.power / data.length,
        });
      }
    };

    // Run both fetches immediately when the dashboard loads
    fetchRealData();
    fetchSystemAverages();

    // Refresh the live reading every 5 seconds, and the averages every 15 seconds
    const readingInterval = setInterval(fetchRealData, 5000);
    const averageInterval = setInterval(fetchSystemAverages, 15000);
    
    return () => {
      clearInterval(readingInterval);
      clearInterval(averageInterval);
    };
  }, [user]);
  const initials = useMemo(() => formatInitials(user?.farmerName ?? ""), [user?.farmerName]);

  if (!user) return null;

 const cards: { metric: Metric; reading: number }[] = [
    { metric: { ...METRICS[0], systemAverage: averages.current }, reading: readings.current },
    { metric: { ...METRICS[1], systemAverage: averages.voltage }, reading: readings.voltage },
    { metric: { ...METRICS[2], systemAverage: averages.power }, reading: readings.power },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size={36} withWordmark={false} />
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold leading-tight text-foreground">
                Smart Agri System
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Field Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-full border border-border/60 bg-card px-2 py-1 pr-4 shadow-soft">
              <span
                aria-hidden
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary font-display text-sm font-bold text-primary-foreground"
              >
                {initials}
              </span>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-sm font-semibold text-foreground">{user.farmerName}</p>
                <p className="text-[11px] text-muted-foreground">@{user.username}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container space-y-8 py-8 animate-fade-in">
        {/* Hero */}
        <section className="rounded-3xl border border-border/60 bg-card p-6 shadow-card sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Smart Agri System
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                Hello, {(user.farmerName ? user.farmerName.split(" ")[0] : user.email ? user.email.split("@")[0] : "Farmer")} 🌱
              </h2>
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {user.farmLocation}
              </p>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Each card compares your live sensor reading against the system average.
                <span className="ml-1 font-semibold text-success">Green</span> means you're at or above
                average,{" "}
                <span className="font-semibold text-destructive">red</span> means below — time to check
                in on the farm.
              </p>
            </div>
            <Button variant="accent" size="sm" onClick={() => setReadings(initialReadings())}>
              <RefreshCw className="h-4 w-4" /> Refresh readings
            </Button>
          </div>
        </section>

        {/* Metric cards */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ metric, reading }) => (
            <MetricCard key={metric.key} metric={metric} reading={reading} />
          ))}
        </section>

        <footer className="pb-8 pt-2 text-center text-xs text-muted-foreground">
          Smart Agri System · Live telemetry for {user.farmerName}'s farm
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
