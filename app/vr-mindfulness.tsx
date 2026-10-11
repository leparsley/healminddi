"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Glasses, Maximize2, Play, Sparkles, Volume2, VolumeX } from "lucide-react";

type Props = {
  onComplete: (collected: number) => void;
};

type ThreeXRSession = Parameters<THREE.WebXRManager["setSession"]>[0];

type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported: (mode: string) => Promise<boolean>;
    requestSession: (mode: string, options?: Record<string, unknown>) => Promise<ThreeXRSession>;
  };
};

export default function VrMindfulness({ onComplete }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    cleanup: () => void;
  } | null>(null);
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(60);
  const [collected, setCollected] = useState(0);
  const [message, setMessage] = useState("准备好后，进入场景并跟随呼吸节奏触碰光点。");
  const [vrReady, setVrReady] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioEnabledRef = useRef(true);
  const lastPhaseRef = useRef("");

  const speak = (text: string) => {
    if (!audioEnabledRef.current || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN"; utterance.rate = 0.78; utterance.volume = 0.9;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const nav = navigator as XRNavigator;
    nav.xr?.isSessionSupported("immersive-vr").then(setVrReady).catch(() => setVrReady(false));
  }, []);

  useEffect(() => {
    if (!started || !hostRef.current) return;

    const host = hostRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x211a38);
    scene.fog = new THREE.FogExp2(0x211a38, 0.055);
    const camera = new THREE.PerspectiveCamera(68, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 1.6, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.xr.enabled = true;
    renderer.domElement.setAttribute("aria-label", "可交互的沉浸式正念光点场景");
    host.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xe7dcff, 0x171126, 2.1);
    scene.add(hemi);
    const key = new THREE.PointLight(0xbda8ff, 18, 20);
    key.position.set(0, 4, 3);
    scene.add(key);

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(18, 64),
      new THREE.MeshStandardMaterial({ color: 0x362a55, roughness: 0.8, metalness: 0.05 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    scene.add(floor);

    const breathOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.72, 36, 24),
      new THREE.MeshStandardMaterial({ color: 0xc8b7ff, emissive: 0x6247ae, emissiveIntensity: 1.4 })
    );
    breathOrb.position.set(0, 1.8, 0);
    scene.add(breathOrb);

    const targets: THREE.Mesh[] = [];
    const targetGeometry = new THREE.IcosahedronGeometry(0.22, 1);
    for (let i = 0; i < 12; i += 1) {
      const material = new THREE.MeshStandardMaterial({
        color: i % 2 ? 0xaed8ff : 0xd7b8ff,
        emissive: i % 2 ? 0x315d89 : 0x70439c,
        emissiveIntensity: 1.4,
      });
      const target = new THREE.Mesh(targetGeometry, material);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 2.4 + (i % 3) * 0.75;
      target.position.set(Math.cos(angle) * radius, 1.2 + (i % 4) * 0.55, Math.sin(angle) * radius - 1.5);
      target.userData.active = true;
      targets.push(target);
      scene.add(target);
    }

    const dustGeometry = new THREE.BufferGeometry();
    const dustPoints: number[] = [];
    for (let i = 0; i < 260; i += 1) {
      dustPoints.push((Math.random() - 0.5) * 24, Math.random() * 9, (Math.random() - 0.5) * 22);
    }
    dustGeometry.setAttribute("position", new THREE.Float32BufferAttribute(dustPoints, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({ color: 0xd8c8ff, size: 0.035, transparent: true, opacity: 0.55 })
    );
    scene.add(dust);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const startTime = performance.now();
    let yaw = 0;
    let pitch = 0;
    let dragging = false;
    let previousX = 0;
    let previousY = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(targets).find((entry) => entry.object.userData.active);
      if (!hit) return;
      const elapsed = (performance.now() - startTime) / 1000;
      const cycle = elapsed % 10;
      if (cycle < 4) {
        setMessage("先吸气并观察光点；呼气阶段再轻触它。");
        return;
      }
      hit.object.userData.active = false;
      hit.object.visible = false;
      setCollected((value) => {
        const next = value + 1;
        setMessage(next >= 8 ? "完成：你已在呼气阶段收集8个光点。" : `很好，已收集 ${next} / 8 个光点。`);
        if (next === 8) window.setTimeout(() => onComplete(next), 800);
        return next;
      });
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      yaw -= (event.clientX - previousX) * 0.003;
      pitch -= (event.clientY - previousY) * 0.002;
      pitch = THREE.MathUtils.clamp(pitch, -0.55, 0.55);
      previousX = event.clientX;
      previousY = event.clientY;
    };
    const onPointerUp = () => { dragging = false; };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    const resize = () => {
      if (!hostRef.current) return;
      camera.aspect = hostRef.current.clientWidth / hostRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(hostRef.current.clientWidth, hostRef.current.clientHeight);
    };
    window.addEventListener("resize", resize);

    renderer.setAnimationLoop((time) => {
      const elapsed = (time - startTime) / 1000;
      const cycle = elapsed % 10;
      const inhale = cycle < 4;
      const phaseName = inhale ? "inhale" : "exhale";
      if (phaseName !== lastPhaseRef.current) {
        lastPhaseRef.current = phaseName;
        speak(inhale ? "慢慢吸气，观察中央光球。" : "缓缓呼气，现在可以轻触周围光点。 ");
      }
      const phase = inhale ? cycle / 4 : (cycle - 4) / 6;
      const scale = inhale ? 0.78 + phase * 0.48 : 1.26 - phase * 0.48;
      breathOrb.scale.setScalar(scale);
      (breathOrb.material as THREE.MeshStandardMaterial).emissiveIntensity = inhale ? 1.2 + phase : 2.2 - phase;
      targets.forEach((target, index) => {
        target.rotation.x += 0.004;
        target.rotation.y += 0.006;
        target.position.y += Math.sin(elapsed * 0.9 + index) * 0.0008;
      });
      dust.rotation.y = elapsed * 0.008;
      camera.rotation.order = "YXZ";
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
      renderer.render(scene, camera);
    });

    const cleanup = () => {
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      targetGeometry.dispose();
      dustGeometry.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
    sceneRef.current = { renderer, camera, scene, cleanup };
    return cleanup;
  }, [started, onComplete]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  useEffect(() => {
    if (!started || collected >= 8) return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          window.setTimeout(() => onComplete(collected), 300);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [started, collected, onComplete]);

  const enterVr = async () => {
    const nav = navigator as XRNavigator;
    if (!nav.xr || !sceneRef.current) return;
    try {
      const session = await nav.xr.requestSession("immersive-vr", { optionalFeatures: ["local-floor"] });
      await sceneRef.current.renderer.xr.setSession(session);
    } catch {
      setMessage("当前设备未能进入头显模式，可继续使用桌面沉浸模式。");
    }
  };

  const enterFullscreen = () => hostRef.current?.requestFullscreen?.();

  if (!started) {
    return (
      <div className="vr-intro">
        <div className="vr-intro-orb"><Sparkles /></div>
        <h3>光息花园</h3>
        <p>跟随中央光球呼吸：吸气时观察，呼气时触碰周围光点。完成8个光点或体验60秒即结束。</p>
        <div className="vr-start-actions"><Button size="lg" onClick={() => { setStarted(true); window.setTimeout(() => speak("欢迎来到光息花园。吸气时观察，呼气时轻触光点。"), 200); }}><Play />进入沉浸场景</Button><Button variant="outline" onClick={() => setAudioEnabled(value=>{ const next=!value; audioEnabledRef.current=next; return next; })}>{audioEnabled ? <Volume2 /> : <VolumeX />}{audioEnabled ? "语音辅助开启" : "语音辅助关闭"}</Button></div>
      </div>
    );
  }

  return (
    <div className="vr-wrap">
      <div className="vr-toolbar">
        <div>
          <span className="eyebrow">沉浸式互动</span>
          <strong>{seconds}s · 光点 {collected}/8</strong>
        </div>
        <div className="vr-actions">
          <Button variant="outline" size="sm" onClick={() => { setAudioEnabled(value=>{ const next=!value; audioEnabledRef.current=next; if (!next) window.speechSynthesis?.cancel(); return next; }); }}>{audioEnabled ? <Volume2 /> : <VolumeX />}{audioEnabled ? "语音开" : "语音关"}</Button>
          <Button variant="outline" size="sm" onClick={enterFullscreen}><Maximize2 />全屏</Button>
          {vrReady && <Button variant="outline" size="sm" onClick={enterVr}><Glasses />进入VR头显</Button>}
        </div>
      </div>
      <Progress value={Math.max((collected / 8) * 100, ((60 - seconds) / 60) * 100)} />
      <div ref={hostRef} className="vr-canvas" />
      <p className="vr-message" aria-live="polite">{message}</p>
    </div>
  );
}
