package com.konkan.krushisahayak.data

import com.google.gson.annotations.SerializedName
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part
import java.util.concurrent.TimeUnit

data class PredictionItem(
    @SerializedName("label") val label: String,
    @SerializedName("confidence") val confidence: Float
)

data class PredictionResponse(
    @SerializedName("predicted_class") val predictedClass: String,
    @SerializedName("confidence") val confidence: Float,
    @SerializedName("all_predictions") val allPredictions: List<PredictionItem> = emptyList()
)

interface MangoDiseaseService {
    @Multipart
    @POST("predict")
    suspend fun predictMangoLeaf(
        @Part image: MultipartBody.Part
    ): PredictionResponse

    companion object {
        fun create(baseUrl: String): MangoDiseaseService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }
            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build()

            val normalizedUrl = if (baseUrl.endsWith("/")) baseUrl else "$baseUrl/"

            return Retrofit.Builder()
                .baseUrl(normalizedUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(MangoDiseaseService::class.java)
        }
    }
}
