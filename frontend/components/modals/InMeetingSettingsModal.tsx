"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Volume2,
  Mic,
  Video,
  Monitor,
  Sparkles,
  Settings,
  User,
  Check,
  Play,
  Square,
  HelpCircle,
  FileText,
} from "lucide-react";
import { useToast } from "../ui/Toast";

interface InMeetingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "general" | "video" | "audio" | "share" | "background" | "captions" | "profile";
  onSelectVirtualBackground?: (bgId: string) => void;
}

export function InMeetingSettingsModal({
  isOpen,
  onClose,
  initialTab = "audio",
  onSelectVirtualBackground,
}: InMeetingSettingsModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab if initialTab changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Audio testing states
  const [isPlayingSpeakerTest, setIsPlayingSpeakerTest] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [speakerVolume, setSpeakerVolume] = useState(80);
  const [micVolume, setMicVolume] = useState(75);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Video settings
  const [mirrorVideo, setMirrorVideo] = useState(true);
  const [hdVideo, setHdVideo] = useState(true);
  const [touchUp, setTouchUp] = useState(true);
  const [lowLight, setLowLight] = useState(true);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);

  // Background selection
  const [selectedBg, setSelectedBg] = useState("none");

  // Caption settings
  const [captionSize, setCaptionSize] = useState("medium");
  const [captionLang, setCaptionLang] = useState("en-US");

  // Toggles for general/meeting
  const [confirmLeave, setConfirmLeave] = useState(true);
  const [autoCopyLink, setAutoCopyLink] = useState(false);
  const [alwaysShowControls, setAlwaysShowControls] = useState(true);

  // Speaker audio test chime with Web Audio API
  const handleTestSpeaker = () => {
    if (isPlayingSpeakerTest) {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setIsPlayingSpeakerTest(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      setIsPlayingSpeakerTest(true);

      // Play Zoom-like harmonic chime (chord: C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.15);

        gain.gain.setValueAtTime(0.2 * (speakerVolume / 100), ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.15 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.6);
      });

      setTimeout(() => {
        setIsPlayingSpeakerTest(false);
      }, 1200);
    } catch {
      setIsPlayingSpeakerTest(false);
      showToast("Audio device output active", "info");
    }
  };

  // Microphone test using real getUserMedia + AnalyserNode
  const handleTestMic = async () => {
    if (isTestingMic) {
      setIsTestingMic(false);
      setMicLevel(0);
      return;
    }

    try {
      setIsTestingMic(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let animId: number;

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animId = requestAnimationFrame(updateMeter);
      };

      updateMeter();

      setTimeout(() => {
        cancelAnimationFrame(animId);
        stream.getTracks().forEach((t) => t.stop());
        ctx.close().catch(() => {});
        setIsTestingMic(false);
        setMicLevel(0);
        showToast("Microphone is picking up audio clearly!", "success");
      }, 3500);
    } catch {
      setIsTestingMic(false);
      showToast("Could not access microphone for testing.", "error");
    }
  };

  // Camera preview in Video tab
  useEffect(() => {
    if (activeTab === "video" && isOpen) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true })
        .then((s) => {
          setPreviewStream(s);
          if (videoPreviewRef.current) {
            videoPreviewRef.current.srcObject = s;
          }
        })
        .catch(() => {
          // Camera in use or blocked
        });
    } else {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
        setPreviewStream(null);
      }
    }

    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl h-[600px] max-h-[90vh] flex flex-col overflow-hidden text-gray-800">
        {/* Top Header */}
        <div className="bg-[#1C1C28] text-white px-5 py-3 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-sm">Settings</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Left Navigation Tabs + Right Tab Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Tabs */}
          <div className="w-44 bg-[#F8FAFC] border-r border-gray-200 p-2 space-y-1 flex-shrink-0">
            {[
              { id: "general", label: "General", icon: Settings },
              { id: "video", label: "Video", icon: Video },
              { id: "audio", label: "Audio", icon: Mic },
              { id: "share", label: "Share Screen", icon: Monitor },
              { id: "background", label: "Backgrounds", icon: Sparkles },
              { id: "captions", label: "Captions", icon: FileText },
              { id: "profile", label: "Profile", icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors ${
                    isActive
                      ? "bg-[#0B5CFF] text-white shadow-xs"
                      : "text-gray-700 hover:bg-gray-200/70"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Tab Content */}
          <div className="flex-1 p-6 overflow-y-auto text-xs space-y-6">
            {/* AUDIO TAB */}
            {activeTab === "audio" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Speaker Settings</h3>
                  <p className="text-gray-500 mb-3">Choose the audio output device for this meeting.</p>
                  <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <select className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-800">
                        <option>Default - Speakers (Realtek(R) Audio)</option>
                        <option>Communications - Speakers (Realtek(R) Audio)</option>
                        <option>Headphones (High Definition Audio Device)</option>
                      </select>
                      <button
                        onClick={handleTestSpeaker}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 font-semibold text-gray-800 flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        {isPlayingSpeakerTest ? (
                          <>
                            <Square className="w-3.5 h-3.5 text-red-500 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-blue-600 fill-current" />
                            <span>Test Speaker</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <Volume2 className="w-4 h-4 text-gray-500" />
                      <span className="w-12 text-gray-500">Output:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={speakerVolume}
                        onChange={(e) => setSpeakerVolume(Number(e.target.value))}
                        className="flex-1 accent-[#0B5CFF]"
                      />
                      <span className="w-8 font-mono text-gray-700">{speakerVolume}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Microphone Settings</h3>
                  <p className="text-gray-500 mb-3">Choose your microphone and test voice input levels.</p>
                  <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <select className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-800">
                        <option>Default - Microphone Array (Intel® Smart Sound Technology)</option>
                        <option>Communications - Microphone Array (Intel® Smart Sound Technology)</option>
                        <option>Headset Microphone (Realtek(R) Audio)</option>
                      </select>
                      <button
                        onClick={handleTestMic}
                        className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 font-semibold text-gray-800 flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        {isTestingMic ? (
                          <>
                            <Square className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
                            <span>Recording...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-blue-600" />
                            <span>Test Mic</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <Mic className="w-4 h-4 text-gray-500" />
                      <span className="w-12 text-gray-500">Input Level:</span>
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all duration-75"
                          style={{ width: `${isTestingMic ? micLevel : 0}%` }}
                        />
                      </div>
                      <span className="w-8 font-mono text-gray-700">{isTestingMic ? `${micLevel}%` : "0%"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0B5CFF] accent-[#0B5CFF]" />
                    <span className="text-gray-700">Automatically adjust microphone volume</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded text-[#0B5CFF] accent-[#0B5CFF]" />
                    <span className="text-gray-700">Suppress background noise (Auto)</span>
                  </label>
                </div>
              </div>
            )}

            {/* VIDEO TAB */}
            {activeTab === "video" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Camera Preview</h3>
                  <div className="w-full h-48 bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                    <video
                      ref={videoPreviewRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${mirrorVideo ? "transform -scale-x-100" : ""}`}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2.5 py-1 rounded text-[11px] text-white">
                      Integrated Camera (04f2:b61e)
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Original Ratio (16:9 HD)</span>
                    <input
                      type="checkbox"
                      checked={hdVideo}
                      onChange={(e) => setHdVideo(e.target.checked)}
                      className="accent-[#0B5CFF]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Mirror my video</span>
                    <input
                      type="checkbox"
                      checked={mirrorVideo}
                      onChange={(e) => setMirrorVideo(e.target.checked)}
                      className="accent-[#0B5CFF]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Touch up my appearance</span>
                    <input
                      type="checkbox"
                      checked={touchUp}
                      onChange={(e) => setTouchUp(e.target.checked)}
                      className="accent-[#0B5CFF]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Adjust for low light</span>
                    <input
                      type="checkbox"
                      checked={lowLight}
                      onChange={(e) => setLowLight(e.target.checked)}
                      className="accent-[#0B5CFF]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* BACKGROUNDS TAB */}
            {activeTab === "background" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Virtual Backgrounds</h3>
                <p className="text-gray-500">Choose a background effect to apply to your video feed.</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "none", label: "None", color: "bg-gray-800" },
                    { id: "blur", label: "Blur", color: "bg-blue-900/60 backdrop-blur-md" },
                    { id: "office", label: "Modern Office", color: "bg-gradient-to-tr from-amber-900 to-amber-700" },
                    { id: "bridge", label: "Golden Gate", color: "bg-gradient-to-tr from-orange-600 to-red-600" },
                    { id: "nature", label: "Nature Coast", color: "bg-gradient-to-tr from-emerald-700 to-teal-900" },
                    { id: "space", label: "Deep Space", color: "bg-gradient-to-tr from-indigo-950 to-purple-900" },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => {
                        setSelectedBg(bg.id);
                        onSelectVirtualBackground?.(bg.id);
                        showToast(`Virtual background set to ${bg.label}`, "info");
                      }}
                      className={`h-24 rounded-xl flex flex-col items-center justify-center p-2 text-white font-semibold transition-all relative overflow-hidden ${
                        bg.color
                      } ${
                        selectedBg === bg.id
                          ? "ring-3 ring-[#0B5CFF] shadow-lg scale-102"
                          : "hover:opacity-90"
                      }`}
                    >
                      <span>{bg.label}</span>
                      {selectedBg === bg.id && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0B5CFF] rounded-full flex items-center justify-center text-white">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CAPTIONS TAB */}
            {activeTab === "captions" && (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-gray-900">Live Captions & Subtitles</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
                  <div>
                    <label className="block font-semibold text-gray-800 mb-1">Speaking Language</label>
                    <select
                      value={captionLang}
                      onChange={(e) => setCaptionLang(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs"
                    >
                      <option value="en-US">English (United States)</option>
                      <option value="es-ES">Spanish (Español)</option>
                      <option value="fr-FR">French (Français)</option>
                      <option value="de-DE">German (Deutsch)</option>
                      <option value="hi-IN">Hindi (हिंदी)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-800 mb-1">Caption Size</label>
                    <div className="flex gap-2">
                      {["small", "medium", "large"].map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setCaptionSize(sz)}
                          className={`flex-1 py-1.5 rounded-lg border text-xs capitalize font-semibold transition-colors ${
                            captionSize === sz
                              ? "bg-[#0B5CFF] text-white border-[#0B5CFF]"
                              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GENERAL TAB */}
            {activeTab === "general" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">General Meeting Preferences</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Ask me to confirm when I leave a meeting</span>
                    <input
                      type="checkbox"
                      checked={confirmLeave}
                      onChange={(e) => setConfirmLeave(e.target.checked)}
                      className="accent-[#0B5CFF]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Automatically copy invite link when meeting starts</span>
                    <input
                      type="checkbox"
                      checked={autoCopyLink}
                      onChange={(e) => setAutoCopyLink(e.target.checked)}
                      className="accent-[#0B5CFF]"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Always show meeting controls</span>
                    <input
                      type="checkbox"
                      checked={alwaysShowControls}
                      onChange={(e) => setAlwaysShowControls(e.target.checked)}
                      className="accent-[#0B5CFF]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* SHARE SCREEN TAB */}
            {activeTab === "share" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Screen Sharing Controls</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Enter full screen when a participant shares screen</span>
                    <input type="checkbox" defaultChecked className="accent-[#0B5CFF]" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Side-by-side mode</span>
                    <input type="checkbox" defaultChecked className="accent-[#0B5CFF]" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-semibold text-gray-800">Silence system notifications when sharing</span>
                    <input type="checkbox" defaultChecked className="accent-[#0B5CFF]" />
                  </label>
                </div>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-900">Your Account Profile</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#C43D1A] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xs">
                      V
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Vinayak Gupta</p>
                      <p className="text-gray-500">Licensed User • Zoom Workplace</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-200 text-gray-600">
                    <p>Default Meeting ID: 712 2030 0900</p>
                    <p className="mt-1">Workplace Version: 6.2.0 (Live Web)</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F8FAFC] px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0B5CFF] text-white hover:bg-[#0845BF] font-semibold text-xs shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
