import 'package:flutter/material.dart';

class PageLoadingOverlay extends StatelessWidget {
  const PageLoadingOverlay({super.key});

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: IgnorePointer(
        child: TweenAnimationBuilder<double>(
          duration: const Duration(milliseconds: 220),
          tween: Tween(begin: 0, end: 1),
          curve: Curves.easeOut,
          builder: (context, value, child) => Opacity(
            opacity: value,
            child: ColoredBox(
              color: Colors.white.withValues(alpha: 0.96),
              child: child,
            ),
          ),
          child: Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE3ECF3)),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x1F0A1F44),
                    blurRadius: 26,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.2,
                      color: Color(0xFF0A1F44),
                    ),
                  ),
                  SizedBox(width: 12),
                  Text(
                    'Loading securely…',
                    style: TextStyle(
                      color: Color(0xFF0A1F44),
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
