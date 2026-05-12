import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Sprout } from "lucide-react";

const Signup = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [farmerName, setFarmerName] = useState("");
  const [username, setUsername] = useState("");
  const [farmLocation, setFarmLocation] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = farmerName.trim();
    const u = username.trim();
    const loc = farmLocation.trim();
    if (name.length < 2) return toast.error("Please enter your farmer name.");
    if (u.length < 3) return toast.error("Farm username must be at least 3 characters.");
    if (!/^[a-zA-Z0-9_.-]+$/.test(u))
      return toast.error("Farm username can only contain letters, numbers, _ . -");
    if (loc.length < 2) return toast.error("Please enter your farm location.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");

    setSubmitting(true);
    try {
      await signup({ farmerName: name, username: u, farmLocation: loc, password });
      toast.success(`Welcome, ${name}! Your farm is registered.`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Register your farm" subtitle="Set up your Smart Agri profile in under a minute.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="farmerName">Farmer Name</Label>
          <Input
            id="farmerName"
            value={farmerName}
            onChange={(e) => setFarmerName(e.target.value)}
            placeholder="e.g. Asha Patel"
            maxLength={60}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Farm Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. greenacres42"
            maxLength={40}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="farmLocation">Farm Location</Label>
          <Input
            id="farmLocation"
            value={farmLocation}
            onChange={(e) => setFarmLocation(e.target.value)}
            placeholder="e.g. Nashik, Maharashtra"
            maxLength={80}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" /> : <Sprout />}
          {submitting ? "Registering…" : "Register"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
