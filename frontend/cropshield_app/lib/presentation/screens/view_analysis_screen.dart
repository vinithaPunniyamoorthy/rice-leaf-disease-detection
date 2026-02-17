import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../data/auth_provider.dart';
import '../../data/api_service.dart';

class ViewAnalysisScreen extends StatefulWidget {
  const ViewAnalysisScreen({super.key});

  @override
  State<ViewAnalysisScreen> createState() => _ViewAnalysisScreenState();
}

class _ViewAnalysisScreenState extends State<ViewAnalysisScreen> {
  List<dynamic> _detections = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDetections();
  }

  Future<void> _loadDetections() async {
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    if (token == null) {
      setState(() { _loading = false; _error = 'Not authenticated'; });
      return;
    }
    try {
      final result = await ApiService.getDetections(token);
      if (mounted) {
        setState(() {
          _detections = result['detections'] ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _loading = false; _error = e.toString(); });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('View Analysis', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.black), onPressed: () => Navigator.pop(context)),
      ),
      backgroundColor: AppColors.surface,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : _detections.isEmpty
                  ? _buildEmptyState()
                  : _buildDetectionList(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('Failed to load analysis', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () {
                setState(() { _loading = true; _error = null; });
                _loadDetections();
              },
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No analysis results yet', style: TextStyle(color: Colors.grey[600], fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text('Upload a crop image to get started', style: TextStyle(color: Colors.grey[400], fontSize: 14)),
          ],
        ),
      ),
    );
  }

  Widget _buildDetectionList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _detections.length,
      itemBuilder: (context, index) {
        final d = _detections[index];
        final diseaseName = d['DiseaseName'] ?? 'Unknown Disease';
        final summary = d['Summary'] ?? 'No summary available';
        final date = _formatDate(d['DetectionDate']);
        final color = _diseaseColor(diseaseName);

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(Icons.biotech, color: color, size: 24),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(diseaseName, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
                        const SizedBox(height: 2),
                        Text(date, style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      diseaseName.toLowerCase().contains('healthy') ? 'Healthy' : 'Detected',
                      style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              Text(
                'Analysis Summary',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Colors.grey[700]),
              ),
              const SizedBox(height: 6),
              Text(
                summary,
                style: TextStyle(color: Colors.grey[600], fontSize: 13, height: 1.4),
              ),
              if (d['rice_blast_prob'] != null) ...[
                const SizedBox(height: 16),
                const Text('Confidence Levels', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                const SizedBox(height: 10),
                _buildProbBar('Rice Blast', d['rice_blast_prob']?.toDouble() ?? 0, Colors.red),
                const SizedBox(height: 6),
                _buildProbBar('Brown Spot', d['brown_spot_prob']?.toDouble() ?? 0, Colors.orange),
                const SizedBox(height: 6),
                _buildProbBar('Other', d['other_prob']?.toDouble() ?? 0, Colors.blue),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildProbBar(String label, double value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
            Text('${value.toStringAsFixed(1)}%', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: value / 100,
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
      ],
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    try {
      final dt = DateTime.parse(dateStr);
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${dt.day} ${months[dt.month - 1]} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  Color _diseaseColor(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('healthy')) return Colors.green;
    if (lower.contains('blast')) return Colors.orange;
    if (lower.contains('blight')) return Colors.red;
    return Colors.blueGrey;
  }
}
