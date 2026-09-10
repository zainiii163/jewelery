import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/cloud_config.dart';
import '../data/database_helper.dart';
import '../models/product.dart';
import '../models/website.dart';
import 'cloud_sync.dart';

/// Automatic, offline-first sync between the local database and the website.
///
/// Publishes products that changed locally (dirty SKUs), uploads their media
/// only when the files actually changed (avoids duplicate uploads), and caches
/// the latest orders / appointments / custom requests so the Website screen
/// works even when the server is unreachable.
class SyncEngine extends ChangeNotifier {
  static final SyncEngine instance = SyncEngine._();

  static const _kDirtySkus = 'sync_dirty_skus';
  static const _kMediaFp = 'sync_media_fp';
  static const _kCacheOrders = 'sync_cache_orders';
  static const _kCacheAppointments = 'sync_cache_appointments';
  static const _kCacheRequests = 'sync_cache_requests';

  bool _isSyncing = false;
  DateTime? _lastSyncAt;
  String? _lastError;
  int _pendingCount = 0;
  Timer? _timer;

  SyncEngine._();

  bool get isSyncing => _isSyncing;
  DateTime? get lastSyncAt => _lastSyncAt;
  String? get lastError => _lastError;
  int get pendingCount => _pendingCount;

  /// Marks [sku] as needing a website re-sync on the next automatic sync.
  Future<void> markDirty(String sku) async {
    final sp = await SharedPreferences.getInstance();
    final list = sp.getStringList(_kDirtySkus) ?? <String>[];
    if (!list.contains(sku)) {
      list.add(sku);
      await sp.setStringList(_kDirtySkus, list);
      _pendingCount = list.length;
      notifyListeners();
    }
  }

  Future<List<String>> _dirtySkus() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getStringList(_kDirtySkus) ?? <String>[];
  }

  /// Starts a background timer (every 5 minutes) plus an initial sync shortly
  /// after app start, only when a cloud server is configured.
  void startAutoTimer() {
    _timer?.cancel();
    final cfg = CloudConfig.instance;
    if (!cfg.configured) return;
    Timer(const Duration(seconds: 8), () {
      unawaited(fullSync());
    });
    _timer = Timer.periodic(const Duration(minutes: 5), (_) {
      unawaited(fullSync());
    });
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Runs one full sync: push dirty products/media, then pull website
  /// activity into the offline cache. Returns a short human summary.
  Future<String> fullSync() async {
    if (_isSyncing) return 'Syncing already in progress';
    final cfg = CloudConfig.instance;
    if (!cfg.configured) {
      _lastError = 'Not configured';
      notifyListeners();
      return 'Not configured';
    }

    _isSyncing = true;
    _lastError = null;
    notifyListeners();

    final sync = CloudSyncService(cfg);
    final pushed = <String>[];
    final problems = <String>[];

    // ---- Push dirty products ----
    final dirty = List.of(await _dirtySkus());
    for (final sku in dirty) {
      try {
        final product = await DatabaseHelper.instance.getProductBySku(sku);
        if (product == null) {
          await markClean(sku);
          continue;
        }
        await sync.publishProduct(product, publish: product.published);
        if (product.published) {
          final uploaded = await _pushMediaIfChanged(sync, product);
          pushed.add('$sku${uploaded > 0 ? ' (+$uploaded media)' : ''}');
        } else {
          pushed.add('$sku (unpublished)');
        }
        await markClean(sku);
      } catch (e) {
        problems.add('$sku: $e');
        break; // server likely offline; keep the rest dirty for next run
      }
    }

    // ---- Pull website activity into the offline cache ----
    final pullErrors = <String>[];
    final sp = await SharedPreferences.getInstance();
    try {
      final orders = await sync.fetchOrders();
      await sp.setString(_kCacheOrders, jsonEncode(orders));
    } catch (e) {
      pullErrors.add('orders: $e');
    }
    try {
      final apts = await sync.fetchAppointments();
      await sp.setString(_kCacheAppointments, jsonEncode(apts));
    } catch (e) {
      pullErrors.add('appointments: $e');
    }
    try {
      final reqs = await sync.fetchCustomRequests();
      await sp.setString(_kCacheRequests, jsonEncode(reqs));
    } catch (e) {
      pullErrors.add('requests: $e');
    }

    _lastSyncAt = DateTime.now();
    _lastError = problems.isNotEmpty || pullErrors.isNotEmpty
        ? [...problems, ...pullErrors].join('; ')
        : null;
    _isSyncing = false;

    final n = await _dirtySkus();
    _pendingCount = n.length;
    notifyListeners();

    final parts = <String>[
      if (pushed.isNotEmpty) 'Pushed ${pushed.length} product(s)',
      if (_lastError == null) 'Website activity updated',
    ];
    return parts.join(' · ');
  }

  Future<void> markClean(String sku) async {
    final sp = await SharedPreferences.getInstance();
    final list = List.of(sp.getStringList(_kDirtySkus) ?? <String>[])
      ..removeWhere((s) => s == sku);
    await sp.setStringList(_kDirtySkus, list);
    _pendingCount = list.length;
    notifyListeners();
  }

  /// Uploads media only when the file set or file contents changed compared
  /// with the last successful upload for [sku]. Returns the number uploaded.
  Future<int> _pushMediaIfChanged(CloudSyncService sync, Product p) async {
    final sku = p.sku.isNotEmpty ? p.sku : p.productId;
    final fp = _mediaFingerprint(p);
    final sp = await SharedPreferences.getInstance();
    final map = jsonDecode(sp.getString(_kMediaFp) ?? '{}');
    if (map is Map && map[sku] == fp) return 0;

    final uploaded = await sync.pushProductMedia(p);
    map[sku] = fp;
    await sp.setString(_kMediaFp, jsonEncode(map));
    return uploaded;
  }

  String _mediaFingerprint(Product p) {
    final files = <String>[];
    files.addAll(_splitPaths(p.photosPath));
    files.addAll(_splitPaths(p.videoPath));
    final parts = files.map((path) {
      final f = File(path);
      try {
        final stat = f.statSync();
        return '${f.path}|${stat.size}|${stat.modified.millisecondsSinceEpoch}';
      } catch (_) {
        return '$path|missing';
      }
    }).toList()
      ..sort();
    return parts.join(',');
  }

  List<String> _splitPaths(String raw) => raw
      .split(RegExp(r'[,\n;]'))
      .map((s) => s.trim())
      .where((s) => s.isNotEmpty)
      .toList();

  // ---- Offline caches for the Website screen ----

  Future<List<OnlineOrder>> cachedOrders() async {
    final sp = await SharedPreferences.getInstance();
    final raw = sp.getString(_kCacheOrders);
    if (raw == null || raw.isEmpty) return <OnlineOrder>[];
    try {
      return (jsonDecode(raw) as List)
          .map((e) => OnlineOrder.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return <OnlineOrder>[];
    }
  }

  Future<List<WebsiteAppointment>> cachedAppointments() async {
    final sp = await SharedPreferences.getInstance();
    final raw = sp.getString(_kCacheAppointments);
    if (raw == null || raw.isEmpty) return <WebsiteAppointment>[];
    try {
      return (jsonDecode(raw) as List)
          .map((e) => WebsiteAppointment.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return <WebsiteAppointment>[];
    }
  }

  Future<List<WebsiteCustomRequest>> cachedCustomRequests() async {
    final sp = await SharedPreferences.getInstance();
    final raw = sp.getString(_kCacheRequests);
    if (raw == null || raw.isEmpty) return <WebsiteCustomRequest>[];
    try {
      return (jsonDecode(raw) as List)
          .map((e) => WebsiteCustomRequest.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return <WebsiteCustomRequest>[];
    }
  }
}