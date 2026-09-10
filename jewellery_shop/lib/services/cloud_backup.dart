import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

import '../data/cloud_config.dart';

/// Client for the Laravel backup/sync API.
///
/// Messages are human-friendly and safe to show in the UI.
class CloudBackupService {
  final CloudConfig cfg;

  CloudBackupService(this.cfg);

  Map<String, String> get _headers => {
        'Authorization': 'Bearer ${cfg.apiToken}',
        'X-Shop-Code': cfg.shopCode,
        'Accept': 'application/json',
      };

  Uri _uri(String path) => Uri.parse(cfg.endpoint(path));

  /// Tests connectivity + token validity. Returns a friendly message.
  Future<String> ping() async {
    final res = await http
        .get(_uri('/api/ping'), headers: _headers)
        .timeout(const Duration(seconds: 15));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return 'OK — ${data['shop'] ?? 'server'} (${data['version'] ?? '?'})';
    }
    throw Exception('Connection failed (HTTP ${res.statusCode})');
  }

  /// Authenticates a shop with password and stores the returned token.
  Future<String> login(String password) async {
    final res = await http
        .post(
          _uri('/api/auth/login'),
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          body: jsonEncode({'shop_code': cfg.shopCode, 'password': password}),
        )
        .timeout(const Duration(seconds: 20));
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      cfg.apiToken = data['token'] ?? '';
      cfg.shopCode = (cfg.shopCode.isEmpty)
          ? (data['shop']?['shop_code'] ?? '')
          : cfg.shopCode;
      await cfg.save();
      return 'Logged in — ${(data['shop']?['name'] ?? 'shop')}';
    }
    try {
      final data = jsonDecode(res.body);
      throw Exception(data['message'] ?? 'Login failed');
    } catch (e) {
      if (e is Exception && e.toString().contains('Login')) rethrow;
      throw Exception('Login failed (HTTP ${res.statusCode})');
    }
  }

  /// Uploads the database backup file to the cloud.
  Future<String> pushBackup(File src) async {
    final req = http.MultipartRequest('POST', _uri('/api/backup/push'));
    req.headers.addAll(_headers);
    req.files.add(await http.MultipartFile.fromPath('backup', src.path));
    final streamed = await req.send().timeout(const Duration(seconds: 120));
    final res = await http.Response.fromStream(streamed);
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return 'Uploaded ${data['size'] ?? src.lengthSync()} bytes • v${data['version'] ?? '?'}';
    }
    throw Exception('Upload failed (HTTP ${res.statusCode})');
  }

  /// Downloads the latest cloud backup into [destPath]. Returns file size.
  Future<int> fetchLatest(String destPath) async {
    final res = await http
        .get(_uri('/api/backup/latest'), headers: _headers)
        .timeout(const Duration(seconds: 120));
    if (res.statusCode == 200) {
      final f = File(destPath);
      await f.parent.create(recursive: true);
      await f.writeAsBytes(res.bodyBytes, flush: true);
      return res.bodyBytes.length;
    }
    if (res.statusCode == 404) {
      throw Exception('No cloud backup available yet');
    }
    throw Exception('Download failed (HTTP ${res.statusCode})');
  }
}