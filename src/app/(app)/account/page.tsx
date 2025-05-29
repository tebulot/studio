
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, CreditCard, ShieldCheck, Save, XCircle, Loader2, Mail, ExternalLink, CheckCircle, Zap, BarChartHorizontalBig, Eye } from "lucide-react";
import { useAuth, type UserProfile } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { format } from 'date-fns';

// Ensure these IDs and Stripe Price IDs match your setup.
// If your backend stores Stripe Price IDs in userProfile.activeTierId for paid plans,
// the stripePriceId here MUST match that value for the correct plan name to be displayed.
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
    cta: "Switch to Window Shopping", // Consistent CTA
    variant: "outline" as const,
    actionType: "switch_plan" as const, // Consistent actionType
    stripePriceId: null,
  },
  {
    id: "set_and_forget",
    name: "Set & Forget",
    price: "$5/mo",
    features: [
      "1 Managed URL",
      "Dashboard Stats (30-min refresh)",
      "Email Support",
    ],
    icon: Zap,
    cta: "Switch to Set & Forget",
    variant: "default" as const,
    actionType: "switch_plan" as const,
    stripePriceId: "price_1RSzbxQO5aNncTFjyeaANlLf", // CONFIRMED - KEEP THIS
  },
  {
    id: "analytics",
    name: "Analytics",
    price: "$20/mo",
    features: [
      "Up to 3 Managed URLs",
      "Advanced Dashboard Analytics (Coming soon)",
      "Priority Email Support",
    ],
    icon: BarChartHorizontalBig,
    cta: "Switch to Analytics",
    variant: "default" as const,
    actionType: "switch_plan" as const,
    stripePriceId: "price_1RTim1KPVCKvfVVwDkc5G0at",
  },
];

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function AccountPage() {
  const { user, userProfile, loading: authContextLoading, updateUserEmail, updateUserDisplayName, sendPasswordReset } = useAuth();
  const { toast } = useToast();

  console.log("AccountPage rendered. UserProfile:", userProfile);

  const [isSubmittingPlanChange, setIsSubmittingPlanChange] = useState<string | null>(null);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailInputValue, setEmailInputValue] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInputValue, setUsernameInputValue] = useState("");
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);

  const loading = authContextLoading;

  useEffect(() => {
    if (user) {
      setEmailInputValue(user.email || "");
      setUsernameInputValue(user.displayName || user.email?.split('@')[0] || "currentUser");
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

  const handlePlanChangeClick = async (tierId: string, actionType: string, stripePriceId: string | null) => {
    if (!user || !userProfile) {
      toast({ title: "Authentication Error", description: "Please log in to change your plan.", variant: "destructive" });
      return;
    }
    
    const isCurrentPlan = userProfile.activeTierId === tierId || (stripePriceId && userProfile.activeTierId === stripePriceId);
    if (isCurrentPlan && actionType === "switch_plan") {
        return; 
    }

    const targetTier = subscriptionTiers.find(t => t.id === tierId);
    if (!targetTier) return;

    if (tierId === "window_shopping") {
      if (userProfile.activeTierId === "window_shopping") {
        toast({
          title: "Explore Paid Plans",
          description: "You are currently on the Window Shopping plan. Check out our paid plans for more features!",
          duration: 5000,
        });
        return;
      }
      // User is on a paid plan and wants to switch to "Window Shopping" (cancel)
      toast({
        title: "Manage Subscription",
        description: "To switch to the Window Shopping plan (which typically involves canceling your current paid subscription), please manage your subscription via the Stripe Customer Portal.",
        duration: 7000,
      });
      await handleManageSubscription();
      return;
    }
    
    if (actionType === "switch_plan") {
        if (!stripePriceId || stripePriceId.startsWith("price_REPLACE_WITH_YOUR_")) {
            toast({ title: "Configuration Error", description: "Stripe Price ID not configured for this plan. Please contact support.", variant: "destructive" });
            console.error(`Stripe Price ID placeholder/issue for tier: ${tierId}. Actual stripePriceId value found: '${stripePriceId}'`);
            return;
        }
        if (!stripePromise) {
            toast({ title: "Stripe Error", description: "Stripe is not configured correctly. Please contact support.", variant: "destructive" });
            console.error("Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) not found in environment variables.");
            return;
        }

        const apiBaseUrl = process.env.NEXT_PUBLIC_SPITESPIRAL_API_BASE_URL;
        if (!apiBaseUrl) {
          toast({ title: "Configuration Error", description: "API base URL not configured. Please contact support.", variant: "destructive" });
          console.error("NEXT_PUBLIC_SPITESPIRAL_API_BASE_URL environment variable is not set.");
          return;
        }

        setIsSubmittingPlanChange(tierId);
        try {
            const idToken = await user.getIdToken();

            const response = await fetch(`${apiBaseUrl}/v1/stripe/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ priceId: stripePriceId }), 
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Failed to create Stripe Checkout session. Status: ${response.status}. Please check server logs and API availability.` }));
                throw new Error(errorData.message || `Failed to create Stripe Checkout session. Status: ${response.status}`);
            }

            const { sessionId } = await response.json();
            if (!sessionId) {
                throw new Error("Stripe Checkout session ID not received from backend.");
            }

            const stripe = await stripePromise;
            if (stripe) {
                const { error } = await stripe.redirectToCheckout({ sessionId });
                if (error) {
                    console.error("Stripe redirect error:", error);
                    toast({ title: "Stripe Error", description: error.message || "Could not redirect to Stripe Checkout.", variant: "destructive" });
                }
            } else {
                 throw new Error("Stripe.js failed to load.");
            }
        } catch (error) {
            console.error("Plan change error:", error);
            let errorMessage = "An unexpected error occurred during plan change.";
            if (error instanceof Error) {
                if (error.message.includes("Failed to fetch")) {
                    errorMessage = "Could not connect to the server to initiate plan change. Please check your internet connection and try again. If the issue persists, the service may be temporarily unavailable.";
                } else {
                    errorMessage = error.message;
                }
            }
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSubmittingPlanChange(null);
        }
    }
  };

  const handleManageSubscription = async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "Please log in to manage your subscription.", variant: "destructive" });
      return;
    }
     if (!stripePromise) {
        toast({ title: "Stripe Error", description: "Stripe is not configured correctly. Please contact support.", variant: "destructive" });
        console.error("Stripe Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) not found in environment variables.");
        return;
    }

    const apiBaseUrl = process.env.NEXT_PUBLIC_SPITESPIRAL_API_BASE_URL;
    if (!apiBaseUrl) {
      toast({ title: "Configuration Error", description: "API base URL not configured. Please contact support.", variant: "destructive" });
      console.error("NEXT_PUBLIC_SPITESPIRAL_API_BASE_URL environment variable is not set.");
      return;
    }

    setIsManagingSubscription(true);
    try {
        const idToken = await user.getIdToken();

        const response = await fetch(`${apiBaseUrl}/v1/stripe/create-customer-portal-session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `Failed to create Stripe Customer Portal session. Status: ${response.status}. Please check server logs and API availability.` }));
            throw new Error(errorData.message || `Failed to create Stripe Customer Portal session. Status: ${response.status}`);
        }

        const { portalUrl } = await response.json();
        if (!portalUrl) {
            throw new Error("Stripe Customer Portal URL not received from backend.");
        }
        window.location.href = portalUrl;

    } catch (error) {
        console.error("Manage subscription error:", error);
        let errorMessage = "Could not open subscription management.";
         if (error instanceof Error) {
            if (error.message.includes("Failed to fetch")) {
                errorMessage = "Could not connect to the server to manage subscription. Please check your internet connection and try again. If the issue persists, the service may be temporarily unavailable.";
            } else {
                errorMessage = error.message;
            }
        }
        toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
        setIsManagingSubscription(false);
    }
  }

  // This is the ID from userProfile (e.g., "window_shopping" or "price_xxxx")
  const profileActiveTierId = userProfile?.activeTierId || "window_shopping";
  
  // Find the full tier object based on profileActiveTierId
  // This will try to match against tier.stripePriceId first, then tier.id
  const currentPlanObject = 
    subscriptionTiers.find(t => t.stripePriceId && t.stripePriceId === profileActiveTierId) ||
    subscriptionTiers.find(t => t.id === profileActiveTierId);
  
  // If currentPlanObject is found, use its name. Otherwise, fallback to profileActiveTierId (which might be the price_xxx string).
  const currentPlanName = currentPlanObject?.name || profileActiveTierId;

  const currentSubscriptionStatus = userProfile?.subscriptionStatus;
  const currentPeriodEnd = userProfile?.currentPeriodEnd;
  const downgradeToTierId = userProfile?.downgradeToTierId;
  
  // Similar lookup for the downgrade tier name
  const downgradeToTierObject = 
    subscriptionTiers.find(t => t.stripePriceId && t.stripePriceId === downgradeToTierId) ||
    subscriptionTiers.find(t => t.id === downgradeToTierId);
  const downgradeToTierName = downgradeToTierObject?.name;


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
            {loading ? (
              <>
                <Skeleton className="h-6 w-1/4 mb-2" /> <Skeleton className="h-10 w-full" />
                <Skeleton className="h-6 w-1/4 mb-2 mt-4" /> <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground/80">Email Address</Label>
                  {isEditingEmail ? (
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

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-foreground/80">Username</Label>
                  {isEditingUsername ? (
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
              </>
            )}
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
            {loading ? (
                <Skeleton className="h-5 w-3/4 mt-1" />
            ) : userProfile ? (
              <CardDescription>
                Your current plan: <span className="font-semibold text-primary">{currentPlanName}</span>.
                Status: <span className="font-semibold text-primary">{userProfile.subscriptionStatus || "unknown"}</span>.
                {(userProfile.subscriptionStatus === "active" || userProfile.subscriptionStatus === "trialing" || userProfile.subscriptionStatus === "active_until_period_end" || userProfile.subscriptionStatus === "pending_downgrade" ) && userProfile.currentPeriodEnd && (
                  <> Renews/Ends: <span className="font-semibold text-primary">{format(userProfile.currentPeriodEnd.toDate(), 'PPP')}</span>.</>
                )}
                { (userProfile.subscriptionStatus === "active_until_period_end" || userProfile.subscriptionStatus === "pending_downgrade") && downgradeToTierName && (
                  <span className="block mt-1 text-sm text-amber-500">Your plan will change to {downgradeToTierName} on {userProfile.currentPeriodEnd ? format(userProfile.currentPeriodEnd.toDate(), 'PPP') : 'the next billing date'}.</span>
                )}
              </CardDescription>
            ) : (
              <CardDescription>Loading subscription details... (If this persists, your user profile might not be fully initialized in Firestore.)</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-60 w-full" />)}
                </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptionTiers.map((tier) => {
                  const isThisTierCurrent = 
                    (tier.stripePriceId && tier.stripePriceId === profileActiveTierId) || // Matched by Stripe Price ID
                    tier.id === profileActiveTierId; // Matched by internal ID

                  return (
                    <Card key={tier.id} className={`flex flex-col ${isThisTierCurrent ? 'border-primary shadow-primary/20' : 'border-border'}`}>
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <tier.icon className={`h-7 w-7 ${isThisTierCurrent ? 'text-primary' : 'text-accent'}`} />
                          <CardTitle className={`text-lg ${isThisTierCurrent ? 'text-primary' : 'text-accent'}`}>{tier.name}</CardTitle>
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
                          className={`w-full ${isThisTierCurrent && tier.actionType === "switch_plan" ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90' }`}
                          variant={tier.variant}
                          onClick={() => handlePlanChangeClick(tier.id, tier.actionType, tier.stripePriceId)}
                          disabled={
                              loading || 
                              isSubmittingPlanChange === tier.id ||
                              (isThisTierCurrent && tier.actionType === "switch_plan") ||
                              (tier.id !== 'window_shopping' && userProfile && 
                                  !['active', 'trialing', 'window_shopping', 'active_until_period_end', 'pending_downgrade'].includes(userProfile.subscriptionStatus || ''))
                          }
                        >
                          {isSubmittingPlanChange === tier.id ? <Loader2 className="h-5 w-5 animate-spin" /> :
                           (isThisTierCurrent && tier.actionType === "switch_plan") ? "Current Plan" : tier.cta}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
            <Separator />
             <div>
                <h3 className="text-md font-semibold text-foreground/90 mb-1">Payment & Invoices</h3>
                <p className="text-sm text-muted-foreground mb-2">Manage your payment method and view billing history via Stripe.</p>
                <Button
                  variant="outline"
                  className="border-accent text-accent hover:bg-accent/10"
                  onClick={handleManageSubscription}
                  disabled={
                    isManagingSubscription ||
                    loading ||
                    !userProfile ||
                    profileActiveTierId === "window_shopping" || 
                    !(
                      userProfile.subscriptionStatus === "active" ||
                      userProfile.subscriptionStatus === "trialing" ||
                      userProfile.subscriptionStatus === "active_until_period_end" ||
                      userProfile.subscriptionStatus === "pending_downgrade"
                    )
                  }
                >
                    {isManagingSubscription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" /> }
                    Manage Subscription (Stripe)
                </Button>
                 {userProfile && profileActiveTierId === "window_shopping" && !loading &&(
                    <p className="text-xs text-muted-foreground mt-1">Select a paid plan to manage your subscription.</p>
                )}
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
                disabled={loading || isSendingResetEmail || !user?.email}
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
