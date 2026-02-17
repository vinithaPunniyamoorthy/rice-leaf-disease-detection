import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/app_colors.dart';
import '../../data/api_service.dart';
import '../../data/auth_provider.dart';
import 'final_analysis_screen.dart';

class MultiImagePickerScreen extends StatefulWidget {
  const MultiImagePickerScreen({super.key});

  @override
  State<MultiImagePickerScreen> createState() => _MultiImagePickerScreenState();
}

class _MultiImagePickerScreenState extends State<MultiImagePickerScreen> {
  final List<XFile> _selectedImages = [];
  bool _isAnalyzing = false;

  Future<void> _pickImages() async {
    final ImagePicker picker = ImagePicker();
    final List<XFile>? images = await picker.pickMultiImage();

    if (images != null) {
      if (images.length != 5) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Selection Error'),
            content: const Text('Select five rice leaf images'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('OK'),
              ),
            ],
          ),
        );
        return;
      }

      setState(() {
        _selectedImages.clear();
        _selectedImages.addAll(images);
      });
    }
  }

  Future<void> _performDetection() async {
    if (_selectedImages.length != 5) return;

    setState(() => _isAnalyzing = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final paths = _selectedImages.map((e) => e.path).toList();
      final result = await ApiService.createBatchDetection(authProvider.token!, paths);

      if (mounted) {
        if (result['success'] == true) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => FinalAnalysisResultScreen(
                results: result,
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gallery Selection'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Text(
              'Select 5 rice leaf images for analysis',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            Expanded(
              child: _selectedImages.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.photo_library, size: 60, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          const Text('No images selected'),
                        ],
                      ),
                    )
                  : GridView.builder(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 10,
                        mainAxisSpacing: 10,
                      ),
                      itemCount: _selectedImages.length,
                      itemBuilder: (context, index) {
                        return Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            image: DecorationImage(
                              image: FileImage(File(_selectedImages[index].path)),
                              fit: BoxFit.cover,
                            ),
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 20),
            if (_isAnalyzing)
              const CircularProgressIndicator(color: AppColors.primary)
            else ...[
              ElevatedButton.icon(
                onPressed: _pickImages,
                icon: const Icon(Icons.add_photo_alternate),
                label: const Text('SELECT IMAGES'),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                ),
              ),
              const SizedBox(height: 12),
              if (_selectedImages.length == 5)
                ElevatedButton(
                  onPressed: _performDetection,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size(double.infinity, 50),
                  ),
                  child: const Text('DETECT', style: TextStyle(color: Colors.white)),
                ),
            ],
          ],
        ),
      ),
    );
  }
}
