
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, CreditCard, ShieldCheck, Save, XCircle, Loader2, Mail, ExternalLink, CheckCircle, Zap, BarChartHorizontalBig, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Define Subscription Tiers
const subscriptionTiers = [
  {
    id: "window_shopping",
    name: "Window Shopping",
    price: "Free (View-Only)",
    features: [
      "Dashboard Overview (Demo/Limited Data)",
      "0 Managed URLs",
      "Explore Features",
      "Email Support",
    ],
    icon: Eye,
    cta: "View Paid Plans",
    variant: "outline" as const,
    isCurrent: (currentTierId: string) => currentTierId === "window_shopping",
    actionType: "view_plans" as const,
  },
  {
    id: "set_and_forget",
    name: "Set & Forget",
    price: "$4/mo", // Updated Price
    features: [
      "1 Managed URL", // Updated Feature
      "Dashboard Stats (30-min refresh)",
      "Email Support",
    ],
    icon: Zap,
    cta: "Switch to Set & Forget",
    variant: "default" as const,
    isCurrent: (currentTierId: string) => currentTierId === "set_and_forget",
    actionType: "switch_plan" as const,
  },
  {
    id: "analytics",
    name: "Analytics",
    price: "$12/mo", // Updated Price
    features: [
      "Up to 3 Managed URLs",
      "Full Dashboard Analytics",
      "Priority Email Support",
    ],
    icon: BarChartHorizontalBig,
    cta: "Upgrade to Analytics",
    variant: "default" as const,
    isCurrent: (currentTierId: string) => currentTierId === "analytics",
    actionType: "switch_plan" as const,
  },
];

export default function AccountPage() {
  const { user, loading: authLoading, updateUserEmail, updateUserDisplayName, sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const [currentUserTierId, setCurrentUserTierId] = useState("window_shopping"); 

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInputValue, setEmailInputValue] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInputValue, setUsernameInputValue] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  useEffect(() => {
    if (user) {
      setEmailInputValue(user.email || "");
      setUsernameInputValue(user.displayName || user.email?.split('@')[0] || "currentUser");
      // In a real app, you would fetch the user's actual tier from your database here
      // and setCurrentUserTierId(fetchedTierId);
      // For simulation, if you want your account to appear as "Analytics" by default:
      // setCurrentUserTierId("analytics"); 
    }
  }, [user]);

  const handleEmailChange = async () => {
    if (!emailInputValue || emailInputValue === user?.email) {
      setIsEditingEmail(false);
      return;
    }
    setIsUpdatingEmail(true);
    const success = await updateUserEmail(emailInputValue);
    if (success) {
      setIsEditingEmail(false);
    }
    setIsUpdatingEmail(false);
  };

  const handleUsernameChange = async () => {
    if (!usernameInputValue || usernameInputValue === (user?.displayName || user?.email?.split('@')[0])) {
      setIsEditingUsername(false);
      return;
    }
    setIsUpdatingUsername(true);
    const success = await updateUserDisplayName(usernameInputValue);
    if (success) {
      setIsEditingUsername(false);
    }
    setIsUpdatingUsername(false);
  };

  const handlePasswordResetRequest = async () => {
    if (!user || !user.email) {
        toast({ title: "Error", description: "User email not found.", variant: "destructive" });
        return;
    }
    setIsSendingResetEmail(true);
    await sendPasswordReset(user.email);
    setIsSendingResetEmail(false);
  };

  const handlePlanChangeClick = (tierId: string, actionType: string) => {
    if (tierId === currentUserTierId && actionType === "switch_plan") return;

    const targetTier = subscriptionTiers.find(t => t.id === tierId);
    if (!targetTier) return;

    if (actionType === "view_plans") {
        toast({
        title: "Explore Our Plans!",
        description: `You are currently on the ${targetTier.name} tier. Check out our paid plans for more features!`,
        duration: 5000,
        });
        // Optionally, scroll to the paid plans or highlight them
    } else { // switch_plan
        toast({
        title: "Coming Soon!",
        description: `Subscription management for the ${targetTier.name} tier will be available soon.`,
        duration: 5000,
        });
        // In a real app, this would initiate a Stripe checkout flow or similar.
        // For now, we can simulate changing the tier for UI purposes if needed:
        // setCurrentUserTierId(tierId); 
    }
  };


  return (
    <div className="space-y-8">
      <header className="mb-10">
        <div className="flex items-center gap-3">
          <UserCog className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text">Account Settings</h1>
        </div>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your account details, subscription, and security settings.
        </p>
      </header>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCog className="h-6 w-6 text-accent" />
              <CardTitle className="text-xl text-primary">Account Details</CardTitle>
            </div>
            <CardDescription>View and update your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Section */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">Email Address</Label>
              {authLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : isEditingEmail ? (
                <div className="flex items-center gap-2">
                  <Input 
                    id="email" 
                    type="email" 
                    value={emailInputValue}
                    onChange={(e) => setEmailInputValue(e.target.value)}
                    className="bg-input border-border focus:ring-primary" 
                    disabled={isUpdatingEmail}
                  />
                  <Button onClick={handleEmailChange} size="icon" variant="ghost" className="text-primary hover:text-accent" disabled={isUpdatingEmail}>
                    {isUpdatingEmail ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  </Button>
                  <Button onClick={() => { setIsEditingEmail(false); setEmailInputValue(user?.email || "");}} size="icon" variant="ghost" className="text-destructive hover:text-destructive/80" disabled={isUpdatingEmail}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input 
                    id="emailDisplay" 
                    type="email" 
                    value={user?.email || "Loading..."} 
                    readOnly 
                    className="bg-background border-border focus:ring-primary cursor-not-allowed flex-grow" 
                  />
                  <Button 
                    variant="outline" 
                    className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" 
                    onClick={() => { setIsEditingEmail(true); setEmailInputValue(user?.email || ""); }}
                  >
                    Change Email
                  </Button>
                </div>
              )}
               {isEditingEmail && <p className="text-xs text-muted-foreground">A verification link will be sent to your new email address.</p>}
            </div>

            {/* Username Section */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground/80">Username</Label>
              {authLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : isEditingUsername ? (
                 <div className="flex items-center gap-2">
                  <Input 
                    id="username" 
                    type="text" 
                    value={usernameInputValue}
                    onChange={(e) => setUsernameInputValue(e.target.value)}
                    className="bg-input border-border focus:ring-primary" 
                    disabled={isUpdatingUsername}
                  />
                  <Button onClick={handleUsernameChange} size="icon" variant="ghost" className="text-primary hover:text-accent" disabled={isUpdatingUsername}>
                     {isUpdatingUsername ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  </Button>
                  <Button onClick={() => { setIsEditingUsername(false); setUsernameInputValue(user?.displayName || user?.email?.split('@')[0] || "currentUser");}} size="icon" variant="ghost" className="text-destructive hover:text-destructive/80" disabled={isUpdatingUsername}>
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input 
                    id="usernameDisplay" 
                    type="text" 
                    value={user?.displayName || user?.email?.split('@')[0] || "currentUser"} 
                    readOnly 
                    className="bg-background border-border focus:ring-primary cursor-not-allowed flex-grow" 
                  />
                  <Button 
                    variant="outline" 
                    className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" 
                    onClick={() => { setIsEditingUsername(true); setUsernameInputValue(user?.displayName || user?.email?.split('@')[0] || "currentUser"); }}
                  >
                    Change Username
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-accent/20">
          <CardHeader>
             <div className="flex items-center gap-2">
                <CreditCard className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl text-accent">Subscription & Billing</CardTitle>
            </div>
            <CardDescription>Manage your SpiteSpiral subscription plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptionTiers.map((tier) => (
                <Card key={tier.id} className={`flex flex-col ${tier.isCurrent(currentUserTierId) ? 'border-primary shadow-primary/20' : 'border-border'}`}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <tier.icon className={`h-7 w-7 ${tier.isCurrent(currentUserTierId) ? 'text-primary' : 'text-accent'}`} />
                      <CardTitle className={`text-lg ${tier.isCurrent(currentUserTierId) ? 'text-primary' : 'text-accent'}`}>{tier.name}</CardTitle>
                    </div>
                    <CardDescription className="text-2xl font-semibold text-foreground">{tier.price}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-2">
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-accent/70 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className={`w-full ${tier.isCurrent(currentUserTierId) && tier.actionType === "switch_plan" ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90' }`}
                      variant={tier.variant}
                      onClick={() => handlePlanChangeClick(tier.id, tier.actionType)}
                      disabled={tier.isCurrent(currentUserTierId) && tier.actionType === "switch_plan"}
                    >
                      {tier.isCurrent(currentUserTierId) && tier.actionType === "switch_plan" ? "Current Plan" : tier.cta}
                      {tier.actionType === "switch_plan" && !tier.isCurrent(currentUserTierId) && <span className="text-xs ml-1">(Soon)</span>}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <Separator />
            <div>
                <h3 className="text-md font-semibold text-foreground/90 mb-1">Payment Method</h3>
                <p className="text-sm text-muted-foreground mb-2">Your primary payment method will appear here.</p>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/10" disabled>
                    <ExternalLink className="mr-2 h-4 w-4" /> Manage Payment Methods (Soon)
                </Button>
            </div>
            <div>
                <h3 className="text-md font-semibold text-foreground/90 mb-1">Billing History</h3>
                <p className="text-sm text-muted-foreground mb-2">View your past invoices and billing details.</p>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent/10" disabled>
                    View Invoices (Soon)
                </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-accent" /> 
                <CardTitle className="text-xl text-primary">Security Settings</CardTitle>
            </div>
            <CardDescription>Enhance your account security.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button 
                variant="outline" 
                className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" 
                onClick={handlePasswordResetRequest}
                disabled={authLoading || isSendingResetEmail || !user?.email}
              >
                {isSendingResetEmail ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Mail className="mr-2 h-4 w-4" /> 
                )}
                {isSendingResetEmail ? "Sending..." : "Change Password"}
              </Button>
            <div className="mt-2">
                <p className="text-sm text-muted-foreground">Two-Factor Authentication (2FA): <span className="text-destructive font-semibold">Disabled</span></p>
                <Button variant="outline" className="mt-2 border-primary text-primary hover:bg-primary/10" disabled>Enable 2FA (Soon)</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
    

    
