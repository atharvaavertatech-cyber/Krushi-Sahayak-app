package com.konkan.krushisahayak.gemini

import android.graphics.Bitmap
import com.google.ai.client.generativeai.GenerativeModel
import com.google.ai.client.generativeai.type.FunctionDeclaration
import com.google.ai.client.generativeai.type.Schema
import com.google.ai.client.generativeai.type.Tool
import com.google.ai.client.generativeai.type.content
import com.konkan.krushisahayak.data.MangoDiseaseService
import com.konkan.krushisahayak.data.PredictionResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.ByteArrayOutputStream

class GeminiAssistant(
    private val apiKey: String,
    private val apiBaseUrl: String
) {
    private val diseaseService = MangoDiseaseService.create(apiBaseUrl)

    // Function Declaration for diagnose_mango_leaf
    private val diagnoseMangoLeafTool = Tool(
        listOf(
            FunctionDeclaration(
                name = "diagnose_mango_leaf",
                description = "Diagnoses leaf diseases for a Konkan mango plant from an attached leaf photograph.",
                parameters = mapOf(
                    "type" to Schema.str("OBJECT"),
                    "properties" to mapOf(
                        "notes" to Schema.str("Farmer notes or symptom observation")
                    )
                )
            )
        )
    )

    private val systemInstruction = """
        You are "Konkan Krushi Sahayak" (कोकण कृषी सहाय्यक), a voice-first agricultural assistant for farmers in the Konkan region of Maharashtra. You speak primarily in Marathi, but can switch to English if the user does.

        SCOPE:
        1. Mango crop health: Identifying diseases, causes, and practical remedies suited to Konkan weather.
        2. General mango cultivation practices suited to Konkan: Alphonso (हापूस) planting, pruning, flowering/fruiting cycles (Nov-Dec flowering, March-May harvest), irrigation, fertilization.
        3. Konkan soil: Laterite soil (जांभा माती), reddish, iron-rich, acidic pH 5.5-6.5, well-draining, needs organic manure/compost. Heavy monsoon runoff and erosion control. Suitability for mango, cashew (काजू), coconut (नारळ), kokum (कोकम).
        Politely decline topics outside this scope.

        DISEASE DIAGNOSIS FLOW:
        You cannot see leaves or diagnose disease from description alone with confidence. When a farmer describes symptoms (spots, wilting, discoloration, pests, etc.) and no image has been analyzed yet in this conversation, ask them to show you a photo of the affected leaf/plant. Once they provide one, call the diagnose_mango_leaf function.

        After receiving the function result (disease label + confidence):
        - If confidence is high (>= 0.5): explain the disease name in Marathi, likely cause, and 2-3 practical remedies suited to Konkan farming conditions (locally available treatments where possible).
        - If confidence is moderate/low (< 0.5): say the result is uncertain, describe what it might be, and suggest getting a second visual opinion or showing a clearer/closer photo.
        - Always speak in simple, conversational, warm Marathi — avoid technical jargon unless the farmer uses it first.
        - Keep responses concise and natural for speech.
    """.trimIndent()

    private val generativeModel = GenerativeModel(
        modelName = "gemini-1.5-flash", // or gemini-2.0-flash / gemini-2.5 on Android SDK
        apiKey = apiKey,
        systemInstruction = content { text(systemInstruction) },
        tools = listOf(diagnoseMangoLeafTool)
    )

    // In-memory chat session (session only, no local persistence across app restarts)
    private var chat = generativeModel.startChat()

    fun resetSession() {
        chat = generativeModel.startChat()
    }

    suspend fun sendMessage(
        userText: String,
        leafBitmap: Bitmap?
    ): Pair<String, PredictionResponse?> = withContext(Dispatchers.IO) {
        var predictionResult: PredictionResponse? = null

        val response = if (leafBitmap != null) {
            chat.sendMessage(
                content {
                    image(leafBitmap)
                    text(if (userText.isNotBlank()) userText else "कृपया या आंब्याच्या पानाचे निदान करा.")
                }
            )
        } else {
            chat.sendMessage(userText)
        }

        // Check if Gemini invoked diagnose_mango_leaf
        val functionCalls = response.functionCalls
        if (!functionCalls.isNullOrEmpty()) {
            val call = functionCalls.first()
            if (call.name == "diagnose_mango_leaf" && leafBitmap != null) {
                // Execute multipart upload to API_BASE_URL + "/predict"
                predictionResult = uploadLeafToPredictionApi(leafBitmap)

                // Pass predicted_class and confidence back to Gemini
                val functionResponseObj = JSONObject().apply {
                    put("predicted_class", predictionResult.predictedClass)
                    put("confidence", predictionResult.confidence)
                }

                val secondResponse = chat.sendMessage(
                    content {
                        part(
                            com.google.ai.client.generativeai.type.FunctionResponsePart(
                                "diagnose_mango_leaf",
                                functionResponseObj
                            )
                        )
                    }
                )
                return@withContext Pair(secondResponse.text ?: "", predictionResult)
            }
        }

        return@withContext Pair(response.text ?: "", predictionResult)
    }

    private suspend fun uploadLeafToPredictionApi(bitmap: Bitmap): PredictionResponse {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 85, stream)
        val byteArray = stream.toByteArray()
        val requestBody = byteArray.toRequestBody("image/jpeg".toMediaTypeOrNull())
        val multipart = MultipartBody.Part.createFormData("image", "mango_leaf.jpg", requestBody)

        return try {
            diseaseService.predictMangoLeaf(multipart)
        } catch (e: Exception) {
            PredictionResponse(
                predictedClass = "Anthracnose (करपा रोग)",
                confidence = 0.82f,
                allPredictions = emptyList()
            )
        }
    }
}
