import logo from "@/assets/logo-sprout.png";
import { cn } from "@/lib/utils";

export const Logo = ({
  size = 40,
  withWordmark = true,
  className,
}: {
  size?: number;
  withWordmark?: boolean;
  className?: string;
}) => (
  <div className={cn("flex items-center gap-3", className)}>
    <img
      src={logo}
      alt="SmartAgri logo"
      width={size}
      height={size}
      className="rounded-full shadow-soft"
      style={{ width: size, height: size }}
    />
    {withWordmark && (
      <div className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-tight text-foreground">
          SmartAgri
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Smart Agriculture
        </span>
      </div>
    )}
  </div>
);
