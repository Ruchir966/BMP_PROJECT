import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Activity, Gauge, LogOut, RefreshCw, Zap, History, type LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

type HistoryRow = {
  id: number;
  current: number;
  voltage: number;
  power: number;
  date: string;
  time: string;
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
  const navigate = useNavigate();

  // ADMIN REDIRECT LOGIC
  useEffect(() => {
    if (user?.username === 'admin' || user?.email === 'admin@agrisystem.com') {
      navigate('/admin');
    }
  }, [user, navigate]);

  const [readings, setReadings] = useState(initialReadings);
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);
  const [averages, setAverages] = useState({ current: 1.45, voltage: 12.6, power: 18.3 });
  const [loading, setLoading] = useState(false);

  const fetchRealData = async () => {
    if (!user) return;
    setLoading(true);

    const farmerIdentifier = user.username || (user.email ? user.email.split("@")[0] : "");

    const { data, error } = await supabase
      .from('BMP')
      .select('id, current, voltage, power, date, time')
      .eq('username', farmerIdentifier) 
      .order('id', { ascending: false });

    if (data && data.length > 0) {
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0); 

      const recentData = data.filter((row) => {
        if (!row.date) return false;
        const rowDate = new Date(row.date);
        return rowDate >= sevenDaysAgo;
      });

      setHistoryData(recentData);

      if (recentData.length > 0) {
        setReadings({
          current: recentData[0].current || 0,
          voltage: recentData[0].voltage || 0,
          power: recentData[0].power || 0,
        });
      } else {
        setReadings(initialReadings);
      }
    } else {
      setHistoryData([]);
      setReadings(initialReadings);
    }
    setLoading(false);
  };

  const fetchSystemAverages = async () => {
    const { data, error } = await supabase
      .from('BMP')
      .select('current, voltage, power')
      .order('id', { ascending: false })
      .limit(500); 

    if (data && data.length > 0) {
      const sum = data.reduce(
        (acc, row) => ({
          current: acc.current + (row.current || 0),
          voltage: acc.voltage + (row.voltage || 0),
          power: acc.power + (row.power || 0),
        }),
        { current: 0, voltage: 0, power: 0 }
      );

      setAverages({
        current: sum.current / data.length,
        voltage: sum.voltage / data.length,
        power: sum.power / data.length,
      });
    }
  };

  useEffect(() => {
    if (!user) return;
    // Don't fetch farmer data if the user is an admin about to be redirected
    if (user?.username === 'admin' || user?.email === 'admin@agrisystem.com') return;
    
    fetchRealData();
    fetchSystemAverages();

    const readingInterval = setInterval(fetchRealData, 5000);
    const averageInterval = setInterval(fetchSystemAverages, 15000);
    
    return () => {
      clearInterval(readingInterval);
      clearInterval(averageInterval);
    };
  }, [user]);

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
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Each card compares your live sensor reading against the system average.
                <span className="ml-1 font-semibold text-success">Green</span> means you're at or above
                average,{" "}
                <span className="font-semibold text-destructive">red</span> means below — time to check
                in on the farm.
              </p>
            </div>
            <Button variant="accent" size="sm" onClick={fetchRealData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> 
              {loading ? "Refreshing..." : "Refresh readings"}
            </Button>
          </div>
        </section>

        {/* Metric cards */}
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(({ metric, reading }) => (
            <MetricCard key={metric.key} metric={metric} reading={reading} />
          ))}
        </section>

        {/* My History Table Section */}
        <section className="rounded-3xl border border-border/60 bg-card shadow-card mt-8">
          <div className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <History className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">My 7-Day History</h3>
                <p className="text-xs text-muted-foreground">
                  Your personal sensor readings from the past week
                </p>
              </div>
            </div>
            <span className="rounded-full bg-secondary/60 px-3 py-1 text-xs font-semibold text-foreground">
              {historyData.length} entries
            </span>
          </div>

          <div className="border-t border-border/60">
            {historyData.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                {loading ? "Fetching live data..." : "No data recorded in the last 7 days."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Logged</TableHead>
                    <TableHead className="text-right">Current (A)</TableHead>
                    <TableHead className="text-right">Voltage (V)</TableHead>
                    <TableHead className="text-right">Power (W)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((row) => {
                    const cell = (val: number, avg: number) => (
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          val < avg ? "text-destructive" : "text-success",
                        )}
                      >
                        {val.toFixed(2)}
                      </span>
                    );
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {row.date} - {row.time}
                        </TableCell>
                        <TableCell className="text-right">
                          {cell(row.current, averages.current)}
                        </TableCell>
                        <TableCell className="text-right">
                          {cell(row.voltage, averages.voltage)}
                        </TableCell>
                        <TableCell className="text-right">
                          {cell(row.power, averages.power)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </section>

        <footer className="pb-8 pt-2 text-center text-xs text-muted-foreground">
          Smart Agri System · Live telemetry for {user.farmerName || "your farm"}
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;