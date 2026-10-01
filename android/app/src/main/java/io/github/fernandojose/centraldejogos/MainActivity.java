package io.github.fernandojose.centraldejogos;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

/**
 * App da Central de Jogos: abre os jogos que vão embutidos no APK
 * (pasta assets/www) num WebView. Funciona offline contra bots e online
 * com as salas normalmente.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String BASE = "https://" + HOST + "/assets/www/";
    private static final String SITE_HOST = "fernandojose-esdhc.github.io";
    private static final String SITE_PATH = "/trucoonline";

    private WebView web;
    private WebViewAssetLoader loader;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;          // páginas do próprio app
                String local = toLocal(u);
                if (local != null) { view.loadUrl(local); return true; } // link do site → versão embutida
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } // GitHub etc. → navegador
                catch (ActivityNotFoundException ignored) { }
                return true;
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else openIntent(getIntent());
    }

    /** Converte https://fernandojose-esdhc.github.io/trucoonline/... para o endereço embutido. */
    private static String toLocal(Uri u) {
        if (u == null || !SITE_HOST.equals(u.getHost())) return null;
        String path = u.getPath() == null ? "" : u.getPath();
        if (!path.startsWith(SITE_PATH)) return null;
        String rest = path.substring(SITE_PATH.length());
        if (rest.startsWith("/")) rest = rest.substring(1);
        if (rest.isEmpty() || rest.endsWith("/")) rest = rest + "index.html";
        StringBuilder sb = new StringBuilder(BASE).append(rest);
        if (u.getEncodedQuery() != null) sb.append('?').append(u.getEncodedQuery());
        if (u.getEncodedFragment() != null) sb.append('#').append(u.getEncodedFragment());
        return sb.toString();
    }

    private void openIntent(Intent intent) {
        String url = null;
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) url = toLocal(intent.getData());
        web.loadUrl(url != null ? url : BASE + "index.html");
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) openIntent(intent);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
