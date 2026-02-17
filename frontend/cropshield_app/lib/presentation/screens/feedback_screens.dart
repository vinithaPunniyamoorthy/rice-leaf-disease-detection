import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../data/auth_provider.dart';
import '../../data/api_service.dart';

class ViewFeedbackScreen extends StatefulWidget {
  const ViewFeedbackScreen({super.key});

  @override
  State<ViewFeedbackScreen> createState() => _ViewFeedbackScreenState();
}

class _ViewFeedbackScreenState extends State<ViewFeedbackScreen> {
  List<dynamic> _feedbackList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchFeedback();
  }

  Future<void> _fetchFeedback() async {
    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token;
      final response = await ApiService.getFarmerFeedback(token!); // I'll need to add this to ApiService
      if (mounted && response['success'] == true) {
        setState(() {
          _feedbackList = response['feedback'] ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Expert Feedback')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _feedbackList.isEmpty 
          ? const Center(child: Text('No feedback received yet.'))
          : ListView.builder(
              itemCount: _feedbackList.length,
              itemBuilder: (context, index) {
                final f = _feedbackList[index];
                return Card(
                  margin: const EdgeInsets.all(12),
                  child: ListTile(
                    leading: const Icon(Icons.psychology, color: AppColors.primary),
                    title: Text('Expert: ${f['expert_name']}'),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(f['feedback_text'] ?? ''),
                        const SizedBox(height: 4),
                        Text('Date: ${f['created_at']}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class SubmitFeedbackScreen extends StatefulWidget {
  final String? imageId;
  final String? farmerId;

  const SubmitFeedbackScreen({super.key, this.imageId, this.farmerId});

  @override
  State<SubmitFeedbackScreen> createState() => _SubmitFeedbackScreenState();
}

class _SubmitFeedbackScreenState extends State<SubmitFeedbackScreen> {
  final _feedbackController = TextEditingController();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _feedbackController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final text = _feedbackController.text.trim();
    if (text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter feedback')));
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final token = Provider.of<AuthProvider>(context, listen: false).token;
      // In a real app, we'd have selected a farmer/image. For this demo, we'll use props or mock.
      final result = await ApiService.submitFeedback(
        token!, 
        widget.farmerId ?? 'mock-farmer-id', 
        text
      );

      if (mounted) {
        setState(() => _isSubmitting = false);
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Feedback submitted!')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Submit Feedback')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text('Provide your expert advice:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            TextField(
              controller: _feedbackController,
              maxLines: 5,
              decoration: const InputDecoration(border: OutlineInputBorder(), hintText: 'Enter feedback...'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting ? const CircularProgressIndicator() : const Text('SUBMIT'),
            ),
          ],
        ),
      ),
    );
  }
}

// Keep the old screen for potential use but renamed or kept as is if not used
class FieldEvaluationScreen extends StatelessWidget {
  const FieldEvaluationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Field Evaluation')),
      body: const Center(child: Text('Read-only Field Evaluation')),
    );
  }
}

