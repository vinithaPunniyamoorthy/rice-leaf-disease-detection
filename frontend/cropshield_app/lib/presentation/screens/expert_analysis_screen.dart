import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../data/api_service.dart';
import '../../data/auth_provider.dart';
import 'farmer_analysis_screen.dart';

class ExpertAnalysisScreen extends StatefulWidget {
  const ExpertAnalysisScreen({super.key});

  @override
  State<ExpertAnalysisScreen> createState() => _ExpertAnalysisScreenState();
}

class _ExpertAnalysisScreenState extends State<ExpertAnalysisScreen> {
  bool _isLoading = true;
  String _activeTab = 'Farmers';
  List<String> _activeFarmers = [];
  Map<String, dynamic> _regionalSummary = {};
  String? _selectedFarmer;

  @override
  void initState() {
    super.initState();
    _fetchDashboardData();
  }

  Future<void> _fetchDashboardData() async {
    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token;
      final response = await ApiService.getExpertDashboard(token!);
      if (mounted) {
        setState(() {
          _activeFarmers = List<String>.from(response['activeFarmers'] ?? []);
          _regionalSummary = response['regionalSummary'] ?? {};
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('View Analysis'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Column(
              children: [
                _buildToggleButton(),
                Expanded(
                  child: _activeTab == 'Farmers' ? _buildFarmersTab() : _buildExpertTab(),
                ),
              ],
            ),
    );
  }

  Widget _buildToggleButton() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            _buildTabItem('Farmers'),
            _buildTabItem('Field Expert'),
          ],
        ),
      ),
    );
  }

  Widget _buildTabItem(String title) {
    final isActive = _activeTab == title;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _activeTab = title),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isActive ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              color: isActive ? Colors.white : Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFarmersTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Farmer to view analysis', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _selectedFarmer,
            decoration: InputDecoration(
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              hintText: 'Select Username',
            ),
            items: _activeFarmers.map((username) {
              return DropdownMenuItem(value: username, child: Text(username));
            }).toList(),
            onChanged: (val) {
              setState(() => _selectedFarmer = val);
              if (val != null) {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => FarmerAnalysisScreen(targetUsername: val)),
                );
              }
            },
          ),
          const SizedBox(height: 48),
          const Text('YEARLY REGIONAL ANALYSIS', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey)),
          const SizedBox(height: 16),
          _buildSummarySection(_regionalSummary),
        ],
      ),
    );
  }

  Widget _buildExpertTab() {
    // Requirements say "Field Expert (Default focus: Farmers)" and "Regional Yearly Analysis" on the interface.
    // The "Field Expert" option itself doesn't have specific data listed other than the regional summary.
    final user = Provider.of<AuthProvider>(context, listen: false).user;
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.analytics_outlined, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          const Text('Regional Statistical Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text('Region: ${user?['region'] ?? 'Unknown'}', style: const TextStyle(color: Colors.grey)),
        ],
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
          _buildSummaryRow('Total Detections (1 Year)', '${summary['total_detections'] ?? 0}'),
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
        Text(label, style: const TextStyle(fontSize: 15)),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
