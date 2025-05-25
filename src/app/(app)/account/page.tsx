
'use client';

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCog, CreditCard, ShieldCheck, Save, XCircle, Loader2, Mail, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import NextLink from "next/link"; // For future billing page link

export default function AccountPage() {
  const { user, loading: authLoading, updateUserEmail, updateUserDisplayName, sendPasswordReset } = useAuth();

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
        alert("Error: User email not found."); 
        return;
    }
    setIsSendingResetEmail(true);
    await sendPasswordReset(user.email);
    setIsSendingResetEmail(false);
  };


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
                <CardTitle className="text-xl text-accent">Billing Information</CardTitle>
            </div>
            <CardDescription>Manage your subscription and payment methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Plan:</p>
              <p className="text-lg font-semibold text-foreground">Free Tier (Limited)</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Next Billing Date:</p>
              <p className="text-lg font-semibold text-muted-foreground">N/A</p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" disabled>
              <ExternalLink className="mr-2 h-4 w-4" /> Upgrade to Pro (Soon)
            </Button>
            <Button variant="outline" className="ml-2 border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" disabled>
              View Invoices (Soon)
            </Button>
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
                <Button variant="outline" className="mt-2 border-primary text-primary hover:bg-primary/10 hover:text-primary-foreground" disabled>Enable 2FA (Soon)</Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
