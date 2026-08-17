import 'package:asafor_vtu/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('renders AsaforVTU splash branding', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));

    expect(find.text('AsaforVTU'), findsOneWidget);
    expect(find.text('Instant Digital Services'), findsOneWidget);
  });
}
