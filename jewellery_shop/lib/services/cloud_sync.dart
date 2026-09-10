import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

import '../data/cloud_config.dart';
import '../models/product.dart';
import '../models/website.dart';

/// Client for the Laravel shop-sync API (catalog publishing + website intake).
/// Extends the same token/config used by [CloudBackupService].
class CloudSyncService {
  final CloudConfig cfg;

  CloudSyncService(this.cfg);

  bool get configured => cfg.configured;

  Map<String, String> get _headers => {
        'Authorization': 'Bearer ${cfg.apiToken}',
        'X-Shop-Code': cfg.shopCode,
        'Accept': 'application/json',
      };

  Uri _uri(String path) => Uri.parse(cfg.endpoint(path));

  String _error(http.Response res, String fallback) {
    try {
      final data = jsonDecode(res.body);
      return data['message'] ?? fallback;
    } catch (_) {
      return '$fallback (HTTP ${res.statusCode})';
    }
  }

  /// Publishes (or updates) a product on the website. Unpublishes when
  /// [publish] is false. Always sends current stock/status so the website
  /// stays in sync even when a published product is later marked Sold.
  Future<String> publishProduct(Product p, {required bool publish}) async {
    if (!configured) {
      throw Exception('No cloud connection configured');
    }
    final body = jsonEncode({
      'sku': p.sku.isNotEmpty ? p.sku : p.productId,
      'name': p.name,
      'category': p.category.isEmpty ? null : p.category,
      'metal_type': p.metalType.toLowerCase(),
      'purity': p.purity,
      'karat': p.karat,
      'gross_weight': p.grossWeight,
      'net_weight': p.netWeight,
      'stone_weight': p.stoneWeight,
      'making_charges': p.makingCharges,
      'sale_price': p.salePrice,
      'purchase_cost': p.purchaseCost,
      'status': p.status == 'Lost/Damaged' ? 'Damaged' : p.status,
      'stock_qty': p.quantity,
      'description': p.description.isEmpty ? null : p.description,
      'published': publish,
    });
    final res = await http
        .post(
          _uri('/api/shop/products'),
          headers: {..._headers, 'Content-Type': 'application/json'},
          body: body,
        )
        .timeout(const Duration(seconds: 30));
    if (res.statusCode != 200) {
      throw Exception(_error(res, 'Product sync failed'));
    }
    return publish ? 'Published on website' : 'Removed from website';
  }

  /// Uploads local media files for a product to the website.
  /// Returns the number of files uploaded.
  Future<int> pushProductMedia(Product p) async {
    final sku = p.sku.isNotEmpty ? p.sku : p.productId;
    var uploaded = 0;
    final paths = _splitPaths(p.photosPath)..addAll(_splitPaths(p.videoPath));
    for (final path in paths) {
      final f = File(path);
      if (!await f.exists()) continue;
      final req = http.MultipartRequest(
          'POST', _uri('/api/shop/products/$sku/media'));
      req.headers.addAll(_headers);
      req.files.add(await http.MultipartFile.fromPath('file', f.path));
      final streamed = await req.send().timeout(const Duration(seconds: 60));
      final res = await http.Response.fromStream(streamed);
      if (res.statusCode == 201) uploaded++;
    }
    return uploaded;
  }

  Future<List<OnlineOrder>> fetchOrders({String? status}) async {
    final query = status == null || status.isEmpty
        ? ''
        : '?status=${Uri.encodeQueryComponent(status)}';
    final res = await http
        .get(_uri('/api/shop/orders$query'), headers: _headers)
        .timeout(const Duration(seconds: 30));
    if (res.statusCode != 200) {
      throw Exception(_error(res, 'Could not fetch orders'));
    }
    final data = jsonDecode(res.body) as List;
    return data
        .map((e) => OnlineOrder.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> updateOrder(int id,
      {String? status, String? paymentStatus}) async {
    final body = jsonEncode({
      'status': ?status,
      'payment_status': ?paymentStatus,
    });
    final res = await http
        .patch(
          _uri('/api/shop/orders/$id'),
          headers: {..._headers, 'Content-Type': 'application/json'},
          body: body,
        )
        .timeout(const Duration(seconds: 30));
    if (res.statusCode != 200) {
      throw Exception(_error(res, 'Order update failed'));
    }
  }

  Future<List<WebsiteAppointment>> fetchAppointments() async {
    final res = await http
        .get(_uri('/api/shop/appointments'), headers: _headers)
        .timeout(const Duration(seconds: 30));
    if (res.statusCode != 200) {
      throw Exception(_error(res, 'Could not fetch appointments'));
    }
    final data = jsonDecode(res.body) as List;
    return data
        .map((e) => WebsiteAppointment.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> updateAppointment(int id, {String? status}) async {
    final res = await http
        .patch(
          _uri('/api/shop/appointments/$id'),
          headers: {..._headers, 'Content-Type': 'application/json'},
          body: jsonEncode({'status': status}),
        )
        .timeout(const Duration(seconds: 30));
    if (res.statusCode != 200) {
      throw Exception(_error(res, 'Appointment update failed'));
    }
  }

  Future<List<WebsiteCustomRequest>> fetchCustomRequests() async {
    final res = await http
        .get(_uri('/api/shop/custom-requests'), headers: _headers)
        .timeout(const Duration(seconds: 30));
    if (res.statusCode != 200) {
      throw Exception(_error(res, 'Could not fetch custom requests'));
    }
    final data = jsonDecode(res.body) as List;
    return data
        .map((e) => WebsiteCustomRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> updateCustomRequest(int id, {String? status}) async {
    final res = await http
        .patch(
          _uri('/api/shop/custom-requests/$id'),
          headers: {..._headers, 'Content-Type': 'application/json'},
          body: jsonEncode({'status': status}),
        )
        .timeout(const Duration(seconds: 30));
    if (res.statusCode != 200) {
      throw Exception(_error(res, 'Request update failed'));
    }
  }

  List<String> _splitPaths(String raw) => raw
      .split(RegExp(r'[,\n;]'))
      .map((s) => s.trim())
      .where((s) => s.isNotEmpty)
      .toList();
}