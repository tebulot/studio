
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import BrandLogoIcon from "@/components/icons/BrandLogoIcon";
import { Home } from "lucide-react";

export const metadata: Metadata = {
  title: "Licenses & Acknowledgements - SpiteSpiral Tarpit",
  description: "Licenses and acknowledgements for software used by SpiteSpiral Tarpit.",
};

export default function LicensesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-mono text-foreground">
      <header className="sticky top-0 z-40 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between py-3">
          <NextLink href="/" className="flex items-center gap-3 group">
            <BrandLogoIcon className="h-12 w-12 md:h-14 md:w-14 text-primary" isPriority />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-sans glitch-text">
                <span className="text-primary-foreground">Spite</span><span className="text-primary">Spiral</span>
              </h1>
            </div>
          </NextLink>
          <nav className="flex items-center gap-2">
             <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground">
                <NextLink href="/">
                    <Home className="mr-2 h-4 w-4" /> Back to Homepage
                </NextLink>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 container mx-auto max-w-3xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text sm:text-5xl">Licenses & Acknowledgements</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            SpiteSpiral Tarpit utilizes and acknowledges the following open-source software.
          </p>
        </div>
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-accent">Nepenthes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground/80">
              Our tarpit functionality is heavily inspired by and originally based on concepts from Nepenthes,
              a versatile low-interaction honeypot. We are grateful for its contributions to the security community.
            </p>
            <p className="text-foreground/80">
              Nepenthes is typically distributed under the MIT License.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              For more information on the MIT License, please visit:
              <a
                href="https://opensource.org/licenses/MIT"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-accent hover:text-primary underline"
              >
                opensource.org/licenses/MIT
              </a>
            </p>
          </CardContent>
        </Card>
        {/* You can add more Card components here for other licenses/acknowledgements as needed */}
      </main>
      <footer className="py-6 md:px-8 md:py-0 border-t border-primary/10 bg-card/50">
        <div className="container flex flex-col items-center justify-center gap-2 md:h-20 text-center">
          <NextLink href="/" className="flex items-center gap-2 group mb-2">
            <BrandLogoIcon className="h-8 w-8 text-primary" />
            <span className="text-sm font-semibold text-primary">SpiteSpiral</span>
          </NextLink>
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} SpiteSpiral Industries. Trap with malice.
          </p>
        </div>
      </footer>
    </div>
  );
}
