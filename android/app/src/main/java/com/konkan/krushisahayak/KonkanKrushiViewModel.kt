package com.konkan.krushisahayak

import android.app.Application
import android.graphics.Bitmap
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.konkan.krushisahayak.data.PredictionResponse
import com.konkan.krushisahayak.gemini.GeminiAssistant
import com.konkan.krushisahayak.voice.SpeechAndTtsManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class MessageTurn(
    val id: String = java.util.UUID.randomUUID().toString(),
    val isUser: Boolean,
    val text: String,
    val image: Bitmap? = null,
    val timestamp: Long = System.currentTimeMillis(),
    val prediction: PredictionResponse? = null
)

data class UiState(
    val isListening: Boolean = false,
    val isProcessing: Boolean = false,
    val pendingImage: Bitmap? = null,
    val ttsWarningMessage: String? = null,
    val isSpeaking: Boolean = false
)

class KonkanKrushiViewModel(application: Application) : AndroidViewModel(application) {

    private val geminiAssistant = GeminiAssistant(
        apiKey = BuildConfig.GEMINI_API_KEY,
        apiBaseUrl = BuildConfig.API_BASE_URL
    )

    private val _messages = MutableStateFlow<List<MessageTurn>>(
        listOf(
            MessageTurn(
                isUser = false,
                text = "नमस्कार शेतकरी बंधू! मी कोकण कृषी सहाय्यक आहे. हापूस आंबा, जांभा माती, खते आणि झाडांच्या रोगांविषयी काहीही विचारा. रोगाच्या निदानासाठी पानाचा फोटो जोडा."
            )
        )
    )
    val messages: StateFlow<List<MessageTurn>> = _messages.asStateFlow()

    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    private val voiceManager = SpeechAndTtsManager(
        context = application.applicationContext,
        onSpeechResult = { recognizedText ->
            processUserTurn(recognizedText, _uiState.value.pendingImage)
        },
        onListeningStateChanged = { listening ->
            _uiState.value = _uiState.value.copy(isListening = listening)
        },
        onTtsStatus = { isAvailable, isPoor, message ->
            if (isPoor || !isAvailable) {
                _uiState.value = _uiState.value.copy(ttsWarningMessage = message)
            }
        }
    )

    fun onMicClicked() {
        if (_uiState.value.isListening) {
            voiceManager.stopListening()
        } else {
            voiceManager.stopSpeaking()
            voiceManager.startListening()
        }
    }

    fun onPhotoAttached(bitmap: Bitmap) {
        _uiState.value = _uiState.value.copy(pendingImage = bitmap)
    }

    fun onClearPendingPhoto() {
        _uiState.value = _uiState.value.copy(pendingImage = null)
    }

    fun onSendTextMessage(text: String) {
        if (text.isBlank() && _uiState.value.pendingImage == null) return
        processUserTurn(text, _uiState.value.pendingImage)
    }

    private fun processUserTurn(text: String, photo: Bitmap?) {
        val userTurn = MessageTurn(
            isUser = true,
            text = text,
            image = photo
        )
        // In-memory conversation state only
        _messages.value = _messages.value + userTurn
        _uiState.value = _uiState.value.copy(pendingImage = null, isProcessing = true)

        viewModelScope.launch {
            try {
                val (replyText, diagnosis) = geminiAssistant.sendMessage(text, photo)
                val assistantTurn = MessageTurn(
                    isUser = false,
                    text = replyText,
                    prediction = diagnosis
                )
                _messages.value = _messages.value + assistantTurn
                _uiState.value = _uiState.value.copy(isProcessing = false)

                // Voice first response playback in Marathi
                voiceManager.speak(replyText)
            } catch (e: Exception) {
                val errorTurn = MessageTurn(
                    isUser = false,
                    text = "क्षमस्व, उत्तर मिळवण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा."
                )
                _messages.value = _messages.value + errorTurn
                _uiState.value = _uiState.value.copy(isProcessing = false)
            }
        }
    }

    fun replayMessage(text: String) {
        voiceManager.speak(text)
    }

    fun resetSession() {
        voiceManager.stopSpeaking()
        voiceManager.stopListening()
        geminiAssistant.resetSession()
        _messages.value = listOf(
            MessageTurn(
                isUser = false,
                text = "नवीन चर्चा सुरू केली आहे. सांगा, आज आपल्या बागेत काय काम चालू आहे?"
            )
        )
        _uiState.value = UiState()
    }

    override fun onCleared() {
        super.onCleared()
        voiceManager.destroy()
    }
}
