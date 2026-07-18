"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  dimensions,
  getProductRecommendations,
  getQuestionsForMode,
  questions,
  quizModes,
  typeProfiles,
  type QuizMode,
} from "@/data/mibt";
import { trackEvent } from "@/lib/analytics";
import { generateResultPoster, resizeAvatar } from "@/lib/poster";
import { calculateDimensionResults } from "@/lib/scoring";
import { buildSharedResultUrl } from "@/lib/share-result";

type Stage = "intro" | "profile" | "quiz" | "result";

type CatProfile = {
  name: string;
  age: string;
  breed: string;
  avatar: string;
};

type SavedResult = {
  id: string;
  catName: string;
  code: string;
  typeName: string;
  mode: QuizMode;
  createdAt: string;
  profile: CatProfile;
  answers: Record<number, number>;
  calibrationQuestionIndexes: number[];
};

type QuizDraft = {
  profile: CatProfile;
  mode: QuizMode;
  current: number;
  answers: Record<number, number>;
  calibrationQuestionIndexes: number[];
  updatedAt: string;
};

const scaleValues = [-2, -1, 0, 1, 2] as const;
const scaleLabels = ["非常像左边", "比较像左边", "差不多", "比较像右边", "非常像右边"];
const profileStorageKey = "maoge:cat-profile";
const historyStorageKey = "maoge:test-history";
const draftStorageKey = "maoge:quiz-draft";
const defaultProfile: CatProfile = { name: "", age: "成年猫", breed: "", avatar: "" };

const ageOptions = ["幼猫（1 岁以内）", "成年猫", "熟龄猫（7 岁以上）", "不确定"];

export default function Home() {
  const [stage, setStage] = useState<Stage>("intro");
  const [quizMode, setQuizMode] = useState<QuizMode>("quick");
  const [profile, setProfile] = useState<CatProfile>(defaultProfile);
  const [history, setHistory] = useState<SavedResult[]>([]);
  const [draft, setDraft] = useState<QuizDraft | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [calibrationQuestionIndexes, setCalibrationQuestionIndexes] = useState<number[]>([]);
  const [avatarError, setAvatarError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCreatingPoster, setIsCreatingPoster] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseQuestions = useMemo(() => getQuestionsForMode(quizMode), [quizMode]);
  const activeQuestions = useMemo(
    () => [...baseQuestions, ...calibrationQuestionIndexes.map((index) => questions[index])],
    [baseQuestions, calibrationQuestionIndexes],
  );

  useEffect(() => {
    trackEvent("page_view");
    const hydrationTimer = window.setTimeout(() => {
      try {
        const savedProfile = localStorage.getItem(profileStorageKey);
        if (savedProfile) setProfile({ ...defaultProfile, ...(JSON.parse(savedProfile) as CatProfile) });
        const savedHistory = localStorage.getItem(historyStorageKey);
        if (savedHistory) {
          const parsedHistory = JSON.parse(savedHistory) as SavedResult[];
          setHistory(parsedHistory.filter((item) => item.profile && item.answers).slice(0, 6));
        }
        const savedDraft = localStorage.getItem(draftStorageKey);
        if (savedDraft) setDraft(JSON.parse(savedDraft) as QuizDraft);
      } catch {
        // A damaged local profile should not prevent a new test.
      }
    }, 0);
    return () => window.clearTimeout(hydrationTimer);
  }, []);

  useEffect(() => {
    if (stage !== "quiz") return;
    const saveTimer = window.setTimeout(() => {
      const nextDraft: QuizDraft = {
        profile,
        mode: quizMode,
        current,
        answers,
        calibrationQuestionIndexes,
        updatedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(draftStorageKey, JSON.stringify(nextDraft));
        setDraft(nextDraft);
      } catch {
        // Draft recovery is a progressive enhancement.
      }
    }, 120);
    return () => window.clearTimeout(saveTimer);
  }, [answers, calibrationQuestionIndexes, current, profile, quizMode, stage]);

  const result = useMemo(() => {
    const rows = calculateDimensionResults(activeQuestions, answers, dimensions);

    const code = rows.map((row) => row.winner).join("");
    const typeProfile = typeProfiles[code] ?? typeProfiles.ISTJ;
    return {
      rows,
      code,
      profile: typeProfile,
      recommendations: getProductRecommendations(code),
    };
  }, [activeQuestions, answers]);

  const selected = answers[current];
  const progress = ((current + 1) / activeQuestions.length) * 100;
  const currentQuestion = activeQuestions[current];

  function openProfile() {
    setStage("profile");
    setShareStatus("");
    setFeedback("");
  }

  function startQuiz() {
    const normalizedProfile = { ...profile, name: profile.name.trim(), breed: profile.breed.trim() };
    if (!normalizedProfile.name) return;

    setProfile(normalizedProfile);
    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(normalizedProfile));
    } catch {
      // The test still works when local storage is unavailable.
    }

    setAnswers({});
    setCalibrationQuestionIndexes([]);
    setCurrent(0);
    setDraft(null);
    localStorage.removeItem(draftStorageKey);
    setStage("quiz");
    trackEvent("profile_completed", { has_avatar: Boolean(normalizedProfile.avatar), mode: quizMode });
    trackEvent("quiz_started", { mode: quizMode, questions: activeQuestions.length });
  }

  function continueDraft() {
    if (!draft) return;
    setProfile(draft.profile);
    setQuizMode(draft.mode);
    setAnswers(draft.answers);
    setCalibrationQuestionIndexes(draft.calibrationQuestionIndexes ?? []);
    setCurrent(draft.current);
    setStage("quiz");
    trackEvent("quiz_resumed", { mode: draft.mode, answered: Object.keys(draft.answers).length });
  }

  function openSavedResult(savedResult: SavedResult) {
    setProfile(savedResult.profile);
    setQuizMode(savedResult.mode);
    setAnswers(savedResult.answers);
    setCalibrationQuestionIndexes(savedResult.calibrationQuestionIndexes ?? []);
    setCurrent(0);
    setStage("result");
    setShareStatus("");
    setFeedback("");
    trackEvent("history_result_opened", { code: savedResult.code });
  }

  function goBack() {
    if (current === 0) {
      setStage("profile");
      return;
    }
    setCurrent((value) => value - 1);
  }

  function goNext() {
    if (selected === undefined) return;

    const answeredCount = current + 1;
    if (answeredCount % 4 === 0 && answeredCount < activeQuestions.length) {
      trackEvent("quiz_checkpoint", { mode: quizMode, answered: answeredCount });
    }

    if (current === activeQuestions.length - 1) {
      if (quizMode === "quick" && calibrationQuestionIndexes.length === 0) {
        const tiedPairs = result.rows.filter((row) => row.isTied).map((row) => row.pair);
        const calibrationIndexes = tiedPairs
          .map((pair) => questions.findIndex((question, index) => (
            index >= quizModes.quick.questionCount &&
            question.pair.some((letter) => letter === pair[0] || letter === pair[1])
          )))
          .filter((index) => index >= quizModes.quick.questionCount);

        if (calibrationIndexes.length > 0) {
          setCalibrationQuestionIndexes(calibrationIndexes);
          setCurrent((value) => value + 1);
          trackEvent("quiz_calibration_added", { dimensions: calibrationIndexes.length });
          return;
        }
      }

      const savedResult: SavedResult = {
        id: `${Date.now()}-${result.code}`,
        catName: profile.name,
        code: result.code,
        typeName: result.profile.name,
        mode: quizMode,
        createdAt: new Date().toISOString(),
        profile,
        answers,
        calibrationQuestionIndexes,
      };
      const nextHistory = [savedResult, ...history].slice(0, 6);
      setHistory(nextHistory);
      try {
        localStorage.setItem(historyStorageKey, JSON.stringify(nextHistory));
      } catch {
        // Saving history is optional and should never block the result.
      }
      localStorage.removeItem(draftStorageKey);
      setDraft(null);
      setStage("result");
      trackEvent("quiz_completed", { mode: quizMode, code: result.code });
      return;
    }
    setCurrent((value) => value + 1);
  }

  async function handleAvatar(file?: File) {
    if (!file) return;
    setAvatarError("");
    if (file.size > 12 * 1024 * 1024) {
      setAvatarError("图片不能超过 12MB");
      return;
    }

    try {
      const avatar = await resizeAvatar(file);
      setProfile((currentProfile) => ({ ...currentProfile, avatar }));
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : "图片处理失败，请换一张试试");
    }
  }

  async function createPoster() {
    const resultUrl = getSharedResultUrl();
    return generateResultPoster({
      catName: profile.name || "我家猫咪",
      avatar: profile.avatar,
      code: result.profile.displayCode,
      typeName: result.profile.name,
      tagline: result.profile.tagline,
      rows: result.rows,
      resultUrl,
    });
  }

  function getSharedResultUrl() {
    return buildSharedResultUrl(new URL(".", window.location.href).toString(), {
      code: result.code,
      catName: profile.name || "我家猫咪",
      scores: result.rows.map((row) => row.leftPercent),
      mode: quizMode,
    });
  }

  async function downloadPoster() {
    setIsCreatingPoster(true);
    setShareStatus("");
    try {
      const poster = await createPoster();
      const downloadUrl = URL.createObjectURL(poster);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${profile.name || "猫咪"}-${result.profile.displayCode}-猫格海报.png`;
      link.click();
      URL.revokeObjectURL(downloadUrl);
      setShareStatus("海报已生成，可以发给朋友啦");
      trackEvent("poster_downloaded", { code: result.code });
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : "海报生成失败，请稍后再试");
    } finally {
      setIsCreatingPoster(false);
    }
  }

  async function shareResult() {
    setIsCreatingPoster(true);
    setShareStatus("");
    const shareText = `${profile.name || "我家猫咪"}是 ${result.profile.displayCode}「${result.profile.name}」：${result.profile.tagline}`;
    const shareUrl = getSharedResultUrl();

    try {
      const poster = await createPoster();
      const file = new File([poster], `${profile.name || "猫咪"}-猫格.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: `${profile.name}的猫格测试`, text: shareText, files: [file] });
        setShareStatus("分享成功");
      } else if (navigator.share) {
        await navigator.share({ title: `${profile.name}的猫格测试`, text: shareText, url: shareUrl });
        setShareStatus("分享成功");
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        setShareStatus("结果文案和链接已复制");
      }
      trackEvent("result_shared", { code: result.code });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setShareStatus("当前浏览器不支持直接分享，可以下载海报后发送");
    } finally {
      setIsCreatingPoster(false);
    }
  }

  async function copyProductKeyword(title: string, keyword: string) {
    try {
      await navigator.clipboard.writeText(keyword);
      setShareStatus(`已复制“${keyword}”`);
    } catch {
      setShareStatus(`选购关键词：${keyword}`);
    }
    trackEvent("product_clicked", { code: result.code, product: title, action: "copy_keyword" });
  }

  function submitFeedback(value: "accurate" | "partial" | "inaccurate") {
    setFeedback(value);
    trackEvent("result_feedback", { code: result.code, rating: value, mode: quizMode });
  }

  return (
    <main className="app-shell">
      <div className="mobile-app">
        {stage === "intro" && (
          <section className="screen intro-screen">
            <header className="topbar">
              <div className="brand">
                <span className="brand-dot">M</span>
                <span>猫格 MIBT</span>
              </div>
              <span className="version-badge">趣味观察</span>
            </header>

            <div className="hero-copy">
              <p className="eyebrow">给最懂它的人看的猫咪性格测试</p>
              <h1>
                它不是高冷，
                <span>只是有自己的性格。</span>
              </h1>
              <p className="hero-description">
                从日常行为判断四维倾向，获得专属猫格、相处建议和适合它的生活灵感。
              </p>
            </div>

            <div className="cat-visual" aria-hidden="true">
              <span className="orbit orbit-one" />
              <span className="orbit orbit-two" />
              <div className="cat-face">喵</div>
              <span className="visual-note note-one">好奇</span>
              <span className="visual-note note-two">独立</span>
              <span className="visual-note note-three">亲人</span>
            </div>

            <div className="mode-section">
              <div className="section-heading-row">
                <p className="section-label">选择测试版本</p>
                <span>随时可以返回修改</span>
              </div>
              <div className="mode-grid" role="radiogroup" aria-label="测试版本">
                {(Object.keys(quizModes) as QuizMode[]).map((mode) => {
                  const option = quizModes[mode];
                  const selectedMode = quizMode === mode;
                  return (
                    <button
                      key={mode}
                      className="mode-card"
                      type="button"
                      role="radio"
                      aria-checked={selectedMode}
                      data-selected={selectedMode}
                      onClick={() => setQuizMode(mode)}
                    >
                      <span className="mode-check">{selectedMode ? "✓" : ""}</span>
                      <strong>{option.title}</strong>
                      <small>{option.questionCount} 题 · {option.duration}</small>
                      <p>{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="feature-strip" aria-label="测试能力">
              <span>16 种猫格</span>
              <span>专属相处建议</span>
              <span>可下载结果海报</span>
            </div>

            {draft && (
              <section className="resume-card">
                <span>{draft.profile.name.slice(0, 1)}</span>
                <div>
                  <small>发现未完成的测试</small>
                  <strong>继续观察{draft.profile.name}</strong>
                  <p>已回答 {Object.keys(draft.answers).length} / {getQuestionsForMode(draft.mode).length} 题</p>
                </div>
                <button type="button" onClick={continueDraft}>继续</button>
                <button
                  className="resume-dismiss"
                  type="button"
                  aria-label="删除未完成的测试"
                  onClick={() => {
                    setDraft(null);
                    localStorage.removeItem(draftStorageKey);
                  }}
                >
                  ×
                </button>
              </section>
            )}

            {history.length > 0 && (
              <section className="history-section">
                <div className="section-heading-row">
                  <p className="section-label">最近测试</p>
                  <button
                    type="button"
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem(historyStorageKey);
                    }}
                  >
                    清空记录
                  </button>
                </div>
                <div className="history-list">
                  {history.slice(0, 3).map((item) => (
                    <button className="history-item" type="button" key={item.id} onClick={() => openSavedResult(item)}>
                      <span>{item.catName.slice(0, 1)}</span>
                      <div>
                        <strong>{item.catName}</strong>
                        <p>{typeProfiles[item.code]?.name ?? item.typeName} · {item.mode === "quick" ? "快速版" : "完整版"}</p>
                      </div>
                      <b>{typeProfiles[item.code]?.displayCode ?? item.code}</b>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <div className="sticky-action">
              <button className="primary-button" type="button" onClick={openProfile}>
                创建猫咪档案
                <span aria-hidden="true">→</span>
              </button>
              <p>资料只保存在当前设备，不会上传</p>
            </div>
          </section>
        )}

        {stage === "profile" && (
          <section className="screen profile-screen">
            <header className="quiz-header">
              <button className="icon-button" type="button" onClick={() => setStage("intro")} aria-label="返回首页">
                ←
              </button>
              <span>猫咪档案</span>
              <span className="header-spacer" aria-hidden="true" />
            </header>

            <div className="profile-heading">
              <p className="eyebrow">先认识一下主角</p>
              <h1>这次要观察哪只猫？</h1>
              <p>名字会出现在结果和分享海报里，头像可以稍后更换。</p>
            </div>

            <div className="profile-card">
              <div className="avatar-field">
                <button className="avatar-button" type="button" onClick={() => fileInputRef.current?.click()}>
                  {profile.avatar ? (
                    <Image src={profile.avatar} alt={`${profile.name || "猫咪"}的头像`} width={420} height={420} unoptimized />
                  ) : <span>上传<br />照片</span>}
                </button>
                <div>
                  <strong>猫咪头像</strong>
                  <p>建议使用正面、清晰的方形照片</p>
                  {profile.avatar && (
                    <button className="inline-button" type="button" onClick={() => setProfile((value) => ({ ...value, avatar: "" }))}>
                      移除照片
                    </button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleAvatar(event.target.files?.[0])}
                />
              </div>
              {avatarError && <p className="field-error" role="alert">{avatarError}</p>}

              <label className="form-field">
                <span>名字 <b>必填</b></span>
                <input
                  value={profile.name}
                  maxLength={12}
                  placeholder="例如：毛球"
                  autoComplete="off"
                  onChange={(event) => setProfile((value) => ({ ...value, name: event.target.value }))}
                />
              </label>

              <label className="form-field">
                <span>年龄阶段</span>
                <select value={profile.age} onChange={(event) => setProfile((value) => ({ ...value, age: event.target.value }))}>
                  {ageOptions.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>

              <label className="form-field">
                <span>品种 <em>选填</em></span>
                <input
                  value={profile.breed}
                  maxLength={20}
                  placeholder="例如：中华田园猫"
                  autoComplete="off"
                  onChange={(event) => setProfile((value) => ({ ...value, breed: event.target.value }))}
                />
              </label>
            </div>

            <div className="selected-mode-summary">
              <span>{quizMode === "quick" ? "快" : "全"}</span>
              <div>
                <strong>{quizModes[quizMode].title}</strong>
                <p>{quizModes[quizMode].questionCount} 道题 · {quizModes[quizMode].duration}</p>
              </div>
              <button type="button" onClick={() => setStage("intro")}>更换</button>
            </div>

            <div className="sticky-action">
              <button className="primary-button" type="button" disabled={!profile.name.trim()} onClick={startQuiz}>
                开始观察
                <span aria-hidden="true">→</span>
              </button>
              <p>请根据最近三个月最常见的表现作答</p>
            </div>
          </section>
        )}

        {stage === "quiz" && currentQuestion && (
          <section className="screen quiz-screen">
            <header className="quiz-header">
              <button className="icon-button" type="button" onClick={goBack} aria-label="返回上一页">←</button>
              <span>{profile.name} · {current + 1} / {activeQuestions.length}</span>
              <span className="header-spacer" aria-hidden="true" />
            </header>

            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={activeQuestions.length}
              aria-valuenow={current + 1}
              aria-label="答题进度"
            >
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="question-heading">
              <p className="eyebrow">
                {current >= baseQuestions.length ? "校准题 · 用于区分均衡维度" : "观察题 · 没有标准答案"}
              </p>
              <h2>{currentQuestion.prompt}</h2>
            </div>

            <div className="choice-card">
              <div className="statement statement-left">
                <span>{currentQuestion.pair[0]}</span>
                <p>{currentQuestion.left}</p>
              </div>

              <div className="versus" aria-hidden="true"><span /><b>更像哪边？</b><span /></div>

              <div className="scale" role="radiogroup" aria-label="选择最符合猫咪日常表现的倾向">
                {scaleValues.map((value, index) => {
                  const tone = value < 0 ? "left" : value > 0 ? "right" : "neutral";
                  return (
                    <button
                      key={value}
                      className="scale-option"
                      type="button"
                      role="radio"
                      aria-checked={selected === value}
                      aria-label={scaleLabels[index]}
                      data-tone={tone}
                      data-strength={Math.abs(value)}
                      data-selected={selected === value}
                      onClick={() => setAnswers((currentAnswers) => ({ ...currentAnswers, [current]: value }))}
                    >
                      <span />
                    </button>
                  );
                })}
              </div>

              <div className="scale-caption" aria-hidden="true"><span>更像左边</span><span>更像右边</span></div>

              <div className="statement statement-right">
                <span>{currentQuestion.pair[1]}</span>
                <p>{currentQuestion.right}</p>
              </div>
            </div>

            <p className="quiz-tip">按最常见的表现选择，第一直觉通常更准确。</p>

            <div className="sticky-action quiz-action">
              <button className="primary-button" type="button" disabled={selected === undefined} onClick={goNext}>
                {current === activeQuestions.length - 1 ? "查看专属猫格" : "下一题"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}

        {stage === "result" && (
          <section className="screen result-screen">
            <header className="topbar">
              <div className="brand"><span className="brand-dot">M</span><span>猫格 MIBT</span></div>
              <button className="text-button" type="button" onClick={() => setStage("intro")}>返回首页</button>
            </header>

            <div className="result-hero">
              <div className="result-identity">
                <div className="result-avatar">
                  {profile.avatar ? (
                    <Image src={profile.avatar} alt={`${profile.name}的头像`} width={420} height={420} unoptimized />
                  ) : <span>{profile.name.slice(0, 1)}</span>}
                </div>
                <div><p className="eyebrow">{profile.name}的猫格结果</p><small>{profile.breed || "猫咪"} · {profile.age}</small></div>
              </div>
              <div className="result-code">{result.profile.displayCode}</div>
              <h1>{result.profile.name}</h1>
              <strong className="result-tagline">{result.profile.tagline}</strong>
              <p>{result.profile.summary}</p>
            </div>

            <div className="share-panel">
              <div><strong>把它的猫格分享出去</strong><p>自动生成带头像、四维结果和二维码的高清海报</p></div>
              <div className="share-buttons">
                <button className="secondary-button" type="button" disabled={isCreatingPoster} onClick={() => void downloadPoster()}>
                  {isCreatingPoster ? "生成中…" : "下载海报"}
                </button>
                <button className="compact-primary" type="button" disabled={isCreatingPoster} onClick={() => void shareResult()}>立即分享</button>
              </div>
              {shareStatus && <p className="status-message" role="status">{shareStatus}</p>}
            </div>

            <div className="dimension-card">
              <div className="dimension-heading"><p className="section-label">四维性格倾向</p><span>{quizModes[quizMode].title}</span></div>
              <div className="dimension-list">
                {result.rows.map((row) => (
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

            <div className="insight-grid">
              <article className="insight-card full-width-card">
                <p className="section-label">它可能经常这样</p>
                <ul>{result.profile.traits.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="insight-card">
                <p className="section-label">性格优势</p>
                <ul>{result.profile.strengths.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="insight-card warm-card">
                <p className="section-label">需要留意</p>
                <ul>{result.profile.watchOuts.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
              <article className="insight-card full-width-card care-card">
                <p className="section-label">相处建议</p>
                <ol>{result.profile.careTips.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
              </article>
            </div>

            <section className="feedback-card">
              <div>
                <p className="section-label">帮助我们改进题目</p>
                <h2>这个结果像{profile.name}吗？</h2>
              </div>
              {feedback ? (
                <p className="feedback-thanks" role="status">谢谢反馈，我们会用它检查题目和计分表现。</p>
              ) : (
                <div className="feedback-options">
                  <button type="button" onClick={() => submitFeedback("accurate")}>很像</button>
                  <button type="button" onClick={() => submitFeedback("partial")}>部分像</button>
                  <button type="button" onClick={() => submitFeedback("inaccurate")}>不太像</button>
                </div>
              )}
            </section>

            <section className="recommendation-section">
              <div className="section-heading-row">
                <div><p className="section-label">适合它的生活灵感</p><h2>按性格选，比盲买更有方向</h2></div>
                <span className="promotion-label">非医疗建议</span>
              </div>
              <div className="recommendation-list">
                {result.recommendations.map((item, index) => (
                  <article className="recommendation-card" key={item.title}>
                    <span className="recommendation-index">0{index + 1}</span>
                    <div>
                      <small>{item.basis}</small>
                      <h3>{item.title}</h3>
                      <p>{item.reason}</p>
                      <button type="button" onClick={() => void copyProductKeyword(item.title, item.keyword)}>
                        复制选购关键词
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <p className="commerce-note">当前推荐不含付费推广；未来接入推广商品时会明确标注，并保留推荐依据。</p>
            </section>

            <div className="result-note">
              <span>说明</span>
              <p>结果来自日常行为观察，用于帮助理解相处偏好，不代表医学或动物行为诊断。若行为突然明显改变，请及时咨询专业兽医。</p>
            </div>

            <div className="sticky-action result-action">
              <button className="primary-button" type="button" onClick={openProfile}>
                再测一只猫
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
