package com.konkan.krushisahayak

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddAPhoto
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.MicOff
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private val viewModel: KonkanKrushiViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            KonkanKrushiApp(viewModel = viewModel)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KonkanKrushiApp(viewModel: KonkanKrushiViewModel) {
    val messages by viewModel.messages.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()
    val coroutineScope = rememberCoroutineScope()
    var textInput by remember { mutableStateOf("") }

    // Audio & Camera Permission Launchers
    var hasAudioPermission by remember { mutableStateOf(false) }
    var hasCameraPermission by remember { mutableStateOf(false) }

    val audioPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasAudioPermission = granted
        if (granted) viewModel.onMicClicked()
    }

    val cameraLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.TakePicturePreview()
    ) { bitmap: Bitmap? ->
        bitmap?.let { viewModel.onPhotoAttached(it) }
    }

    val cameraPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
        if (granted) cameraLauncher.launch(null)
    }

    // Auto-scroll when new message arrives
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1B4332), // Deep Agricultural Green
                    titleContentColor = Color.White,
                    actionIconContentColor = Color.White
                ),
                title = {
                    Column {
                        Text(
                            text = "कोकण कृषी सहाय्यक",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Konkan Krushi Sahayak • हापूस व जांभा माती",
                            fontSize = 12.sp,
                            color = Color(0xFFB7E4C7)
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.resetSession() }) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "नवीन चर्चा (Reset Session)"
                        )
                    }
                }
            )
        },
        bottomBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(horizontal = 12.dp, vertical = 8.dp)
            ) {
                // Pending leaf photo preview
                if (uiState.pendingImage != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .background(Color(0xFFE8F5E9), RoundedCornerShape(8.dp))
                            .padding(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Image(
                            bitmap = uiState.pendingImage!!.asImageBitmap(),
                            contentDescription = "Leaf photo",
                            modifier = Modifier
                                .size(56.dp)
                                .clip(RoundedCornerShape(6.dp))
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                "पानाचा फोटो जोडला आहे",
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 14.sp,
                                color = Color(0xFF1B4332)
                            )
                            Text(
                                "माईक दाबा किंवा पाठवा वर क्लिक करा",
                                fontSize = 12.sp,
                                color = Color.Gray
                            )
                        }
                        TextButton(onClick = { viewModel.onClearPendingPhoto() }) {
                            Text("रद्द करा", color = Color.Red, fontSize = 13.sp)
                        }
                    }
                }

                // TTS quality note/warning if device lacks Marathi voice
                if (uiState.ttsWarningMessage != null) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Warning, contentDescription = null, tint = Color(0xFFD97706), modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = uiState.ttsWarningMessage ?: "",
                            fontSize = 11.sp,
                            color = Color(0xFF92400E)
                        )
                    }
                }

                // Bottom Input Control Row: Large Mic Button + Camera Attach + Quick Text
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Camera / Photo attach button
                    FilledTonalIconButton(
                        onClick = { cameraPermissionLauncher.launch(Manifest.permission.CAMERA) },
                        colors = IconButtonDefaults.filledTonalIconButtonColors(
                            containerColor = Color(0xFFE2E8F0),
                            contentColor = Color(0xFF1E293B)
                        ),
                        modifier = Modifier.size(52.dp)
                    ) {
                        Icon(Icons.Default.AddAPhoto, contentDescription = "फोटो घ्या (Camera)", modifier = Modifier.size(24.dp))
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    // Text Input Field for optional typing
                    OutlinedTextField(
                        value = textInput,
                        onValueChange = { textInput = it },
                        placeholder = { Text("येथे लिहा किंवा बोला...", fontSize = 14.sp) },
                        modifier = Modifier
                            .weight(1f)
                            .heightIn(min = 52.dp),
                        shape = RoundedCornerShape(26.dp),
                        singleLine = true,
                        trailingIcon = {
                            if (textInput.isNotBlank() || uiState.pendingImage != null) {
                                IconButton(
                                    onClick = {
                                        viewModel.onSendTextMessage(textInput)
                                        textInput = ""
                                    }
                                ) {
                                    Icon(Icons.Default.Send, contentDescription = "Send", tint = Color(0xFF2D6A4F))
                                }
                            }
                        }
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    // Large Voice Mic Button for field use
                    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
                    val pulseScale by infiniteTransition.animateFloat(
                        initialValue = 1.0f,
                        targetValue = 1.15f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(600),
                            repeatMode = RepeatMode.Reverse
                        ),
                        label = "scale"
                    )

                    Button(
                        onClick = {
                            audioPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO)
                        },
                        modifier = Modifier
                            .size(60.dp)
                            .scale(if (uiState.isListening) pulseScale else 1.0f),
                        shape = CircleShape,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (uiState.isListening) Color(0xFFDC2626) else Color(0xFF2D6A4F)
                        ),
                        contentPadding = PaddingValues(0.dp)
                    ) {
                        Icon(
                            imageVector = if (uiState.isListening) Icons.Default.MicOff else Icons.Default.Mic,
                            contentDescription = if (uiState.isListening) "थांबा (Stop Mic)" else "बोला (Start Mic)",
                            tint = Color.White,
                            modifier = Modifier.size(30.dp)
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF4F6F4))
        ) {
            LazyColumn(
                state = listState,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(messages, key = { it.id }) { msg ->
                    ConversationItem(
                        item = msg,
                        onReplay = { viewModel.replayMessage(msg.text) }
                    )
                }

                if (uiState.isProcessing) {
                    item {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = Color.White),
                            shape = RoundedCornerShape(14.dp),
                            modifier = Modifier.padding(end = 40.dp)
                        ) {
                            Row(
                                modifier = Modifier.padding(14.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                CircularProgressIndicator(
                                    modifier = Modifier.size(20.dp),
                                    color = Color(0xFF2D6A4F),
                                    strokeWidth = 2.dp
                                )
                                Spacer(modifier = Modifier.width(12.dp))
                                Text(
                                    text = "कृषी सहाय्यक विचार करत आहे...",
                                    fontSize = 15.sp,
                                    color = Color(0xFF2D6A4F),
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ConversationItem(item: MessageTurn, onReplay: () -> Unit) {
    val isUser = item.isUser

    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 330.dp)
                .clip(
                    RoundedCornerShape(
                        topStart = 16.dp,
                        topEnd = 16.dp,
                        bottomStart = if (isUser) 16.dp else 4.dp,
                        bottomEnd = if (isUser) 4.dp else 16.dp
                    )
                )
                .background(if (isUser) Color(0xFF2D6A4F) else Color.White)
                .border(
                    width = if (isUser) 0.dp else 1.dp,
                    color = Color(0xFFE2E8F0),
                    shape = RoundedCornerShape(16.dp)
                )
                .padding(14.dp)
        ) {
            // Attached Leaf Photo display
            if (item.image != null) {
                Image(
                    bitmap = item.image.asImageBitmap(),
                    contentDescription = "Uploaded leaf photo",
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(180.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .padding(bottom = 8.dp)
                )
            }

            // Disease prediction banner if returned by diagnose_mango_leaf
            if (item.prediction != null) {
                val isHighConfidence = item.prediction.confidence >= 0.5f
                Card(
                    colors = CardDefaults.cardColors(
                        containerColor = if (isHighConfidence) Color(0xFFFEF3C7) else Color(0xFFF3F4F6)
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "🔬 निदान: ${item.prediction.predictedClass}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = Color(0xFF92400E)
                            )
                            Text(
                                text = "${(item.prediction.confidence * 100).toInt()}% अचूकता",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = if (isHighConfidence) Color(0xFF15803D) else Color(0xFFB45309)
                            )
                        }
                    }
                }
            }

            // Spoken text transcript
            Text(
                text = item.text,
                fontSize = 16.sp,
                lineHeight = 24.sp,
                color = if (isUser) Color.White else Color(0xFF1E293B),
                fontWeight = if (isUser) FontWeight.Medium else FontWeight.Normal
            )

            // Audio Replay button for assistant turns
            if (!isUser) {
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(
                        onClick = onReplay,
                        contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                    ) {
                        Icon(
                            Icons.Default.VolumeUp,
                            contentDescription = "ऐका (Listen)",
                            tint = Color(0xFF2D6A4F),
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "पुन्हा ऐका",
                            fontSize = 13.sp,
                            color = Color(0xFF2D6A4F),
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }
            }
        }
    }
}
