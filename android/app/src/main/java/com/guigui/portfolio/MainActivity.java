package com.guigui.portfolio;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        disableOverScroll();
    }

    @Override
    public void onResume() {
        super.onResume();
        disableOverScroll();
    }

    private void disableOverScroll() {
        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
                // Désactiver le pull-to-refresh sur le parent aussi
                android.view.View parent = (android.view.View) webView.getParent();
                while (parent != null) {
                    parent.setOverScrollMode(android.view.View.OVER_SCROLL_NEVER);
                    if (parent.getParent() instanceof android.view.View) {
                        parent = (android.view.View) parent.getParent();
                    } else {
                        break;
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
