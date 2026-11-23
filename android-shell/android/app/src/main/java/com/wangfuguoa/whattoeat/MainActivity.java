package com.wangfuguoa.whattoeat;

import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private boolean canExit = false;
    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onBackPressed() {
        if (bridge != null && bridge.getWebView() != null && bridge.getWebView().canGoBack()) {
            bridge.getWebView().goBack();
            return;
        }

        if (canExit) {
            super.onBackPressed();
            return;
        }

        canExit = true;
        Toast.makeText(this, getString(R.string.exit_hint), Toast.LENGTH_SHORT).show();
        handler.postDelayed(() -> canExit = false, 2000);
    }
}
