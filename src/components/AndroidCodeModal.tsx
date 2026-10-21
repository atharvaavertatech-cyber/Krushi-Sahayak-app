import React, { useState } from 'react';
import { Code, Copy, Check, ExternalLink, X, FileCode } from 'lucide-react';

interface AndroidCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ANDROID_FILES = [
  {
    name: 'MainActivity.kt',
    path: 'android/app/src/main/java/com/konkan/krushisahayak/MainActivity.kt',
    lang: 'kotlin',
    description: 'Jetpack Compose UI: Single conversation screen, outdoor large mic button, leaf capture, transcript list',
  },
  {
    name: 'GeminiAssistant.kt',
    path: 'android/app/src/main/java/com/konkan/krushisahayak/gemini/GeminiAssistant.kt',
    lang: 'kotlin',
    description: 'Gemini GenerativeModel, system instructions in Marathi, diagnose_mango_leaf function calling tool',
  },
  {
    name: 'KonkanKrushiViewModel.kt',
    path: 'android/app/src/main/java/com/konkan/krushisahayak/KonkanKrushiViewModel.kt',
    lang: 'kotlin',
    description: 'In-memory session state, STT speech callbacks, leaf image state, audio reply triggering',
  },
  {
    name: 'SpeechAndTtsManager.kt',
    path: 'android/app/src/main/java/com/konkan/krushisahayak/voice/SpeechAndTtsManager.kt',
    lang: 'kotlin',
    description: 'Android SpeechRecognizer & TextToSpeech configured for mr-IN (Marathi) with quality warning',
  },
  {
    name: 'MangoDiseaseApi.kt',
    path: 'android/app/src/main/java/com/konkan/krushisahayak/data/MangoDiseaseApi.kt',
    lang: 'kotlin',
    description: 'Retrofit interface uploading leaf photo multipart/form-data to API_BASE_URL + "/predict"',
  },
  {
    name: 'AndroidManifest.xml',
    path: 'android/app/src/main/AndroidManifest.xml',
    lang: 'xml',
    description: 'Permissions: RECORD_AUDIO, CAMERA, INTERNET and queries for speech service',
  },
  {
    name: 'build.gradle.kts',
    path: 'android/app/build.gradle.kts',
    lang: 'kotlin',
    description: 'Gradle configuration with Google Generative AI SDK, Compose BOM, Retrofit, Coil',
  },
];

export const AndroidCodeModal: React.FC<AndroidCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const activeFile = ANDROID_FILES[activeFileIndex];

  const handleCopy = () => {
    // In production environment we copy path and status
    navigator.clipboard.writeText(`// File: ${activeFile.path}\n// See file in repository`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-950 border border-emerald-700/50 rounded-lg text-emerald-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                Native Android (Kotlin & Jetpack Compose) Architecture
                <span className="text-xs bg-emerald-900/60 text-emerald-300 font-normal px-2 py-0.5 rounded-full border border-emerald-700/40">
                  Android SDK 35
                </span>
              </h3>
              <p className="text-xs text-stone-400">
                Complete Kotlin source code implemented in the <code className="text-emerald-400 font-mono">android/</code> directory.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* File Tabs */}
        <div className="flex border-b border-stone-800 bg-stone-950/80 px-4 overflow-x-auto gap-2 py-2">
          {ANDROID_FILES.map((file, idx) => (
            <button
              key={file.name}
              onClick={() => setActiveFileIndex(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition whitespace-nowrap ${
                activeFileIndex === idx
                  ? 'bg-emerald-800/40 text-emerald-300 border border-emerald-600/50'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              {file.name}
            </button>
          ))}
        </div>

        {/* File Info */}
        <div className="px-5 py-2.5 bg-stone-950/50 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-emerald-400">{activeFile.path}</div>
            <div className="text-xs text-stone-400">{activeFile.description}</div>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-md border border-stone-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy File Path'}
          </button>
        </div>

        {/* Content Highlights */}
        <div className="p-5 overflow-y-auto flex-1 font-mono text-xs leading-relaxed text-stone-300 bg-stone-900">
          {activeFileIndex === 0 && (
            <div>
              <div className="text-stone-400 mb-2">// MainActivity.kt — Jetpack Compose Single Conversation Screen</div>
              <pre className="text-emerald-300 bg-stone-950 p-4 rounded-xl border border-stone-800 overflow-x-auto">
{`@Composable
fun KonkanKrushiApp(viewModel: KonkanKrushiViewModel) {
    val messages by viewModel.messages.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("कोकण कृषी सहाय्यक", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color(0xFF1B4332))
            )
        },
        bottomBar = {
            // Large outdoor high-contrast Mic Button with pulsating animation
            Button(
                onClick = { viewModel.onMicClicked() },
                modifier = Modifier.size(60.dp),
                shape = CircleShape,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (uiState.isListening) Color(0xFFDC2626) else Color(0xFF2D6A4F)
                )
            ) {
                Icon(if (uiState.isListening) Icons.Default.MicOff else Icons.Default.Mic, contentDescription = "माईक")
            }
        }
    ) { ... }
}`}
              </pre>
            </div>
          )}

          {activeFileIndex === 1 && (
            <div>
              <div className="text-stone-400 mb-2">// GeminiAssistant.kt — Function Calling & Marathi System Instruction</div>
              <pre className="text-emerald-300 bg-stone-950 p-4 rounded-xl border border-stone-800 overflow-x-auto">
{`// diagnose_mango_leaf Tool Declaration
val diagnoseMangoLeafTool = Tool(
    listOf(
        FunctionDeclaration(
            name = "diagnose_mango_leaf",
            description = "Diagnoses leaf diseases for a Konkan mango plant from an attached leaf photograph."
        )
    )
)

// When Gemini invokes diagnose_mango_leaf:
if (call.name == "diagnose_mango_leaf" && leafBitmap != null) {
    val predictionResult = uploadLeafToPredictionApi(leafBitmap)
    val functionResponseObj = JSONObject().apply {
        put("predicted_class", predictionResult.predictedClass)
        put("confidence", predictionResult.confidence)
    }
    val secondResponse = chat.sendMessage(FunctionResponsePart("diagnose_mango_leaf", functionResponseObj))
    return Pair(secondResponse.text, predictionResult)
}`}
              </pre>
            </div>
          )}

          {activeFileIndex === 2 && (
            <div>
              <div className="text-stone-400 mb-2">// KonkanKrushiViewModel.kt — In-Memory Session & State</div>
              <pre className="text-emerald-300 bg-stone-950 p-4 rounded-xl border border-stone-800 overflow-x-auto">
{`class KonkanKrushiViewModel(application: Application) : AndroidViewModel(application) {
    // In-memory conversation turns for the current app session only (no local DB)
    private val _messages = MutableStateFlow<List<MessageTurn>>(listOf(welcomeTurn))
    val messages = _messages.asStateFlow()

    private val voiceManager = SpeechAndTtsManager(
        context = application.applicationContext,
        onSpeechResult = { recognizedText -> processUserTurn(recognizedText, pendingPhoto) },
        onTtsStatus = { isAvailable, isPoor, message -> ... }
    )
}`}
              </pre>
            </div>
          )}

          {activeFileIndex === 3 && (
            <div>
              <div className="text-stone-400 mb-2">// SpeechAndTtsManager.kt — SpeechRecognizer & TextToSpeech in Marathi</div>
              <pre className="text-emerald-300 bg-stone-950 p-4 rounded-xl border border-stone-800 overflow-x-auto">
{`// Locale mr-IN for Marathi voice recognition
val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
    putExtra(RecognizerIntent.EXTRA_LANGUAGE, "mr-IN")
    putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "mr-IN")
}

// Marathi TextToSpeech with quality check
val result = textToSpeech?.setLanguage(Locale("mr", "IN"))
if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
    // Flagged for fallback to Google Cloud Text-to-Speech API
    onTtsStatus(false, true, "Device missing Marathi voice. Switch to Google Cloud TTS.")
}`}
              </pre>
            </div>
          )}

          {activeFileIndex >= 4 && (
            <div>
              <div className="text-stone-400 mb-2">// View complete file in android/ directory</div>
              <p className="text-stone-300">
                This file is fully generated and ready in the project filesystem at{' '}
                <span className="text-emerald-400 font-semibold">{activeFile.path}</span>. You can import the{' '}
                <code className="text-emerald-300">android/</code> directory directly into Android Studio Hedgehog / Iguana / Ladybug.
              </p>
            </div>
          )}

          {/* Quick summary points */}
          <div className="mt-4 pt-4 border-t border-stone-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-stone-400">
            <div className="bg-stone-950/60 p-3 rounded-lg border border-stone-800/80">
              <span className="text-emerald-400 font-bold block mb-1">Android Permissions</span>
              <code className="text-stone-300">RECORD_AUDIO</code>, <code className="text-stone-300">CAMERA</code>, <code className="text-stone-300">INTERNET</code> configured in AndroidManifest.xml.
            </div>
            <div className="bg-stone-950/60 p-3 rounded-lg border border-stone-800/80">
              <span className="text-emerald-400 font-bold block mb-1">Voice First & Marathi Locale</span>
              Native <code className="text-stone-300">mr-IN</code> recognition and spoken TTS with fallback flagging.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-800 bg-stone-950 flex justify-between items-center text-xs text-stone-400">
          <span>Ready to build with Gradle 8.7+ and Kotlin 2.0+</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-medium transition"
          >
            बंद करा (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
