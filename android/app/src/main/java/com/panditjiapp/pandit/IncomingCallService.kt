package com.panditjiapp.pujaguru

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import android.util.Log
import java.util.UUID

class IncomingCallService : Service() {
    companion object {
        private const val CHANNEL_ID = "incoming_call_channel"
        private const val ONGOING_NOTIFICATION_ID = 998
    }

    override fun onCreate() {
        super.onCreate()
        createChannel()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Incoming calls",
                NotificationManager.IMPORTANCE_HIGH
            )
            channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), null)
            val nm = getSystemService(NotificationManager::class.java)
            nm?.createNotificationChannel(channel)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val callerName = intent?.getStringExtra("callerName")
        var callId = intent?.getStringExtra("callId")
        val meetingUrl = intent?.getStringExtra("meeting_url")
        if (callId == null) callId = UUID.randomUUID().toString()

        // Build notification with ringtone
        val soundUri: Uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
        val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Incoming call")
            .setContentText(callerName ?: "PujaGuru")
            .setSmallIcon(R.mipmap.ic_launcher)
            .setSound(soundUri)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setOngoing(true)
            .build()

        startForeground(ONGOING_NOTIFICATION_ID, notification)

        // Call RNCallKeep to display incoming call UI
        try {
            // This bridges to Java static for displayIncomingCall; adjust as needed for project interop.
            val rnCallKeepClass = Class.forName("io.wazo.callkeep.RNCallKeepModule")
            val method = rnCallKeepClass.getDeclaredMethod(
                "displayIncomingCall",
                android.content.Context::class.java,
                String::class.java,
                String::class.java,
                String::class.java,
                String::class.java,
                Boolean::class.javaPrimitiveType
            )
            method.invoke(
                null,
                applicationContext,
                callId,
                callerName ?: "PujaGuru",
                "Video",
                "number",
                true
            )
        } catch (t: Throwable) {
            Log.e("IncomingCallService", "displayIncomingCall failed", t)
        }

        // Optionally stop self after delay, but typically keep alive for call UI
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}
