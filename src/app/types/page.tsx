import type { Metadata } from "next";
import Link from "next/link";
import { typeProfiles } from "@/data/mibt";

export const metadata: Metadata = {
  title: "16 种猫格类型｜猫格 MIBT",
  description: "浏览猫格 MIBT 的 16 种猫咪性格类型，了解典型行为、性格优势、注意事项和相处建议。",
};

export default function TypeIndexPage() {
  return (
    <main className="type-page-shell">
      <header className="type-site-header">
        <Link className="brand brand-link" href="/"><span className="brand-dot">M</span><span>猫格 MIBT</span></Link>
        <Link href="/">开始测试</Link>
      </header>

      <section className="type-index-hero">
        <p className="eyebrow">CAT PERSONALITY ATLAS</p>
        <h1>16 种猫格，<br />16 种理解它的方式。</h1>
        <p>类型不是给猫咪贴标签，而是帮助主人更容易看见它表达社交、探索、情绪和生活节奏的方式。</p>
      </section>

      <section className="type-index-grid" aria-label="16种猫格类型">
        {Object.entries(typeProfiles).map(([code, profile]) => (
          <Link className="type-index-card" href={`/types/${code.toLowerCase()}/`} key={code}>
            <span>{profile.displayCode}</span>
            <h2>{profile.name}</h2>
            <p>{profile.tagline}</p>
            <b aria-hidden="true">→</b>
          </Link>
        ))}
      </section>

      <footer className="type-footer">
        <p>不知道它是哪一种？根据最近三个月最常见的行为完成测试。</p>
        <Link className="primary-button inline-primary" href="/">测测我家猫<span aria-hidden="true">→</span></Link>
      </footer>
    </main>
  );
}
