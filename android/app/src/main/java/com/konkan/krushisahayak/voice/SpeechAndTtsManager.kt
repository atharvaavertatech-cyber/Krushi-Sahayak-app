package com.konkan.krushisahayak.voice

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

class SpeechAndTtsManager(
    private val context: Context,
    private val onSpeechResult: (String) -> Unit,
    private val onListeningStateChanged: (Boolean) -> Unit,
    private val onTtsStatus: (isAvailable: Boolean, isPoorQuality: Boolean, message: String) -> Unit
) {
    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private val marathiLocale = Locale("mr", "IN")
    private var isTtsInitialized = false
    private var isMarathiTtsAvailable = false

    init {
        initSpeechRecognizer()
        initTextToSpeech()
    }

    private fun initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        onListeningStateChanged(true)
                    }
                    override fun onBeginningOfSpeech() {}
                    override fun onRmsChanged(rmsdB: Float) {}
                    override fun onBufferReceived(buffer: ByteArray?) {}
                    override fun onEndOfSpeech() {
                        onListeningStateChanged(false)
                    }
                    override fun onError(error: Int) {
                        onListeningStateChanged(false)
                        Log.w("SpeechRecognizer", "Error code: $error")
                    }
                    override fun onResults(results: Bundle?) {
                        onListeningStateChanged(false)
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        if (!matches.isNullOrEmpty()) {
                            onSpeechResult(matches[0])
                        }
                    }
                    override fun onPartialResults(partialResults: Bundle?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }
        }
    }

    private fun initTextToSpeech() {
        textToSpeech = TextToSpeech(context) { status ->
            if (status == TextToSpeech.SUCCESS) {
                isTtsInitialized = true
                val result = textToSpeech?.setLanguage(marathiLocale)
                if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                    isMarathiTtsAvailable = false
                    Log.w("TTS", "Marathi (mr-IN) not supported on device TTS engine.")
                    // Flagged for fallback to Cloud TTS as requested in prompt:
                    // "if Marathi TTS quality is poor on-device, flag this so I can switch to Google Cloud Text-to-Speech API instead"
                    onTtsStatus(
                        false,
                        true,
                        "On-device Marathi voice is missing. Recommend switching to Google Cloud Text-to-Speech API."
                    )
                } else {
                    isMarathiTtsAvailable = true
                    textToSpeech?.setPitch(1.0f)
                    textToSpeech?.setSpeechRate(0.92f) // slightly slower for better farmer clarity
                    onTtsStatus(true, false, "On-device Marathi TTS ready.")
                }
            } else {
                onTtsStatus(false, true, "TTS initialization failed.")
            }
        }
    }

    fun startListening() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, "mr-IN")
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, "mr-IN")
            putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, "mr-IN")
            putExtra(RecognizerIntent.EXTRA_PROMPT, "आपला प्रश्न बोला (Speak in Marathi)")
        }
        speechRecognizer?.startListening(intent)
        onListeningStateChanged(true)
    }

    fun stopListening() {
        speechRecognizer?.stopListening()
        onListeningStateChanged(false)
    }

    fun speak(text: String, utteranceId: String = "krushi_reply") {
        if (!isTtsInitialized || !isMarathiTtsAvailable) return
        val clean = text.replace(Regex("[*#_~`]"), "")
        textToSpeech?.speak(clean, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    fun stopSpeaking() {
        textToSpeech?.stop()
    }

    fun destroy() {
        speechRecognizer?.destroy()
        textToSpeech?.stop()
        textToSpeech?.shutdown()
    }
}
