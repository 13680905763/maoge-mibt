import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dimensions, getProductRecommendations, typeProfiles } from "@/data/mibt";

type TypePageProps = {
  params: Promise<{ code: string }>;
};

export function generateStaticParams() {
  return Object.keys(typeProfiles).map((code) => ({ code: code.toLowerCase() }));
}
export async function generateMetadata({ params }: TypePageProps): Promise<Metadata> {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const profile = typeProfiles[code];
  if (!profile) return {};

  return {
    title: `${profile.displayCode} ${profile.name}｜猫咪性格说明｜猫格 MIBT`,
    description: `${profile.tagline}。了解“${profile.name}”猫咪的典型行为、性格优势、注意事项和相处建议。`,
    openGraph: {
      title: `${profile.displayCode}「${profile.name}」｜猫格 MIBT`,
      description: profile.tagline,
    },
  };
}

export default async function TypeDetailPage({ params }: TypePageProps) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const profile = typeProfiles[code];
  if (!profile) notFound();

  const tendencies = dimensions.map((dimension) => {
    const useLeft = code.includes(dimension.pair[0]);
    return {
      letter: useLeft ? dimension.pair[0] : dimension.pair[1],
      label: useLeft ? dimension.left : dimension.right,
    };
  });
  const recommendations = getProductRecommendations(code);
  const codes = Object.keys(typeProfiles);
  const currentIndex = codes.indexOf(code);
  const previousCode = codes[(currentIndex - 1 + codes.length) % codes.length];
  const nextCode = codes[(currentIndex + 1) % codes.length];

  return (
    <main className="type-page-shell">
      <header className="type-site-header">
        <Link className="brand brand-link" href="/"><span className="brand-dot">M</span><span>猫格 MIBT</span></Link>
        <Link href="/types/">全部类型</Link>
      </header>

      <article className="type-detail">
        <section className="type-detail-hero">
          <p className="eyebrow">猫格类型档案</p>
          <div className="type-detail-code">{profile.displayCode}</div>
          <h1>{profile.name}</h1>
          <strong>{profile.tagline}</strong>
          <p>{profile.summary}</p>
          <div className="type-tendency-list">
            {tendencies.map((item) => <span key={item.letter}><b>{item.letter}</b>{item.label}</span>)}
          </div>
        </section>

        <section className="type-content-grid">
          <div className="type-content-card full-type-card">
            <p className="section-label">典型行为</p>
            <ul>{profile.traits.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="type-content-card">
            <p className="section-label">性格优势</p>
            <ul>{profile.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="type-content-card attention-type-card">
            <p className="section-label">需要留意</p>
            <ul>{profile.watchOuts.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="type-content-card full-type-card advice-type-card">
            <p className="section-label">相处建议</p>
            <ol>{profile.careTips.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
          </div>
        </section>

        <section className="type-product-direction">
          <div>
            <p className="section-label">生活环境方向</p>
            <h2>它可能更喜欢这些用品特征</h2>
          </div>
          <div className="type-product-grid">
            {recommendations.map((item) => (
              <article key={item.title}>
                <small>{item.basis}</small>
                <h3>{item.title}</h3>
                <p>{item.reason}</p>
              </article>
            ))}
          </div>
          <p className="commerce-note">用品方向来自趣味性格倾向，不构成医疗、健康或行为诊断建议。</p>
        </section>

        <nav className="type-pagination" aria-label="浏览其他猫格">
          <Link href={`/types/${previousCode.toLowerCase()}/`}><small>上一个</small><strong>{typeProfiles[previousCode].displayCode} · {typeProfiles[previousCode].name}</strong></Link>
          <Link href={`/types/${nextCode.toLowerCase()}/`}><small>下一个</small><strong>{typeProfiles[nextCode].displayCode} · {typeProfiles[nextCode].name}</strong></Link>
        </nav>
      </article>

      <footer className="type-footer">
        <p>类型说明只能帮助理解倾向，完成行为观察才能看到它的四维比例。</p>
        <Link className="primary-button inline-primary" href="/">测测我家猫<span aria-hidden="true">→</span></Link>
      </footer>
    </main>
  );
}
