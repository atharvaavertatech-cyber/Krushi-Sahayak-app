/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Camera,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Sparkles,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  Code,
  X,
  HelpCircle,
  Layers,
  ChevronDown,
  Volume1,
  Smartphone
} from 'lucide-react';
import { SAMPLE_LEAF_PRESETS, KONKAN_SOIL_FACTS, QUICK_VOICE_PROMPTS, SampleLeaf } from './data/konkanKnowledge';
import { generateLeafCanvasDataUrl } from './utils/leafGenerator';
import { AndroidCodeModal } from './components/AndroidCodeModal';
import { InstallGuideModal } from './components/InstallGuideModal';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  imageMime?: string;
  timestamp: string;
  diagnosis?: {
    predicted_class: string;
    confidence: number;
    all_predictions?: Array<{ label: string; confidence: number }>;
  };
  audioUrl?: string;
}

export default function App() {
  // In-memory conversation state for current session only (no persistence across app restarts)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: 'नमस्कार शेतकरी बांधवांनो! मी "कोकण कृषी सहाय्यक" आहे. हापूस आंबा, जांभा माती, खत नियोजन आणि कीड-रोगांविषयी काहीही विचारा. पानावर रोग दिसल्यास खालील कॅमेरा चिन्हावर दाबून फोटो पाठवा.',
      timestamp: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingImageMime, setPendingImageMime] = useState<string>('image/jpeg');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [largeTextMode, setLargeTextMode] = useState(false);
  const [ttsProvider, setTtsProvider] = useState<'cloud' | 'browser'>('cloud');
  const [browserHasMarathiVoice, setBrowserHasMarathiVoice] = useState(false);
  const [showPresetsModal, setShowPresetsModal] = useState(false);
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [showAndroidCodeModal, setShowAndroidCodeModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [micStatusText, setMicStatusText] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Check on-device browser TTS capabilities for Marathi (mr-IN)
  useEffect(() => {
    const checkVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        const hasMr = voices.some((v) => v.lang.toLowerCase().includes('mr'));
        setBrowserHasMarathiVoice(hasMr);
      }
    };
    checkVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    }
  }, []);

  // Initialize SpeechRecognition with Marathi (mr-IN) locale
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'mr-IN'; // Marathi (India)

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatusText('ऐकत आहे... कृपया मराठीत बोला (Listening in Marathi)');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setMicStatusText('');
      };

      recognition.onend = () => {
        setIsListening(false);
        setMicStatusText('');
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Voice Input Toggle (large outdoor mic button)
  const toggleListening = () => {
    stopCurrentAudio();
    if (!recognitionRef.current) {
      alert('या ब्राउझरमध्ये व्हॉईस रेकग्निशन उपलब्ध नाही. कृपया टाइप करा.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  // Stop currently playing audio or TTS
  const stopCurrentAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Play spoken response in Marathi
  const playSpokenResponse = async (text: string, existingAudioUrl?: string) => {
    stopCurrentAudio();
    setIsSpeaking(true);

    if (existingAudioUrl) {
      const audio = new Audio(existingAudioUrl);
      audioPlayerRef.current = audio;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => {
        fallbackToBrowserTts(text);
      };
      audio.play().catch(() => fallbackToBrowserTts(text));
      return;
    }

    if (ttsProvider === 'cloud') {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const data = await res.json();
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          audioPlayerRef.current = audio;
          audio.onended = () => setIsSpeaking(false);
          audio.play();
          return;
        }
      } catch (err) {
        console.warn('Cloud TTS error, falling back to browser synthesis:', err);
      }
    }

    fallbackToBrowserTts(text);
  };

  const fallbackToBrowserTts = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }
    const clean = text.replace(/[*#_~`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'mr-IN';
    utterance.rate = 0.92; // slightly slower for better farmer clarity

    const voices = window.speechSynthesis.getVoices();
    const mrVoice = voices.find((v) => v.lang.toLowerCase().includes('mr'));
    if (mrVoice) {
      utterance.voice = mrVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Send message turn to backend
  const handleSendMessage = async (textToSend?: string, imageToSend?: string | null) => {
    const text = (textToSend !== undefined ? textToSend : inputText).trim();
    const img = imageToSend !== undefined ? imageToSend : pendingImage;

    if (!text && !img) return;

    stopCurrentAudio();

    const userMessage: Message = {
      id: 'usr-' + Date.now(),
      role: 'user',
      text: text || (img ? 'या पानाचा फोटो पाहून रोगाचे निदान करा.' : ''),
      image: img || undefined,
      imageMime: pendingImageMime,
      timestamp: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    // Update in-memory session
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setPendingImage(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          currentImageBase64: img,
          currentImageMime: pendingImageMime,
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
            image: m.image,
            imageMime: m.imageMime,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      const modelMessage: Message = {
        id: 'bot-' + Date.now(),
        role: 'model',
        text: data.reply || 'माहिती उपलब्ध नाही.',
        timestamp: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' }),
        diagnosis: data.diagnosisResult && data.diagnosisResult.predicted_class ? data.diagnosisResult : undefined,
      };

      setMessages((prev) => [...prev, modelMessage]);

      // Automatically play spoken response (Voice-First core feature)
      playSpokenResponse(modelMessage.text);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: Message = {
        id: 'err-' + Date.now(),
        role: 'model',
        text: 'क्षमस्व, संपर्क करताना अडचण आली. कृपया पुन्हा बोला किंवा इंटरनेट तपासा.',
        timestamp: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Image attach handlers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingImageMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Attach sample leaf symptom preset
  const handleSelectPreset = (preset: SampleLeaf) => {
    const dataUrl = generateLeafCanvasDataUrl(preset.id);
    setPendingImage(dataUrl);
    setPendingImageMime('image/jpeg');
    setInputText(`माझ्या हापूस आंब्याच्या पानावर ${preset.nameMr} ची लक्षणे दिसत आहेत. उपाय सांगा.`);
    setShowPresetsModal(false);
  };

  // Reset conversation session (in-memory only)
  const handleResetSession = () => {
    stopCurrentAudio();
    setMessages([
      {
        id: 'welcome-msg-' + Date.now(),
        role: 'model',
        text: 'नवीन चर्चा सुरू केली आहे. सांगा, आज बागेत काय काम चालू आहे? रोग निदानासाठी पानाचा फोटो जोडा किंवा प्रश्न बोला.',
        timestamp: new Date().toLocaleTimeString('mr-IN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInputText('');
    setPendingImage(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-stone-100 border-x border-stone-200 shadow-xl overflow-hidden font-sans">
      {/* Hidden File Inputs for Photo Attach & Direct Camera */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleImageFileChange}
        className="hidden"
      />

      {/* Top Header Bar — High Contrast Outdoor Agricultural Green */}
      <header className="bg-emerald-950 text-white px-4 py-3 shrink-0 shadow-md border-b border-emerald-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-800 flex items-center justify-center border-2 border-emerald-500 shadow-inner">
              <span className="text-xl">🥭</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight flex items-center gap-2">
                कोकण कृषी सहाय्यक
                <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-full font-normal border border-emerald-700/60">
                  व्हॉईस-फर्स्ट
                </span>
              </h1>
              <p className="text-xs text-emerald-300">
                हापूस आंबा, जांभा माती व रोग निदान (Konkan Region)
              </p>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center space-x-1.5">
            {/* Outdoor Text Size Toggle */}
            <button
              onClick={() => setLargeTextMode(!largeTextMode)}
              title="मोठे अक्षर (Large Font for Sunlight)"
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                largeTextMode
                  ? 'bg-amber-400 text-emerald-950 border-amber-300'
                  : 'bg-emerald-900/60 text-emerald-200 border-emerald-700 hover:bg-emerald-800'
              }`}
            >
              अ+
            </button>

            {/* Konkan Soil Info Button */}
            <button
              onClick={() => setShowSoilModal(true)}
              title="जांभा माती मार्गदर्शक"
              className="p-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded-lg border border-emerald-700 transition"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Android Kotlin Source Code Modal */}
            <button
              onClick={() => setShowAndroidCodeModal(true)}
              title="Android Kotlin Code"
              className="p-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded-lg border border-emerald-700 transition"
            >
              <Code className="w-4 h-4" />
            </button>

            {/* Get on Mobile Phone Button */}
            <button
              onClick={() => setShowInstallModal(true)}
              title="मोबाईलवर ॲप कसे सुरू करावे?"
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold rounded-lg text-xs shadow-xs transition active:scale-95 border border-amber-300"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>फोनवर घ्या</span>
            </button>

            {/* Reset Session Button (In-memory current session) */}
            <button
              onClick={handleResetSession}
              title="नवीन चर्चा (Reset Session)"
              className="p-2 bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 rounded-lg border border-emerald-700 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice & Status Sub-strip */}
        <div className="mt-2 pt-2 border-t border-emerald-900/80 flex flex-wrap items-center justify-between text-xs text-emerald-300 gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>भाषा: मराठी (mr-IN)</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              title="External Disease Classifier Endpoint: https://immobile-rewrap-creed.ngrok-free.dev"
              className="text-[10px] bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700/60 font-mono truncate max-w-[170px]"
            >
              API: immobile-rewrap-creed.ngrok-free.dev
            </span>
            <button
              onClick={() => setTtsProvider(ttsProvider === 'cloud' ? 'browser' : 'cloud')}
              className="text-[11px] underline hover:text-white flex items-center gap-1"
            >
              <Volume1 className="w-3 h-3" />
              आवाज: {ttsProvider === 'cloud' ? 'क्लाउड' : 'डिव्हाइस'}
            </button>
          </div>
        </div>
      </header>

      {/* Device Marathi Voice Notice (As requested: flag poor on-device TTS so farmer can switch to Cloud TTS) */}
      {!browserHasMarathiVoice && ttsProvider === 'browser' && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>डिव्हाइसवर मराठी व्हॉईस पॅक उपलब्ध नाही. स्पष्ट आवाजासाठी क्लाउड व्हॉईस सुरू करा.</span>
          </div>
          <button
            onClick={() => setTtsProvider('cloud')}
            className="px-2 py-0.5 bg-amber-600 text-white rounded font-medium text-[11px] hover:bg-amber-700 shrink-0"
          >
            क्लाउड निवडा
          </button>
        </div>
      )}

      {/* Main Scrolling Conversation View */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 shadow-sm transition-all ${
                  isUser
                    ? 'bg-emerald-800 text-white rounded-br-xs'
                    : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-xs'
                }`}
              >
                {/* Attached Leaf Photo Thumbnail */}
                {msg.image && (
                  <div className="mb-2.5 overflow-hidden rounded-xl border border-black/10 bg-black/5">
                    <img
                      src={msg.image}
                      alt="Uploaded leaf"
                      className="w-full max-h-56 object-cover"
                    />
                    <div className="p-1.5 bg-stone-900/80 text-white text-[11px] flex items-center justify-between">
                      <span>🍃 आंब्याचे पान (Leaf Image)</span>
                      <span className="text-emerald-400">विश्लेषण केले</span>
                    </div>
                  </div>
                )}

                {/* Leaf Diagnosis Result Card (When function call diagnose_mango_leaf was triggered) */}
                {msg.diagnosis && (
                  <div className="mb-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-stone-900">
                    <div className="flex items-center justify-between border-b border-amber-200/70 pb-2 mb-2">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-amber-950">
                        <span className="text-base">🔬</span>
                        <span>रोग निदान (Leaf Diagnosis)</span>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          msg.diagnosis.confidence >= 0.5
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-200 text-amber-900 border border-amber-400'
                        }`}
                      >
                        {Math.round(msg.diagnosis.confidence * 100)}% अचूकता (Confidence)
                      </span>
                    </div>

                    <div className="text-base font-bold text-amber-900 mb-1">
                      {msg.diagnosis.predicted_class}
                    </div>

                    {msg.diagnosis.confidence < 0.5 && (
                      <div className="text-xs text-amber-800 bg-amber-100/80 p-2 rounded-lg mb-2 flex items-start gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          अंदाजित निकाल अनिश्चित आहे. कृपया अधिक स्पष्ट आणि जवळून काढलेला फोटो दाखवा.
                        </span>
                      </div>
                    )}

                    {msg.diagnosis.all_predictions && msg.diagnosis.all_predictions.length > 1 && (
                      <div className="text-[11px] text-stone-600 space-y-1">
                        <span className="font-semibold text-stone-700">इतर शक्यता:</span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {msg.diagnosis.all_predictions.slice(1, 3).map((p, idx) => (
                            <span
                              key={idx}
                              className="bg-white/80 px-2 py-0.5 rounded border border-amber-200/60"
                            >
                              {p.label}: {Math.round(p.confidence * 100)}%
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Spoken Text Transcript with Outdoor High Contrast font sizes */}
                <div
                  className={`leading-relaxed whitespace-pre-wrap ${
                    largeTextMode ? 'text-lg font-medium' : 'text-base font-normal'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Footer Controls: Timestamp & Voice Replay */}
                <div
                  className={`mt-2.5 pt-1.5 border-t flex items-center justify-between text-xs ${
                    isUser ? 'border-emerald-700/60 text-emerald-200' : 'border-stone-100 text-stone-500'
                  }`}
                >
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <button
                      onClick={() => playSpokenResponse(msg.text, msg.audioUrl)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-medium transition active:scale-95 border border-emerald-200"
                    >
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                      <span>पुन्हा ऐका (Replay)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="flex items-center space-x-3 p-3.5 bg-white border border-stone-200 rounded-2xl max-w-[80%] shadow-sm">
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-sm font-semibold text-emerald-950">
                कृषी सहाय्यक विचार करत आहे...
              </p>
              <p className="text-xs text-stone-500">
                माहिती व उपायांचे विश्लेषण सुरू आहे
              </p>
            </div>
          </div>
        )}

        {/* Audio Speaking Waveform Indicator */}
        {isSpeaking && (
          <div className="flex items-center justify-between bg-emerald-900 text-white px-3 py-2 rounded-xl text-xs shadow-md animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-1 bg-emerald-300 h-2 animate-bounce"></span>
                <span className="w-1 bg-emerald-300 h-4 animate-bounce delay-100"></span>
                <span className="w-1 bg-emerald-300 h-3 animate-bounce delay-200"></span>
                <span className="w-1 bg-emerald-300 h-4 animate-bounce delay-150"></span>
              </div>
              <span className="font-medium">सहाय्यक बोलत आहे... (Speaking aloud in Marathi)</span>
            </div>
            <button
              onClick={stopCurrentAudio}
              className="text-emerald-300 hover:text-white px-2 py-0.5 rounded bg-emerald-800/80"
            >
              थांबवा (Mute)
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Suggested Quick Farmer Queries */}
      {messages.length <= 3 && !isProcessing && (
        <div className="px-3 py-1.5 bg-stone-50 border-t border-stone-200/80 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>शेतकरी बांधवांचे नेहमीचे प्रश्न (Quick Questions):</span>
          </div>
          <div className="flex gap-2 pb-1">
            {QUICK_VOICE_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white text-stone-800 text-xs font-medium border border-stone-300 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-900 transition shrink-0 shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Action & Voice Input Bar */}
      <footer className="bg-white border-t border-stone-200 p-2.5 sm:p-3 shrink-0 shadow-lg">
        {/* Pending Attached Leaf Photo Preview Bar */}
        {pendingImage && (
          <div className="mb-2 p-2 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <img
                src={pendingImage}
                alt="Selected leaf"
                className="w-12 h-12 object-cover rounded-lg border border-emerald-400 shadow-2xs"
              />
              <div>
                <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  पानाचा फोटो जोडला आहे
                </div>
                <div className="text-[11px] text-emerald-800">
                  आता माईक दाबून बोला किंवा 'पाठवा' वर क्लिक करा
                </div>
              </div>
            </div>
            <button
              onClick={() => setPendingImage(null)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition"
            >
              रद्द करा (Remove)
            </button>
          </div>
        )}

        {/* Listening Status Banner */}
        {isListening && (
          <div className="mb-2 p-2 bg-red-50 border border-red-300 rounded-xl flex items-center justify-between text-xs text-red-800 animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
              <span className="font-bold">{micStatusText || 'ऐकत आहे... बोला (Listening)'}</span>
            </div>
            <span className="text-[11px] bg-red-200/80 text-red-900 px-2 py-0.5 rounded font-mono">
              मराठी (mr-IN)
            </span>
          </div>
        )}

        {/* Core Controls: Large Outdoor Voice Button + Camera + Text Input */}
        <div className="flex items-center space-x-2">
          {/* Direct Camera Button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            title="पानाचा थेट फोटो घ्या (Camera Capture)"
            className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full border border-stone-300 transition active:scale-95 shadow-2xs"
          >
            <Camera className="w-5 h-5 text-emerald-800" />
          </button>

          {/* Gallery / Presets Modal Button */}
          <button
            onClick={() => setShowPresetsModal(true)}
            title="गॅलरी किंवा नमुने (Gallery / Symptom Presets)"
            className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full border border-stone-300 transition active:scale-95 shadow-2xs"
          >
            <ImageIcon className="w-5 h-5 text-emerald-800" />
          </button>

          {/* Text input for optional typing or speech preview */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={pendingImage ? 'पानाविषयी काही सांगायचे आहे का?' : 'येथे बोला किंवा टाइप करा...'}
              className="w-full pl-3.5 pr-10 py-3 bg-stone-50 border border-stone-300 rounded-full text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white shadow-inner"
            />
            {(inputText || pendingImage) && (
              <button
                onClick={() => handleSendMessage()}
                disabled={isProcessing}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center transition active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Large Outdoor Microphone Button (Voice-First core feature) */}
          <button
            onClick={toggleListening}
            title={isListening ? 'माईक बंद करा (Stop Listening)' : 'माईक चालू करा (Start Voice Input)'}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 shrink-0 ${
              isListening
                ? 'bg-red-600 text-white ring-4 ring-red-300 animate-pulse'
                : 'bg-emerald-700 hover:bg-emerald-800 text-white ring-2 ring-emerald-500/50'
            }`}
          >
            {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
          </button>
        </div>
      </footer>

      {/* Leaf Symptom Presets & Gallery Modal */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-emerald-950 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">🍃</span>
                <div>
                  <h3 className="font-bold text-base">पानाचा फोटो निवडा</h3>
                  <p className="text-xs text-emerald-300">फोटो अपलोड करा किंवा रोग नमुना निवडा</p>
                </div>
              </div>
              <button
                onClick={() => setShowPresetsModal(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {/* Option 1: Choose from device gallery */}
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowPresetsModal(false);
                }}
                className="w-full p-3.5 border-2 border-dashed border-emerald-500/80 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center gap-2.5 text-emerald-950 font-bold transition"
              >
                <ImageIcon className="w-5 h-5 text-emerald-700" />
                <span>मोबाईल गॅलरीतून फोटो निवडा</span>
              </button>

              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider pt-2">
                किंवा चाचणीसाठी रोग नमुना निवडा:
              </div>

              {SAMPLE_LEAF_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="p-3 border border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/50 rounded-xl cursor-pointer transition flex items-start space-x-3 group"
                >
                  <span className="text-2xl p-2 bg-stone-100 rounded-lg group-hover:bg-emerald-100 shrink-0">
                    {preset.svgIcon}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-stone-900 text-sm">{preset.nameMr}</h4>
                      <span className="text-[11px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">
                        {Math.round(preset.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                onClick={() => setShowPresetsModal(false)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-lg transition"
              >
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Konkan Soil & Mango Reference Guide Modal */}
      {showSoilModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-amber-900 text-white">
              <div className="flex items-center gap-2">
                <span className="text-xl">🪨</span>
                <div>
                  <h3 className="font-bold text-base">कोकण जांभा माती व पीक संदर्भ</h3>
                  <p className="text-xs text-amber-200">रत्नागिरी, सिंधुदुर्ग, रायगड शेती मार्गदर्शक</p>
                </div>
              </div>
              <button
                onClick={() => setShowSoilModal(false)}
                className="p-1 text-amber-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed">
                <strong>महत्त्वाची टीप:</strong> कोकणातील जांभा माती (Laterite Soil) लोहसमृद्ध आणि उत्तम निचरा होणारी असल्यामुळे हापूस आंब्याला अद्वितीय गोडवा व सुगंध प्राप्त होतो.
              </div>

              {KONKAN_SOIL_FACTS.map((fact, idx) => (
                <div key={idx} className="p-3 border border-stone-200 rounded-xl bg-stone-50/70">
                  <div className="font-bold text-sm text-stone-900 mb-1 flex items-center justify-between">
                    <span>{fact.titleMr}</span>
                    <span className="text-[11px] text-stone-500 font-normal">{fact.titleEn}</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">{fact.descMr}</p>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-stone-200 bg-stone-50 flex justify-end">
              <button
                onClick={() => setShowSoilModal(false)}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition"
              >
                समजले (Done)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Android Native Kotlin & Jetpack Compose Code Inspector Modal */}
      <AndroidCodeModal
        isOpen={showAndroidCodeModal}
        onClose={() => setShowAndroidCodeModal(false)}
      />

      {/* Mobile Install Guide Modal */}
      <InstallGuideModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        appUrl={window.location.href}
      />
    </div>
  );
}
