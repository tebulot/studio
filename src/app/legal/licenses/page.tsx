
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import BrandLogoIcon from "@/components/icons/BrandLogoIcon";
import { Home, Link as LinkIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "Licenses & Acknowledgements - SpiteSpiral",
  description: "Licenses and acknowledgements for software used by SpiteSpiral.",
};

const dependencies = [
  { name: "lustache", license: "MIT" },
  { name: "dkjson", license: "MIT/X11" },
  { name: "basexx", license: "MIT" },
  { name: "binaryheap", license: "MIT/X11" },
  { name: "fifo", license: "MIT/X11" },
  { name: "lpeg_patterns", license: "MIT/X11" },
  { name: "http", license: "MIT" },
  { name: "api7-lua-tinyyaml", license: "MIT" },
];

const authorLibraries = [
  { name: "perihelion", license: "MIT (Same as Nepenthes)" },
  { name: "sqltable", license: "MIT (Same as Nepenthes)" },
  { name: "daemonparts", license: "MIT (Same as Nepenthes)" },
];

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
      <main className="flex-1 container mx-auto max-w-4xl py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-primary glitch-text sm:text-5xl">Licenses & Acknowledgements</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            SpiteSpiral utilizes, is inspired by, and gratefully acknowledges the following open-source software and its creators.
          </p>
        </div>

        <Card className="shadow-lg border-primary/20 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-accent">Nepenthes</CardTitle>
            <CardDescription className="text-muted-foreground">
              Core inspiration and foundational concepts by Aaron.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-foreground/80">
              SpiteSpiral's tarpit functionality is heavily inspired by and originally based on concepts from Nepenthes,
              a versatile low-interaction honeypot created by Aaron. We are immensely grateful for his contributions to the security community.
            </p>
            <p className="text-foreground/80">
              Nepenthes is distributed under the MIT License. Some of its common dependencies also utilize the X11 License.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                <a
                    href="https://zadzmo.org/code/nepenthes/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-accent text-accent rounded-md text-sm font-medium hover:bg-accent/10 hover:text-accent-foreground transition-colors"
                >
                    <LinkIcon className="mr-2 h-4 w-4" /> Visit Nepenthes Homepage (zadzmo.org)
                </a>
                <a
                    href="https://opensource.org/licenses/MIT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 hover:text-primary-foreground transition-colors"
                >
                    <LinkIcon className="mr-2 h-4 w-4" /> View MIT License Details
                </a>
                <a
                    href="https://spdx.org/licenses/X11.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-primary text-primary rounded-md text-sm font-medium hover:bg-primary/10 hover:text-primary-foreground transition-colors"
                >
                    <LinkIcon className="mr-2 h-4 w-4" /> View X11 License Details
                </a>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-accent/20 mb-8">
          <CardHeader>
            <CardTitle className="text-xl text-primary">Nepenthes Associated Libraries (by Aaron)</CardTitle>
            <CardDescription className="text-muted-foreground">
              Libraries by the creator of Nepenthes, Aaron, typically distributed under MIT license terms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              {authorLibraries.map((lib) => (
                <li key={lib.name}>
                  <span className="font-semibold">{lib.name}</span> - ({lib.license})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl text-accent">Nepenthes Dependencies</CardTitle>
            <CardDescription className="text-muted-foreground">
              Other open-source dependencies often included with Nepenthes, each with their own licenses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-foreground/80">
              {dependencies.map((dep) => (
                <li key={dep.name}>
                  <span className="font-semibold">{dep.name}</span> - ({dep.license})
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3">
              Deploying Nepenthes or systems derived from it implies acceptance of these respective licenses. Always refer to the original distribution for precise licensing terms.
            </p>
          </CardContent>
        </Card>

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

    