import 'dart:io';
import 'package:flutter/material.dart';

import '../../core/app_colors.dart';

class FinalAnalysisResultScreen extends StatelessWidget {
  final Map<String, dynamic> results;

  const FinalAnalysisResultScreen({super.key, required this.results});

  @override
  Widget build(BuildContext context) {
    // results structure from backend:
    // {
    //   'success': true,
    //   'results': [ { 'imagePath': '...', 'probabilities': { 'Rice Blast': 40, ... } }, ... ],
    //   'averages': { 'Average Healthy': ..., 'Average Rice Blast': ..., ... },
    //   'finalAssessment': '...'
    // }
    final List<dynamic> individualResults = results['results'] ?? [];
    final Map<String, dynamic> averages = results['averages'] ?? {};
    final String finalAssessment =
        results['finalAssessment'] ?? 'No assessment available';

    return Scaffold(
      appBar: AppBar(title: const Text('Field Analysis Results')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Field Assessment Summary',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Major Assessment:',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    finalAssessment,
                    style: const TextStyle(
                      fontSize: 18,
                      fontStyle: FontStyle.italic,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            const Text(
              'Average Field Probabilities',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...averages.entries.map(
              (e) => _buildProbabilityCard(
                e.key,
                (e.value as num).toDouble(),
                _getColorForDisease(e.key),
              ),
            ),

            const SizedBox(height: 32),
            const Text(
              'Individual Image Results',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // GRID VIEW for all 5 images
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: individualResults.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
                childAspectRatio: 0.75,
              ),
              itemBuilder: (context, index) {
                final item = individualResults[index];
                final Map<String, dynamic> probs = Map<String, dynamic>.from(
                  item['probabilities'] ?? {},
                );
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 4,
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(12),
                        ),
                        child: (item['imagePath'] as String).startsWith('http')
                            ? Image.network(
                                item['imagePath'],
                                height: 100,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              )
                            : Image.file(
                                File(item['imagePath']),
                                height: 100,
                                width: double.infinity,
                                fit: BoxFit.cover,
                              ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Image ${index + 1}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                            const SizedBox(height: 6),
                            ...probs.entries.map(
                              (e) => Padding(
                                padding: const EdgeInsets.only(bottom: 2),
                                child: Text(
                                  '${e.key}: ${e.value}%',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: _getColorForDisease(e.key),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 40),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                minimumSize: const Size(double.infinity, 50),
              ),
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'RETURN TO DASHBOARD',
                style: TextStyle(color: Colors.white),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Color _getColorForDisease(String label) {
    if (label.contains('Blast')) return Colors.red;
    if (label.contains('Brown')) return Colors.orange;
    if (label.contains('Healthy')) return Colors.green;
    return Colors.blue;
  }

  Widget _buildProbabilityCard(String label, double value, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(
                '${value.toStringAsFixed(1)}%',
                style: TextStyle(fontWeight: FontWeight.bold, color: color),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: value / 100,
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ],
      ),
    );
  }
}
