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
        // 页面内可后退时先后退，避免一按就退出 App
        if (bridge != null && bridge.getWebView() != null && bridge.getWebView().canGoBack()) {
            bridge.getWebView().goBack();
            return;
        }

        if (canExit) {
            super.onBackPressed();
            return;
        }

        canExit = true;
        Toast.makeText(this, "再按一次退出", Toast.LENGTH_SHORT).show();
        handler.postDelayed(() -> canExit = false, 2000);
    }
}
