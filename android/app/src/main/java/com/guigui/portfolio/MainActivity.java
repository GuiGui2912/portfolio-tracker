package com.guigui.portfolio;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        forceRefresh();
    }

    private void forceRefresh() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
                webView.clearCache(true);
                webView.clearHistory();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
