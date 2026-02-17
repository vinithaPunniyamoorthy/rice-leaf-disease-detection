import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // CONNECTION SETTINGS FOR GALAXY A12:
  // Option A (Recommended): Replace '127.0.0.1' with your Computer's Real IP (e.g. 192.168.1.5)
  // Option B: Keep '127.0.0.1' and run 'adb reverse tcp:5000 tcp:5000' in your terminal.
  static const String backendIp = '127.0.0.1';

  static String get baseUrl {
    return 'http://$backendIp:5000/api';
  }

  // Auth APIs
  static Future<Map<String, dynamic>> login(
    String email,
    String password,
  ) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email, 'password': password}),
          )
          .timeout(const Duration(seconds: 10));

      return Map<String, dynamic>.from(jsonDecode(response.body));
    } catch (e) {
      return {
        'success': false,
        'message': 'Network Error: Please check your internet connection.',
      };
    }
  }

  static Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/forgot-password'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email}),
          )
          .timeout(const Duration(seconds: 10));
      return Map<String, dynamic>.from(jsonDecode(response.body));
    } catch (e) {
      return {'success': false, 'message': 'Network Error: Try again later.'};
    }
  }

  static Future<Map<String, dynamic>> register(
    Map<String, dynamic> userData,
  ) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/auth/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(userData),
          )
          .timeout(const Duration(seconds: 15));

      final dynamic decodedBody = jsonDecode(response.body);
      final Map<String, dynamic> body = decodedBody is Map
          ? Map<String, dynamic>.from(decodedBody)
          : {'message': response.body};

      if (response.statusCode == 201) {
        return {'success': true, 'message': body['message']};
      } else {
        return {
          'success': false,
          'message':
              body['message'] ?? 'Registration failed. Please try again.',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Connection error: Please check your data connection.',
      };
    }
  }

  static Future<Map<String, dynamic>> verifyEmail(String email) async {
    // This method is now legacy for the link flow
    return {
      'success': false,
      'message': 'Please use the link sent to your email',
    };
  }

  // User Profile API
  static Future<Map<String, dynamic>> getUserProfile(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/profile'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return Map<String, dynamic>.from(jsonDecode(response.body));
    }
    throw Exception('Failed to load profile');
  }

  static Future<Map<String, dynamic>> getAdmins(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/admins'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return Map<String, dynamic>.from(jsonDecode(response.body));
    }
    throw Exception('Failed to load admins');
  }

  static Future<Map<String, dynamic>> getPendingExperts(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/pending-experts'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return Map<String, dynamic>.from(jsonDecode(response.body));
  }

  static Future<Map<String, dynamic>> approveFieldExpert(
    String token,
    String userId,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/approve-field-expert'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'userId': userId}),
    );
    return Map<String, dynamic>.from(jsonDecode(response.body));
  }

  static Future<Map<String, dynamic>> rejectFieldExpert(
    String token,
    String userId,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/reject-field-expert'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'userId': userId}),
    );
    return Map<String, dynamic>.from(jsonDecode(response.body));
  }

  // Detection APIs
  static Future<Map<String, dynamic>> getDetections(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/detections'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return Map<String, dynamic>.from(jsonDecode(response.body));
    }
    throw Exception('Failed to load detections');
  }

  static Future<Map<String, dynamic>> createBatchDetection(
    String token,
    List<String> imagePaths,
  ) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/detections/batch'),
    );
    request.headers['Authorization'] = 'Bearer $token';
    for (String path in imagePaths) {
      request.files.add(await http.MultipartFile.fromPath('images', path));
    }
    var res = await request.send();
    var responseData = await res.stream.bytesToString();
    return Map<String, dynamic>.from(jsonDecode(responseData));
  }

  static Future<Map<String, dynamic>> submitFeedback(
    String token,
    String recipient,
    String message,
  ) async {
    final response = await http.post(
      Uri.parse('$baseUrl/detections/feedback'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'recipient': recipient, 'message': message}),
    );
    return Map<String, dynamic>.from(jsonDecode(response.body));
  }

  static Future<Map<String, dynamic>> getFarmerFeedback(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/detections/feedback'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return Map<String, dynamic>.from(jsonDecode(response.body));
  }

  static Future<Map<String, dynamic>> getFarmerAnalysis(
    String token, {
    String? username,
  }) async {
    final url = username != null
        ? '$baseUrl/detections/analysis?username=$username'
        : '$baseUrl/detections/analysis';
    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer $token'},
    );
    return Map<String, dynamic>.from(jsonDecode(response.body));
  }

  static Future<Map<String, dynamic>> getExpertDashboard(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/detections/expert/dashboard'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return Map<String, dynamic>.from(jsonDecode(response.body));
  }
}
