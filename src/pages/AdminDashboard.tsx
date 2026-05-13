import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Gauge,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
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

// Shape of the real data coming from your Supabase BMP table
type AdminReading = {
  id: number;
  username: string;
  current: number;
  voltage: number;
  power: number;
  date: string;
  time: string;
};

const formatInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "?";

const AverageCard = ({
  label,
  value,
  unit,
  icon: Icon,
  hint,
}: {
  label: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  hint: string;
}) => (
  <article className="rounded-3xl border border-border/60 bg-card p-6 shadow-card transition-smooth hover:shadow-elevated hover:-translate-y-1">
    <div className="flex items-center gap-3">
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">{label}</h3>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
    <p className="mt-5 font-display text-4xl font-extrabold tabular-nums tracking-tight text-foreground">
      {value.toFixed(2)}
      <span className="ml-1 text-base font-semibold text-muted-foreground">{unit}</span>
    </p>
    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      System-wide average
    </p>
  </article>
);

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  
  // Real state for Supabase data
  const [tableData, setTableData] = useState<AdminReading[]>([]);
  const [systemAverages, setSystemAverages] = useState({ current: 0, voltage: 0, power: 0 });
  const [loading, setLoading] = useState(false);

  const fetchGlobalData = async () => {
    setLoading(true);

    // 1. Fetch all relevant data, ordering by newest ID first
    const { data, error } = await supabase
      .from('BMP')
      .select('id, username, current, voltage, power, date, time')
      .order('id', { ascending: false });

    if (data && data.length > 0) {
      // 2. Calculate the exact Date for 7 days ago
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0); // Start at midnight

      // 3. Filter using the text 'date' column in memory
      const recentData = data.filter((row) => {
        if (!row.date) return false;
        const rowDate = new Date(row.date); 
        return rowDate >= sevenDaysAgo;
      });

      if (recentData.length > 0) {
        // Calculate averages only from the filtered 7-day data
        const avgCurrent = recentData.reduce((sum, d) => sum + (d.current || 0), 0) / recentData.length;
        const avgVoltage = recentData.reduce((sum, d) => sum + (d.voltage || 0), 0) / recentData.length;
        const avgPower = recentData.reduce((sum, d) => sum + (d.power || 0), 0) / recentData.length;
        
        setSystemAverages({ current: avgCurrent, voltage: avgVoltage, power: avgPower });

        // Filter out admin rows
        const allFarmersData = recentData.filter((u: any) => !u.username.toLowerCase().startsWith("admin"));
        setTableData(allFarmersData);
      } else {
        setTableData([]);
        setSystemAverages({ current: 0, voltage: 0, power: 0 });
      }
    } else {
      setTableData([]);
      setSystemAverages({ current: 0, voltage: 0, power: 0 });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGlobalData();
    const id = setInterval(fetchGlobalData, 8000);
    return () => clearInterval(id);
  }, []);

  const initials = useMemo(() => formatInitials(user?.farmerName ?? "Admin"), [user?.farmerName]);
  
  // Calculate how many unique users are in the table for the header
  const uniqueUsersCount = new Set(tableData.map(d => d.username)).size;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo size={36} withWordmark={false} />
            <div className="hidden sm:block">
              <h1 className="font-display text-lg font-bold leading-tight text-foreground">
                Smart Agri System
              </h1>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
                Admin Console
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
                <p className="text-sm font-semibold text-foreground">{user.farmerName || "System Admin"}</p>
                <p className="text-[11px] text-muted-foreground">@{user.username || "admin"}</p>
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
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                <ShieldCheck className="h-4 w-4" /> Administrator
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                System Overview
              </h2>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                Monitor global telemetry averages and inspect the latest sensor readings reported by
                every active farmer on the network.
              </p>
            </div>
            <Button variant="accent" size="sm" onClick={fetchGlobalData} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
            </Button>
          </div>
        </section>

        {/* Centralized averages */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-foreground">System Averages</h3>
            <span className="text-xs text-muted-foreground">Auto-refreshes every 8s</span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <AverageCard
              label="Current"
              value={systemAverages.current}
              unit="A"
              icon={Activity}
              hint="Network-wide draw"
            />
            <AverageCard
              label="Voltage"
              value={systemAverages.voltage}
              unit="V"
              icon={Gauge}
              hint="Battery / solar bus"
            />
            <AverageCard
              label="Power"
              value={systemAverages.power}
              unit="W"
              icon={Zap}
              hint="Aggregate consumption"
            />
          </div>
        </section>

        {/* Historical Data Table */}
        <section className="rounded-3xl border border-border/60 bg-card shadow-card">
          <div className="flex items-center justify-between gap-4 p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">7-Day Telemetry Log</h3>
                <p className="text-xs text-muted-foreground">
                  All historical sensor readings from the past week
                </p>
              </div>
            </div>
            <span className="rounded-full bg-secondary/60 px-3 py-1 text-xs font-semibold text-foreground">
              {uniqueUsersCount} {uniqueUsersCount === 1 ? "user" : "users"} ({tableData.length} entries)
            </span>
          </div>

          <div className="border-t border-border/60">
            {tableData.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                {loading ? "Fetching live data..." : "No data recorded in the last 7 days."}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Farmer Node</TableHead>
                    <TableHead>Date Logged</TableHead>
                    <TableHead className="text-right">Current (A)</TableHead>
                    <TableHead className="text-right">Voltage (V)</TableHead>
                    <TableHead className="text-right">Power (W)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row) => {
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
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-primary font-display text-xs font-bold text-primary-foreground">
                              {formatInitials(row.username)}
                            </span>
                            <span className="font-semibold text-foreground">
                              {row.username.charAt(0).toUpperCase() + row.username.slice(1)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-mono text-xs">
                          {row.date} - {row.time}
                        </TableCell>
                        <TableCell className="text-right">
                          {cell(row.current, systemAverages.current)}
                        </TableCell>
                        <TableCell className="text-right">
                          {cell(row.voltage, systemAverages.voltage)}
                        </TableCell>
                        <TableCell className="text-right">
                          {cell(row.power, systemAverages.power)}
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
          Smart Agri System · Admin console
        </footer>
      </main>
    </div>
  );
};

export default AdminDashboard;