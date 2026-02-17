import 'package:flutter/material.dart';
import '../../core/app_colors.dart';

class DetectionResultScreen extends StatelessWidget {
  final String diseaseName;
  final double confidence;

  const DetectionResultScreen({
    super.key, 
    this.diseaseName = 'Bacterial Leaf Blight',
    this.confidence = 0.94,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CROP ANALYSIS', style: TextStyle(color: Colors.black, fontSize: 18, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              height: 300,
              width: double.infinity,
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage('https://images.unsplash.com/photo-1594751439417-df8aab2a0c11?q=80&w=1000&auto=format&fit=crop'), // Placeholder rice leaf
                  fit: BoxFit.cover,
                ),
              ),
            ),
            Container(
              transform: Matrix4.translationValues(0, -30, 0),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            diseaseName,
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.primary),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${(confidence * 100).toStringAsFixed(1)}%',
                            style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    _buildSection('Symptoms', 'Small, water-soaked streaks that lengthen and turn yellow/tan. Leaves may wilt and dry up.'),
                    const SizedBox(height: 20),
                    _buildSection('Treatment', 'Apply appropriate copper-based fungicides. Ensure proper field drainage and nitrogen management.'),
                    const SizedBox(height: 20),
                    _buildSection('Prevention', 'Use resistant varieties. Maintain clean fields. Avoid excessive irrigation during early growth.'),
                    const SizedBox(height: 40),
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: AppColors.primary,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.message_outlined),
                          SizedBox(width: 10),
                          Text('Consult with Expert'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        const SizedBox(height: 8),
        Text(content, style: TextStyle(color: Colors.grey[700], height: 1.5)),
      ],
    );
  }
}
