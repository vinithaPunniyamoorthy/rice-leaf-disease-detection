import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../data/api_service.dart';
import '../../data/auth_provider.dart';
import 'final_analysis_screen.dart';

class CaptureFlowScreen extends StatefulWidget {
  const CaptureFlowScreen({super.key});

  @override
  State<CaptureFlowScreen> createState() => _CaptureFlowScreenState();
}

class _CaptureFlowScreenState extends State<CaptureFlowScreen> {
  bool _isCaptureEnabled = false;
  int _currentStep = 1;
  final int _maxSteps = 5;
  bool _isAnalyzing = false;

  final List<String> _imagePaths = [];

  final Map<int, String> _stepInstructions = {
    1: "Capture image from the 1st corner of the field",
    2: "Go to the 2nd corner of the field",
    3: "Go to the 3rd corner of the field",
    4: "Go to the 4th corner of the field",
    5: "Go to the centre of the field",
  };

  void _onCaptureToggle(bool value) async {
    setState(() => _isCaptureEnabled = value);
    if (value && _currentStep <= _maxSteps) {
      _captureImage();
    }
  }

  Future<void> _captureImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.camera);

    if (image == null) {
      setState(() => _isCaptureEnabled = false);
      return;
    }

    setState(() {
      _imagePaths.add(image.path);
      _isCaptureEnabled = false;
    });

    if (_currentStep < _maxSteps) {
      _showNextStepDialog();
    } else {
      _showReadyToDetectDialog();
    }
  }

  void _showNextStepDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Image $_currentStep Captured'),
        content: Text(
          _stepInstructions[_currentStep + 1]!,
          style: const TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() => _currentStep++);
            },
            child: const Text('PROCEED'),
          ),
        ],
      ),
    );
  }

  void _showReadyToDetectDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('All 5 Images Captured'),
        content: const Text('Ready to perform field analysis?'),
        actions: [
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _performBatchDetection();
            },
            child: const Text('DETECT'),
          ),
        ],
      ),
    );
  }

  Future<void> _performBatchDetection() async {
    setState(() => _isAnalyzing = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final result = await ApiService.createBatchDetection(
        authProvider.token!,
        _imagePaths,
      );

      if (mounted) {
        if (result['success'] == true) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => FinalAnalysisResultScreen(
                results: result, // Passing the entire result object
              ),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Detection failed')),
          );
          setState(() => _isAnalyzing = false);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isAnalyzing = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Field Coverage Scan')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Capture Image Progress: $_currentStep / $_maxSteps',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 40),
            if (_isAnalyzing)
              Column(
                children: [
                  const CircularProgressIndicator(color: AppColors.primary),
                  const SizedBox(height: 16),
                  Text(
                    'Analyzing Step $_currentStep...',
                    style: const TextStyle(fontStyle: FontStyle.italic),
                  ),
                ],
              )
            else
              Column(
                children: [
                  const Text(
                    'Enable camera to start capture',
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 12),
                  Transform.scale(
                    scale: 1.5,
                    child: Switch(
                      value: _isCaptureEnabled,
                      onChanged: _onCaptureToggle,
                      activeColor: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Capture Image',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
