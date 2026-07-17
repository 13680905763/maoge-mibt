"use client";

import { useMemo, useState } from "react";
import { dimensions, questions, typeNames, type Letter } from "@/data/mibt";

type Stage = "intro" | "quiz" | "result";

const scaleValues = [-2, -1, 0, 1, 2] as const;
const scaleLabels = ["非常像左边", "比较像左边", "差不多", "比较像右边", "非常像右边"];

export default function Home() {
  const [stage, setStage] = useState<Stage>("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const result = useMemo(() => {
    const rows = dimensions.map((dimension) => {
      let leftScore = 0;
      let rightScore = 0;

      questions.forEach((question, index) => {
        if (!question.pair.includes(dimension.pair[0])) return;

        const answer = answers[index] ?? 0;
        const addScore = (letter: Letter, amount: number) => {
          if (letter === dimension.pair[0]) leftScore += amount;
          if (letter === dimension.pair[1]) rightScore += amount;
        };

        if (answer < 0) addScore(question.pair[0], Math.abs(answer));
        if (answer > 0) addScore(question.pair[1], answer);
        if (answer === 0) {
          addScore(question.pair[0], 1);
          addScore(question.pair[1], 1);
        }
      });

      const total = leftScore + rightScore;
      const leftPercent = total === 0 ? 50 : Math.round((leftScore / total) * 100);

      return {
        ...dimension,
        leftPercent,
        rightPercent: 100 - leftPercent,
        winner: leftScore >= rightScore ? dimension.pair[0] : dimension.pair[1],
      };
    });

    const code = rows.map((row) => row.winner).join("");
    return { rows, code, name: typeNames[code] ?? "独特小猫" };
  }, [answers]);

  const selected = answers[current];
  const progress = ((current + 1) / questions.length) * 100;

  function startQuiz() {
    setAnswers({});
    setCurrent(0);
    setStage("quiz");
  }

  function goBack() {
    if (current === 0) {
      setStage("intro");
      return;
    }
    setCurrent((value) => value - 1);
  }

  function goNext() {
    if (selected === undefined) return;
    if (current === questions.length - 1) {
      setStage("result");
      return;
    }
    setCurrent((value) => value + 1);
  }

  return (
    <main className="app-shell">
      <div className="mobile-app">
        {stage === "intro" && (
          <section className="screen intro-screen">
            <header className="topbar">
              <div className="brand">
                <span className="brand-dot">M</span>
                <span>MIBT</span>
              </div>
            </header>

            <div className="hero-copy">
              <p className="eyebrow">给主人看的猫咪性格测试</p>
              <h1>
                它不是高冷，
                <span>只是有自己的性格。</span>
              </h1>
              <p className="hero-description">
                根据日常相处中的真实表现作答，看看你家猫咪更接近哪一种 MIBT 性格。
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

            <div className="test-meta" aria-label="测试信息">
              <div>
                <strong>{questions.length}</strong>
                <span>道观察题</span>
              </div>
              <div>
                <strong>5</strong>
                <span>分钟完成</span>
              </div>
              <div>
                <strong>4</strong>
                <span>个性格维度</span>
              </div>
            </div>

            <div className="flow-outline">
              <p className="section-label">测试流程</p>
              <ol>
                <li>
                  <span>01</span>
                  <div>
                    <strong>回想日常</strong>
                    <p>以最近三个月最常见的表现为准</p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <strong>凭直觉选择</strong>
                    <p>不用纠结偶尔发生的特殊情况</p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <strong>查看性格类型</strong>
                    <p>获得四维倾向和结果代号</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="sticky-action">
              <button className="primary-button" type="button" onClick={startQuiz}>
                开始测试
                <span aria-hidden="true">→</span>
              </button>
              <p>请由最熟悉这只猫的人作答</p>
            </div>
          </section>
        )}

        {stage === "quiz" && (
          <section className="screen quiz-screen">
            <header className="quiz-header">
              <button className="icon-button" type="button" onClick={goBack} aria-label="返回上一页">
                ←
              </button>
              <span>
                {current + 1} / {questions.length}
              </span>
              <span className="header-spacer" aria-hidden="true" />
            </header>

            <div
              className="progress-track"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={questions.length}
              aria-valuenow={current + 1}
              aria-label="答题进度"
            >
              <span style={{ width: `${progress}%` }} />
            </div>

            <div className="question-heading">
              <p className="eyebrow">观察题 · 没有标准答案</p>
              <h2>{questions[current].prompt}</h2>
            </div>

            <div className="choice-card">
              <div className="statement statement-left">
                <span>{questions[current].pair[0]}</span>
                <p>{questions[current].left}</p>
              </div>

              <div className="versus" aria-hidden="true">
                <span />
                <b>更像哪边？</b>
                <span />
              </div>

              <div
                className="scale"
                role="radiogroup"
                aria-label="选择最符合猫咪日常表现的倾向"
              >
                {scaleValues.map((value, index) => {
                  const tone = value < 0 ? "left" : value > 0 ? "right" : "neutral";
                  const strength = Math.abs(value);
                  const isSelected = selected === value;

                  return (
                    <button
                      key={value}
                      className="scale-option"
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      aria-label={scaleLabels[index]}
                      data-tone={tone}
                      data-strength={strength}
                      data-selected={isSelected}
                      onClick={() =>
                        setAnswers((currentAnswers) => ({
                          ...currentAnswers,
                          [current]: value,
                        }))
                      }
                    >
                      <span />
                    </button>
                  );
                })}
              </div>

              <div className="scale-caption" aria-hidden="true">
                <span>更像左边</span>
                <span>更像右边</span>
              </div>

              <div className="statement statement-right">
                <span>{questions[current].pair[1]}</span>
                <p>{questions[current].right}</p>
              </div>
            </div>

            <p className="quiz-tip">按它最常见的表现选择，第一直觉通常更准确。</p>

            <div className="sticky-action quiz-action">
              <button
                className="primary-button"
                type="button"
                disabled={selected === undefined}
                onClick={goNext}
              >
                {current === questions.length - 1 ? "查看结果" : "下一题"}
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </section>
        )}

        {stage === "result" && (
          <section className="screen result-screen">
            <header className="topbar">
              <div className="brand">
                <span className="brand-dot">M</span>
                <span>MIBT</span>
              </div>
              <button className="text-button" type="button" onClick={() => setStage("intro")}>
                返回首页
              </button>
            </header>

            <div className="result-hero">
              <p className="eyebrow">猫咪性格结果</p>
              <div className="result-code">{result.code}</div>
              <h1>{result.name}</h1>
              <p>
                它有自己稳定的观察方式和相处节奏。尊重它表达亲近、探索和休息的方式，
                会让你们更容易理解彼此。
              </p>
            </div>

            <div className="dimension-card">
              <div className="dimension-heading">
                <p className="section-label">四维性格倾向</p>
                <span>四维计分</span>
              </div>

              <div className="dimension-list">
                {result.rows.map((row) => (
                  <div className="dimension" key={row.pair.join("")}>
                    <div className="dimension-labels">
                      <span>
                        <b>{row.pair[0]}</b>
                        {row.left}
                      </span>
                      <span>
                        {row.right}
                        <b>{row.pair[1]}</b>
                      </span>
                    </div>
                    <div className="dimension-track">
                      <span className="dimension-left" style={{ width: `${row.leftPercent}%` }} />
                      <span className="dimension-right" style={{ width: `${row.rightPercent}%` }} />
                    </div>
                    <div className="dimension-values">
                      <span>{row.leftPercent}%</span>
                      <span>{row.rightPercent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="result-note">
              <span>说明</span>
              <p>结果来自日常行为观察，用于帮助理解相处偏好，不代表医学或行为诊断。</p>
            </div>

            <div className="sticky-action result-action">
              <button className="primary-button" type="button" onClick={startQuiz}>
                重新测试
                <span aria-hidden="true">↻</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
