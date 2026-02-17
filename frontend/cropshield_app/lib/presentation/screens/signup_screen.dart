import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../data/api_service.dart';
import '../../data/auth_provider.dart';
import '../../core/app_colors.dart';
import 'farmer_dashboard.dart';
import 'expert_dashboard.dart';
import 'email_verification_screen.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({Key? key}) : super(key: key);

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  bool _isPasswordVisible = false;
  final _formKey = GlobalKey<FormState>();
  
  final _usernameController = TextEditingController(); // Renamed from _nameController
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String? selectedRole;
  String? selectedRegion;

  final List<String> userRoles = [
    'Farmer',
    'Field Expert',
  ];

  final List<String> regions = [
    'Dry Zone',
    'Wet Zone',
    'Intermediate Zone',
  ];

  void _navigateToHome(String role) {
    Widget dashboard;
    if (role == 'Field Expert') {
      dashboard = ExpertDashboard();
    } else {
      dashboard = FarmerDashboard();
    }
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => dashboard),
      (route) => false,
    );
  }

  void _showExpertVerificationDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Registration Pending'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Your account has been created.'),
            SizedBox(height: 8),
            Text('Admin must approve Field Expert before you can log in.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Go back to login
            },
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center, // Changed alignment
            children: [
              // Removed the CropShield logo and text
              Text(
                'User Registration', // Updated heading
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 32),
              
              TextFormField(
                controller: _usernameController, // Changed controller
                decoration: const InputDecoration(
                  hintText: 'Username', // Updated hint
                  prefixIcon: Icon(Icons.person_outline),
                  helperText: 'Username must be unique', // Added helper text
                ),
                validator: (value) => value!.isEmpty ? 'All field required' : null,
              ),
              const SizedBox(height: 16),
              
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(
                  hintText: 'Email', // Updated hint
                  prefixIcon: Icon(Icons.email_outlined),
                  helperText: 'Email must be unique', // Added helper text
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'All field required';
                  }
                  final emailRegex = RegExp(r'^[^@]+@[^@]+\.[^@]+');
                  if (!emailRegex.hasMatch(value)) {
                    return 'Enter a valid email address';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),

              TextFormField(
                controller: _passwordController,
                obscureText: !_isPasswordVisible,
                decoration: InputDecoration(
                  hintText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                    ),
                    onPressed: () {
                      setState(() {
                        _isPasswordVisible = !_isPasswordVisible;
                      });
                    },
                  ),
                ),
                validator: (value) => value!.isEmpty ? 'All field required' : (value.length < 6 ? 'Password must be at least 6 chars' : null),
              ),
              const SizedBox(height: 16), // Moved password field up

              // USER ROLE DROPDOWN
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  hintText: 'User Role',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
                value: selectedRole,
                items: userRoles
                    .map(
                      (role) => DropdownMenuItem<String>(
                        value: role,
                        child: Text(role),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  setState(() {
                    selectedRole = value;
                  });
                },
                validator: (value) => value == null ? 'All field required' : null,
              ),
              const SizedBox(height: 16),

              // REGION DROPDOWN
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(
                  hintText: 'Region',
                  prefixIcon: Icon(Icons.map_outlined),
                ),
                value: selectedRegion,
                items: regions
                    .map(
                      (region) => DropdownMenuItem<String>(
                        value: region,
                        child: Text(region),
                      ),
                    )
                    .toList(),
                onChanged: (value) {
                  setState(() {
                    selectedRegion = value;
                  });
                },
                validator: (value) => value == null ? 'All field required' : null,
              ),
              const SizedBox(height: 32), // Adjusted SizedBox height
              
              ElevatedButton(
                onPressed: () async {
                  if (_formKey.currentState!.validate()) {
                    try {
                      final result = await ApiService.register({
                        'username': _usernameController.text, // Changed key and controller
                        'email': _emailController.text,
                        // 'phone': _phoneController.text, // Removed as per new design if not needed, or add back if schema requires
                        'role': selectedRole,
                        'region': selectedRegion,
                        'password': _passwordController.text,
                      });

                      if (mounted) {
                        if (result['success'] == true) {
                          if (selectedRole == 'Field Expert') {
                            _showExpertVerificationDialog(); // New dialog for experts
                          } else {
                             _navigateToHome('Farmer'); // Farmers navigate directly
                          }
                        } else {
                          String message = result['message'] ?? 'Signup failed';
                          if (message == 'Username already exists' || message == 'Email already exists') {
                            // Message is already specific enough
                          }
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text(message)),
                          );
                        }
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Error: $e')),
                        );
                      }
                    }
                  }
                },
                child: const Text('Create Account'),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Already have an account? "),
                  GestureDetector(
                    onTap: () {
                      Navigator.pop(context);
                    },
                    child: Text(
                      'Login',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }
}
