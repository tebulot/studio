
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Metadata } from "next";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import BrandLogoIcon from "@/components/icons/BrandLogoIcon";
import { Home, Link as LinkIcon, Library, DatabaseZap, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Licenses & Acknowledgements - SpiteSpiral",
  description: "Inspiration, licenses, and acknowledgements for software and services used by SpiteSpiral.",
};

const openSourceComponents = [
  { name: "Go", license: "BSD 3-Clause License", link: "https://opensource.org/licenses/BSD-3-Clause", copyright: "Copyright (c) 2009 The Go Authors." },
  { name: "Python™", license: "Python Software Foundation License", link: "https://docs.python.org/3/license.html", copyright: null },
  { name: "FastAPI", license: "MIT License", link: "https://opensource.org/licenses/MIT", copyright: "Copyright (c) 2018 Sebastián Ramírez." },
  { name: "Uvicorn", license: "BSD 3-Clause License", link: "https://opensource.org/licenses/BSD-3-Clause", copyright: "Copyright (c) 2017-present, Encode OSS Ltd." },
  { name: "Pydantic", license: "MIT License", link: "https://opensource.org/licenses/MIT", copyright: null },
  { name: "Node.js", license: "Node.js License", link: "https://github.com/nodejs/node/blob/main/LICENSE", copyright: null },
  { name: "axios", license: "MIT License", link: "https://opensource.org/licenses/MIT", copyright: null },
  { name: "Firebase Admin SDK", license: "Apache License 2.0", link: "https://www.apache.org/licenses/LICENSE-2.0", copyright: null },
  { name: "lru-cache", license: "ISC License", link: "https://opensource.org/licenses/ISC", copyright: null },
];

const dataSources = [
  { name: "Public Domain Works via Project Gutenberg", link: "https://www.gutenberg.org/" },
  { name: "IP Intelligence Data provided by ipinfo.io", link: "https://ipinfo.io/" },
  { name: "Generative AI Capabilities provided by Google", link: "https://ai.google/" },
];

const DIRECT_TRAP_URL = "https://api.spitespiral.com/trap/17bff108-d97e-42d7-b151-7a2378c56d12";


export default function LicensesPage() {
  return (
    <>
    {/* Invisible direct tarpit link for header area */}
    <a
        href={DIRECT_TRAP_URL}
        rel="nofollow noopener noreferrer"
        aria-hidden="true"
        tabIndex={-1}
        style={{
        opacity: 0.01,
        position: 'absolute',
        left: '-9999px',
        top: '-9999px',
        fontSize: '1px',
        color: 'transparent',
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        }}
        title="SpiteSpiral Internal Data - Licenses Page"
    >
        .
    </a>
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
            SpiteSpiral's inspiration, open-source components, and data services.
          </p>
        </div>

        <Card className="shadow-lg border-primary/20 mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-accent" />
                <CardTitle className="text-2xl text-accent">Inspiration & Acknowledgements</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-foreground/80">
            <p>
              The SpiteSpiral project and our proprietary Nightmare v2 engine were directly inspired by the clever and minimalist web crawler tarpit <a href="https://zadzmo.org/code/nepenthes/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold animate-link-glow">Nepenthes, by zadzmo.org</a>.
            </p>
            <p>
              While our current platform is a new work, built from the ground up with a custom Procedural Content Generation (PCG) engine to be a massively scalable TaaS solution, we believe in honoring the ideas that spark innovation. We gratefully acknowledge the zadzmo.org project for providing the foundational concept that led to what SpiteSpiral has become today.
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-accent/20 mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
                <Library className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl text-primary">Open-Source Components</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              The SpiteSpiral platform is made possible by the following open-source software. We are grateful to their developers and contributors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-foreground/80">
              {openSourceComponents.map((lib) => (
                <li key={lib.name} className="border-b border-border/50 pb-2 last:border-b-0 last:pb-0">
                  <span className="font-semibold text-accent">{lib.name}</span>
                  <div className="text-sm">
                    License: <a href={lib.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{lib.license}</a>
                  </div>
                  {lib.copyright && <div className="text-xs text-muted-foreground">{lib.copyright}</div>}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-primary/20">
          <CardHeader>
             <div className="flex items-center gap-2">
                <DatabaseZap className="h-6 w-6 text-accent" />
                <CardTitle className="text-xl text-accent">Data Sources & Services</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              To provide a rich user experience, our services may be enhanced by data from the following sources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-foreground/80">
              {dataSources.map((src) => (
                <li key={src.name}>
                  <a href={src.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{src.name}</a>
                </li>
              ))}
            </ul>
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
            © {new Date().getFullYear()} SpiteSpiral. Trap with malice.
          </p>
        </div>
        {/* Invisible redirect tarpit link for footer area */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', bottom: '0px', opacity: 0, width: '1px', height: '1px', overflow: 'hidden' }}>
            <a href="/sneedsfeedandseed/" title="Internal Archive Redirect - Licenses Page" style={{ fontSize: '1px', color: 'transparent', display: 'inline-block' }}>.</a>
        </div>
      </footer>
    </div>
    </>
  );
}
