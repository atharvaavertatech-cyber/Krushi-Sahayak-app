import React, { useState } from 'react';
import { Smartphone, Download, QrCode, Check, Copy, ExternalLink, X, ArrowRight, Sparkles } from 'lucide-react';

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl: string;
}

export const InstallGuideModal: React.FC<InstallGuideModalProps> = ({ isOpen, onClose, appUrl }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'instant' | 'apk'>('instant');

  if (!isOpen) return null;

  // Clean shareable URL
  const targetUrl = appUrl || window.location.origin;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate QR code SVG URL using public QR server or SVG
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    targetUrl
  )}&bgcolor=ffffff&color=064e3b&margin=6`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-fade-in font-sans">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-900 border border-stone-200">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 flex items-center justify-center text-emerald-200 border border-emerald-600/50 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">मोबाईलवर ॲप कसे सुरू करावे?</h3>
              <p className="text-xs text-emerald-300">How to get this app on your phone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-stone-200 bg-stone-50 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('instant')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'instant'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>पर्याय १: थेट इन्स्टॉल (१० सेकंद)</span>
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'apk'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>पर्याय २: Android APK फाईल</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'instant' ? (
            <div className="space-y-4">
              {/* QR Code and Quick Share */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80">
                <div className="bg-white p-2 rounded-xl shadow-xs border border-emerald-300 shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="Scan QR code to open app on phone"
                    className="w-32 h-32 rounded-lg"
                  />
                </div>
                <div className="text-center sm:text-left space-y-1.5 flex-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2 py-0.5 rounded-full inline-block">
                    कॅमेऱ्याने स्कॅन करा
                  </span>
                  <h4 className="font-bold text-stone-900 text-sm sm:text-base leading-snug">
                    तुमच्या मोबाईल कॅमेऱ्याने हा QR कोड स्कॅन करा
                  </h4>
                  <p className="text-xs text-stone-600">
                    किंवा खालील लिंक कॉपी करून तुमच्या फोनमधील Chrome ब्राउझरमध्ये उघडा.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={handleCopyUrl}
                      className="px-3 py-1.5 bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'लिंक कॉपी झाली!' : 'लिंक कॉपी करा'}</span>
                    </button>
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>थेट उघडा</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 3 Step Guide for Android Chrome */}
              <div className="space-y-2.5">
                <h5 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>Android फोनवर इन्स्टॉल करण्याच्या सोप्या पायऱ्या:</span>
                </h5>

                <div className="space-y-2 text-xs sm:text-sm text-stone-700">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      १
                    </div>
                    <div>
                      <strong>मोबाईलच्या Chrome मध्ये लिंक उघडा.</strong>
                      <p className="text-xs text-stone-500 mt-0.5">माईक आणि कॅमेरा वापराची परवानगी मागितल्यास 'Allow' करा.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      २
                    </div>
                    <div>
                      <strong>उजव्या बाजूला वर असलेल्या ३ ठिपक्यांवर (⋮) दाबा.</strong>
                      <p className="text-xs text-stone-500 mt-0.5">Chrome मेनू उघडेल.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      ३
                    </div>
                    <div>
                      <strong>"Install app" (ॲप इन्स्टॉल करा) किंवा "Add to Home screen" वर क्लिक करा.</strong>
                      <p className="text-xs text-emerald-800 font-medium mt-0.5">
                        हे ॲप थेट तुमच्या मोबाईलवर एका स्वतंत्र ॲपप्रमाणे सेव्ह होईल आणि इंटरनेट/शेतात सहज चालेल!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed">
                <strong>Android Studio द्वारे APK तयार करणे:</strong> या प्रोजेक्टमधील <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">android/</code> डिरेक्टरीमध्ये संपूर्ण Kotlin आणि Jetpack Compose कोड तयार आहे.
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="w-6 h-6 rounded-full bg-stone-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    १
                  </div>
                  <div>
                    <strong>Android Studio उघडा आणि 'Open Project' निवडा:</strong>
                    <p className="text-xs text-stone-500 mt-0.5 font-mono">
                      प्रोजेक्टमधील <span className="text-emerald-700 font-bold">android/</span> फोल्डर निवडा.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="w-6 h-6 rounded-full bg-stone-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    २
                  </div>
                  <div>
                    <strong>APK बिल्ड करा:</strong>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Android Studio च्या वरच्या मेनूमध्ये जा: <br />
                      <span className="font-semibold text-stone-800">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="w-6 h-6 rounded-full bg-stone-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    ३
                  </div>
                  <div>
                    <strong>मोबाईलमध्ये APK पाठवा व इन्स्टॉल करा:</strong>
                    <p className="text-xs text-stone-500 mt-0.5">
                      तयार झालेली <span className="font-mono text-emerald-700">app-debug.apk</span> फाईल WhatsApp किंवा USB द्वारे मोबाईलवर ट्रान्सफर करा आणि त्यावर टॅप करून ॲप इन्स्टॉल करा.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-600">
                <strong>टीप:</strong> फोन कनेक्ट असल्यास थेट Android Studio मधील हिरव्या <span className="text-emerald-700 font-bold">Run (▶)</span> बटनावर दाबून ॲप थेट फोनवर चालू करता येते.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>कोकण कृषी सहाय्यक • शेतकरी बांधवांसाठी</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg transition"
          >
            समजले (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
