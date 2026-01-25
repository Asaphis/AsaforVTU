import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';
import 'package:webview_flutter_wkwebview/webview_flutter_wkwebview.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:app_links/app_links.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'dart:io';

void main() {
  runApp(MaterialApp(
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF0A1F44),
        primary: const Color(0xFF0A1F44),
      ),
      useMaterial3: true,
    ),
    home: const SplashScreen(),
  ));
}

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _scale;
  late final Animation<double> _fade;
  late final Animation<double> _glow;
  late final Animation<double> _ring;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 2000));
    _scale = Tween<double>(begin: 0.82, end: 1.0).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));
    _fade = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
    _glow = Tween<double>(begin: 0.0, end: 12.0).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
    _ring = Tween<double>(begin: 0.9, end: 1.15).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(MaterialPageRoute(builder: (_) => const WebViewApp()));
      }
    });
  }

  @override
  void dispose() {
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
                              color: const Color(0xFF0A1F44).withValues(alpha: 0.12),
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
                                width: 160,
                                height: 160,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: const Color(0xFF0A1F44).withValues(alpha: 0.08 * _fade.value),
                                    width: 6,
                                  ),
                                ),
                              ),
                            ),
                            ClipOval(
                              child: Image.asset(
                                'assets/logo.png',
                                width: 140,
                                height: 140,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stack) {
                                  return Container(
                                    width: 140,
                                    height: 140,
                                    color: Colors.white,
                                    child: Center(
                                      child: Text(
                                        'A',
                                        style: TextStyle(
                                          fontSize: 64,
                                          fontWeight: FontWeight.w900,
                                          color: const Color(0xFF0A1F44).withValues(alpha: 0.9),
                                        ),
                                      ),
                                    ),
                                  );
                                },
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
  bool _isLoading = true;
  bool _isOffline = false;
  Future<bool> _hasRealConnection() async {
    try {
      final result = await InternetAddress.lookup('asaforvtu.onrender.com');
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
    _initAppLinks();
    _initConnectivity();
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
          onProgress: (int progress) {
            if (progress == 100) {
              setState(() {
                _isLoading = false;
              });
            }
          },
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('Web resource error: ${error.description}');
            if (error.errorType == WebResourceErrorType.connect ||
                error.errorType == WebResourceErrorType.hostLookup ||
                error.errorType == WebResourceErrorType.timeout) {
              _hasRealConnection().then((ok) {
                if (!ok) {
                  if (mounted) {
                    setState(() { _isOffline = true; });
                  }
                }
              });
            }
          },
          onNavigationRequest: (NavigationRequest request) async {
            final Uri uri = Uri.parse(request.url);
            // Handle external schemes
            if (uri.scheme == 'mailto' || uri.scheme == 'tel' || uri.scheme == 'sms') {
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              }
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse('https://asaforvtu.onrender.com/login'));

    if (controller.platform is AndroidWebViewController) {
      AndroidWebViewController.enableDebugging(true);
      (controller.platform as AndroidWebViewController)
          .setMediaPlaybackRequiresUserGesture(false);
    }

    _controller = controller;
  }

  Future<void> _initAppLinks() async {
    _appLinks = AppLinks();
    _linkSubscription = _appLinks.uriLinkStream.listen((uri) {
      debugPrint('Received deep link: $uri');
      if (uri.toString().contains("asaforvtu.onrender.com")) {
        _controller.loadRequest(uri);
      }
    });
  }

  Future<void> _initConnectivity() async {
    final initial = await Connectivity().checkConnectivity();
    final initialHas = !initial.contains(ConnectivityResult.none);
    if (!initialHas) {
      final ok = await _hasRealConnection();
      setState(() { _isOffline = !ok; });
    } else {
      setState(() { _isOffline = false; });
    }
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((results) {
      bool hasConnection = results.any((result) => result != ConnectivityResult.none);
      if (hasConnection) {
        if (_isOffline) {
          setState(() { _isOffline = false; });
          _controller.reload();
        }
      } else {
        _hasRealConnection().then((ok) {
          if (mounted) setState(() { _isOffline = !ok; });
        });
      }
    });
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
              if (!_isOffline) WebViewWidget(controller: _controller),
              if (_isLoading && !_isOffline)
                const Center(
                  child: CircularProgressIndicator(),
                ),
              if (_isOffline)
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.wifi_off, size: 64, color: Colors.grey),
                      const SizedBox(height: 16),
                      const Text(
                        'No Internet Connection',
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text('Please check your network settings.'),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _isLoading = true;
                            _isOffline = false;
                          });
                          _controller.reload();
                        },
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

