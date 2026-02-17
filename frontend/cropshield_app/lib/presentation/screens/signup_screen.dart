import 'package:flutter/material.dart';
import '../../data/api_service.dart';
import '../../core/app_colors.dart';
import 'farmer_dashboard.dart';
import 'expert_dashboard.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({Key? key}) : super(key: key);

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> {
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  final _formKey = GlobalKey<FormState>();

  final _usernameController =
      TextEditingController(); // Renamed from _nameController
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String? selectedRole;
  String? selectedRegion;

  final List<String> userRoles = ['Farmer', 'Field Expert'];

  final List<String> regions = ['Dry Zone', 'Wet Zone', 'Intermediate Zone'];

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

  // Legacy Expert verification dialog removed in favor of link-based flow

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
                validator: (value) =>
                    value!.isEmpty ? 'All field required' : null,
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
                      _isPasswordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
                    ),
                    onPressed: () {
                      setState(() {
                        _isPasswordVisible = !_isPasswordVisible;
                      });
                    },
                  ),
                ),
                validator: (value) => value!.isEmpty
                    ? 'All field required'
                    : (value.length < 6
                          ? 'Password must be at least 6 chars'
                          : null),
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
                validator: (value) =>
                    value == null ? 'All field required' : null,
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
                validator: (value) =>
                    value == null ? 'All field required' : null,
              ),
              const SizedBox(height: 32), // Adjusted SizedBox height

              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _isLoading
                      ? null
                      : () async {
                          if (_formKey.currentState!.validate()) {
                            setState(() => _isLoading = true);
                            try {
                              final result = await ApiService.register({
                                'username': _usernameController.text.trim(),
                                'email': _emailController.text.trim(),
                                'role': selectedRole,
                                'region': selectedRegion,
                                'password': _passwordController.text,
                              });

                              if (mounted) {
                                setState(() => _isLoading = false);
                                if (result['success'] == true) {
                                  if (selectedRole == 'Field Expert') {
                                    // Experts wait for Admin approval
                                    showDialog(
                                      context: context,
                                      barrierDismissible: false,
                                      builder: (context) => AlertDialog(
                                        title: const Text(
                                          'Registration Pending',
                                        ),
                                        content: const Text(
                                          'Your account has been created and is pending admin approval. You will receive an email once an admin reviews and approves your request.',
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(
                                                context,
                                              ); // Close dialog
                                              Navigator.pop(
                                                context,
                                              ); // Go back to login
                                            },
                                            child: const Text('OK'),
                                          ),
                                        ],
                                      ),
                                    );
                                  } else {
                                    // Farmers must verify email via link
                                    showDialog(
                                      context: context,
                                      barrierDismissible: false,
                                      builder: (context) => AlertDialog(
                                        title: const Text('Verify Your Email'),
                                        content: const Text(
                                          'A verification link has been sent to your email. Please click the link to activate your account before logging in.',
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () {
                                              Navigator.pop(
                                                context,
                                              ); // Close dialog
                                              Navigator.pop(
                                                context,
                                              ); // Go back to login
                                            },
                                            child: const Text('OK'),
                                          ),
                                        ],
                                      ),
                                    );
                                  }
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        result['message'] ?? 'Signup failed',
                                      ),
                                      action: SnackBarAction(
                                        label: 'Retry',
                                        onPressed:
                                            () {}, // User can click again
                                      ),
                                    ),
                                  );
                                }
                              }
                            } catch (e) {
                              if (mounted) {
                                setState(() => _isLoading = false);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Connection lost. Please try again.',
                                    ),
                                  ),
                                );
                              }
                            }
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Create Account',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
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
