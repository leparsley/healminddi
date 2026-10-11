"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, ArrowLeft, ArrowRight, Check, CircleAlert, ExternalLink, Film, HeartPulse, HomeIcon, Leaf, Palette, RotateCcw, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import VrMindfulness from "./vr-mindfulness";
import {downloadText} from './research-data';
import { ageLabels, concernLabels, resolveScale, scales, scoreAnswers, severityFor, type AgeBand, type Concern } from "./assessment-data";

type Stage = "home" | "setup" | "assessment" | "baseline" | "hub" | "suds-pre" | "video" | "vr" | "suds-post" | "retest" | "report";
type ModuleId = "video" | "vr";
type ModuleResult = { pre: number; post: number; retestAnswers: number[]; retestScore: number; retestRisk: boolean; completedAt: number; detail?: string };

const journey = ["建立画像", "量表前测", "筛查结果", "预体验", "SUDS后测", "量表复测", "对比报告"];

function scaleProgress(stage: Stage) {
  if (stage === "home") return 0;
  if (stage === "setup") return 8;
  if (stage === "assessment") return 24;
  if (stage === "baseline") return 42;
  if (["hub", "suds-pre", "video", "vr"].includes(stage)) return 64;
  if (stage === "suds-post") return 78;
  if (stage === "retest") return 90;
  return 100;
}

export default function Experience({active=true}:{active?:boolean}) {
  const [stage, setStage] = useState<Stage>("setup");
  const [age, setAge] = useState<AgeBand>("18-64");
  const [concern, setConcern] = useState<Concern>("anxiety");
  const [answers, setAnswers] = useState<number[]>([]);
  const [safetyRisk, setSafetyRisk] = useState<"yes" | "no" | null>(null);
  const [pendingModule, setPendingModule] = useState<ModuleId | null>(null);
  const [currentSuds, setCurrentSuds] = useState(40);
  const [pendingPre, setPendingPre] = useState<number | null>(null);
  const [pendingPost, setPendingPost] = useState<number | null>(null);
  const [pendingDetail, setPendingDetail] = useState<string | undefined>();
  const [retestAnswers, setRetestAnswers] = useState<number[]>([]);
  const [retestSafetyRisk, setRetestSafetyRisk] = useState<"yes" | "no" | null>(null);
  const [results, setResults] = useState<Partial<Record<ModuleId, ModuleResult>>>({});
  const [videoEnded, setVideoEnded] = useState(false);
  const [notice, setNotice] = useState("");
  const [rating,setRating] = useState('');
  const [feedback,setFeedback] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(()=>{if(!active){videoRef.current?.pause();window.speechSynthesis?.cancel();}},[active]);

  const scaleId = resolveScale(age, concern);
  const selectedScale = scaleId ? scales[scaleId] : null;
  const score = selectedScale && answers.length === selectedScale.items.length ? scoreAnswers(selectedScale, answers) : 0;
  const severity = selectedScale ? severityFor(selectedScale.id, score, age) : null;
  const riskFromPhq = scaleId === "PHQ9" && (answers[8] ?? 0) > 0;
  const blockedByRisk = safetyRisk === "yes" || riskFromPhq || Object.values(results).some(item => item?.retestRisk);

  const resetAssessment = (nextAge = age, nextConcern = concern) => {
    const nextScaleId = resolveScale(nextAge, nextConcern);
    setAnswers(Array(nextScaleId ? scales[nextScaleId].items.length : 0).fill(-1));
    setSafetyRisk(null);
    setResults({});
    setPendingModule(null);
    setPendingPre(null);
    setPendingPost(null);
    setPendingDetail(undefined);
    setNotice("");
  };

  const startAssessment = () => {
    if (!scaleId) {
      setNotice("12岁以下人群需结合儿童自评、照护者报告与专业评估，当前版本暂不提供自动筛查。");
      return;
    }
    resetAssessment();
    setStage("assessment");
  };

  const completeAssessment = () => {
    if (!selectedScale || answers.some((value) => value < 0) || !safetyRisk) {
      setNotice("请完成全部量表题目和安全确认后继续。");
      return;
    }
    setNotice("");
    setStage("baseline");
  };

  const chooseModule = (module: ModuleId) => {
    if (blockedByRisk) { setStage("report"); return; }
    setPendingModule(module);
    setCurrentSuds(40);
    setPendingPre(null);
    setPendingPost(null);
    setPendingDetail(undefined);
    setVideoEnded(false);
    setStage("suds-pre");
  };

  const savePreSuds = () => {
    setPendingPre(currentSuds);
    setStage(pendingModule === "video" ? "video" : "vr");
  };

  const finishExperience = useCallback(() => {
    setCurrentSuds(pendingPre ?? 40);
    setStage("suds-post");
  }, [pendingPre]);

  const savePostSuds = () => {
    if (!pendingModule || pendingPre === null) return;
    setPendingPost(currentSuds);
    setRetestAnswers(Array(selectedScale?.items.length ?? 0).fill(-1));
    setRetestSafetyRisk(null);
    setStage("retest");
  };

  const completeRetest = () => {
    if (!selectedScale || !pendingModule || pendingPre === null || pendingPost === null) return;
    if (retestAnswers.some((value) => value < 0) || !retestSafetyRisk) {
      setNotice("请完成全部重复量表题目和安全确认后继续。");
      return;
    }
    const retestScore = scoreAnswers(selectedScale, retestAnswers);
    const retestRisk = retestSafetyRisk === "yes" || (selectedScale.id === "PHQ9" && (retestAnswers[8] ?? 0) > 0);
    setResults((current) => ({ ...current, [pendingModule]: { pre: pendingPre, post: pendingPost, retestAnswers: [...retestAnswers], retestScore, retestRisk, completedAt: Date.now(), detail: pendingDetail } }));
    setPendingModule(null); setPendingPre(null); setPendingPost(null); setPendingDetail(undefined); setNotice("");
    setStage(retestRisk ? "report" : "hub");
  };

  const completeVr = useCallback((collected: number) => {
    setPendingDetail(`呼气阶段收集 ${collected} 个光点`);
    finishExperience();
  }, [finishExperience]);

  const restart = () => {
    window.speechSynthesis?.cancel();
    setStage("setup"); setResults({}); setAnswers([]); setSafetyRisk(null); setPendingModule(null); setPendingPre(null); setPendingPost(null); setRetestAnswers([]);setRetestSafetyRisk(null);setRating('');setFeedback('');setNotice("");
  };

  const itemData = useMemo(() => {
    if (!selectedScale) return [];
    return selectedScale.items.map((item, index) => ({
      item: `${index + 1}`,
      label: item.text,
      score: selectedScale.id === "GDS15"
        ? ((item.scoreForYes ? answers[index] === 1 : answers[index] === 0) ? 1 : 0)
        : Math.max(0, answers[index] ?? 0),
    }));
  }, [selectedScale, answers]);

  const comparisonData = useMemo(() => {
    const rows: { name: string; value: number }[] = [];
    if (results.video) rows.push({ name: "视频前", value: results.video.pre }, { name: "视频后", value: results.video.post });
    if (results.vr) rows.push({ name: "VR前", value: results.vr.pre }, { name: "VR后", value: results.vr.post });
    return rows;
  }, [results]);

  const symptomComparisonData = useMemo(() => {
    const rows = [{ name: "基线前测", value: score }];
    if (results.video) rows.push({ name: "视频后即时复测", value: results.video.retestScore });
    if (results.vr) rows.push({ name: "VR后即时复测", value: results.vr.retestScore });
    return rows;
  }, [results, score]);

  const completedCount = Number(Boolean(results.video)) + Number(Boolean(results.vr));

  return (
    <main className="healing-app">
      <header className="app-header">
        <button className="brand-mark" aria-label="返回主页" onClick={() => { window.speechSynthesis?.cancel(); setStage("home"); }}><Leaf /></button>
        <div className="brand-copy"><strong>澄心 · 数字心理健康体验</strong><span>心理筛查 · 正念体验 · 数据反馈</span></div>
        {stage !== "home" && <Button variant="ghost" size="sm" className="home-button" onClick={() => { window.speechSynthesis?.cancel(); setStage("home"); }}><HomeIcon />主页</Button>}
        <div className="privacy-note"><ShieldCheck />数据仅保留在当前页面</div>
      </header>

      {stage === "home" ? (
        <div className="home-page">
          <section className="home-hero">
            <div className="hero-copy"><p className="eyebrow">DIGITAL WELLBEING EXPERIENCE</p><h1>从心理筛查开始，探索适合自己的情绪调节方式</h1><p>依据年龄与主要困扰匹配筛查量表，通过正念视频或沉浸式互动记录体验前后的主观状态，并形成个人数据报告。</p><div className="hero-actions"><Button size="lg" onClick={() => setStage("setup")}>开始体验<ArrowRight /></Button><a href="/design-lab"><Palette />设计体验实验室</a><a href="#evidence">循证依据</a></div><div className="hero-tags"><span>标准化量表</span><span>音频引导体验</span><span>阶段性数据记录</span></div></div>
            <div className="hero-orbit" aria-hidden="true"><div className="hero-sun"><Leaf /></div><span className="orbit-one" /><span className="orbit-two" /><p>呼吸 · 观察 · 回到当下</p></div>
          </section>
          <section className="home-path"><p className="eyebrow">体验流程</p><h2>七个阶段完成一次体验</h2><div className="path-grid">{["选择人群与问题","完成基线量表","记录体验前SUDS","视频或VR互动","记录体验后SUDS","重复同一量表","生成双指标报告"].map((item,index)=><div key={item}><span>{index+1}</span><strong>{item}</strong></div>)}</div></section>
          <section className="evidence-center" id="evidence"><div className="section-heading"><div><p className="eyebrow">循证依据</p><h2>数字心理干预的研究概览</h2></div><p>以下结果来自群体层面的系统综述与元分析，用于说明相关干预的研究基础，不用于预测个体效果。</p></div><div className="evidence-card-grid">
            <article><span>焦虑与抑郁 · 39项试验</span><h3>VR 对比控制条件</h3><strong>焦虑 g=0.79</strong><em>95% CI 0.57–1.02</em><strong>抑郁 g=0.73</strong><em>95% CI 0.25–1.21</em><p>异质性较高，且对比积极干预时未显示稳定优势。</p><a href="https://www.nature.com/articles/s41598-018-28113-6" target="_blank" rel="noreferrer">查看元分析<ExternalLink /></a></article>
            <article><span>VR暴露结合CBT</span><h3>与传统CBT效果相近</h3><strong>优于等待名单</strong><em>退出率 OR=0.79</em><p>研究提示VR是治疗交付工具，不等于自动替代治疗师。</p><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8874794/" target="_blank" rel="noreferrer">查看系统综述<ExternalLink /></a></article>
            <article><span>老年慢病人群 · 19项RCT</span><h3>特定人群的亚组参照</h3><strong>焦虑 SMD=-0.76</strong><em>95% CI -0.95至-0.57</em><strong>抑郁 SMD=-0.67</strong><em>95% CI -0.90至-0.45</em><p>只用于支持老年模块研发，不用于预测某位用户一定受益。</p><a href="https://pubmed.ncbi.nlm.nih.gov/39697092/" target="_blank" rel="noreferrer">查看研究<ExternalLink /></a></article>
          </div></section>
          <footer className="home-footer"><ShieldCheck />本页面用于心理筛查与体验记录，不替代医学诊断或紧急危机干预。</footer>
        </div>
      ) : <div className="app-layout">
        <aside className="journey-panel">
          <div className="breathing-visual" aria-hidden="true"><span /></div>
          <p className="eyebrow">YOUR JOURNEY</p><h1>一次完整、可追溯的情绪体验</h1>
          <p className="journey-intro">完成症状筛查与即时状态测量，体验正念视频或沉浸式互动，并形成结构化个人报告。</p>
          <ol className="journey-list">
            {journey.map((item, index) => {
              const current = Math.min(6, Math.floor(scaleProgress(stage) / 15));
              return <li key={item} className={index < current ? "done" : index === current ? "active" : ""}><span>{index < current ? <Check /> : index + 1}</span>{item}</li>;
            })}
          </ol>
          <div className="evidence-note"><Activity /><span>筛查量表与即时状态数据分开解释，避免把一次放松体验误报为症状治愈。</span></div>
        </aside>

        <section className="workspace">
          <div className="workspace-top"><span>体验进度</span><strong>{scaleProgress(stage)}%</strong></div><Progress value={scaleProgress(stage)} />

          {stage === "setup" && (
            <section className="stage-panel setup-stage">
              <p className="eyebrow">第一步 · 建立体验画像</p><h2>先选择年龄和当前最想了解的问题</h2><p className="lead">系统会按年龄与问题分配合适的筛查量表。当前版本覆盖12岁及以上人群。</p>
              <div className="choice-block"><label>年龄范围</label>
                <RadioGroup value={age} onValueChange={(value) => { const next = value as AgeBand; setAge(next); resetAssessment(next, concern); }} className="choice-grid four">
                  {(Object.keys(ageLabels) as AgeBand[]).map((value) => <label className="choice-card" key={value} data-selected={age === value}><RadioGroupItem value={value} /><span>{ageLabels[value]}</span>{value === "under12" && <small>需监护人与专业端</small>}</label>)}
                </RadioGroup>
              </div>
              <div className="choice-block"><label>主要问题</label>
                <RadioGroup value={concern} onValueChange={(value) => { const next = value as Concern; setConcern(next); resetAssessment(age, next); }} className="choice-grid two">
                  <label className="choice-card concern" data-selected={concern === "anxiety"}><RadioGroupItem value="anxiety" /><HeartPulse /><span>{concernLabels.anxiety}</span><small>分配 GAD-7</small></label>
                  <label className="choice-card concern" data-selected={concern === "depression"}><RadioGroupItem value="depression" /><Sparkles /><span>{concernLabels.depression}</span><small>{age === "65plus" ? "分配 GDS-15" : "分配 PHQ-9"}</small></label>
                </RadioGroup>
              </div>
              {scaleId ? <div className="route-summary"><span>为你分配</span><strong>{scales[scaleId].name}</strong><small>{scales[scaleId].recall}</small></div> : <Alert><CircleAlert /><AlertTitle>儿童版暂不自动开放</AlertTitle><AlertDescription>12岁以下需要儿童量表、照护者报告和专业人员共同判断。后续可单独建立儿童版流程。</AlertDescription></Alert>}
              {notice && <p className="form-notice" role="alert">{notice}</p>}
              <div className="stage-actions"><Button size="lg" onClick={startAssessment}>开始量表前测<ArrowRight /></Button></div>
            </section>
          )}

          {stage === "assessment" && selectedScale && (
            <section className="stage-panel assessment-stage">
              <div className="stage-heading"><div><p className="eyebrow">第二步 · 量表前测</p><h2>{selectedScale.name}</h2><p className="lead">{selectedScale.recall}请根据实际情况完成所有题目，系统依据量表计分规则生成结果。</p></div><a href={selectedScale.sourceUrl} target="_blank" rel="noreferrer" className="source-link">查看来源<ExternalLink /></a></div>
              <div className="question-list">
                {selectedScale.items.map((item, index) => <fieldset className="question-row" key={item.id}><legend><span>{String(index + 1).padStart(2, "0")}</span>{item.text}</legend>
                  <RadioGroup value={answers[index] >= 0 ? String(answers[index]) : undefined} onValueChange={(value) => setAnswers((current) => current.map((answer, i) => i === index ? Number(value) : answer))} className={`answer-grid ${selectedScale.id === "GDS15" ? "binary" : ""}`}>
                    {selectedScale.options.map((option) => <label key={option.value} data-selected={answers[index] === option.value}><RadioGroupItem value={String(option.value)} />{option.label}</label>)}
                  </RadioGroup>
                </fieldset>)}
              </div>
              <fieldset className="safety-check"><legend><ShieldCheck />安全确认（不计入量表总分）</legend><p>当前是否存在立即伤害自己或他人的风险，或无法保证自身安全？</p><RadioGroup value={safetyRisk ?? undefined} onValueChange={(value) => setSafetyRisk(value as "yes" | "no")} className="answer-grid binary"><label data-selected={safetyRisk === "no"}><RadioGroupItem value="no" />否</label><label data-selected={safetyRisk === "yes"}><RadioGroupItem value="yes" />是</label></RadioGroup></fieldset>
              {notice && <p className="form-notice" role="alert">{notice}</p>}
              <div className="stage-actions between"><Button variant="outline" onClick={() => setStage("setup")}><ArrowLeft />返回</Button><Button onClick={completeAssessment}>查看筛查结果<ArrowRight /></Button></div>
            </section>
          )}

          {stage === "baseline" && selectedScale && severity && (
            <section className="stage-panel result-stage">
              <p className="eyebrow">第三步 · 初步筛查结果</p><div className="result-title-row"><div><h2>你的当次作答结果</h2><p className="lead">以下分数、分层和条目图均直接来自你刚才的答案。</p></div><div className={`severity-badge ${severity.tone}`}>{severity.label}</div></div>
              <div className="result-grid">
                <div className="score-panel"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={[{ value: score }, { value: selectedScale.max - score }]} dataKey="value" startAngle={210} endAngle={-30} innerRadius={72} outerRadius={92} stroke="none"><Cell fill="var(--teal-600)" /><Cell fill="var(--mist-200)" /></Pie></PieChart></ResponsiveContainer><div className="score-center"><strong>{score}</strong><span>/ {selectedScale.max}</span></div><small>{selectedScale.name}</small></div>
                <div className="item-chart-panel"><h3>各条目实际得分</h3><ResponsiveContainer width="100%" height={245}><BarChart data={itemData} margin={{ left: -20, right: 8 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="item" tickLine={false} axisLine={false} /><YAxis domain={[0, selectedScale.id === "GDS15" ? 1 : 3]} allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [`${value} 分`, "条目得分"]} labelFormatter={(value) => `第 ${value} 题`} /><Bar dataKey="score" fill="var(--teal-500)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
              </div>
              {blockedByRisk ? <Alert variant="destructive"><CircleAlert /><AlertTitle>请暂停自动体验并优先获得人工帮助</AlertTitle><AlertDescription>你的回答提示可能存在安全风险。本演示不会继续推荐视频或VR。请立即联系身边可信任的人、当地急救服务或心理危机支持；如风险迫近，请不要独处。</AlertDescription></Alert> : <div className="interpretation"><h3>如何理解</h3><p>这是筛查分层，不是医学诊断。量表反映的是特定回顾期内的症状频率；下一阶段只测量“当前此刻”的主观不适度，两者不能互相替代。</p></div>}
              <div className="stage-actions between"><Button variant="outline" onClick={() => setStage("assessment")}><ArrowLeft />修改答案</Button>{!blockedByRisk && <Button onClick={() => setStage("hub")}>进入预体验模块<ArrowRight /></Button>}</div>
            </section>
          )}

          {stage === "hub" && (
            <section className="stage-panel hub-stage">
              <p className="eyebrow">第四步 · 选择预体验</p><h2>选择一种情绪调节体验</h2><p className="lead">每个模块均包含体验前SUDS、体验过程、体验后SUDS和{selectedScale?.name}即时复测。</p>
              <div className="module-grid">
                <article className="module-card"><div className="module-icon video"><Film /></div><div className="module-copy"><span>72秒 · 视频 · 古典钢琴</span><h3>正念呼吸暂停</h3><p>在轻柔的古典钢琴旋律中，通过缓慢吸气、短暂停留和延长呼气完成呼吸觉察练习。</p></div>{results.video ? <div className="module-result"><Check />已完成 · SUDS {results.video.pre} → {results.video.post} · 量表 {score} → {results.video.retestScore}</div> : <Button onClick={() => chooseModule("video")}>开始视频体验<ArrowRight /></Button>}</article>
                <article className="module-card featured"><div className="module-icon vr"><Sparkles /></div><div className="module-copy"><span>60秒 · 3D / WebXR · 语音节奏</span><h3>光息花园</h3><p>跟随呼吸光球，在呼气阶段收集漂浮光点；支持桌面沉浸模式，兼容设备可进入VR头显。</p></div>{results.vr ? <div className="module-result"><Check />已完成 · SUDS {results.vr.pre} → {results.vr.post} · 量表 {score} → {results.vr.retestScore}</div> : <Button onClick={() => chooseModule("vr")}>开始VR互动<ArrowRight /></Button>}</article>
              </div>
              <div className="research-context"><Activity /><div><strong>VR干预研究概览</strong><p>现有元分析显示，VR干预相对等待或非干预控制可改善焦虑症状；与传统CBT相比尚未显示稳定优势，适合作为心理干预的辅助媒介。</p></div><a href="https://www.nature.com/articles/s41598-018-28113-6" target="_blank" rel="noreferrer">文献来源<ExternalLink /></a></div>
              <div className="stage-actions between"><Button variant="outline" onClick={() => setStage("baseline")}><ArrowLeft />查看筛查结果</Button><Button disabled={completedCount === 0} onClick={() => setStage("report")}>查看总报告<ArrowRight /></Button></div>
            </section>
          )}

          {stage === "suds-pre" && pendingModule && <SudsPanel title={`${pendingModule === "video" ? "视频" : "VR"}体验前`} value={currentSuds} onChange={setCurrentSuds} onBack={() => setStage("hub")} onNext={savePreSuds} button="记录前测并开始" />}

          {stage === "video" && (
            <section className="stage-panel experience-stage"><p className="eyebrow">正念视频体验</p><h2>正念呼吸暂停</h2><p className="lead">点击播放后，跟随画面与古典钢琴旋律调整呼吸。建议佩戴耳机，并将设备音量调至舒适水平。</p><div className="audio-toolbar"><Volume2 /><span>视频内含古典钢琴音轨，播放时将同步输出声音。</span></div><video ref={videoRef} className="mindful-video" controls playsInline preload="metadata" onEnded={() => setVideoEnded(true)}><source src="/mindful-breathing.mp4" type="video/mp4" />当前浏览器不支持HTML5视频播放。</video><div className="video-status">{videoEnded ? <><Check />播放完成，可以填写后测</> : <><Film />请完整播放至结束</>}</div><div className="stage-actions between"><Button variant="outline" onClick={() => { videoRef.current?.pause(); setStage("hub"); }}><ArrowLeft />退出体验</Button><Button disabled={!videoEnded} onClick={finishExperience}>进入即时后测<ArrowRight /></Button></div></section>
          )}

          {stage === "vr" && active && <section className="stage-panel experience-stage"><p className="eyebrow">VR正念辅助互动</p><h2>光息花园</h2><p className="lead">支持鼠标或触屏观察；兼容WebXR的设备可进入头显模式，并跟随语音节奏完成呼吸互动。</p><VrMindfulness onComplete={completeVr} /><Button variant="outline" className="exit-vr" onClick={() => setStage("hub")}><ArrowLeft />退出体验</Button></section>}

          {stage === "suds-post" && pendingModule && <SudsPanel title={`${pendingModule === "video" ? "视频" : "VR"}体验后`} value={currentSuds} onChange={setCurrentSuds} onBack={() => setStage(pendingModule)} onNext={savePostSuds} button="保存后测数据" />}

          {stage === "retest" && selectedScale && pendingModule && (
            <section className="stage-panel assessment-stage retest-stage"><p className="eyebrow">体验后 · 同量表即时复测</p><h2>再次完成 {selectedScale.name}</h2><Alert><CircleAlert /><AlertTitle>即时复测说明</AlertTitle><AlertDescription>{selectedScale.name}有固定回顾期（{selectedScale.recall}）。立即复测可能受记忆和当前情境影响，结果仅用于本次体验记录，不作为临床疗效判定。</AlertDescription></Alert>
              <div className="question-list">{selectedScale.items.map((item,index)=><fieldset className="question-row" key={item.id}><legend><span>{String(index+1).padStart(2,"0")}</span>{item.text}</legend><RadioGroup value={retestAnswers[index] >= 0 ? String(retestAnswers[index]) : undefined} onValueChange={(value)=>setRetestAnswers(current=>current.map((answer,i)=>i===index?Number(value):answer))} className={`answer-grid ${selectedScale.id === "GDS15" ? "binary" : ""}`}>{selectedScale.options.map(option=><label key={option.value} data-selected={retestAnswers[index]===option.value}><RadioGroupItem value={String(option.value)} />{option.label}</label>)}</RadioGroup></fieldset>)}</div>
              <fieldset className="safety-check"><legend><ShieldCheck />安全确认（不计入量表总分）</legend><p>当前是否存在立即伤害自己或他人的风险，或无法保证自身安全？</p><RadioGroup value={retestSafetyRisk ?? undefined} onValueChange={(value)=>setRetestSafetyRisk(value as "yes"|"no")} className="answer-grid binary"><label data-selected={retestSafetyRisk==="no"}><RadioGroupItem value="no" />否</label><label data-selected={retestSafetyRisk==="yes"}><RadioGroupItem value="yes" />是</label></RadioGroup></fieldset>
              {notice && <p className="form-notice" role="alert">{notice}</p>}<div className="stage-actions between"><Button variant="outline" onClick={()=>setStage("suds-post")}><ArrowLeft />返回SUDS</Button><Button onClick={completeRetest}>保存复测结果<ArrowRight /></Button></div>
            </section>
          )}

          {stage === "report" && selectedScale && severity && (
            <section className="stage-panel report-stage">
              <p className="eyebrow">第七步 · 数据对比报告</p><h2>个人体验报告</h2><p className="lead">SUDS反映即时主观状态；量表图呈现基线筛查与体验后的即时复测，两类指标分别解释。</p>
              <div className="report-summary-grid"><div><span>基线筛查</span><strong>{selectedScale.name}</strong><em>{score}/{selectedScale.max} · {severity.label}</em></div><div><span>已完成体验</span><strong>{completedCount} / 2</strong><em>{results.video ? "正念视频 " : ""}{results.vr ? "VR互动" : ""}</em></div><div><span>记录方式</span><strong>当次自主作答</strong><em>依据量表规则计分</em></div></div>
              <div className="report-chart-grid"><div className="report-chart"><h3>即时SUDS前后测</h3><ResponsiveContainer width="100%" height={300}><LineChart data={comparisonData} margin={{ left: -12, right: 20, top: 15 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => [`${value}`, "SUDS"]} /><Line type="monotone" dataKey="value" stroke="var(--teal-600)" strokeWidth={3} dot={{ r: 6, fill: "var(--teal-600)" }} /></LineChart></ResponsiveContainer><small>SUDS：0＝完全没有不适，100＝能想象到的最强烈不适。</small></div>
                <div className="change-list"><h3>每个模块的实际变化</h3>{(["video", "vr"] as ModuleId[]).map((module) => { const item = results[module]; if (!item) return null; const diff = item.post - item.pre; return <div className="change-row" key={module}><span>{module === "video" ? "正念视频" : "VR互动"}</span><strong>{item.pre} → {item.post}</strong><em className={diff < 0 ? "down" : diff > 0 ? "up" : "flat"}>{diff > 0 ? "+" : ""}{diff}</em></div>; })}<p>这是短时状态变化，不能解释为焦虑症或抑郁症已经改善。若要评估GAD-7、PHQ-9或GDS-15变化，应在其规定回顾期后再次测量。</p></div></div>
              <div className="symptom-chart"><div><h3>{selectedScale.name}：基线与即时复测</h3><p>图表采用相同题目与计分规则生成。即时复测尚未达到量表规定的自然回顾间隔。</p></div><ResponsiveContainer width="100%" height={290}><BarChart data={symptomComparisonData} margin={{ left: -14, right: 14, top: 16 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis domain={[0, selectedScale.max]} allowDecimals={false} tickLine={false} axisLine={false} /><Tooltip formatter={(value)=>[`${value} 分`,selectedScale.name]} /><Bar dataKey="value" fill="var(--teal-500)" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer><small>正式疗效评估应在量表规定回顾期后复测，并结合功能状态与专业评估。</small></div>
              {([results.video,results.vr].some(item=>item?.retestRisk)) && <Alert variant="destructive"><CircleAlert /><AlertTitle>重复作答中出现安全风险信号</AlertTitle><AlertDescription>请暂停自助体验，立即联系身边可信任的人、当地急救服务或心理危机支持；如风险迫近，请不要独处。</AlertDescription></Alert>}
              <section className="report-evidence"><div><p className="eyebrow">研究参照</p><h3>VR干预的群体研究结果</h3><p>Fodor等纳入39项试验的元分析中，VR相对控制条件对焦虑的标准化效应量为g=0.79（95% CI 0.57–1.02），对抑郁为g=0.73（95% CI 0.25–1.21）。研究存在异质性与偏倚风险，且相对积极干预未显示稳定优势；群体效应量不能与个人分数直接换算。</p></div><a href="https://www.nature.com/articles/s41598-018-28113-6" target="_blank" rel="noreferrer">查看原文<ExternalLink /></a></section>
              <details className="evidence-details"><summary>查看量表、计分与授权依据</summary><div className="evidence-links"><a href="https://aims.uw.edu/implementation-tool/measures/" target="_blank" rel="noreferrer">GAD-7：AIMS Center<ExternalLink /></a><a href="https://www.apa.org/depression-guideline/patient-health-questionnaire.pdf" target="_blank" rel="noreferrer">PHQ-9：APA表格<ExternalLink /></a><a href="https://www.stanford.edu/~yesavage/GDS.html" target="_blank" rel="noreferrer">GDS-15：Stanford<ExternalLink /></a><a href="https://pubmed.ncbi.nlm.nih.gov/29069107/" target="_blank" rel="noreferrer">青少年GAD-7阈值研究<ExternalLink /></a><a href="https://www.mindgarden.com/state-trait-anxiety-inventory-for-adults/771-staiad-license-to-administer.html" target="_blank" rel="noreferrer">STAI授权说明<ExternalLink /></a></div></details>
              <Alert><ShieldCheck /><AlertTitle>本结果是筛查与体验记录，不是医学诊断</AlertTitle><AlertDescription>如症状持续、功能受损明显或存在安全风险，请由心理咨询师、精神科／身心科医生进行完整评估。紧急风险下请立即联系当地急救服务。</AlertDescription></Alert>
              <section className="feedback-panel"><h3>体验反馈（选填）</h3><label>本次体验满意度<select aria-label="体验满意度" value={rating} onChange={e=>setRating(e.target.value)}><option value="">请选择</option>{[1,2,3,4,5].map(v=><option key={v} value={v}>{v} / 5</option>)}</select></label><textarea aria-label="体验感受" rows={3} placeholder="写下本次感受或建议…" value={feedback} onChange={e=>setFeedback(e.target.value)}/></section>
              <div className="report-download"><Button onClick={()=>downloadText('个人体验报告.txt',`数字心理健康智能交互体验系统\n个人体验报告（非医学诊断）\n生成时间：${new Date().toLocaleString('zh-CN')}\n量表：${selectedScale.name}\n基线：${score}/${selectedScale.max} · ${severity.label}\n`+Object.entries(results).map(([k,r])=>`${k==='video'?'正念视频':'VR互动'}：SUDS ${r.pre} → ${r.post}；量表即时复测 ${r.retestScore}；${r.detail||''}`).join('\n')+`\n满意度：${rating||'未填写'}\n体验反馈：${feedback||'未填写'}\n即时复测受记忆与情境影响，不代表临床疗效。SUDS 与症状量表不可互相替代。\n不包含摄像头画面或模拟情绪记录。`)}>导出个人体验报告</Button></div>
              <div className="stage-actions between"><Button variant="outline" disabled={blockedByRisk} onClick={() => setStage("hub")}><ArrowLeft />继续另一项体验</Button><Button onClick={restart}><RotateCcw />重新开始</Button></div>
            </section>
          )}
        </section>
      </div>}
    </main>
  );
}

function SudsPanel({ title, value, onChange, onBack, onNext, button }: { title: string; value: number; onChange: (value: number) => void; onBack: () => void; onNext: () => void; button: string }) {
  return <section className="stage-panel suds-stage"><p className="eyebrow">即时状态测量 · SUDS</p><h2>{title}：你此刻的不适程度是多少？</h2><p className="lead">请只评估“现在这一刻”。0表示完全没有不适，100表示你能想象到的最强烈不适。</p><div className="suds-thermometer"><div className="suds-value"><strong>{value}</strong><span>/ 100</span></div><Slider min={0} max={100} step={1} value={[value]} onValueChange={(next) => onChange(next[0])} aria-label="当前主观不适度" /><div className="suds-labels"><span>完全平静</span><span>中等不适</span><span>极强不适</span></div></div><div className="suds-context"><Activity /><p>SUDS是即时主观状态指标，不等同于GAD-7、PHQ-9或GDS-15的症状总分。</p></div><div className="stage-actions between"><Button variant="outline" onClick={onBack}><ArrowLeft />返回</Button><Button onClick={onNext}>{button}<ArrowRight /></Button></div></section>;
}

