"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { dimensions, typeProfiles } from "@/data/mibt";
import { trackEvent } from "@/lib/analytics";
import { getInclinationLabel } from "@/lib/scoring";
import { parseSharedResult, type SharedResultPayload } from "@/lib/share-result";

export default function SharedResultPage() {
  const [sharedResult, setSharedResult] = useState<SharedResultPayload | null | undefined>(undefined);

  useEffect(() => {
    const parseTimer = window.setTimeout(() => {
      const parsed = parseSharedResult(window.location.search);
      setSharedResult(parsed);
      if (parsed) trackEvent("shared_result_viewed", { code: parsed.code, mode: parsed.mode });
    }, 0);
    return () => window.clearTimeout(parseTimer);
  }, []);

  const rows = useMemo(() => {
    if (!sharedResult) return [];
    return dimensions.map((dimension, index) => ({
      ...dimension,
      leftPercent: sharedResult.scores[index],
      rightPercent: 100 - sharedResult.scores[index],
      inclination: getInclinationLabel(sharedResult.scores[index]),
    }));
  }, [sharedResult]);

  if (sharedResult === undefined) {
    return (
      <main className="app-shell">
        <div className="mobile-app shared-result-page">
          <section className="screen shared-state"><span className="loading-dot" /><p>正在打开猫格结果…</p></section>
        </div>
      </main>
    );
  }

  if (!sharedResult) {
    return (
      <main className="app-shell">
        <div className="mobile-app shared-result-page">
          <section className="screen shared-state">
            <div className="brand"><span className="brand-dot">M</span><span>猫格 MIBT</span></div>
            <h1>这个结果链接不完整</h1>
            <p>分享链接可能被截断了，不过你仍然可以为自己的猫咪完成一次测试。</p>
            <Link className="primary-button inline-primary" href="/">开始测试<span aria-hidden="true">→</span></Link>
          </section>
        </div>
      </main>
    );
  }

  const profile = typeProfiles[sharedResult.code];

  return (
    <main className="app-shell">
      <div className="mobile-app shared-result-page">
        <section className="screen result-screen">
          <header className="topbar">
            <Link className="brand brand-link" href="/"><span className="brand-dot">M</span><span>猫格 MIBT</span></Link>
            <span className="version-badge">朋友分享</span>
          </header>

          <div className="result-hero shared-result-hero">
            <p className="eyebrow">{sharedResult.catName}的猫格结果</p>
            <div className="result-code">{sharedResult.code}</div>
            <h1>{profile.name}</h1>
            <strong className="result-tagline">{profile.tagline}</strong>
            <p>{profile.summary}</p>
          </div>

          <div className="shared-invite">
            <span>来自朋友的猫格卡片</span>
            <p>这个页面只包含猫咪名字和测试分数，不包含头像或主人资料。</p>
          </div>

          <div className="dimension-card">
            <div className="dimension-heading"><p className="section-label">四维性格倾向</p><span>{sharedResult.mode === "quick" ? "快速观察" : "完整观察"}</span></div>
            <div className="dimension-list">
              {rows.map((row) => (
                <div className="dimension" key={row.pair.join("")}>
                  <div className="dimension-labels">
                    <span><b>{row.pair[0]}</b>{row.left}</span>
                    <em>{row.inclination}</em>
                    <span>{row.right}<b>{row.pair[1]}</b></span>
                  </div>
                  <div className="dimension-track">
                    <span className="dimension-left" style={{ width: `${row.leftPercent}%` }} />
                    <span className="dimension-right" style={{ width: `${row.rightPercent}%` }} />
                  </div>
                  <div className="dimension-values"><span>{row.leftPercent}%</span><span>{row.rightPercent}%</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-grid shared-insights">
            <article className="insight-card full-width-card">
              <p className="section-label">它可能经常这样</p>
              <ul>{profile.traits.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
            <article className="insight-card full-width-card care-card">
              <p className="section-label">相处建议</p>
              <ol>{profile.careTips.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
            </article>
          </div>

          <Link className="type-detail-link" href={`/types/${sharedResult.code.toLowerCase()}/`}>
            查看“{profile.name}”完整性格说明 <span aria-hidden="true">→</span>
          </Link>

          <div className="result-note">
            <span>说明</span>
            <p>结果来自日常行为观察，用于帮助理解相处偏好，不代表医学或动物行为诊断。</p>
          </div>

          <div className="sticky-action result-action">
            <Link className="primary-button" href="/">我也测测我家猫<span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </div>
    </main>
  );
}
