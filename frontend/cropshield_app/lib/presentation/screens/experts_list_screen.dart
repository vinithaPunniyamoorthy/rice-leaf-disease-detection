import 'package:flutter/material.dart';
import '../../core/app_colors.dart';

class ExpertsListScreen extends StatelessWidget {
  const ExpertsListScreen({super.key});

  static const List<Map<String, String>> _experts = [
    {
      'name': 'Dr. Arun Kumar',
      'specialty': 'Rice Pathology',
      'experience': '15 years',
      'location': 'Tamil Nadu',
    },
    {
      'name': 'Dr. Priya Sharma',
      'specialty': 'Crop Disease Management',
      'experience': '12 years',
      'location': 'Karnataka',
    },
    {
      'name': 'Dr. Rajesh Verma',
      'specialty': 'Plant Biotechnology',
      'experience': '10 years',
      'location': 'Andhra Pradesh',
    },
    {
      'name': 'Dr. Meena Devi',
      'specialty': 'Soil Science & Nutrition',
      'experience': '8 years',
      'location': 'Kerala',
    },
    {
      'name': 'Dr. Suresh Babu',
      'specialty': 'Integrated Pest Management',
      'experience': '20 years',
      'location': 'Telangana',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Available Experts',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'Connect with agronomists for help',
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: ListView.builder(
              itemCount: _experts.length,
              itemBuilder: (context, index) {
                final expert = _experts[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppColors.primary.withOpacity(0.1),
                        child: Text(
                          expert['name']!.split(' ').map((e) => e[0]).take(2).join(),
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(expert['name']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 4),
                            Text(expert['specialty']!, style: TextStyle(color: AppColors.primary, fontSize: 13)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.work_outline, size: 14, color: Colors.grey[500]),
                                const SizedBox(width: 4),
                                Text(expert['experience']!, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                                const SizedBox(width: 12),
                                Icon(Icons.location_on_outlined, size: 14, color: Colors.grey[500]),
                                const SizedBox(width: 4),
                                Text(expert['location']!, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.chat_outlined, color: AppColors.primary),
                        onPressed: () {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Contacting ${expert['name']}...')),
                          );
                        },
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
