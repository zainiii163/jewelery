import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/customer.dart';
import '../models/sale.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _db = DatabaseHelper.instance;
  final _appState = AppState.instance;
  bool _loading = true;
  Map<String, dynamic> _summary = {};
  List<Sale> _sales = [];
  List<dynamic> _products = [];
  List<Customer> _customers = [];
  List<Map<String, dynamic>> _productSales = [];
  String? _exportMsg;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final summary = await _db.getDashboardSummary();
    final sales = await _db.getAllSales();
    final products = await _db.getAllProducts();
    final customers = await _db.getAllCustomers();
    final productSales = await _db.getProductSalesSummary();
    if (!mounted) return;
    setState(() {
      _summary = summary;
      _sales = sales;
      _products = products;
      _customers = customers;
      _productSales = productSales;
      _loading = false;
    });
  }

  // ---------- period math ----------
  double _periodTotal(DateTime start, DateTime end) {
    final s = start.toIso8601String();
    final e = end.toIso8601String();
    return _sales
        .where((x) =>
            x.saleDate != null &&
            x.saleDate!.toIso8601String().compareTo(s) >= 0 &&
            x.saleDate!.toIso8601String().compareTo(e) <= 0)
        .fold(0.0, (sum, x) => sum + x.total);
  }

  Map<String, double> get _periods {
    final now = DateTime.now();
    final dayStart = DateTime(now.year, now.month, now.day);
    final weekStart = dayStart.subtract(Duration(days: now.weekday - 1));
    final monthStart = DateTime(now.year, now.month, 1);
    final yearStart = DateTime(now.year, 1, 1);
    final dayEnd = dayStart.add(const Duration(days: 1, milliseconds: -1));
    final weekEnd = weekStart.add(const Duration(days: 7, milliseconds: -1));
    final monthEnd =
        DateTime(now.year, now.month + 1, 1).add(const Duration(milliseconds: -1));
    final yearEnd =
        DateTime(now.year + 1, 1, 1).add(const Duration(milliseconds: -1));
    return {
      'daily': _periodTotal(dayStart, dayEnd),
      'weekly': _periodTotal(weekStart, weekEnd),
      'monthly': _periodTotal(monthStart, monthEnd),
      'yearly': _periodTotal(yearStart, yearEnd),
    };
  }

  Map<int, double> get _purityStock {
    final map = <int, double>{};
    for (final p in _products) {
      if (p.metalType == 'Gold' && p.status == 'In Stock') {
        map[p.karat] = (map[p.karat] ?? 0) + (p.netWeight ?? 0);
      }
    }
    return map;
  }

  Future<void> _exportCsv(String type) async {
    try {
      final dir = await getDownloadsDirectory();
      final path = dir == null
          ? '${Directory.systemTemp.path}\\jewellery_report.csv'
          : '${dir.path}\\jewellery_${type}_${DateTime.now().millisecondsSinceEpoch}.csv';

      final buf = StringBuffer();
      if (type == 'sales') {
        buf.writeln('Invoice,Customer,Date,Total,Paid,Remaining');
        for (final s in _sales) {
          buf.writeln(
              '${s.invoiceId},${s.customerName},${s.saleDate},${s.total},${s.paid},${s.remaining}');
        }
      } else if (type == 'period') {
        final p = _periods;
        buf.writeln('Period,Amount');
        buf.writeln('Today,${p['daily']}');
        buf.writeln('Week,${p['weekly']}');
        buf.writeln('Month,${p['monthly']}');
        buf.writeln('Year,${p['yearly']}');
      } else if (type == 'products') {
        buf.writeln('ProductID,Name,Qty,Revenue,UnitCost');
        for (final r in _productSales) {
          buf.writeln(
              '${r['pid']},${r['name']},${r['qty']},${r['revenue']},${r['cost']}');
        }
      } else if (type == 'customers') {
        buf.writeln('CustomerID,Name,Mobile,Total,Paid,Owing');
        for (final c in _customers) {
          buf.writeln(
              '${c.customerId},${c.name},${c.mobile},${c.totalAmount},${c.paidAmount},${c.remainingAmount}');
        }
      } else if (type == 'purity') {
        buf.writeln('Karat,Weight(g)');
        _purityStock.forEach((k, v) => buf.writeln('$k,$v'));
      } else if (type == 'inventory') {
        buf.writeln('ProductID,Name,Metal,Karat,NetWeight,Status,Price');
        for (final p in _products) {
          buf.writeln(
              '${p.productId},${p.name},${p.metalType},${p.karat},${p.netWeight},${p.status},${p.salePrice}');
        }
      } else if (type == 'financial') {
        buf.writeln('Metric,Value');
        buf.writeln('Total Sales,${_summary['monthlySales']}');
        buf.writeln('Cash Balance,${_summary['cashBalance']}');
        buf.writeln('Receivables,${_summary['receivables']}');
        buf.writeln('Payables,${_summary['payables']}');
        buf.writeln('Profit,${_summary['profit']}');
      }
      final file = File(path);
      await file.writeAsString(buf.toString());
      setState(() => _exportMsg = 'Exported: $path');
    } catch (e) {
      setState(() => _exportMsg = 'Export failed: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = _appState.settings.currency;
    if (_loading) return const Center(child: CircularProgressIndicator());
    return Scaffold(
      appBar: AppBar(title: Text(loc.t('reports'))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_exportMsg != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(_exportMsg!,
                  style: const TextStyle(color: Colors.green)),
            ),
          Text(loc.t('periodSales'),
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          _periodRow(loc, currency),
          const SizedBox(height: 16),
          Text(loc.t('productSales'),
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          _buildProductSalesTable(loc, currency),
          const SizedBox(height: 16),
          Text(loc.t('customerBalances'),
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          _buildCustomerTable(loc, currency),
          const SizedBox(height: 16),
          Text(loc.t('goldReports'),
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          _buildStockTable(context),
          const SizedBox(height: 16),
          Text(loc.t('purityWiseStock'),
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          _buildPurityTable(context),
          const SizedBox(height: 24),
          Text(loc.t('exportExcel'),
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            OutlinedButton.icon(
                onPressed: () => _exportCsv('sales'),
                icon: const Icon(Icons.file_download),
                label: Text('${loc.t('sales')} (CSV)')),
            OutlinedButton.icon(
                onPressed: () => _exportCsv('period'),
                icon: const Icon(Icons.file_download),
                label: Text('${loc.t('periodSales')} (CSV)')),
            OutlinedButton.icon(
                onPressed: () => _exportCsv('products'),
                icon: const Icon(Icons.file_download),
                label: Text('${loc.t('productSales')} (CSV)')),
            OutlinedButton.icon(
                onPressed: () => _exportCsv('customers'),
                icon: const Icon(Icons.file_download),
                label: Text('${loc.t('customerBalances')} (CSV)')),
            OutlinedButton.icon(
                onPressed: () => _exportCsv('purity'),
                icon: const Icon(Icons.file_download),
                label: Text('${loc.t('purityWiseStock')} (CSV)')),
            OutlinedButton.icon(
                onPressed: () => _exportCsv('inventory'),
                icon: const Icon(Icons.file_download),
                label: Text('${loc.t('inventory')} (CSV)')),
            OutlinedButton.icon(
                onPressed: () => _exportCsv('financial'),
                icon: const Icon(Icons.file_download),
                label: Text('${loc.t('financialReports')} (CSV)')),
          ]),
        ],
      ),
    );
  }

  Widget _periodRow(dynamic loc, String currency) {
    final p = _periods;
    return Row(children: [
      _periodCard(loc, loc.t('todaySales'), p['daily']!, currency, Colors.green),
      _periodCard(loc, loc.t('weekly'), p['weekly']!, currency, Colors.blue),
      _periodCard(loc, loc.t('monthly'), p['monthly']!, currency,
          const Color(0xFFB8860B)),
      _periodCard(loc, loc.t('yearly'), p['yearly']!, currency, Colors.purple),
    ]);
  }

  Widget _periodCard(dynamic loc, String label, double value, String currency,
      Color color) {
    return Expanded(
      child: Card(
        color: color.withValues(alpha: 0.08),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(children: [
            Text(label,
                style: const TextStyle(fontSize: 12),
                overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(loc.formatMoney(value, currency),
                style: TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 14, color: color)),
          ]),
        ),
      ),
    );
  }

  Widget _buildProductSalesTable(dynamic loc, String currency) {
    if (_productSales.isEmpty) {
      return Card(
        child: Padding(
            padding: const EdgeInsets.all(12), child: Text(loc.t('noRecords'))),
      );
    }
    return Card(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowHeight: 36,
          dataRowMinHeight: 32,
          dataRowMaxHeight: 40,
          columns: const [
            DataColumn(label: Text('Product')),
            DataColumn(label: Text('Qty')),
            DataColumn(label: Text('Revenue')),
            DataColumn(label: Text('Profit')),
          ],
          rows: [
            for (final r in _productSales)
              DataRow(cells: [
                DataCell(Text('${r['name'] ?? '#'} (${r['pid']})')),
                DataCell(Text('${r['qty'] ?? 0}')),
                DataCell(Text(loc.formatMoney((r['revenue'] ?? 0).toDouble(),
                    currency))),
                DataCell(Text(loc.formatMoney(
                    (r['revenue'] ?? 0).toDouble() -
                        (r['cost'] ?? 0).toDouble() * (r['qty'] ?? 0).toDouble(),
                    currency))),
              ]),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerTable(dynamic loc, String currency) {
    final withBalance = _customers
        .where((c) => c.remainingAmount > 0)
        .toList()
      ..sort((a, b) => b.remainingAmount.compareTo(a.remainingAmount));
    if (withBalance.isEmpty) {
      return Card(
        child: Padding(
            padding: const EdgeInsets.all(12), child: Text(loc.t('noRecords'))),
      );
    }
    return Card(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowHeight: 36,
          dataRowMinHeight: 32,
          dataRowMaxHeight: 40,
          columns: [
            DataColumn(label: Text(loc.t('name'))),
            DataColumn(label: Text(loc.t('mobile'))),
            DataColumn(label: Text('${loc.t('totalAmount')}')),
            DataColumn(label: Text(loc.t('remaining'))),
          ],
          rows: [
            for (final c in withBalance.take(50))
              DataRow(cells: [
                DataCell(Text('${c.customerId} - ${c.name}')),
                DataCell(Text(c.mobile.isEmpty ? '-' : c.mobile)),
                DataCell(
                    Text(loc.formatMoney(c.totalAmount, currency))),
                DataCell(Text(loc.formatMoney(c.remainingAmount, currency),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.red))),
              ]),
          ],
        ),
      ),
    );
  }

  Widget _buildStockTable(BuildContext context) {
    final loc = context.loc;
    final gold = _products.where((p) => p.metalType == 'Gold').toList();
    final silver = _products.where((p) => p.metalType == 'Silver').toList();
    final goldIn = gold.where((p) => p.status == 'In Stock').toList();
    final silverIn = silver.where((p) => p.status == 'In Stock').toList();
    final goldWeight = goldIn.fold<double>(0, (sum, p) => sum + p.netWeight);
    final silverWeight =
        silverIn.fold<double>(0, (sum, p) => sum + p.netWeight);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(children: [
          _line(loc.t('goldStock'),
              '${goldIn.length} items — ${loc.formatKg(goldWeight)} g'),
          _line(loc.t('silverStock'),
              '${silverIn.length} items — ${loc.formatKg(silverWeight)} g'),
          _line(loc.t('fineGold'),
              '${loc.formatKg(goldIn.fold<double>(0, (s, p) => s + p.fineGoldWeight))} g'),
        ]),
      ),
    );
  }

  Widget _buildPurityTable(BuildContext context) {
    final loc = context.loc;
    final purity = _purityStock;
    final sorted = purity.entries.toList()
      ..sort((a, b) => b.key.compareTo(a.key));
    if (sorted.isEmpty) {
      return Card(
        child: Padding(
            padding: const EdgeInsets.all(12), child: Text(loc.t('noRecords'))),
      );
    }
    return Card(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowHeight: 36,
          dataRowMinHeight: 32,
          dataRowMaxHeight: 40,
          columns: [
            DataColumn(label: Text(loc.t('karat'))),
            DataColumn(label: Text('${loc.t('netWeight')} (g)')),
          ],
          rows: [
            for (final e in sorted)
              DataRow(cells: [
                DataCell(Text('${e.key}K')),
                DataCell(Text(loc.formatKg(e.value))),
              ]),
          ],
        ),
      ),
    );
  }

  Widget _line(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(children: [
        Expanded(child: Text(label)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
      ]),
    );
  }
}