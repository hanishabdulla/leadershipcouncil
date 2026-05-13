"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Download, RotateCcw, Check } from "lucide-react";
import { toBlob, toPng } from "html-to-image";
import { leaders, tiers } from "./data";

const MAX_SELECTIONS = 3;
const BUDGET = 10;

export default function Home() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [countryName, setCountryName] = useState("");
  const [status, setStatus] = useState("");
  const cardRef = useRef(null);

  const selected = useMemo(
    () => selectedIds.map((id) => leaders.find((l) => l.id === id)).filter(Boolean),
    [selectedIds],
  );

  const total = selected.reduce((sum, l) => sum + l.price, 0);
  const remaining = BUDGET - total;
  const isComplete = selected.length === MAX_SELECTIONS && total <= BUDGET;
  const cardSlots = Array.from({ length: MAX_SELECTIONS }, (_, i) => selected[i] || null);

  const toggleLeader = (leader) => {
    setStatus("");
    if (selectedIds.includes(leader.id)) {
      setSelectedIds((cur) => cur.filter((id) => id !== leader.id));
      return;
    }
    if (selectedIds.length >= MAX_SELECTIONS || total + leader.price > BUDGET) return;
    setSelectedIds((cur) => [...cur, leader.id]);
  };

  const canPick = (leader) =>
    selectedIds.includes(leader.id) ||
    (selectedIds.length < MAX_SELECTIONS && total + leader.price <= BUDGET);

  const downloadCard = async () => {
    if (!cardRef.current || !isComplete) return;
    const dataUrl = await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#06080c",
    });
    const link = document.createElement("a");
    link.download = "leader-council.png";
    link.href = dataUrl;
    link.click();
    setStatus("Downloaded PNG");
  };

  const copyCard = async () => {
    if (!cardRef.current || !isComplete) return;
    try {
      const blob = await toBlob(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#06080c",
      });
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setStatus("Copied image");
    } catch {
      const names = selected.map((l) => l.name).join(", ");
      await navigator.clipboard.writeText(names);
      setStatus("Copied names");
    }
  };

  const remainingPicks = MAX_SELECTIONS - selected.length;

  return (
    <main className="page">
      {/* ── Header ── */}
      <header className="header">
        <div className="headerLeft">
          <h1 className="title">Lemonade Stand Leadership Council</h1>
          <span className="tagline">Three leaders · Ten dollars</span>
        </div>
        <div className="stats" aria-live="polite">
          <div className="stat">
            <span className="statValue">${remaining}</span>
            <span className="statLabel">remaining</span>
          </div>
          <span className="statDot" aria-hidden="true" />
          <div className="stat">
            <span className="statValue">{selected.length}/3</span>
            <span className="statLabel">selected</span>
          </div>
        </div>
      </header>

      {/* ── Tier Board ── */}
      <section className="tiers" aria-label="Leader tiers">
        {tiers.map((tier) => (
          <div className="tier" key={tier}>
            <div className="tierDivider">
              <hr />
              <span className="tierLabel">${tier}</span>
              <hr />
            </div>
            <div className="grid">
              {leaders
                .filter((l) => l.price === tier)
                .map((leader) => {
                  const picked = selectedIds.includes(leader.id);
                  const disabled = !canPick(leader);

                  return (
                    <button
                      className="card"
                      data-selected={picked}
                      disabled={disabled}
                      key={leader.id}
                      onClick={() => toggleLeader(leader)}
                      type="button"
                    >
                      <img alt="" src={`/portraits/${leader.id}.jpg`} />
                      <div className="cardOverlay" />
                      <span className="cardName">{leader.name}</span>
                      <span className="cardCheck" aria-hidden="true">
                        <Check size={14} />
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </section>

      {/* ── Your Council ── */}
      <section className="council" aria-label="Your council">
        <div className="councilHead">
          <h2>Your Council</h2>
          <div className="councilDivider" />
          <span className="statusText">
            {status ||
              (isComplete
                ? "Ready to export"
                : remainingPicks > 0
                  ? `Select ${remainingPicks} more leader${remainingPicks !== 1 ? "s" : ""}`
                  : "Over budget — deselect someone")}
          </span>
        </div>

        <div className="councilBody">
          <div className="preview" ref={cardRef}>
            <div className="previewTitle">{countryName.trim() || "Your Country"}</div>

            {selected.length === 0 ? (
              <div className="emptyHint">
                <span>Pick three portraits above to build your card</span>
              </div>
            ) : (
              <div className="previewSlots">
                {cardSlots.map((leader, index) =>
                  leader ? (
                    <div className="slot" key={leader.id}>
                      <div className="slotPortrait">
                        <img alt="" src={`/portraits/${leader.id}.jpg`} />
                      </div>
                      <div className="slotName">{leader.name}</div>
                    </div>
                  ) : (
                    <div className="slotEmpty" key={`empty-${index}`}>
                      <span className="slotEmptyIcon">?</span>
                      <span className="slotEmptyLabel">Pick one</span>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="controls">
            <label className="countryInput">
              <span>Country name</span>
              <input
                maxLength={36}
                onChange={(e) => setCountryName(e.target.value)}
                placeholder="e.g. San Diego"
                type="text"
                value={countryName}
              />
            </label>
            <button className="btnPrimary" disabled={!isComplete} onClick={downloadCard} type="button">
              <Download size={16} aria-hidden="true" />
              Download PNG
            </button>
            <button className="btnSecondary" disabled={!isComplete} onClick={copyCard} type="button">
              <Copy size={16} aria-hidden="true" />
              Copy card
            </button>
            <button
              className="btnIcon"
              disabled={selected.length === 0}
              onClick={() => {
                setSelectedIds([]);
                setStatus("");
              }}
              type="button"
              title="Reset"
              aria-label="Reset selections"
            >
              <RotateCcw size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
