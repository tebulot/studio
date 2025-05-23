
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, CreditCard, ShieldCheck } from "lucide-react"; // Changed ShieldLock to ShieldCheck

export default function AccountPage() {
  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <UserCog className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Account Settings</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your account details, billing information, and security settings.
        </p>
      </header>

      {/* Account Details Card */}
      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCog className="h-6 w-6 text-accent" />
              <CardTitle className="text-xl text-primary">Account Details</CardTitle>
            </div>
            <CardDescription>View and update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-foreground/80">Email Address</Label>
              <Input id="email" type="email" defaultValue="user@example.com" readOnly className="bg-background border-border focus:ring-primary cursor-not-allowed" />
            </div>
            <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" disabled>Change Email (Soon)</Button>
             <div className="space-y-1 mt-4">
              <Label htmlFor="username" className="text-foreground/80">Username</Label>
              <Input id="username" type="text" defaultValue="currentUser" readOnly className="bg-background border-border focus:ring-primary cursor-not-allowed" />
            </div>
             <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" disabled>Change Username (Soon)</Button>
          </CardContent>
        </Card>
      </section>

      {/* Billing Information Card */}
      <section>
        <Card className="shadow-lg border-accent/20">
          <CardHeader>
             <div className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl text-accent">Billing Information</CardTitle>
            </div>
            <CardDescription>Manage your subscription and payment methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan:</p>
              <p className="text-lg font-semibold text-foreground">Pro Tier (Monthly)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date:</p>
              <p className="text-lg font-semibold text-foreground">July 15, 2024</p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" disabled>Manage Billing (Soon)</Button>
             <Button variant="outline" className="ml-2 border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" disabled>View Invoices (Soon)</Button>
          </CardContent>
        </Card>
      </section>

      {/* Security Settings Card */}
      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-accent" /> {/* Changed ShieldLock to ShieldCheck */}
                <CardTitle className="text-xl text-primary">Security Settings</CardTitle>
            </div>
            <CardDescription>Enhance your account security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" disabled>Change Password (Soon)</Button>
            <div className="mt-2">
                <p className="text-sm text-muted-foreground">Two-Factor Authentication (2FA): <span className="text-destructive font-semibold">Disabled</span></p>
                <Button variant="outline" className="mt-2 border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground" disabled>Enable 2FA (Soon)</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
