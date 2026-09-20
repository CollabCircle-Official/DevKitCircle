"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ArrowUpRight,
  ChevronRight,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  Trash2,
  X,
} from "lucide-react";
import { categories, tools } from "@/data/tools";
import type { Category, ToolDefinition } from "@/types";
const ToolWorkspace = dynamic(
  () => import("./ToolWorkspace").then((module) => module.ToolWorkspace),
  {
    ssr: false,
    loading: () => <div className="workspace-loading">Loading tool…</div>,
  },
);

// These references must remain static so Next.js can replace them at build time.
const socials = [
  { name: "Website", url: process.env.NEXT_PUBLIC_WEBSITE },
  { name: "LinkedIn", url: process.env.NEXT_PUBLIC_LINKEDIN },
  { name: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK },
  { name: "X", url: process.env.NEXT_PUBLIC_X },
  { name: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM },
  { name: "YouTube", url: process.env.NEXT_PUBLIC_YOUTUBE },
].filter((social): social is { name: string; url: string } =>
  Boolean(social.url),
);

export function Dashboard() {
  const [category, setCategory] = useState<"All tools" | Category>("All tools"),
    [search, setSearch] = useState(""),
    [active, setActive] = useState<ToolDefinition | null>(null),
    [recent, setRecent] = useState<string[]>([]),
    [theme, setTheme] = useState<"light" | "dark">("light");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setRecent(JSON.parse(localStorage.getItem("devkit-recent") || "[]"));
    const savedTheme =
      localStorage.getItem("devkit-theme") === "dark" ? "dark" : "light";
    setTheme(savedTheme);
    document.documentElement.dataset.theme = savedTheme;
    const requested = new URLSearchParams(location.search).get("tool");
    const tool = tools.find((item) => item.id === requested);
    if (tool) setActive(tool);
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") setActive(null);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);
  function openTool(tool: ToolDefinition) {
    setActive(tool);
    const next = [tool.id, ...recent.filter((id) => id !== tool.id)].slice(
      0,
      6,
    );
    setRecent(next);
    localStorage.setItem("devkit-recent", JSON.stringify(next));
    history.replaceState(null, "", `?tool=${tool.id}`);
  }
  function closeTool() {
    setActive(null);
    history.replaceState(null, "", location.pathname);
  }
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("devkit-theme", next);
  }
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
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tools..."
          />
        </label>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Use ${theme === "light" ? "dark" : "light"} theme`}
        >
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>
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
            {category === "All tools" && recent.length > 0 && !search && (
              <div className="recent-tools">
                <span>Recent</span>
                {recent.map((id) => {
                  const tool = tools.find((t) => t.id === id);
                  return tool ? (
                    <button key={id} onClick={() => openTool(tool)}>
                      {tool.title}
                    </button>
                  ) : null;
                })}
              </div>
            )}
            {filtered.length ? (
              <div className="tool-grid">
                {filtered.map((tool) => (
                  <button
                    className="tool-card"
                    key={tool.id}
                    onClick={() => openTool(tool)}
                    aria-label={`Open ${tool.title}`}
                  >
                    <div className="card-top">
                      <span className="tool-icon">
                        <tool.icon />
                      </span>
                      <span className="card-category">{tool.category}</span>
                      <span className="card-arrow" aria-hidden="true">
                        <ChevronRight />
                      </span>
                    </div>
                    <div className="card-copy">
                      <h3>{tool.title}</h3>
                      <p>{tool.description}</p>
                    </div>
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
          <button
            onClick={() => {
              localStorage.clear();
              setRecent([]);
            }}
          >
            <Trash2 size={13} /> Clear local data
          </button>
        </div>
      </footer>
      {active && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeTool();
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
                onClick={closeTool}
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
