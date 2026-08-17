import 'dart:async';
import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;

const _apiBaseUrl = 'https://vtuapi.ferixas.com';
const _notificationChannelId = 'asaforvtu_account_alerts';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Native system notifications are displayed by FCM while the app is in the
  // background. This entry point keeps Flutter available for data-only events.
  await Firebase.initializeApp();
  debugPrint('AsaforVTU background notification: ${message.messageId}');
}

class PushNotificationService {
  PushNotificationService._();

  static final instance = PushNotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  String? _deviceToken;
  String? _authenticatedAccessToken;
  ValueChanged<String>? _onOpenDestination;
  StreamSubscription<String>? _tokenRefreshSubscription;

  Future<void> initialize({
    required ValueChanged<String> onOpenDestination,
  }) async {
    _onOpenDestination = onOpenDestination;

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/launcher_icon',
    );
    const iosSettings = DarwinInitializationSettings();
    const initializationSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings: initializationSettings,
      onDidReceiveNotificationResponse: (response) {
        final destination = response.payload;
        if (destination != null && destination.isNotEmpty) {
          _onOpenDestination?.call(destination);
        }
      },
    );

    const androidChannel = AndroidNotificationChannel(
      _notificationChannelId,
      'Account alerts',
      description: 'Important AsaforVTU account and transaction notifications.',
      importance: Importance.high,
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    await _messaging.requestPermission(alert: true, badge: true, sound: true);
    await _messaging.setForegroundNotificationPresentationOptions(
      alert: false,
      badge: true,
      sound: false,
    );

    FirebaseMessaging.onMessage.listen(_showForegroundNotification);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleOpenedMessage);
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleOpenedMessage(initialMessage);
    }

    _deviceToken = await _messaging.getToken();
    _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = _messaging.onTokenRefresh.listen((token) {
      _deviceToken = token;
      final accessToken = _authenticatedAccessToken;
      if (accessToken != null && accessToken.isNotEmpty) {
        unawaited(registerAuthenticatedDevice(accessToken));
      }
    });
  }

  Future<bool> registerAuthenticatedDevice(String accessToken) async {
    _authenticatedAccessToken = accessToken;
    final token = _deviceToken ?? await _messaging.getToken();
    if (token == null || token.isEmpty || accessToken.isEmpty) return false;

    try {
      final response = await http
          .post(
            Uri.parse('$_apiBaseUrl/api/notifications/devices'),
            headers: {
              HttpHeaders.authorizationHeader: 'Bearer $accessToken',
              HttpHeaders.contentTypeHeader: 'application/json',
            },
            body:
                '{"token":"$token","platform":"${Platform.isIOS ? 'ios' : 'android'}"}',
          )
          .timeout(const Duration(seconds: 8));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        debugPrint('Push-token registration deferred: ${response.statusCode}');
        return false;
      }
      return true;
    } catch (error) {
      // The app remains fully usable if the registration endpoint is offline,
      // unavailable during rollout, or the device has no network connection.
      debugPrint('Push-token registration deferred: $error');
      return false;
    }
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    final notification = message.notification;
    final destination = _destinationFor(message);
    await _localNotifications.show(
      id: message.hashCode,
      title: notification?.title ?? 'AsaforVTU',
      body: notification?.body ?? 'You have a new account update.',
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          _notificationChannelId,
          'Account alerts',
          channelDescription:
              'Important AsaforVTU account and transaction notifications.',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@drawable/ic_stat_asaforvtu',
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: destination,
    );
  }

  void _handleOpenedMessage(RemoteMessage message) {
    _onOpenDestination?.call(_destinationFor(message));
  }

  String _destinationFor(RemoteMessage message) {
    final data = message.data;
    return data['deep_link']?.toString() ??
        data['destination']?.toString() ??
        data['url']?.toString() ??
        '/dashboard/notifications';
  }
}
