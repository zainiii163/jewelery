import 'dart:io';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/customer.dart';
import '../models/exchange.dart';
import '../models/expense.dart';
import '../models/ledger_entry.dart';
import '../models/purchase.dart';
import '../models/repair.dart';
import '../models/sale.dart';
import '../models/user.dart';
import '../services/report_pdf.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _db = DatabaseHelper.instance;
  final _appState = AppState.instance;
  bool _loading = true;
  List<Sale> _sales = [];
  List<dynamic> _products = [];
  List<Customer> _customers = [];
  List<Map<String, dynamic>> _productSales = [];
  List<Purchase> _purchases = [];
  List<Expense> _expenses = [];
  List<Repair> _repairs = [];
  List<Exchange> _exchanges = [];
  List<LedgerEntry> _ledger = [];
  List<GoldRate> _goldRates = [];
  String? _exportMsg;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final sales = await _db.getAllSales();
    final products = await _db.getAllProducts();
    final customers = await _db.getAllCustomers();
    final productSales = await _db.getProductSalesSummary();
    final purchases = await _db.getAllPurchases();
    final expenses = await _db.getAllExpenses();
    final repairs = await _db.getAllRepairs();
    final exchanges = await _db.getAllExchanges();
    final ledger = await _db.getAllLedger();
    final goldRates = await _db.getAllGoldRates();
    if (!mounted) return;
    setState(() {
      _sales = sales;
      _products = products;
      _customers = customers;
      _productSales = productSales;
      _purchases = purchases;
      _expenses = expenses;
      _repairs = repairs;
      _exchanges = exchanges;
      _ledger = ledger;
      _goldRates = goldRates;
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
    final bounds = _bounds;
    return {
      'daily': _periodTotal(bounds['day']![0], bounds['day']![1]),
      'weekly': _periodTotal(bounds['week']![0], bounds['week']![1]),
      'monthly': _periodTotal(bounds['month']![0], bounds['month']![1]),
      'yearly': _periodTotal(bounds['year']![0], bounds['year']![1]),
    };
  }

  Map<String, List<DateTime>> get _bounds {
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
      'day': [dayStart, dayEnd],
      'week': [weekStart, weekEnd],
      'month': [monthStart, monthEnd],
      'year': [yearStart, yearEnd],
    };
  }

  /// Total of an amount field for items whose date falls in a period.
  double _totalIn<T>(
      List<T> list, DateTime? Function(T) dateOf, double Function(T) amount,
      DateTime start, DateTime end) {
    final s = start.toIso8601String();
    final e = end.toIso8601String();
    var sum = 0.0;
    for (final x in list) {
      final d = dateOf(x);
      if (d != null) {
        final ds = d.toIso8601String();
        if (ds.compareTo(s) >= 0 && ds.compareTo(e) <= 0) sum += amount(x);
      }
    }
    return sum;
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

  // ---------- PDF export ----------
  Future<void> _savePdf(
      String title, String subtitle, List<String> columns, List<List<String>> rows,
      {Map<String, String>? totals}) async {
    try {
      final bytes = await ReportPdf.bytes(
        title: title,
        subtitle: subtitle,
        columns: columns,
        rows: rows,
        shopName: _appState.settings.shopName,
        currency: _appState.settings.currency,
        totals: totals,
      );
      final dir = await getDownloadsDirectory();
      final path = dir == null
          ? '${Directory.systemTemp.path}\\${title.replaceAll(' ', '_')}.pdf'
          : '${dir.path}\\${title.replaceAll(' ', '_')}_${DateTime.now().millisecondsSinceEpoch}.pdf';
      final file = File(path);
      await file.writeAsBytes(bytes, flush: true);
      setState(() => _exportMsg = 'Exported PDF: $path');
    } catch (e) {
      setState(() => _exportMsg = 'Export failed: $e');
    }
  }

  String _money(double v) =>
      context.loc.formatMoney(v, _appState.settings.currency);

  String _date(DateTime? d) {
    if (d == null) return '-';
    final dd = '${d.day}'.padLeft(2, '0');
    final m = '${d.month}'.padLeft(2, '0');
    return '$d.year/$m/$dd'.replaceFirst('$d.year', '${d.year}');
  }

  String _monthLabel(DateTime d) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return '${months[d.month - 1]} ${d.year}';
  }

  // ---------- export actions per section ----------
  Future<void> _exportSalesPdf() async {
    final p = _periods;
    await _savePdf('Sales Summary', 'Period totals',
        ['Metric', 'Amount'],
        [
          ['Today', _money(p['daily']!)],
          ['This Week', _money(p['weekly']!)],
          ['This Month', _money(p['monthly']!)],
          ['This Year', _money(p['yearly']!)],
        ]);
  }

  Future<void> _exportProfitLossPdf() async {
    final pl = _profitLoss;
    await _savePdf('Profit & Loss', 'Period comparison',
        ['Metric', 'Today', 'This Week', 'This Month'],
        [
          ['POS Sales', _money(pl['salesD']!), _money(pl['salesW']!), _money(pl['salesM']!)],
          ['Purchases', _money(pl['purchD']!), _money(pl['purchW']!), _money(pl['purchM']!)],
          ['Expenses', _money(pl['expD']!), _money(pl['expW']!), _money(pl['expM']!)],
          ['Net', _money(pl['netD']!), _money(pl['netW']!), _money(pl['netM']!)],
        ]);
  }

  Future<void> _exportPurchasesPdf() async {
    final b = _bounds['month']!;
    final monthRows = _purchases
        .where((p) => p.purchaseDate != null)
        .where((p) =>
            p.purchaseDate!.toIso8601String().compareTo(b[0].toIso8601String()) >= 0 &&
            p.purchaseDate!.toIso8601String().compareTo(b[1].toIso8601String()) <= 0)
        .toList();
    await _savePdf('Purchase Report', _monthLabel(b[0]),
        ['ID', 'Date', 'Supplier', 'Product', 'Cost', 'Paid', 'Remaining'],
        [
          for (final p in monthRows)
            [
              _orDash(p.purchaseId),
              _date(p.purchaseDate),
              p.supplierName,
              p.productName,
              p.totalCost.toStringAsFixed(0),
              p.paid.toStringAsFixed(0),
              p.remaining.toStringAsFixed(0),
            ]
        ],
        totals: {
          'Total': _money(monthRows.fold(0.0, (s, p) => s + p.totalCost)),
        });
  }

  Future<void> _exportExpensesPdf() async {
    final b = _bounds['month']!;
    final monthRows = _expenses
        .where((e) => e.date != null)
        .where((e) =>
            e.date!.toIso8601String().compareTo(b[0].toIso8601String()) >= 0 &&
            e.date!.toIso8601String().compareTo(b[1].toIso8601String()) <= 0)
        .toList();
    await _savePdf('Expense Report', _monthLabel(b[0]),
        ['ID', 'Date', 'Category', 'Description', 'Amount'],
        [
          for (final e in monthRows)
            [
              _orDash(e.expenseId),
              _date(e.date),
              e.category,
              e.description,
              e.amount.toStringAsFixed(0),
            ]
        ],
        totals: {
          'Total': _money(monthRows.fold(0.0, (s, e) => s + e.amount)),
        });
  }

  Future<void> _exportRepairsPdf() async {
    await _savePdf('Repair Report', 'All repairs',
        ['ID', 'Received', 'Customer', 'Product', 'Status', 'Final'],
        [
          for (final r in _repairs)
            [
              _orDash(r.repairId),
              _date(r.receivedDate),
              r.customerName,
              r.productName,
              r.status,
              r.finalCharges.toStringAsFixed(0),
            ]
        ],
        totals: {
          'Pending': '${_repairs.where((r) => r.status != 'Completed' && r.status != 'Cancelled').length}',
          'Total Charges': _money(_repairs.fold(0.0, (s, r) => s + r.finalCharges)),
        });
  }

  Future<void> _exportExchangesPdf() async {
    await _savePdf('Exchange Report', 'All exchanges',
        ['ID', 'Date', 'Customer', 'Old Value', 'New Value', 'Net', 'Due'],
        [
          for (final x in _exchanges)
            [
              _orDash(x.exchangeId),
              _date(x.date),
              x.customerName,
              x.oldTotalValue.toStringAsFixed(0),
              x.newTotalValue.toStringAsFixed(0),
              x.netAmount.toStringAsFixed(0),
              x.amountDue.toStringAsFixed(0),
            ]
        ],
        totals: {
          'Total Net': _money(_exchanges.fold(0.0, (s, x) => s + x.netAmount)),
        });
  }

  Future<void> _exportGoldRatesPdf() async {
    final r = _goldRates.reversed.take(30).toList();
    await _savePdf('Gold & Silver Rates', 'Latest rates',
        ['Date', '24K', '22K', '21K', '20K', '18K', 'Silver'],
        [
          for (final g in r)
            [
              _date(g.date),
              g.rate24k.toStringAsFixed(0),
              g.rate22k.toStringAsFixed(0),
              g.rate21k.toStringAsFixed(0),
              g.rate20k.toStringAsFixed(0),
              g.rate18k.toStringAsFixed(0),
              g.silverRate.toStringAsFixed(0),
            ]
        ]);
  }

  Future<void> _exportLedgerPdf() async {
    final top = _ledger.take(100).toList();
    await _savePdf('Customer Ledger', 'Recent 100 entries',
        ['Date', 'Customer', 'Description', 'Debit', 'Credit', 'Balance'],
        [
          for (final l in top)
            [
              _date(l.date),
              _orDash(l.customerName),
              _orDash(l.description),
              l.debit.toStringAsFixed(0),
              l.credit.toStringAsFixed(0),
              l.balance.toStringAsFixed(0),
            ]
        ]);
  }

  String _orDash(String s) => s.isEmpty ? '-' : s;

  /// [Purchases, Expenses] totals for the given window.
  List<double> _pe(DateTime start, DateTime end) {
    final pur = _totalIn(
        _purchases, (p) => p.purchaseDate, (p) => p.totalCost, start, end);
    final ex = _totalIn(
        _expenses, (e) => e.date, (e) => e.amount, start, end);
    return [pur, ex];
  }

  // ---------- derived report data ----------
  Map<String, double> get _profitLoss {
    final b = _bounds;
    final day = _pe(b['day']![0], b['day']![1]);
    final week = _pe(b['week']![0], b['week']![1]);
    final month = _pe(b['month']![0], b['month']![1]);
    final s = _periods;
    return {
      'salesD': s['daily']!,
      'salesW': s['weekly']!,
      'salesM': s['monthly']!,
      'purchD': day[0], 'purchW': week[0], 'purchM': month[0],
      'expD': day[1], 'expW': week[1], 'expM': month[1],
      'netD': s['daily']! - day[0] - day[1],
      'netW': s['weekly']! - week[0] - week[1],
      'netM': s['monthly']! - month[0] - month[1],
    };
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
          // Period sales
          _sectionHeader(loc, loc.t('periodSales'), _exportSalesPdf),
          const SizedBox(height: 8),
          _periodRow(loc, currency),

          // Profit & Loss
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('profitLoss'), _exportProfitLossPdf),
          const SizedBox(height: 8),
          _buildProfitLoss(loc, currency),

          // Product-wise sales
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('productSales'),
              () => _savePdf('Product-wise Sales', 'All products', [
                    'Product', 'Qty', 'Revenue', 'Cost'
                  ], [
                    for (final r in _productSales)
                      [
                        '${r['name'] ?? '#'} (${r['pid']})',
                        '${r['qty'] ?? 0}',
                        (r['revenue'] ?? 0).toDouble().toStringAsFixed(0),
                        (r['cost'] ?? 0).toDouble().toStringAsFixed(0),
                      ]
                  ])),
          const SizedBox(height: 8),
          _buildProductSalesTable(loc, currency),

          // Purchases
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('purchases'), _exportPurchasesPdf),
          const SizedBox(height: 8),
          _buildPurchases(loc, currency),

          // Expenses
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('expenses'), _exportExpensesPdf),
          const SizedBox(height: 8),
          _buildExpenses(loc, currency),

          // Customer balances
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('customerBalances'),
              () => _savePdf('Customer Balances', 'Customers with balances', [
                    'ID', 'Name', 'Mobile', 'Total', 'Paid', 'Owing'
                  ], [
                    for (final c in _customers)
                      [
                        _orDash(c.customerId),
                        c.name,
                        c.mobile.isEmpty ? '-' : c.mobile,
                        c.totalAmount.toStringAsFixed(0),
                        c.paidAmount.toStringAsFixed(0),
                        c.remainingAmount.toStringAsFixed(0),
                      ]
                  ])),
          const SizedBox(height: 8),
          _buildCustomerTable(loc, currency),

          // Repairs
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('repairs'), _exportRepairsPdf),
          const SizedBox(height: 8),
          _buildRepairs(loc, currency),

          // Exchanges
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('exchangeList'), _exportExchangesPdf),
          const SizedBox(height: 8),
          _buildExchanges(loc, currency),

          // Gold stock
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('goldReports'),
              () => _savePdf('Gold & Silver Stock', 'In-stock gold and silver', [
                    'Metal', 'Items', 'Weight (g)', 'Fine Gold (g)'
                  ], [
                    ..._goldStockRows(),
                  ])),
          const SizedBox(height: 8),
          _buildStockTable(context),

          // Purity-wise stock
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('purityWiseStock'), () => _savePdf(
                  'Purity-wise Stock', 'In-stock gold by karat', [
                'Karat', 'Weight (g)'
              ], [
                for (final e in _purityStockRows())
                  ['${e.key}K', e.value.toStringAsFixed(3)]
              ])),
          const SizedBox(height: 8),
          _buildPurityTable(context),

          // Gold & Silver rates
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('goldRates'), _exportGoldRatesPdf),
          const SizedBox(height: 8),
          _buildGoldRates(loc),

          // Customer ledger
          const SizedBox(height: 16),
          _sectionHeader(loc, loc.t('customerLedger'), _exportLedgerPdf),
          const SizedBox(height: 8),
          _buildLedger(loc, currency),
        ],
      ),
    );
  }

  Widget _sectionHeader(dynamic loc, String title, Future<void> Function() onPdf) {
    return Row(children: [
      Expanded(
        child: Text(title, style: Theme.of(context).textTheme.titleMedium),
      ),
      IconButton(
        tooltip: loc.t('exportPdf'),
        onPressed: onPdf,
        icon: const Icon(Icons.picture_as_pdf, size: 22),
        color: Theme.of(context).colorScheme.primary,
      ),
    ]);
  }

  List<List<String>> _goldStockRows() {
    final goldIn = _products.where((p) => p.metalType == 'Gold' && p.status == 'In Stock').toList();
    final silverIn = _products.where((p) => p.metalType == 'Silver' && p.status == 'In Stock').toList();
    final gW = goldIn.fold<double>(0, (s, p) => s + (p.netWeight ?? 0));
    final sW = silverIn.fold<double>(0, (s, p) => s + (p.netWeight ?? 0));
    final gF = goldIn.fold<double>(0, (s, p) => s + p.fineGoldWeight);
    return [
      ['Gold', '${goldIn.length}', gW.toStringAsFixed(3), gF.toStringAsFixed(3)],
      ['Silver', '${silverIn.length}', sW.toStringAsFixed(3), '0.000'],
    ];
  }

  List<MapEntry<int, double>> _purityStockRows() {
    final sorted = _purityStock.entries.toList()..sort((a, b) => b.key.compareTo(a.key));
    return sorted;
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

  Widget _buildProfitLoss(dynamic loc, String currency) {
    final pl = _profitLoss;
    return Card(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowHeight: 36,
          dataRowMinHeight: 32,
          dataRowMaxHeight: 40,
          columns: [
            DataColumn(label: Text(loc.t('reports'))),
            DataColumn(label: Text(loc.t('todaySales'))),
            DataColumn(label: Text(loc.t('weekly'))),
            DataColumn(label: Text(loc.t('monthly'))),
          ],
          rows: [
            DataRow(cells: [
              DataCell(Text(loc.t('sales'))),
              DataCell(Text(loc.formatMoney(pl['salesD']!, currency))),
              DataCell(Text(loc.formatMoney(pl['salesW']!, currency))),
              DataCell(Text(loc.formatMoney(pl['salesM']!, currency))),
            ]),
            DataRow(cells: [
              DataCell(Text(loc.t('purchases'))),
              DataCell(Text(loc.formatMoney(pl['purchD']!, currency))),
              DataCell(Text(loc.formatMoney(pl['purchW']!, currency))),
              DataCell(Text(loc.formatMoney(pl['purchM']!, currency))),
            ]),
            DataRow(cells: [
              DataCell(Text(loc.t('expenses'))),
              DataCell(Text(loc.formatMoney(pl['expD']!, currency))),
              DataCell(Text(loc.formatMoney(pl['expW']!, currency))),
              DataCell(Text(loc.formatMoney(pl['expM']!, currency))),
            ]),
            DataRow(cells: [
              DataCell(Text(loc.t('netProfit'),
                  style: const TextStyle(fontWeight: FontWeight.bold))),
              DataCell(Text(loc.formatMoney(pl['netD']!, currency),
                  style: const TextStyle(fontWeight: FontWeight.bold))),
              DataCell(Text(loc.formatMoney(pl['netW']!, currency),
                  style: const TextStyle(fontWeight: FontWeight.bold))),
              DataCell(Text(loc.formatMoney(pl['netM']!, currency),
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: (pl['netM'] ?? 0) < 0 ? Colors.red : Colors.green))),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildPurchases(dynamic loc, String currency) {
    final recent = _purchases.take(25).toList();
    if (_purchases.isEmpty) {
      return Card(
        child: Padding(
            padding: const EdgeInsets.all(12), child: Text(loc.t('noRecords'))),
      );
    }
    final monthTotal = _profitLoss['purchM']!;
    return Card(
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              '${loc.t('monthlyPurchases')}: ${loc.formatMoney(monthTotal, currency)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowHeight: 36,
            dataRowMinHeight: 32,
            dataRowMaxHeight: 40,
            columns: const [
              DataColumn(label: Text('ID')),
              DataColumn(label: Text('Date')),
              DataColumn(label: Text('Supplier')),
              DataColumn(label: Text('Product')),
              DataColumn(label: Text('Cost')),
              DataColumn(label: Text('Remaining')),
            ],
            rows: [
              for (final p in recent)
                DataRow(cells: [
                  DataCell(Text(_orDash(p.purchaseId))),
                  DataCell(Text(_date(p.purchaseDate))),
                  DataCell(Text(_orDash(p.supplierName))),
                  DataCell(Text(_orDash(p.productName))),
                  DataCell(Text(loc.formatMoney(p.totalCost, currency))),
                  DataCell(Text(
                      loc.formatMoney(p.remaining, currency),
                      style: p.remaining > 0
                          ? const TextStyle(color: Colors.red)
                          : null)),
                ]),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _buildExpenses(dynamic loc, String currency) {
    if (_expenses.isEmpty) {
      return Card(
        child: Padding(
            padding: const EdgeInsets.all(12), child: Text(loc.t('noRecords'))),
      );
    }
    final monthTotal = _profitLoss['expM']!;
    return Card(
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              '${loc.t('monthlyExpenses')}: ${loc.formatMoney(monthTotal, currency)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowHeight: 36,
            dataRowMinHeight: 32,
            dataRowMaxHeight: 40,
            columns: const [
              DataColumn(label: Text('ID')),
              DataColumn(label: Text('Date')),
              DataColumn(label: Text('Category')),
              DataColumn(label: Text('Description')),
              DataColumn(label: Text('Amount')),
            ],
            rows: [
              for (final e in _expenses.take(25))
                DataRow(cells: [
                  DataCell(Text(_orDash(e.expenseId))),
                  DataCell(Text(_date(e.date))),
                  DataCell(Text(e.category)),
                  DataCell(Text(_orDash(e.description))),
                  DataCell(Text(loc.formatMoney(e.amount, currency))),
                ]),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _buildRepairs(dynamic loc, String currency) {
    if (_repairs.isEmpty) {
      return Card(
        child: Padding(
            padding: const EdgeInsets.all(12), child: Text(loc.t('noRecords'))),
      );
    }
    final pending =
        _repairs.where((r) => r.status != 'Completed' && r.status != 'Cancelled').length;
    return Card(
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              '${loc.t('pendingRepairs')}: $pending',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowHeight: 36,
            dataRowMinHeight: 32,
            dataRowMaxHeight: 40,
            columns: const [
              DataColumn(label: Text('ID')),
              DataColumn(label: Text('Received')),
              DataColumn(label: Text('Customer')),
              DataColumn(label: Text('Product')),
              DataColumn(label: Text('Status')),
              DataColumn(label: Text('Final')),
            ],
            rows: [
              for (final r in _repairs.take(25))
                DataRow(cells: [
                  DataCell(Text(_orDash(r.repairId))),
                  DataCell(Text(_date(r.receivedDate))),
                  DataCell(Text(_orDash(r.customerName))),
                  DataCell(Text(_orDash(r.productName))),
                  DataCell(Text(_orDash(r.status))),
                  DataCell(Text(loc.formatMoney(r.finalCharges, currency))),
                ]),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _buildExchanges(dynamic loc, String currency) {
    if (_exchanges.isEmpty) {
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
            DataColumn(label: Text('ID')),
            DataColumn(label: Text('Date')),
            DataColumn(label: Text('Customer')),
            DataColumn(label: Text('Old Value')),
            DataColumn(label: Text('New Value')),
            DataColumn(label: Text('Net')),
            DataColumn(label: Text('Due')),
          ],
          rows: [
            for (final x in _exchanges.take(25))
              DataRow(cells: [
                DataCell(Text(_orDash(x.exchangeId))),
                DataCell(Text(_date(x.date))),
                DataCell(Text(_orDash(x.customerName))),
                DataCell(Text(loc.formatMoney(x.oldTotalValue, currency))),
                DataCell(Text(loc.formatMoney(x.newTotalValue, currency))),
                DataCell(Text(loc.formatMoney(x.netAmount, currency))),
                DataCell(Text(
                    loc.formatMoney(x.amountDue, currency),
                    style: x.amountDue > 0
                        ? const TextStyle(color: Colors.red)
                        : null)),
              ]),
          ],
        ),
      ),
    );
  }

  Widget _buildGoldRates(dynamic loc) {
    if (_goldRates.isEmpty) {
      return Card(
        child: Padding(
            padding: const EdgeInsets.all(12), child: Text(loc.t('noRecords'))),
      );
    }
    final latest = _goldRates.last;
    return Card(
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 4),
          child: Align(
            alignment: Alignment.centerLeft,
            child: Text(
              '${loc.t('rate')} (${_date(latest.date)}): 24K ${latest.rate24k.toStringAsFixed(0)} · 22K ${latest.rate22k.toStringAsFixed(0)} · Silver ${latest.silverRate.toStringAsFixed(0)}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            headingRowHeight: 36,
            dataRowMinHeight: 32,
            dataRowMaxHeight: 40,
            columns: const [
              DataColumn(label: Text('Date')),
              DataColumn(label: Text('24K')),
              DataColumn(label: Text('22K')),
              DataColumn(label: Text('21K')),
              DataColumn(label: Text('20K')),
              DataColumn(label: Text('18K')),
              DataColumn(label: Text('Silver')),
            ],
            rows: [
              for (final g in _goldRates.reversed.take(20))
                DataRow(cells: [
                  DataCell(Text(_date(g.date))),
                  DataCell(Text(g.rate24k.toStringAsFixed(0))),
                  DataCell(Text(g.rate22k.toStringAsFixed(0))),
                  DataCell(Text(g.rate21k.toStringAsFixed(0))),
                  DataCell(Text(g.rate20k.toStringAsFixed(0))),
                  DataCell(Text(g.rate18k.toStringAsFixed(0))),
                  DataCell(Text(g.silverRate.toStringAsFixed(0))),
                ]),
            ],
          ),
        ),
      ]),
    );
  }

  Widget _buildLedger(dynamic loc, String currency) {
    if (_ledger.isEmpty) {
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
            DataColumn(label: Text('Date')),
            DataColumn(label: Text('Customer')),
            DataColumn(label: Text('Description')),
            DataColumn(label: Text('Debit')),
            DataColumn(label: Text('Credit')),
            DataColumn(label: Text('Balance')),
          ],
          rows: [
            for (final l in _ledger.take(50))
              DataRow(cells: [
                DataCell(Text(_date(l.date))),
                DataCell(Text(_orDash(l.customerName))),
                DataCell(Text(_orDash(l.description))),
                DataCell(Text(loc.formatMoney(l.debit, currency))),
                DataCell(Text(loc.formatMoney(l.credit, currency))),
                DataCell(Text(
                    loc.formatMoney(l.balance, currency),
                    style: l.balance > 0
                        ? const TextStyle(color: Colors.red)
                        : null)),
              ]),
          ],
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
    final sorted = _purityStockRows();
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