import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/api_service.dart';
import '../../data/auth_provider.dart';
import '../../core/app_colors.dart';

class PendingExpertsScreen extends StatefulWidget {
  const PendingExpertsScreen({super.key});

  @override
  State<PendingExpertsScreen> createState() => _PendingExpertsScreenState();
}

class _PendingExpertsScreenState extends State<PendingExpertsScreen> {
  List<dynamic> pendingExperts = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchPendingExperts();
  }

  Future<void> _fetchPendingExperts() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final result = await ApiService.getPendingExperts(authProvider.token!);
    if (result['success'] == true) {
      setState(() {
        pendingExperts = result['experts'];
        isLoading = false;
      });
    } else {
      setState(() => isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to load experts')),
      );
    }
  }

  Future<void> _handleAction(String userId, bool approve) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final result = approve
        ? await ApiService.approveFieldExpert(authProvider.token!, userId)
        : await ApiService.rejectFieldExpert(authProvider.token!, userId);

    if (result['success'] == true) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(result['message'])));
      _fetchPendingExperts(); // Refresh
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Action failed')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Pending Experts',
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
          : pendingExperts.isEmpty
          ? const Center(
              child: Text(
                'No pending approval requests.',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: pendingExperts.length,
              itemBuilder: (context, index) {
                final expert = pendingExperts[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  elevation: 4,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          expert['name'],
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          expert['email'],
                          style: const TextStyle(color: Colors.grey),
                        ),
                        const SizedBox(height: 8),
                        Text('Region: ${expert['region'] ?? 'Not Specified'}'),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: () =>
                                  _handleAction(expert['id'], false),
                              child: const Text(
                                'Reject',
                                style: TextStyle(color: Colors.red),
                              ),
                            ),
                            const SizedBox(width: 12),
                            ElevatedButton(
                              onPressed: () =>
                                  _handleAction(expert['id'], true),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                              ),
                              child: const Text('Approve'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
