import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/customer.dart';
import '../models/product.dart';
import '../models/sale.dart';
import '../models/ledger_entry.dart';
import '../models/user.dart';
import '../services/invoice_pdf.dart';

class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  final _db = DatabaseHelper.instance;
  final _appState = AppState.instance;

  List<Customer> _customers = [];
  List<Product> _products = [];
  final List<SaleItem> _cart = [];
  int? _selectedCustomerId;
  bool _loading = true;
  String _search = '';
  double _discount = 0;
  double _tax = 0;
  String _paymentMethod = 'Cash';
  double _cashReceived = 0;
  bool _isCredit = false;

  @override
  void initState() {
    super.initState();
    _load();
    _tax = _appState.settings.taxRate;
    _loadRate();
  }

  Future<void> _load() async {
    final customers = await _db.getAllCustomers();
    var products = await _db.getAllProducts();
    products = products.where((p) => p.status == 'In Stock').toList();
    if (!mounted) return;
    setState(() {
      _customers = customers;
      _products = products;
      _loading = false;
    });
  }

  double get _dueAmount => _grandTotal - (_isCredit ? 0 : _cashReceived);

  List<Product> get _filteredProducts => _search.isEmpty
      ? _products
      : _products
          .where((p) =>
              p.name.toLowerCase().contains(_search.toLowerCase()) ||
              p.productId.toLowerCase().contains(_search.toLowerCase()))
          .toList();

  double get _metalTotal {
    double t = 0;
    for (final it in _cart) {
      t += it.metalValue;
    }
    return t;
  }

  double get _makingTotal {
    double t = 0;
    for (final it in _cart) {
      t += it.makingCharges + it.stoneCharges;
    }
    return t;
  }

  double get _subtotal => _metalTotal + _makingTotal;
  double get _taxAmount => _subtotal * (_tax / 100);
  double get _grandTotal => _subtotal - _discount + _taxAmount;

  void _addToCart(Product p) {
    final rate = _rateFor(p.karat);
    final metalValue = p.netWeight * rate;
    setState(() {
      _cart.add(SaleItem(
        productId: p.id!,
        productName: p.name,
        grossWeight: p.grossWeight,
        netWeight: p.netWeight,
        purity: p.purity,
        karat: p.karat,
        goldRate: rate,
        metalValue: metalValue,
        makingCharges: p.makingCharges,
        stoneCharges: p.stoneCharges,
        quantity: 1,
      ));
    });
  }

  double _rateFor(int karat) {
    final rate = _latestRate;
    if (rate == null) return 10000;
    return rate.getRateForKarat(karat);
  }

  GoldRate? get _latestRate => _cachedRate;

  GoldRate? _cachedRate;

  Future<void> _loadRate() async {
    _cachedRate = await _db.getLatestGoldRate();
  }

  Future<void> _completeSale() async {
    if (_cart.isEmpty) {
      _showMsg('Cart is empty');
      return;
    }
    if (_selectedCustomerId == null) {
      _showMsg('Please select a customer');
      return;
    }
    final customer = _customers.firstWhere((c) => c.id == _selectedCustomerId);

    final invoiceId = 'INV-${DateTime.now().millisecondsSinceEpoch % 1000000}';
    final total = _grandTotal;
    final remainingValue = _isCredit ? total : (total - _cashReceived).clamp(0.0, total);

    final sale = Sale(
      invoiceId: invoiceId,
      customerId: customer.id!,
      customerName: customer.name,
      saleDate: DateTime.now(),
      subtotal: _subtotal,
      totalDiscount: _discount,
      tax: _taxAmount,
      total: total,
      paid: _isCredit ? 0 : _cashReceived,
      remaining: remainingValue.toDouble(),
      paymentMethod: _paymentMethod,
      items: List.from(_cart),
    );

    await _db.addSale(sale, _cart);

    // Update customer balances and ledger
    final newTotal = customer.totalAmount + (_isCredit ? total : 0);
    final newPaid = customer.paidAmount + (_isCredit ? 0 : _cashReceived);
    await _db.updateCustomerBalances(
        customer.id!, newTotal, newPaid);

    await _db.addLedgerEntry(LedgerEntry(
      customerId: customer.id!,
      customerName: customer.name,
      date: DateTime.now(),
      description: 'Sale $invoiceId',
      debit: total,
      credit: 0,
      balance: _isCredit ? total : (total - _cashReceived),
      source: 'Sale',
      referenceId: invoiceId,
    ));

    if (!_isCredit && _cashReceived > 0) {
      await _db.addLedgerEntry(LedgerEntry(
        customerId: customer.id!,
        customerName: customer.name,
        date: DateTime.now(),
        description: 'Payment',
        debit: 0,
        credit: _cashReceived,
        balance: total - _cashReceived,
        source: 'Payment',
      ));
    }

    // Update product statuses
    for (final item in _cart) {
      await _db.updateProductStatus(item.productId, 'Sold');
    }

    // Audit log
    await _db.addAuditLog(AuditLog(
      timestamp: DateTime.now(),
      userId: _appState.currentUser?.id ?? 0,
      username: _appState.currentUser?.username ?? '',
      action: 'Invoice',
      entityType: 'Sale',
      entityId: invoiceId,
      details: 'Total: ${total.toStringAsFixed(0)}',
    ));

    if (!mounted) return;
    _showInvoiceDialog(sale);

    setState(() {
      _cart.clear();
      _discount = 0;
      _cashReceived = 0;
      _isCredit = false;
      _selectedCustomerId = null;
    });
    _load();
  }

  void _showMsg(String m) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  void _showInvoiceDialog(Sale sale) {
    final loc = context.loc;
    final currency = _appState.settings.currency;
    final settings = _appState.settings;
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(loc.t('invoice')),
        content: SizedBox(
          width: 420,
          child: SingleChildScrollView(
            child: Column(children: [
              Text(sale.invoiceId, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 8),
              Text('${loc.t('customerId')}: ${sale.customerName}'),
              const Divider(),
              for (final it in sale.items)
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(children: [
                    Expanded(child: Text(it.productName)),
                    Text(loc.formatMoney(it.lineTotal > 0 ? it.lineTotal : it.metalValue + it.makingCharges + it.stoneCharges, currency)),
                  ]),
                ),
              const Divider(),
              Row(children: [Expanded(child: Text(loc.t('total'))), Text(loc.formatMoney(sale.total, currency))]),
              Row(children: [Expanded(child: Text(loc.t('paid'))), Text(loc.formatMoney(sale.paid, currency))]),
              Row(children: [Expanded(child: Text(loc.t('remaining'))), Text(loc.formatMoney(sale.remaining, currency))]),
            ]),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await InvoicePdf.printInvoice(sale, settings);
              } catch (e) {
                if (mounted) _showMsg('$e');
              }
            },
            child: const Text('PDF / Print'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final b = await InvoicePdf.bytes(sale, settings);
                final saved = await FilePicker.saveFile(
                  fileName: 'invoice_${sale.invoiceId}.pdf',
                  bytes: b,
                );
                if (saved != null && mounted) {
                  _showMsg('Saved: ${saved.toFilePath()}');
                }
              } catch (e) {
                if (mounted) _showMsg('$e');
              }
            },
            child: const Text('SAVE PDF'),
          ),
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('OK')),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = _appState.settings.currency;
    return Scaffold(
      appBar: AppBar(title: Text(loc.t('newSale'))),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Row(children: [
              // Left: product search & list
              Expanded(
                flex: 3,
                child: Column(children: [
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: TextField(
                      onChanged: (v) => setState(() => _search = v),
                      decoration: InputDecoration(
                        hintText: loc.t('search'),
                        prefixIcon: const Icon(Icons.search),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                  ),
                  Expanded(
                    child: ListView.builder(
                      itemCount: _filteredProducts.length,
                      itemBuilder: (context, i) {
                        final p = _filteredProducts[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          child: ListTile(
                            dense: true,
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFFB8860B),
                              child: Text('${p.karat}K', style: const TextStyle(color: Colors.white, fontSize: 10)),
                            ),
                            title: Text(p.name),
                            subtitle: Text('${p.netWeight.toStringAsFixed(3)}g • ${p.productId}'),
                            trailing: IconButton(
                              icon: const Icon(Icons.add_circle),
                              onPressed: () => _addToCart(p),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ]),
              ),
              const VerticalDivider(width: 1),
              // Right: cart & checkout
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    DropdownButtonFormField<int?>(
                      value: _selectedCustomerId,
                      decoration: InputDecoration(
                        labelText: loc.t('selectCustomer'),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: _customers
                          .map((c) => DropdownMenuItem(
                              value: c.id, child: Text('${c.name} (${c.mobile})')))
                          .toList(),
                      onChanged: (v) => setState(() => _selectedCustomerId = v),
                    ),
                    const SizedBox(height: 10),
                    Expanded(
                      child: _cart.isEmpty
                          ? Center(child: Text(loc.t('selectProduct')))
                          : ListView.builder(
                              itemCount: _cart.length,
                              itemBuilder: (context, i) {
                                final it = _cart[i];
                                final line = it.metalValue + it.makingCharges + it.stoneCharges;
                                return Card(
                                  margin: const EdgeInsets.symmetric(vertical: 2),
                                  child: ListTile(
                                    dense: true,
                                    title: Text(it.productName),
                                    subtitle: Text('${it.netWeight.toStringAsFixed(3)}g x ${it.goldRate.toStringAsFixed(0)}'),
                                    trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                                      Text(loc.formatMoney(line, currency)),
                                      IconButton(
                                        icon: const Icon(Icons.remove_circle, color: Colors.red),
                                        onPressed: () => setState(() => _cart.removeAt(i)),
                                      ),
                                    ]),
                                  ),
                                );
                              },
                            ),
                    ),
                    const Divider(),
                    _row(context, loc.t('subtotal'), loc.formatMoney(_subtotal, currency)),
                    _row(context, loc.t('discount'), loc.formatMoney(-_discount, currency)),
                    _row(context, loc.t('tax'), loc.formatMoney(_taxAmount, currency)),
                    _row(context, loc.t('total'), loc.formatMoney(_grandTotal, currency), bold: true),
                    const SizedBox(height: 8),
                    TextField(
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      onChanged: (v) => setState(() => _discount = double.tryParse(v) ?? 0),
                      decoration: InputDecoration(
                        labelText: loc.t('discount'),
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _paymentMethod,
                      decoration: const InputDecoration(
                        labelText: 'Payment Method',
                        border: OutlineInputBorder(),
                        isDense: true,
                      ),
                      items: const [
                        DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                        DropdownMenuItem(value: 'Bank', child: Text('Bank')),
                        DropdownMenuItem(value: 'Card', child: Text('Card')),
                        DropdownMenuItem(value: 'JazzCash', child: Text('JazzCash')),
                        DropdownMenuItem(value: 'Easypaisa', child: Text('Easypaisa')),
                      ],
                      onChanged: (v) => setState(() => _paymentMethod = v ?? 'Cash'),
                    ),
                    SwitchListTile(
                      dense: true,
                      value: _isCredit,
                      title: Text(loc.t('credit')),
                      onChanged: (v) => setState(() => _isCredit = v),
                    ),
                    if (!_isCredit) ...[
                      TextField(
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        onChanged: (v) =>
                            setState(() => _cashReceived = double.tryParse(v) ?? 0),
                        decoration: InputDecoration(
                          labelText: loc.t('paid'),
                          border: const OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    _row(context, loc.t('remaining'), loc.formatMoney(_dueAmount.clamp(0.0, _grandTotal), currency), bold: true, color: Colors.red),
                    const SizedBox(height: 10),
                    FilledButton.icon(
                      onPressed: _completeSale,
                      icon: const Icon(Icons.receipt),
                      label: Text(loc.t('createInvoice')),
                    ),
                  ]),
                ),
              ),
            ]),
    );
  }

  Widget _row(BuildContext context, String label, String value,
      {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal))),
        Text(value,
            style: TextStyle(
                fontWeight: bold ? FontWeight.bold : FontWeight.normal,
                color: color,
                fontSize: bold ? 16 : null)),
      ]),
    );
  }
}
