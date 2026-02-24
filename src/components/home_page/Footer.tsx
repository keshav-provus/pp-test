
"use client";

import Link from "next/link";
import { Spade } from "lucide-react";

const FOOTER_LINKS = {
  Product: [
    { label: "Services Quoting", href: "https://provus.ai/services-quoting/" },
    { label: "Services CPQ", href: "https://provus.ai/services-cpq/" },
    { label: "CPQ Express", href: "https://provus.ai/cpq-express/" },
  ],
  Solutions: [
    { label: "Professional Services", href: "https://provus.ai/solutions/professional-services/" },
    { label: "Consulting Services", href: "https://provus.ai/solutions/consulting-services/" },
    { label: "Asset-based Services", href: "https://provus.ai/solutions/asset-based-services/" },
  ],
  Resources: [
    { label: "Blog", href: "https://provus.ai/blog/" },
    { label: "Glossary", href: "https://provus.ai/cpq-software-glossary/" },
    { label: "Podcasts", href: "https://provus.ai/podcasts/" },
    { label: "Resource Center", href: "https://provus.ai/resources/" },
  ],
  Company: [
    { label: "About Us", href: "https://provus.ai/company/" },
    { label: "Customers", href: "https://provus.ai/customers/" },
    { label: "Careers", href: "https://provus.ai/careers/" },
    { label: "Contact Us", href: "https://provus.ai/contact-us/" },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12">
          
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                <Spade className="w-4 h-4 text-primary" />
              </div>
              <span className="text-foreground font-semibold text-lg tracking-tight">
                Provus<span className="text-primary">Poker</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm font-light leading-relaxed max-w-[200px]">
              Agile estimation, built for the Provus team.
            </p>

            {/* Social */}
            <div className="flex items-center gap-3 mt-8">
              {['Twitter', 'LinkedIn', 'YouTube'].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted transition-all"
                  aria-label={platform}
                >
                  <div className="w-4 h-4 bg-current opacity-80" style={{ maskImage: 'url(https://unpkg.com/lucide-static@0.344.0/icons/share-2.svg)', maskSize: 'contain' }} /> 
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-foreground text-xs font-semibold tracking-widest uppercase mb-5">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground text-sm font-light hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm font-light">
            © {new Date().getFullYear()} Provus Inc. All Rights Reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://provus.ai/legal/" className="text-muted-foreground text-sm font-light hover:text-foreground transition-colors">
              Legal
            </a>
            <a href="https://provus.ai/company/" className="text-muted-foreground text-sm font-light hover:text-foreground transition-colors">
              provus.ai
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}