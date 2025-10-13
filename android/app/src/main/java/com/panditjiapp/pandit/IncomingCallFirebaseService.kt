package com.panditjiapp.pujaguru

import android.content.Intent
import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

class IncomingCallFirebaseService : FirebaseMessagingService() {
    companion object {
        private const val TAG = "IncomingCallFcmService"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        val data = remoteMessage.data
        if (data != null && data["type"] == "video_call_invite") {
            Log.d(TAG, "incoming call push received")
            val intent = Intent(this, IncomingCallService::class.java)
            intent.putExtra("callerName", data["callerName"])
            intent.putExtra("callId", data["callId"])
            intent.putExtra("meeting_url", data["meeting_url"])
            // Start a foreground service so we have UI context to call CallKeep
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        }
    }
}
