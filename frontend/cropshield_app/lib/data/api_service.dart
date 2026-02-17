import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/foundation.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:5000/api'; // For Chrome/Web
    }
    return 'http://192.168.76.16:5000/api'; // For Mobile (Physical Device)
  }

  // Auth APIs
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    // Return decoded body regardless of status, handle logic in UI
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/forgot-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email}),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> register(Map<String, dynamic> userData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(userData),
      );
      
      final body = jsonDecode(response.body);

      if (response.statusCode == 201) {
         return {'success': true, 'message': body['message']};
      } else if (response.statusCode == 200 && body['status'] == 'VERIFICATION_LINK_SENT') {
         return {
           'success': false, 
           'status': 'VERIFICATION_LINK_SENT',
           'message': body['message']
         };
      } else {
         return {'success': false, 'message': body['message'] ?? 'Registration failed'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Connection error: $e'};
    }
  }

  static Future<Map<String, dynamic>> verifyEmail(String email, String otp) async {
    // This method is now largely unused for the link flow but kept for compatibility
    return {'success': false, 'message': 'Please use the link sent to your email'};
  }

  // User Profile API
  static Future<Map<String, dynamic>> getUserProfile(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/profile'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load profile');
  }

  static Future<Map<String, dynamic>> getAdmins(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/admins'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load admins');
  }

  // Detection APIs
  static Future<Map<String, dynamic>> getDetections(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/detections'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    }
    throw Exception('Failed to load detections');
  }

  static Future<Map<String, dynamic>> createBatchDetection(String token, List<String> imagePaths) async {
    var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/detections/batch'));
    request.headers['Authorization'] = 'Bearer $token';
    for (String path in imagePaths) {
      request.files.add(await http.MultipartFile.fromPath('images', path));
    }
    var res = await request.send();
    var responseData = await res.stream.bytesToString();
    return jsonDecode(responseData);
  }

  static Future<Map<String, dynamic>> submitFeedback(String token, String recipient, String message) async {
    final response = await http.post(
      Uri.parse('$baseUrl/detections/feedback'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token'
      },
      body: jsonEncode({
        'recipient': recipient,
        'message': message
      }),
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getFarmerFeedback(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/detections/feedback'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getFarmerAnalysis(String token, {String? username}) async {
    final url = username != null 
      ? '$baseUrl/detections/analysis?username=$username'
      : '$baseUrl/detections/analysis';
    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }

  static Future<Map<String, dynamic>> getExpertDashboard(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/detections/expert/dashboard'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }
}
