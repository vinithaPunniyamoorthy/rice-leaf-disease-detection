import 'package:flutter/material.dart';
import 'core/app_theme.dart';
import 'presentation/screens/splash_screen.dart';

import 'package:provider/provider.dart';
import 'data/auth_provider.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const CropShieldApp(),
    ),
  );
}

class CropShieldApp extends StatelessWidget {
  const CropShieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CropShield',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const SplashScreen(),
    );
  }
}
