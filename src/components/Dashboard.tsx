"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowUpRight,
  ChevronRight,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { categories, tools } from "@/data/tools";
import type { Category, ToolDefinition } from "@/types";
import { ToolWorkspace } from "./ToolWorkspace";

// These references must remain static so Next.js can replace them at build time.
const socials = [
  { name: "Website", url: process.env.NEXT_PUBLIC_WEBSITE },
  { name: "LinkedIn", url: process.env.NEXT_PUBLIC_LINKEDIN },
  { name: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK },
  { name: "X", url: process.env.NEXT_PUBLIC_X },
  { name: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM },
  { name: "YouTube", url: process.env.NEXT_PUBLIC_YOUTUBE },
].filter((social): social is { name: string; url: string } => Boolean(social.url));

export function Dashboard() {
  const [category, setCategory] = useState<"All tools" | Category>("All tools"),
    [search, setSearch] = useState(""),
    [active, setActive] = useState<ToolDefinition | null>(null);
  const filtered = useMemo(
    () =>
      tools.filter(
        (t) =>
          (category === "All tools" || t.category === category) &&
          `${t.title} ${t.description} ${t.tags.join(" ")}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [category, search],
  );
  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-logo-crop">
            <Image
              src="/devkitcircle-logo.png"
              alt=""
              width={500}
              height={500}
              priority
            />
          </span>
          <span>
            DevKitCircle<small>by CollabCircle</small>
          </span>
        </a>
        <label className="search">
          <Search size={17} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
          />
        </label>
        <a
          className="product-link"
          href={process.env.NEXT_PUBLIC_WEBSITE}
          target="_blank"
          rel="noreferrer"
          aria-label="Visit CollabCircle"
        >
          <span>A Product of CollabCircle</span>
          <ArrowUpRight size={15} />
        </a>
      </header>
      <div className="app-body">
        <main>
          <section className="hero">
            <h1>
              Developer tools, <em>in your browser.</em>
            </h1>
            <p>
              Convert, inspect, format, and generate 100% Free and Private. Your
              input never leaves your device.
            </p>
          </section>
          <section className="tools-section">
            <nav className="category-tabs" aria-label="Tool categories">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </nav>
            <div className="section-heading">
              <h2>{category}</h2>
              <span>{filtered.length} tools</span>
            </div>
            {filtered.length ? (
              <div className="tool-grid">
                {filtered.map((tool) => (
                  <button
                    className="tool-card"
                    key={tool.id}
                    onClick={() => setActive(tool)}
                  >
                    <div className="card-top">
                      <span className="tool-icon">
                        <tool.icon />
                      </span>
                      <ChevronRight />
                    </div>
                    <h3>{tool.title}</h3>
                    <p>{tool.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty">
                <Search />
                <h3>No tools found</h3>
                <p>Change the search or category.</p>
              </div>
            )}
          </section>
        </main>
      </div>
      <footer>
        <a className="brand footer-brand" href="#">
          <span className="brand-logo-crop">
            <Image
              src="/devkitcircle-logo.png"
              alt=""
              width={500}
              height={500}
            />
          </span>
          <span>
            DevKitCircle<small>by CollabCircle</small>
          </span>
        </a>
        <div className="footer-links">
          {socials.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noreferrer">
              {s.name}
            </a>
          ))}
        </div>
      </footer>
      {active && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setActive(null);
          }}
        >
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tool-title"
          >
            <header>
              <div className="modal-title">
                <span className="tool-icon">
                  <active.icon />
                </span>
                <div>
                  <small>{active.category}</small>
                  <h2 id="tool-title">{active.title}</h2>
                </div>
              </div>
              <button
                className="close"
                onClick={() => setActive(null)}
                aria-label="Close tool"
              >
                <X />
              </button>
            </header>
            <div className="privacy-strip">
              <ShieldCheck size={14} /> Processing locally — your input never
              leaves this device
            </div>
            <div className="workspace">
              <ToolWorkspace id={active.id} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
