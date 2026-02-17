import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../data/api_service.dart';
import '../../data/auth_provider.dart';

class FarmerAnalysisScreen extends StatefulWidget {
  final String? targetUsername; // Used by Expert to view a specific farmer

  const FarmerAnalysisScreen({super.key, this.targetUsername});

  @override
  State<FarmerAnalysisScreen> createState() => _FarmerAnalysisScreenState();
}

class _FarmerAnalysisScreenState extends State<FarmerAnalysisScreen> {
  bool _isLoading = true;
  Map<String, dynamic> _analysisData = {};

  @override
  void initState() {
    super.initState();
    _fetchAnalysis();
  }

  Future<void> _fetchAnalysis() async {
    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token;
      // Note: Backend getFarmerAnalysis could be adapted for Expert to pass a username,
      // but for Interface 8 specifically, it's for the logged-in Farmer.
      // If an expert is viewing, we'd ideally have an API like getFarmerAnalysisByUsername.
      // For now, following strict rules to implement Interface 8 for Farmer.
      final response = await ApiService.getFarmerAnalysis(token!, username: widget.targetUsername);
      if (mounted) {
        setState(() {
          _analysisData = Map<String, dynamic>.from(response);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final username = widget.targetUsername ?? _analysisData['username'] ?? '...';
    final last24h = (_analysisData['last24h'] as List?) ?? [];
    final summary = _analysisData['summary'] ?? {};

    return Scaffold(
      appBar: AppBar(
        title: const Text('View Analysis'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Farmer: $username',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                  const SizedBox(height: 32),
                  
                  // Section 1: Last 24 Hours
                  const Text(
                    'LAST 24 HOURS ANALYSIS',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 16),
                  if (last24h.isEmpty)
                    const Text('No detections in the last 24 hours.')
                  else
                    ...last24h.map((d) => _buildAnalysisCard(d)),

                  const SizedBox(height: 40),

                  // Section 2: Past One Year Summary
                  const Text(
                    'PAST ONE YEAR SUMMARY',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.2),
                  ),
                  const SizedBox(height: 16),
                  _buildSummarySection(summary),
                ],
              ),
            ),
    );
  }

  Widget _buildAnalysisCard(Map<String, dynamic> data) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(
          data['disease_name'] ?? 'Unknown',
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        trailing: Text(
          '${(data['confidence'] ?? 0)}%',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
        ),
        subtitle: Text(_formatTime(data['detected_at'])),
      ),
    );
  }

  Widget _buildSummarySection(Map<String, dynamic> summary) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        children: [
          _buildSummaryRow('Total Detections', '${summary['total_detections'] ?? 0}'),
          const Divider(height: 32),
          _buildSummaryRow('Rice Blast', '${summary['rice_blast_count'] ?? 0}'),
          const SizedBox(height: 12),
          _buildSummaryRow('Brown Spot', '${summary['brown_spot_count'] ?? 0}'),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 16)),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final date = DateTime.parse(dateStr);
      return '${date.hour}:${date.minute.toString().padLeft(2, '0')}'; // Simple time format for 24h
    } catch (e) {
      return dateStr;
    }
  }
}
