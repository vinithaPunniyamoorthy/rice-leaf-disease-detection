import 'package:flutter/material.dart';
import '../../core/app_colors.dart';
import 'login_options_screen.dart';

// ViewFeedbackScreen was moved to feedback_screens.dart to support expert-to-farmer feedback linkage.

class LogoutConfirmationScreen extends StatelessWidget {
  const LogoutConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D2310), // Very dark green as seen in image
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text(
                'See you soon!',
                style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              const Text(
                'Sign in again to continue managing your crops.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70),
              ),
              const SizedBox(height: 60),
              Container(
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.green.withOpacity(0.1),
                  boxShadow: [
                    BoxShadow(color: Colors.green.withOpacity(0.2), blurRadius: 40, spreadRadius: 10),
                  ],
                ),
                child: const Icon(Icons.shield, size: 80, color: Colors.greenAccent),
              ),
              const SizedBox(height: 80),
              ElevatedButton(
                onPressed: () {
                  Navigator.pushAndRemoveUntil(
                    context,
                    MaterialPageRoute(builder: (context) => const LoginOptionsScreen()),
                    (route) => false,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.greenAccent,
                  foregroundColor: Colors.black,
                  minimumSize: const Size(double.infinity, 50),
                ),
                child: const Text('Log In Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
