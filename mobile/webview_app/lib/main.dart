import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:app_links/app_links.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'push_notification_service.dart';

const productionCustomerUrl = 'https://vtu.ferixas.com';
const productionSignInUrl = '$productionCustomerUrl/login';
const productionCustomerHost = 'vtu.ferixas.com';
late final Future<void> _firebaseInitialization;

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  _firebaseInitialization = _initializeFirebase();
  runApp(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0A1F44),
          primary: const Color(0xFF0A1F44),
        ),
        useMaterial3: true,
      ),
      home: const SplashScreen(),
    ),
  );
}

Future<void> _initializeFirebase() async {
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (error) {
    // Push is optional at startup; the customer WebView must still open if
    // Firebase is unavailable during a rollout or on an unsupported device.
    debugPrint('Firebase startup deferred: $error');
  }
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;
  late final Animation<double> _fade;
  late final Animation<double> _glow;
  late final Animation<double> _ring;
  Timer? _navigationTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _scale = Tween<double>(
      begin: 0.94,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic));
    _fade = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
    _glow = Tween<double>(
      begin: 0.0,
      end: 12.0,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
    _ring = Tween<double>(
      begin: 0.9,
      end: 1.15,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
    _navigationTimer = Timer(const Duration(milliseconds: 2200), () {
      if (!mounted) return;
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute(builder: (_) => const WebViewApp()));
    });
  }

  @override
  void dispose() {
    _navigationTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFF7FBFF), Color(0xFFE9F2FF)],
              ),
            ),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Opacity(
                    opacity: _fade.value,
                    child: Transform.scale(
                      scale: _scale.value,
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFF0A1F44,
                              ).withValues(alpha: 0.12),
                              blurRadius: 24 * (_glow.value / 12.0),
                              spreadRadius: 2,
                            ),
                          ],
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Transform.scale(
                              scale: _ring.value,
                              child: Container(
                                width: 210,
                                height: 210,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: const Color(
                                      0xFF0A1F44,
                                    ).withValues(alpha: 0.08 * _fade.value),
                                    width: 6,
                                  ),
                                ),
                              ),
                            ),
                            Image.asset(
                              'assets/splash_logo.png',
                              width: 230,
                              height: 230,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stack) =>
                                  const Icon(
                                    Icons.public,
                                    color: Color(0xFF0A1F44),
                                    size: 88,
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Opacity(
                    opacity: _fade.value,
                    child: Transform.translate(
                      offset: Offset(0, (1 - _fade.value) * 12),
                      child: const Text(
                        'AsaforVTU',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0A1F44),
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Opacity(
                    opacity: _fade.value,
                    child: Column(
                      children: const [
                        Text(
                          'Instant Digital Services',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF6B7C93),
                            letterSpacing: 0.6,
                          ),
                        ),
                        SizedBox(height: 12),
                      ],
                    ),
                  ),
                  Opacity(
                    opacity: _fade.value,
                    child: SizedBox(
                      height: 10,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          _Dot(opacity: _dotOpacity(0)),
                          const SizedBox(width: 6),
                          _Dot(opacity: _dotOpacity(1)),
                          const SizedBox(width: 6),
                          _Dot(opacity: _dotOpacity(2)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  double _dotOpacity(int index) {
    final t = (_controller.value * 3) - index;
    final v = (t.clamp(0.0, 1.0));
    return Curves.easeInOut.transform(v);
  }
}

class _ErrorOverlay extends StatelessWidget {
  const _ErrorOverlay({
    required this.message,
    required this.onRetry,
    required this.isChecking,
    this.icon = Icons.cloud_off,
  });

  final String message;
  final VoidCallback onRetry;
  final bool isChecking;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: ColoredBox(
        color: Colors.white,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 64, color: const Color(0xFF6B7C93)),
                const SizedBox(height: 16),
                const Text(
                  'AsaforVTU is temporarily unavailable',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0A1F44),
                  ),
                ),
                const SizedBox(height: 8),
                Text(message, textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: isChecking ? null : onRetry,
                  icon: isChecking
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.refresh),
                  label: Text(isChecking ? 'Checking…' : 'Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  final double opacity;
  const _Dot({required this.opacity});
  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: opacity,
      child: Container(
        width: 8,
        height: 8,
        decoration: const BoxDecoration(
          color: Color(0xFF0A1F44),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

class WebViewApp extends StatefulWidget {
  const WebViewApp({super.key});

  @override
  State<WebViewApp> createState() => _WebViewAppState();
}

class _WebViewAppState extends State<WebViewApp> {
  late final WebViewController _controller;
  late final AppLinks _appLinks;
  StreamSubscription<Uri>? _linkSubscription;
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;
  bool _isOffline = false;
  bool _isCheckingConnection = false;
  bool _isLoading = true;
  int _loadingProgress = 0;
  String? _webViewError;
  bool _pushRegistrationScheduled = false;
  Future<bool> _hasRealConnection() async {
    try {
      final result = await InternetAddress.lookup(productionCustomerHost);
      if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) return true;
    } catch (_) {}
    try {
      final result = await InternetAddress.lookup('google.com');
      return result.isNotEmpty && result[0].rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  @override
  void initState() {
    super.initState();
    _initWebView();
    unawaited(_initPushNotifications());
    unawaited(_initAppLinks());
    unawaited(_initConnectivity());
  }

  void _initWebView() {
    late final PlatformWebViewControllerCreationParams params;
    if (WebViewPlatform.instance is WebKitWebViewPlatform) {
      params = WebKitWebViewControllerCreationParams(
        allowsInlineMediaPlayback: true,
        mediaTypesRequiringUserAction: const <PlaybackMediaTypes>{},
      );
    } else {
      params = const PlatformWebViewControllerCreationParams();
    }

    final WebViewController controller =
        WebViewController.fromPlatformCreationParams(params);

    controller
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            if (!mounted) return;
            setState(() {
              _isLoading = true;
              _loadingProgress = 0;
              _webViewError = null;
            });
          },
          onProgress: (int progress) {
            if (!mounted) return;
            setState(() {
              _loadingProgress = progress.clamp(0, 100);
            });
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                _isLoading = false;
                _loadingProgress = 100;
                _webViewError = null;
              });
            }
            _schedulePushRegistration(url);
          },
          onWebResourceError: (WebResourceError error) {
            if (error.isForMainFrame == false) return;
            debugPrint('Web resource error: ${error.description}');
            _hasRealConnection().then((ok) {
              if (!mounted) return;
              setState(() {
                _isLoading = false;
                _isOffline = !ok;
                _webViewError = ok
                    ? 'The service could not be loaded. Please try again.'
                    : null;
              });
            });
          },
          onNavigationRequest: (NavigationRequest request) async {
            final Uri uri = Uri.parse(request.url);
            // Handle external schemes
            if (uri.scheme == 'mailto' ||
                uri.scheme == 'tel' ||
                uri.scheme == 'sms') {
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              }
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      // The mobile product is an authenticated application. Every new session
      // starts at the live sign-in screen, while website links still open inside
      // the app through the production deep-link host.
      ..loadRequest(Uri.parse(productionSignInUrl));

    if (controller.platform is AndroidWebViewController) {
      if (!kReleaseMode) AndroidWebViewController.enableDebugging(true);
      (controller.platform as AndroidWebViewController)
          .setMediaPlaybackRequiresUserGesture(false);
    }

    _controller = controller;
  }

  Future<void> _initPushNotifications() async {
    try {
      await _firebaseInitialization;
      await PushNotificationService.instance.initialize(
        onOpenDestination: _openNotificationDestination,
      );
    } catch (error) {
      debugPrint('Push notifications are unavailable on this device: $error');
    }
  }

  void _schedulePushRegistration(String url) {
    final page = Uri.tryParse(url);
    if (_pushRegistrationScheduled ||
        page == null ||
        page.host != productionCustomerHost ||
        page.path == '/login') {
      return;
    }
    _pushRegistrationScheduled = true;
    Future<void>.delayed(const Duration(seconds: 1), () async {
      if (!mounted) return;
      final registered = await _syncPushTokenFromAuthenticatedSession();
      if (!registered && mounted) {
        _pushRegistrationScheduled = false;
      }
    });
  }

  Future<bool> _syncPushTokenFromAuthenticatedSession() async {
    try {
      final rawValue = await _controller.runJavaScriptReturningResult(
        'window.localStorage.getItem("access_token") || "";',
      );
      final accessToken = _decodeJavaScriptString(rawValue);
      if (accessToken.isEmpty) return false;
      return await PushNotificationService.instance.registerAuthenticatedDevice(
        accessToken,
      );
    } catch (error) {
      debugPrint('Push-token session sync deferred: $error');
      return false;
    }
  }

  String _decodeJavaScriptString(Object? rawValue) {
    final value = rawValue?.toString() ?? '';
    if (value.isEmpty || value == 'null') return '';
    try {
      final decoded = jsonDecode(value);
      return decoded is String ? decoded : '';
    } catch (_) {
      return value.replaceAll('"', '');
    }
  }

  void _openNotificationDestination(String destination) {
    final relative = destination.startsWith('/')
        ? destination
        : '/$destination';
    final candidate = Uri.tryParse(destination);
    final target = candidate != null && candidate.hasScheme
        ? candidate
        : Uri.parse('$productionCustomerUrl$relative');
    if (target.host == productionCustomerHost && target.scheme == 'https') {
      _controller.loadRequest(target);
    }
  }

  Future<void> _initAppLinks() async {
    try {
      _appLinks = AppLinks();
      final initialUri = await _appLinks.getInitialLink();
      if (initialUri != null &&
          initialUri.host == productionCustomerHost &&
          initialUri.scheme == 'https') {
        await _controller.loadRequest(initialUri);
      }
      _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
        debugPrint('Received deep link: $uri');
        if (uri.host == productionCustomerHost && uri.scheme == 'https') {
          unawaited(_controller.loadRequest(uri));
        }
      });
    } catch (error) {
      debugPrint('Deep-link initialization deferred: $error');
    }
  }

  Future<void> _initConnectivity() async {
    try {
      final initial = await Connectivity().checkConnectivity();
      final initialHas = !initial.contains(ConnectivityResult.none);
      if (!initialHas) {
        final ok = await _hasRealConnection();
        if (mounted) {
          setState(() {
            _isOffline = !ok;
          });
        }
      } else if (mounted) {
        setState(() {
          _isOffline = false;
        });
      }
      _connectivitySubscription = Connectivity().onConnectivityChanged.listen((
        results,
      ) {
        final hasConnection = results.any(
          (result) => result != ConnectivityResult.none,
        );
        if (hasConnection) {
          if (_isOffline) {
            setState(() {
              _isOffline = false;
            });
            unawaited(_controller.reload());
          }
        } else {
          _hasRealConnection().then((ok) {
            if (mounted) {
              setState(() {
                _isOffline = !ok;
              });
            }
          });
        }
      });
    } catch (error) {
      debugPrint('Connectivity monitoring unavailable: $error');
    }
  }

  Future<void> _retryConnection() async {
    if (_isCheckingConnection) return;
    setState(() {
      _isCheckingConnection = true;
    });
    final connected = await _hasRealConnection();
    if (!mounted) return;
    setState(() {
      _isCheckingConnection = false;
      _isOffline = !connected;
      _webViewError = connected ? null : _webViewError;
    });
    if (connected) {
      unawaited(_controller.reload());
    }
  }

  @override
  void dispose() {
    _linkSubscription?.cancel();
    _connectivitySubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) async {
        if (didPop) return;
        final bool canGoBack = await _controller.canGoBack();
        if (canGoBack) {
          await _controller.goBack();
        } else {
          await SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Stack(
            children: [
              RefreshIndicator(
                onRefresh: () async {
                  await _controller.reload();
                },
                color: const Color(0xFF0A1F44),
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    SizedBox(
                      height: MediaQuery.of(context).size.height - 100,
                      child: WebViewWidget(controller: _controller),
                    ),
                  ],
                ),
              ),
              if (_isLoading && !_isOffline)
                Positioned(
                  left: 0,
                  right: 0,
                  top: 0,
                  child: LinearProgressIndicator(
                    value: _loadingProgress == 0
                        ? null
                        : _loadingProgress / 100,
                    minHeight: 3,
                    color: const Color(0xFF0A1F44),
                    backgroundColor: const Color(0xFFE8EEF6),
                  ),
                ),
              // Smooth navigation loading overlay for dashboard/page transitions
              IgnorePointer(
                ignoring: !(_isLoading && _loadingProgress < 85),
                child: AnimatedOpacity(
                  opacity: (_isLoading && _loadingProgress < 85) ? 1.0 : 0.0,
                  duration: const Duration(milliseconds: 350),
                  child: Container(
                    color: Colors.white.withValues(alpha: 0.92),
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.08),
                                  blurRadius: 20,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const SizedBox(
                                  width: 36,
                                  height: 36,
                                  child: CircularProgressIndicator(
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Color(0xFF0A1F44),
                                    ),
                                    strokeWidth: 3,
                                  ),
                                ),
                                const SizedBox(height: 16),
                                const Text(
                                  'Loading AsaforVTU...',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF0A1F44),
                                    letterSpacing: 0.2,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Preparing your secure workspace',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              if (_webViewError != null && !_isOffline)
                _ErrorOverlay(
                  message: _webViewError!,
                  onRetry: _retryConnection,
                  isChecking: _isCheckingConnection,
                ),
              if (_isOffline)
                _ErrorOverlay(
                  message:
                      'No internet connection. Check your network settings and try again.',
                  onRetry: _retryConnection,
                  isChecking: _isCheckingConnection,
                  icon: Icons.wifi_off,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
