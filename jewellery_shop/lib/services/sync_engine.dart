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

    // ---- Push POS business data (watermark-based delta) ----
    final bizCounts = <String, int>{};
    try {
      bizCounts.addAll(await _pushBusinessData(sync));
    } catch (e) {
      problems.add('business: $e');
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
      if (bizCounts.isNotEmpty)
        'POS: ${bizCounts.entries.map((e) => '${e.key}=${e.value}').join(', ')}',
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

  // ---- POS business data watermark push ----

  static const _kBizWm = 'sync_biz_wm_';
  static const _bizSyncOrder = [
    'customers', 'gold_rates', 'sales', 'purchases', 'payments',
    'ledger_entries', 'expenses', 'repairs', 'exchanges', 'inventory_moves',
  ];

  /// Maps local camelCase columns to the server's snake_case payload keys.
  static const Map<String, Map<String, String>> _bizMaps = {
    'customers': {
      'customerId': 'customer_id', 'name': 'name', 'fatherName': 'father_name',
      'cnic': 'cnic', 'mobile': 'mobile', 'whatsapp': 'whatsapp',
      'address': 'address', 'city': 'city', 'email': 'email', 'notes': 'notes',
      'totalAmount': 'total_amount', 'paidAmount': 'paid_amount',
      'registeredDate': 'registered_date',
    },
    'gold_rates': {
      'date': 'rate_date', 'rate24k': 'rate24k', 'rate22k': 'rate22k',
      'rate21k': 'rate21k', 'rate20k': 'rate20k', 'rate18k': 'rate18k',
      'silverRate': 'silver_rate',
    },
    'sales': {
      'invoiceId': 'invoice_id', 'customerId': 'customer_id',
      'customerName': 'customer_name', 'saleDate': 'sale_date',
      'subtotal': 'subtotal', 'totalDiscount': 'total_discount', 'tax': 'tax',
      'total': 'total', 'paid': 'paid', 'remaining': 'remaining',
      'paymentMethod': 'payment_method', 'notes': 'notes',
    },
    'sale_items': {
      'productId': 'product_id', 'productName': 'product_name',
      'grossWeight': 'gross_weight', 'netWeight': 'net_weight',
      'purity': 'purity', 'karat': 'karat', 'goldRate': 'gold_rate',
      'metalValue': 'metal_value', 'makingCharges': 'making_charges',
      'stoneCharges': 'stone_charges', 'discount': 'discount',
      'lineTotal': 'line_total', 'quantity': 'quantity',
    },
    'purchases': {
      'purchaseId': 'purchase_id', 'supplierId': 'supplier_id',
      'supplierName': 'supplier_name', 'productId': 'product_id',
      'productName': 'product_name', 'purchaseDate': 'purchase_date',
      'grossWeight': 'gross_weight', 'netWeight': 'net_weight',
      'purity': 'purity', 'karat': 'karat', 'rate': 'rate',
      'makingCharges': 'making_charges', 'totalCost': 'total_cost',
      'paid': 'paid', 'remaining': 'remaining',
      'paymentMethod': 'payment_method', 'notes': 'notes',
    },
    'payments': {
      'paymentId': 'payment_id', 'customerId': 'customer_id',
      'customerName': 'customer_name', 'date': 'payment_date',
      'amount': 'amount', 'method': 'method', 'type': 'type',
      'reference': 'reference', 'notes': 'notes',
    },
    'ledger_entries': {
      'customerId': 'customer_id', 'customerName': 'customer_name',
      'date': 'entry_date', 'description': 'description', 'debit': 'debit',
      'credit': 'credit', 'balance': 'balance', 'source': 'source',
      'referenceId': 'reference_id',
    },
    'expenses': {
      'expenseId': 'expense_id', 'date': 'expense_date', 'category': 'category',
      'description': 'description', 'amount': 'amount',
      'paymentMethod': 'payment_method', 'notes': 'notes',
    },
    'repairs': {
      'repairId': 'repair_id', 'customerId': 'customer_id',
      'customerName': 'customer_name', 'productId': 'product_id',
      'productName': 'product_name', 'problem': 'problem',
      'receivedDate': 'received_date', 'expectedDate': 'expected_date',
      'estimatedCharges': 'estimated_charges', 'finalCharges': 'final_charges',
      'employee': 'employee', 'notes': 'notes', 'status': 'status',
    },
    'exchanges': {
      'exchangeId': 'exchange_id', 'customerId': 'customer_id',
      'customerName': 'customer_name', 'date': 'exchange_date',
      'oldTotalValue': 'old_total_value', 'newTotalValue': 'new_total_value',
      'makingCharges': 'making_charges', 'stoneCharges': 'stone_charges',
      'discount': 'discount', 'netAmount': 'net_amount',
      'cashReceived': 'cash_received', 'amountDue': 'amount_due',
      'paymentMethod': 'payment_method', 'notes': 'notes',
    },
    'exchange_items': {
      'direction': 'direction', 'metalType': 'metal_type',
      'productId': 'product_id', 'productName': 'product_name',
      'grossWeight': 'gross_weight', 'netWeight': 'net_weight',
      'purity': 'purity', 'karat': 'karat', 'rate': 'rate',
      'metalValue': 'metal_value', 'makingCharges': 'making_charges',
      'stoneCharges': 'stone_charges', 'lineTotal': 'line_total',
    },
    'inventory_moves': {
      'productId': 'product_id', 'productName': 'product_name',
      'date': 'move_date', 'type': 'type', 'metalType': 'metal_type',
      'weight': 'weight', 'quantity': 'quantity', 'notes': 'notes',
    },
  };

  Map<String, dynamic> _bizRow(Map<String, dynamic> src, Map<String, String> map) {
    final out = <String, dynamic>{};
    for (final e in map.entries) {
      final v = src[e.key];
      if (v != null) out[e.value] = v;
    }
    out['ext_id'] = src['id'];
    return out;
  }

  /// Pushes rows with local id > per-table watermark to the server. Watermarks
  /// advance only after a successful push, so partial failures replay cleanly.
  /// Returns a map of table -> rows pushed.
  Future<Map<String, int>> _pushBusinessData(CloudSyncService sync) async {
    final sp = await SharedPreferences.getInstance();
    final db = await DatabaseHelper.instance.database;
    final payload = <String, dynamic>{};
    final advanced = <String, int>{};

    for (final table in _bizSyncOrder) {
      final wm = sp.getInt('$_kBizWm$table') ?? 0;
      final map = _bizMaps[table]!;
      final rows = await db.query(table,
          where: 'id > ?',
          whereArgs: [wm],
          orderBy: 'id ASC',
          limit: 500);
      if (rows.isEmpty) continue;
      final mapped = rows.map((r) => _bizRow(r, map)).toList();
      if (table == 'sales' || table == 'exchanges') {
        final itemTable = table == 'sales' ? 'sale_items' : 'exchange_items';
        final fk = table == 'sales' ? 'saleId' : 'exchangeId';
        final itemMap = _bizMaps[itemTable]!;
        for (var i = 0; i < mapped.length; i++) {
          final items = await db.query(itemTable,
              where: '$fk = ?', whereArgs: [mapped[i]['ext_id']], orderBy: 'id ASC');
          mapped[i]['items'] = items.map((r) => _bizRow(r, itemMap)).toList();
        }
      }
      payload[table] = mapped;
      advanced[table] = mapped.fold<int>(0, (m, r) {
        final id = r['ext_id'] as int;
        return id > m ? id : m;
      });
    }

    if (payload.isEmpty) return {};
    await sync.pushBusinessData(payload);
    for (final e in advanced.entries) {
      await sp.setInt('$_kBizWm${e.key}', e.value);
    }
    return advanced.map((k, v) => MapEntry(k, payload[k].length));
  }

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