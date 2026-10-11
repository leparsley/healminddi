"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  ArrowLeft,
  Check,
  Eye,
  Film,
  Glasses,
  Headphones,
  Leaf,
  Maximize2,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

type Mode = "film" | "breath" | "sound" | "gaze";
type InteractiveMode = Exclude<Mode, "film">;

const modeCopy: Record<Mode, {
  short: string;
  title: string;
  description: string;
  goal: string;
  interaction: string;
  feedback: string;
}> = {
  film: {
    short: "视听样片",
    title: "云间呼吸",
    description: "以缓慢镜头、呼吸字幕和古典钢琴构成一段低刺激正念视听体验。",
    goal: "让第一次接触VR的用户先适应声音、运动速度与沉浸感。",
    interaction: "播放、暂停、音量与全屏；后续可转制为180°或360°视频。",
    feedback: "记录观看完成度、主动退出、眩晕与体验前后SUDS。",
  },
  breath: {
    short: "呼吸光场",
    title: "呼气拾光",
    description: "中央光球以4秒吸气、6秒呼气循环；只有呼气阶段可以收集光点。",
    goal: "把抽象的腹式呼吸节奏转化为可观察、可操作的空间变化。",
    interaction: "吸气时观察，呼气时点击光点；头显版可改为手柄射线或手势触碰。",
    feedback: "光球缩放、光点消散、节奏提示与完成进度同步反馈。",
  },
  sound: {
    short: "声景花园",
    title: "触声生长",
    description: "触碰漂浮种子，让植物逐步发光；古典钢琴作为连续的情绪背景。",
    goal: "用低失败感的创造性任务提升参与感，让用户看到自己的操作留下痕迹。",
    interaction: "点击种子完成培育；后续可用手势距离、呼吸深度或HRV驱动生长。",
    feedback: "每次触碰生成一株发光植物，颜色与空间亮度逐步变化。",
  },
  gaze: {
    short: "凝视星河",
    title: "凝视归心",
    description: "将光标停留在漂浮星体上约1.2秒，无需点击即可完成一次凝视。",
    goal: "展示眼动交互的基本逻辑，同时减少复杂手柄操作。",
    interaction: "桌面版以指针停留模拟凝视；HTC Vive Pro Eye版接入Tobii注视射线。",
    feedback: "目标出现环形计时，完成后汇入中央星云并记录凝视次数。",
  },
};

const cases = [
  ["DEEP", "呼吸即控制器", "用腹式呼吸控制水下移动，把生理训练藏进探索过程。", "https://www.exploredeep.com/"],
  ["Flowborne VR", "呼吸驱动旅程", "用手柄感知腹部起伏，通过连续的空间旅程训练呼吸觉察。", "https://flowborne.com/"],
  ["Healium", "生理信号可视化", "心率、HRV或脑电改变场景，并在体验后形成个人反馈。", "https://tryhealium.com/how-it-works"],
  ["TRIPP", "生成式沉浸空间", "以抽象视觉、引导声音和短时任务构成Focus与Calm体验。", "https://www.tripp.com/"],
  ["Nature Treks VR", "可塑造的自然环境", "用户可以改变时间、天气与生态，获得低压力的环境控制感。", "https://store.steampowered.com/app/587580/Nature_Treks_VR/"],
  ["Liminal", "按状态组织内容", "按Calm、Awe、Focus等目标建立短体验库，适合内容平台结构。", "https://liminalvr.com/consumer"],
  ["gameChange", "虚拟教练与分级任务", "在现实情境中逐级练习，由虚拟教练解释任务并支持复盘。", "https://www.psy.ox.ac.uk/research/oxford-cognitive-approaches-to-psychosis/projects-1/gamechange"],
] as const;

type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported: (mode: string) => Promise<boolean>;
    requestSession: (mode: string, options?: Record<string, unknown>) => Promise<Parameters<THREE.WebXRManager["setSession"]>[0]>;
  };
};

function SpatialExperience({ mode, onProgress, onFinish }: {
  mode: InteractiveMode;
  onProgress: (value: number, message: string) => void;
  onFinish: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const [started, setStarted] = useState(false);
  const [audio, setAudio] = useState(true);
  const [vrReady, setVrReady] = useState(false);
  const mediaRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const nav = navigator as XRNavigator;
    nav.xr?.isSessionSupported("immersive-vr").then(setVrReady).catch(() => setVrReady(false));
  }, []);

  useEffect(() => {
    setStarted(false);
    onProgress(0, mode === "gaze" ? "将光标停留在星体上，等待环形进度完成。" : "进入场景后按照提示完成互动。 ");
    mediaRef.current?.pause();
  }, [mode, onProgress]);

  const start = async () => {
    setStarted(true);
    if (audio && mediaRef.current) {
      mediaRef.current.currentTime = 0;
      await mediaRef.current.play().catch(() => undefined);
    }
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!started || !host) return;

    const palette = mode === "sound"
      ? { background: 0x171b31, floor: 0x242846, key: 0xffd8a8, accent: 0xf0b9ff }
      : mode === "gaze"
        ? { background: 0x11152d, floor: 0x1d2340, key: 0xb8d9ff, accent: 0xa8b7ff }
        : { background: 0x211a38, floor: 0x362a55, key: 0xc9b6ff, accent: 0xd9c7ff };

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(palette.background);
    scene.fog = new THREE.FogExp2(palette.background, 0.05);
    const camera = new THREE.PerspectiveCamera(66, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 1.7, 7.2);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.xr.enabled = true;
    renderer.domElement.setAttribute("aria-label", `${modeCopy[mode].title}三维交互场景`);
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.HemisphereLight(0xf1e9ff, 0x111326, 2.2));
    const point = new THREE.PointLight(palette.key, 24, 24);
    point.position.set(0, 4, 3);
    scene.add(point);
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(18, 72),
      new THREE.MeshStandardMaterial({ color: palette.floor, roughness: 0.88, metalness: 0.05 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.25;
    scene.add(floor);

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(mode === "sound" ? 0.35 : 0.68, 36, 24),
      new THREE.MeshStandardMaterial({ color: palette.key, emissive: palette.accent, emissiveIntensity: 1.1 }),
    );
    center.position.set(0, 1.65, 0);
    scene.add(center);

    const targets: THREE.Mesh[] = [];
    const count = mode === "gaze" ? 6 : 8;
    const geometry = mode === "sound" ? new THREE.OctahedronGeometry(0.25, 0) : new THREE.IcosahedronGeometry(0.23, 1);
    for (let index = 0; index < count; index += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: index % 2 ? palette.key : palette.accent,
        emissive: index % 2 ? palette.accent : palette.key,
        emissiveIntensity: 1.25,
        transparent: true,
        opacity: 0.94,
      });
      const target = new THREE.Mesh(geometry, material);
      const angle = (index / count) * Math.PI * 2 + 0.25;
      const radius = 2.25 + (index % 3) * 0.55;
      target.position.set(Math.cos(angle) * radius, 1.2 + (index % 3) * 0.72, Math.sin(angle) * radius - 1.1);
      target.userData.active = true;
      targets.push(target);
      scene.add(target);
    }

    const particlesGeometry = new THREE.BufferGeometry();
    const particlePositions: number[] = [];
    for (let index = 0; index < 260; index += 1) {
      particlePositions.push((Math.random() - 0.5) * 22, Math.random() * 8.5, (Math.random() - 0.5) * 20);
    }
    particlesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particlesGeometry,
      new THREE.PointsMaterial({ color: palette.key, size: 0.035, transparent: true, opacity: 0.55 }),
    );
    scene.add(particles);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(4, 4);
    const clock = new THREE.Clock();
    let collected = 0;
    let yaw = 0;
    let pitch = 0;
    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let hoverTarget: THREE.Object3D | null = null;
    let hoverStartedAt = 0;
    let lastReportedDwell = -1;

    const growPlant = (position: THREE.Vector3, index: number) => {
      const group = new THREE.Group();
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.055, 0.8 + index * 0.04, 10),
        new THREE.MeshStandardMaterial({ color: 0x92d6c2, emissive: 0x376d65, emissiveIntensity: 0.35 }),
      );
      stem.position.y = 0.38;
      const bloom = new THREE.Mesh(
        new THREE.SphereGeometry(0.18 + (index % 3) * 0.025, 18, 12),
        new THREE.MeshStandardMaterial({ color: palette.accent, emissive: palette.key, emissiveIntensity: 1.5 }),
      );
      bloom.position.y = 0.82 + index * 0.04;
      group.add(stem, bloom);
      group.position.set(position.x, -0.2, position.z);
      group.scale.setScalar(0.01);
      group.userData.birth = clock.elapsedTime;
      scene.add(group);
    };

    const collect = (target: THREE.Object3D) => {
      if (!target.userData.active) return;
      const elapsed = clock.elapsedTime;
      if (mode === "breath" && elapsed % 10 < 4) {
        onProgress((collected / count) * 100, "现在是吸气阶段。先观察光球，呼气时再触碰光点。 ");
        return;
      }
      target.userData.active = false;
      target.visible = false;
      if (mode === "sound") growPlant(target.position, collected);
      collected += 1;
      const label = mode === "sound" ? `已培育 ${collected}/${count} 株光植。` : mode === "gaze" ? `已完成 ${collected}/${count} 次凝视。` : `已在呼气阶段收集 ${collected}/${count} 个光点。`;
      onProgress((collected / count) * 100, label);
      if (collected >= count) window.setTimeout(onFinish, 700);
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const onPointerDown = (event: PointerEvent) => {
      updatePointer(event);
      if (mode !== "gaze") {
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(targets).find((entry) => entry.object.userData.active);
        if (hit) collect(hit.object);
      }
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onPointerMove = (event: PointerEvent) => {
      updatePointer(event);
      if (!dragging) return;
      yaw -= (event.clientX - previousX) * 0.0028;
      pitch -= (event.clientY - previousY) * 0.002;
      pitch = THREE.MathUtils.clamp(pitch, -0.5, 0.5);
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onPointerUp = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener("resize", resize);

    renderer.setAnimationLoop(() => {
      const elapsed = clock.getElapsedTime();
      const cycle = elapsed % 10;
      const inhale = cycle < 4;
      const phase = inhale ? cycle / 4 : (cycle - 4) / 6;
      const scale = inhale ? 0.78 + phase * 0.48 : 1.26 - phase * 0.48;
      center.scale.setScalar(mode === "breath" ? scale : 1 + Math.sin(elapsed * 0.7) * 0.08);
      targets.forEach((target, index) => {
        target.rotation.x += 0.004;
        target.rotation.y += 0.006;
        target.position.y += Math.sin(elapsed * 0.7 + index) * 0.0007;
      });
      particles.rotation.y = elapsed * 0.008;

      if (mode === "gaze") {
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(targets).find((entry) => entry.object.userData.active)?.object ?? null;
        if (hit !== hoverTarget) {
          if (hoverTarget) hoverTarget.scale.setScalar(1);
          hoverTarget = hit;
          hoverStartedAt = elapsed;
          lastReportedDwell = -1;
        }
        if (hoverTarget) {
          const dwell = Math.min(1, (elapsed - hoverStartedAt) / 1.2);
          hoverTarget.scale.setScalar(1 + dwell * 0.8);
          const reportStep = Math.floor(dwell * 10);
          if (reportStep !== lastReportedDwell) {
            lastReportedDwell = reportStep;
            onProgress(((collected + dwell) / count) * 100, dwell < 1 ? "保持凝视，目标正在响应。" : `已完成 ${collected + 1}/${count} 次凝视。`);
          }
          if (dwell >= 1) {
            const completed = hoverTarget;
            hoverTarget = null;
            collect(completed);
          }
        }
      }

      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
      renderer.render(scene, camera);
    });

    return () => {
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      geometry.dispose();
      particlesGeometry.dispose();
      rendererRef.current = null;
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [started, mode, onFinish, onProgress]);

  const enterVr = async () => {
    const nav = navigator as XRNavigator;
    if (!nav.xr || !rendererRef.current) return;
    const session = await nav.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] }).catch(() => null);
    if (session) await rendererRef.current.xr.setSession(session);
  };

  return (
    <div className="lab-spatial-shell">
      <video ref={mediaRef} src="/mindful-breathing.mp4" loop playsInline className="lab-audio-source" />
      {!started && (
        <div className="lab-start-layer">
          <div className="lab-start-orb"><Sparkles /></div>
          <strong>{modeCopy[mode].title}</strong>
          <p>{modeCopy[mode].description}</p>
          <Button size="lg" onClick={start}><Play />开始互动</Button>
        </div>
      )}
      <div ref={hostRef} className="lab-spatial-canvas" />
      {started && (
        <div className="lab-canvas-tools">
          <button onClick={() => {
            const next = !audio;
            setAudio(next);
            if (!mediaRef.current) return;
            if (next) mediaRef.current.play().catch(() => undefined);
            else mediaRef.current.pause();
          }}>{audio ? <Volume2 /> : <VolumeX />}<span>{audio ? "声音开启" : "声音关闭"}</span></button>
          <button onClick={() => hostRef.current?.requestFullscreen?.()}><Maximize2 /><span>全屏</span></button>
          {vrReady && <button onClick={enterVr}><Glasses /><span>进入头显</span></button>}
        </div>
      )}
    </div>
  );
}

export default function DesignLab() {
  const [mode, setMode] = useState<Mode>("film");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("选择一种原型开始体验。");
  const [baseline, setBaseline] = useState(55);
  const [post, setPost] = useState(35);
  const [completed, setCompleted] = useState(false);
  const [filmPlaying, setFilmPlaying] = useState(false);
  const filmRef = useRef<HTMLVideoElement>(null);

  const handleProgress = useCallback((value: number, nextMessage: string) => {
    setProgress(value);
    setMessage(nextMessage);
  }, []);

  const finish = useCallback(() => {
    setProgress(100);
    setMessage("本次互动已完成，可以填写体验后状态并查看记录卡。 ");
    setCompleted(true);
  }, []);

  const resetMode = (next: Mode) => {
    setMode(next);
    setProgress(0);
    setCompleted(false);
    setFilmPlaying(false);
    setMessage(next === "film" ? "点击播放并打开声音，完成一段视听适应体验。" : "进入场景后按照提示完成互动。 ");
  };

  const delta = baseline - post;
  const resultLabel = delta > 0 ? `即时紧张感下降 ${delta} 分` : delta < 0 ? `即时紧张感上升 ${Math.abs(delta)} 分` : "即时紧张感无变化";
  const current = modeCopy[mode];
  const ModeIcon = mode === "film" ? Film : mode === "breath" ? Waves : mode === "sound" ? Headphones : Eye;

  const designSteps = useMemo(() => [
    ["1", "状态输入", "体验前SUDS、眩晕史与声音偏好"],
    ["2", "感官引导", mode === "film" ? "镜头、字幕、古典钢琴" : "视觉节奏、空间声音与交互提示"],
    ["3", "低压力任务", current.interaction],
    ["4", "结果反馈", current.feedback],
  ], [current, mode]);

  return (
    <main className="design-lab">
      <header className="lab-header">
        <a href="/" className="lab-back"><ArrowLeft />返回完整系统</a>
        <div className="lab-brand"><span><Leaf /></span><div><strong>澄心 · 设计体验实验室</strong><small>VR疗愈视听与空间交互原型</small></div></div>
        <div className="lab-note">工业设计 × 交互设计 × 数字健康</div>
      </header>

      <section className="lab-workbench">
        <nav className="lab-mode-nav" aria-label="原型类型">
          {(Object.keys(modeCopy) as Mode[]).map((item) => {
            const Icon = item === "film" ? Film : item === "breath" ? Waves : item === "sound" ? Headphones : Eye;
            return <button key={item} onClick={() => resetMode(item)} data-active={mode === item}><Icon /><span>{modeCopy[item].short}</span><small>{modeCopy[item].title}</small></button>;
          })}
        </nav>

        <div className="lab-stage">
          <div className="lab-stage-heading"><div><p>PROTOTYPE 0{(Object.keys(modeCopy) as Mode[]).indexOf(mode) + 1}</p><h1>{current.title}</h1><span>{current.description}</span></div><ModeIcon /></div>
          <div className="lab-media-frame">
            {mode === "film" ? (
              <div className="lab-film">
                <video ref={filmRef} src="/mindful-breathing.mp4" controls playsInline onPlay={() => setFilmPlaying(true)} onPause={() => setFilmPlaying(false)} onEnded={finish} />
                <div className="lab-film-label"><span className={filmPlaying ? "is-live" : ""} />{filmPlaying ? "视听样片播放中" : "点击视频播放，声音随视频同步开启"}</div>
              </div>
            ) : <SpatialExperience mode={mode} onProgress={handleProgress} onFinish={finish} />}
          </div>
          <div className="lab-progress"><div><strong>{Math.round(progress)}%</strong><span>{message}</span></div><Progress value={progress} /></div>
        </div>

        <aside className="lab-spec-panel">
          <p className="lab-kicker">设计说明</p>
          <h2>不是观看效果图，而是完成一次体验</h2>
          <dl><div><dt>设计目标</dt><dd>{current.goal}</dd></div><div><dt>交互映射</dt><dd>{current.interaction}</dd></div><div><dt>结果反馈</dt><dd>{current.feedback}</dd></div></dl>
          <div className="lab-suds"><div><span>体验前 SUDS</span><strong>{baseline}</strong></div><Slider value={[baseline]} min={0} max={100} step={5} onValueChange={([value]) => setBaseline(value)} /><div><span>体验后 SUDS</span><strong>{post}</strong></div><Slider value={[post]} min={0} max={100} step={5} onValueChange={([value]) => setPost(value)} /></div>
          <div className="lab-result-card" data-complete={completed}><span>{completed ? <Check /> : <MousePointer2 />}</span><div><small>{completed ? "体验记录" : "完成原型后生成记录"}</small><strong>{completed ? resultLabel : "等待完成"}</strong><p>SUDS只表示当下主观不适程度，不等同于临床疗效。</p></div></div>
          <Button variant="outline" onClick={() => resetMode(mode)}><RotateCcw />重新体验</Button>
        </aside>
      </section>

      <section className="lab-design-logic">
        <div className="lab-section-title"><p>DESIGN LOGIC</p><h2>每个体验都按照同一条设计链完成</h2><span>这样不同小组可以并行设计场景，但最后仍能接入同一套产品流程。</span></div>
        <div className="lab-step-grid">{designSteps.map(([index, title, body]) => <article key={index}><span>{index}</span><h3>{title}</h3><p>{body}</p></article>)}</div>
      </section>

      <section className="lab-benchmarks">
        <div className="lab-section-title"><p>REFERENCE CASES</p><h2>可直接转化为设计任务的案例</h2><span>重点看交互结构与反馈方式，不照搬治疗结论或视觉资产。</span></div>
        <div className="lab-case-grid">{cases.map(([name, focus, detail, href], index) => <a href={href} target="_blank" rel="noreferrer" key={name}><span>0{index + 1}</span><small>{focus}</small><h3>{name}</h3><p>{detail}</p><strong>查看案例 ↗</strong></a>)}</div>
      </section>

      <section className="lab-deliverables">
        <div><p>研究生阶段建议做到</p><h2>每个设计小组交付一套“可以体验、可以记录、可以复盘”的原型</h2></div>
        <ul><li><Check />一张场景情绪板与空间脚本</li><li><Check />一个60—180秒可运行交互</li><li><Check />一套声音、动作与反馈对应表</li><li><Check />一张体验结果记录卡</li><li><Check />一次5—8人的可用性测试</li><li><Check />一段30—60秒演示录像</li></ul>
      </section>
    </main>
  );
}
