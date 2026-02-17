import 'package:flutter/material.dart';
import '../../core/app_colors.dart';

class ExpertStatsScreen extends StatelessWidget {
  const ExpertStatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Expert Analysis', style: TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black), onPressed: () => Navigator.pop(context)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        children: [
          const Center(
            child: Text(
              '2,580',
              style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: AppColors.primary),
            ),
          ),
          const Center(child: Text('Registered Farmers', style: TextStyle(color: Colors.grey))),
          const SizedBox(height: 32),
          _buildMeterSection('Nitrogen', 1240, 240, Colors.blue),
          const SizedBox(height: 20),
          _buildMeterSection('Phosphorus', 820, 154, Colors.orange),
          const SizedBox(height: 20),
          _buildMeterSection('Potassium', 480, 115, Colors.green),
        ],
      ),
    );
  }

  Widget _buildMeterSection(String title, int total, int change, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.analytics, color: color),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(total.toString(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const Text('Total Detections', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('+$change', style: TextStyle(color: color, fontWeight: FontWeight.bold)),
                  const Text('This Month', style: TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
