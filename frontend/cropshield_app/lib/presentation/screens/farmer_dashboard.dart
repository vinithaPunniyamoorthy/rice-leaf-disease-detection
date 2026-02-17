import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../data/auth_provider.dart';
import '../../data/api_service.dart';
import 'camera_screen.dart';
import 'image_picker_screen.dart';
import 'final_screens.dart';
import 'view_analysis_screen.dart';
import 'login_options_screen.dart';
import 'multi_image_picker_screen.dart';
import 'view_feedback_screen.dart';
import 'farmer_analysis_screen.dart';
import 'capture_flow_screen.dart';

class FarmerDashboard extends StatelessWidget {
  const FarmerDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final userName = authProvider.user?['name'] ?? 'Farmer';

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('CROPSHIELD', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
        centerTitle: false,
        backgroundColor: Colors.white,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.black),
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.agriculture, size: 40, color: Colors.white),
                  const SizedBox(height: 12),
                  Text(
                    'Welcome, $userName!',
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Protect your crops with AI-powered detection',
                    style: TextStyle(color: Colors.white70, fontSize: 14),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            const Text('Quick Actions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),

                        // 4 Action Buttons Grid
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
                _buildActionCard(
                  context,
                  icon: Icons.camera_alt,
                  label: 'Capture Image',
                  subtitle: 'Use camera',
                  color: const Color(0xFF2E7D32),
                  onTap: () => _showPermissionDialog(
                    context, 
                    title: "Allow access for camera", 
                    onConfirm: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CaptureFlowScreen())),
                  ),
                ),
                _buildActionCard(
                  context,
                  icon: Icons.photo_library,
                  label: 'Upload Image',
                  subtitle: 'From gallery',
                  color: const Color(0xFF1565C0),
                  onTap: () => _showPermissionDialog(
                    context, 
                    title: "Allow access for gallery", 
                    onConfirm: () => Navigator.push(context, MaterialPageRoute(builder: (_) => MultiImagePickerScreen())),
                  ),
                ),
                _buildActionCard(
                  context,
                  icon: Icons.feedback_outlined,
                  label: 'View Feedback',
                  subtitle: 'Read-only',
                  color: const Color(0xFFEF6C00),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ViewFeedbackScreen())),
                ),
                _buildActionCard(
                  context,
                  icon: Icons.analytics_outlined,
                  label: 'View Analysis',
                  subtitle: 'View-only',
                  color: const Color(0xFF7B1FA2),
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => FarmerAnalysisScreen())),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(BuildContext context, {
    required IconData icon,
    required String label,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(height: 12),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            const SizedBox(height: 4),
            Text(subtitle, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
          ],
        ),
      ),
    );
  }

  void _showPermissionDialog(BuildContext context, {required String title, required VoidCallback onConfirm}) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(title),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              onConfirm();
            },
            child: const Text('Yes'),
          ),
        ],
      ),
    );
  }

  void _logout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Provider.of<AuthProvider>(context, listen: false).logout();
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (_) => const LoginOptionsScreen()),
                (route) => false,
              );
            },
            child: const Text('Yes'),
          ),
        ],
      ),
    );
  }
}
