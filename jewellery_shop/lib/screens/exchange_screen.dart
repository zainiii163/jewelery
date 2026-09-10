import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/customer.dart';
import '../models/product.dart';
import '../models/exchange.dart';
import '../models/ledger_entry.dart';
import '../models/payment.dart';
import '../models/user.dart';

class ExchangeScreen extends StatefulWidget {
  const ExchangeScreen({super.key});

  @override
  State<ExchangeScreen> createState() => _ExchangeScreenState();
}

class _ExchangeScreenState extends State<ExchangeScreen> {
  final _db = DatabaseHelper.instance;
  List<Exchange> _exchanges = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final exchanges = await _db.getAllExchanges();
    if (!mounted) return;
    setState(() {
      _exchanges = exchanges;
      _loading = false;
    });
  }

  Future<void> _openNew() async {
    final created = await showDialog<bool>(
      context: context,
      builder: (_) => const ExchangeFormDialog(),
    );
    if (created == true) _load();
  }

  Future<void> _viewDetails(Exchange ex) async {
    final items = await _db.getExchangeItems(ex.id!);
    if (!mounted) return;
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('${loc.t('exchangeId')}: ${ex.exchangeId}'),
        content: SizedBox(
          width: 420,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('${loc.t('customerProfile')}: ${ex.customerName}'),
                Text('${loc.t('date')}: '
                    '${ex.date?.toLocal().toString().split(' ').first ?? ''}'),
                const Divider(),
                Text(loc.t('oldJewellery'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                for (final it in items.where((i) => i.direction == 'Old'))
                  _itemRow(loc.t('oldGold'), it, loc, currency),
                Text(loc.t('newJewellery'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                for (final it in items.where((i) => i.direction == 'New'))
                  _itemRow(it.productName, it, loc, currency),
                const Divider(),
                _line(loc.t('oldValue'),
                    loc.formatMoney(ex.oldTotalValue, currency)),
                _line(loc.t('newValue'),
                    loc.formatMoney(ex.newTotalValue, currency)),
                _line(loc.t('makingCharges'),
                    loc.formatMoney(ex.makingCharges, currency)),
                _line(loc.t('discount'),
                    loc.formatMoney(ex.discount, currency)),
                _line(loc.t('netAmount'),
                    loc.formatMoney(ex.netAmount, currency)),
                _line(loc.t('paid'),
                    loc.formatMoney(ex.cashReceived, currency)),
                _line(loc.t('remaining'),
                    loc.formatMoney(ex.amountDue, currency),
                    color: ex.amountDue > 0 ? Colors.red : Colors.green),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(loc.t('cancel'))),
        ],
      ),
    );
  }

  Widget _itemRow(
      String name, ExchangeItem it, dynamic loc, String currency) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(children: [
        Expanded(child: Text(name)),
        Text(
            '${loc.formatWeight(it.netWeight)}g @ ${loc.formatMoney(it.rate, currency)} = ',
            style: const TextStyle(fontSize: 12)),
        Text(loc.formatMoney(it.metalValue, currency),
            style: const TextStyle(fontWeight: FontWeight.bold)),
      ]),
    );
  }

  Widget _line(String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(children: [
        Expanded(child: Text(label)),
        Text(value,
            style: TextStyle(
                fontWeight: FontWeight.w600,
                color: color)),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('exchangeList')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline),
            tooltip: loc.t('newExchange'),
            onPressed: _openNew,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _exchanges.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(loc.t('noRecords')),
                      const SizedBox(height: 12),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.swap_horiz),
                        label: Text(loc.t('newExchange')),
                        onPressed: _openNew,
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _exchanges.length,
                  itemBuilder: (context, i) {
                    final ex = _exchanges[i];
                    return Card(
                      child: ListTile(
                        leading: const Icon(Icons.swap_horiz,
                            color: Color(0xFFB8860B)),
                        title: Text('${ex.exchangeId} - ${ex.customerName}'),
                        subtitle: Text(
                            '${loc.t('date')}: ${ex.date?.toLocal().toString().split(' ').first ?? ''}  |  '
                            '${loc.t('oldValue')}: ${loc.formatMoney(ex.oldTotalValue, currency)}  |  '
                            '${loc.t('newValue')}: ${loc.formatMoney(ex.newTotalValue, currency)}'),
                        trailing: Text(
                          loc.formatMoney(ex.amountDue, currency),
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color:
                                ex.amountDue > 0 ? Colors.red : Colors.green,
                          ),
                        ),
                        onTap: () => _viewDetails(ex),
                      ),
                    );
                  },
                ),
    );
  }
}

class ExchangeFormDialog extends StatefulWidget {
  const ExchangeFormDialog({super.key});

  @override
  State<ExchangeFormDialog> createState() => _ExchangeFormDialogState();
}

class _OldEntry {
  String metalType = 'Gold';
  int karat = 22;
  final TextEditingController weight = TextEditingController();
  double rate = 0;

  double get value => (double.tryParse(weight.text) ?? 0) * rate;
  double get weightValue => double.tryParse(weight.text) ?? 0;
  void dispose() => weight.dispose();
}

class _NewEntry {
  final Product product;
  double rate;
  double metalValue;
  _NewEntry(this.product, this.rate, this.metalValue);
}

class _ExchangeFormDialogState extends State<ExchangeFormDialog> {
  final _db = DatabaseHelper.instance;
  final _appState = AppState.instance;

  List<Customer> _customers = [];
  List<Product> _products = [];
  GoldRate? _rate;
  int? _selectedCustomerId;
  final List<_OldEntry> _old = [];
  final List<_NewEntry> _new = [];
  int? _newProductId;
  final _extraCharges = TextEditingController();
  final _discount = TextEditingController();
  final _cashReceived = TextEditingController();
  final _notes = TextEditingController();
  String _paymentMethod = 'Cash';
  bool _loading = true;
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    for (final o in _old) {
      o.dispose();
    }
    _extraCharges.dispose();
    _discount.dispose();
    _cashReceived.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final customers = await _db.getAllCustomers();
    var products = await _db.getAllProducts();
    products = products.where((p) => p.status == 'In Stock').toList();
    final rate = await _db.getLatestGoldRate();
    if (!mounted) return;
    setState(() {
      _customers = customers;
      _products = products;
      _rate = rate;
      _loading = false;
    });
  }

  double _rateFor(int karat) =>
      _rate?.getRateForKarat(karat) ?? 10000;

  double get _silverRate => _rate?.silverRate ?? 10000;

  double get _oldTotal =>
      _old.fold(0.0, (sum, e) => sum + e.value);

  double get _newMetalTotal =>
      _new.fold(0.0, (sum, e) => sum + e.metalValue);

  double get _makingTotal =>
      _new.fold(0.0, (sum, e) => sum + e.product.makingCharges);

  double get _stoneTotal =>
      _new.fold(0.0, (sum, e) => sum + e.product.stoneCharges);

  double get _extraChargesValue => double.tryParse(_extraCharges.text) ?? 0;
  double get _discountValue => double.tryParse(_discount.text) ?? 0;
  double get _cashValue => double.tryParse(_cashReceived.text) ?? 0;

  double get _gross =>
      _newMetalTotal + _makingTotal + _stoneTotal + _extraChargesValue -
      _discountValue;

  double get _netAmount => _gross - _oldTotal;
  double get _amountDue => (_netAmount - _cashValue).clamp(0, double.infinity).toDouble();

  void _addOldItem({String metalType = 'Gold'}) {
    final entry = _OldEntry();
    entry.rate = metalType == 'Silver' ? _silverRate : _rateFor(entry.karat);
    setState(() {
      entry.metalType = metalType;
      _old.add(entry);
    });
  }

  void _addNewItem(Product p) {
    final rate = p.metalType == 'Silver' ? _silverRate : _rateFor(p.karat);
    setState(() {
      _new.add(_NewEntry(p, rate, p.netWeight * rate));
      _newProductId = null;
    });
  }

  void _updateOldRate(_OldEntry e) {
    setState(() {
      e.rate = e.metalType == 'Silver' ? _silverRate : _rateFor(e.karat);
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCustomerId == null) return;
    if (_old.isEmpty && _new.isEmpty) return;

    final customer =
        _customers.firstWhere((c) => c.id == _selectedCustomerId);
    final loc = context.loc;
    final now = DateTime.now();
    final stamp = now.millisecondsSinceEpoch % 1000000;
    final exchangeId = 'EXC-$stamp';

    final items = <ExchangeItem>[
      for (final o in _old)
        ExchangeItem(
          direction: 'Old',
          metalType: o.metalType,
          productName: o.metalType == 'Gold'
              ? loc.t('oldGold')
              : loc.t('silver'),
          netWeight: o.weightValue,
          purity: o.metalType == 'Gold' ? o.karat.toDouble() : 92.5,
          karat: o.metalType == 'Gold' ? o.karat : 0,
          rate: o.rate,
          metalValue: o.value,
          lineTotal: o.value,
        ),
      for (final n in _new)
        ExchangeItem(
          direction: 'New',
          metalType: n.product.metalType,
          productId: n.product.id,
          productName: n.product.name,
          grossWeight: n.product.grossWeight,
          netWeight: n.product.netWeight,
          purity: n.product.purity,
          karat: n.product.karat,
          rate: n.rate,
          metalValue: n.metalValue,
          makingCharges: n.product.makingCharges,
          stoneCharges: n.product.stoneCharges,
          lineTotal: n.metalValue + n.product.makingCharges +
              n.product.stoneCharges,
        ),
    ];

    final ex = Exchange(
      exchangeId: exchangeId,
      customerId: customer.id!,
      customerName: customer.name,
      date: now,
      oldTotalValue: _oldTotal,
      newTotalValue: _newMetalTotal,
      makingCharges: _makingTotal + _extraChargesValue,
      stoneCharges: _stoneTotal,
      discount: _discountValue,
      netAmount: _netAmount,
      cashReceived: _cashValue,
      amountDue: _amountDue,
      paymentMethod: _paymentMethod,
      notes: _notes.text,
    );

    await _db.addExchange(ex, items);

    // Mark new jewellery as sold
    for (final n in _new) {
      await _db.updateProductStatus(n.product.id!, 'Sold');
    }

    // Buy-back of old metal becomes fresh stock (melt)
    final oldWeight = _old.fold(0.0, (sum, e) => sum + e.weightValue);
    if (oldWeight > 0) {
      final hasSilver = _old.any((e) => e.metalType == 'Silver');
      final weightedKarat = _old.isEmpty
          ? 22
          : (_old.fold(0.0, (s, e) =>
                      s + e.weightValue * (e.metalType == 'Gold' ? e.karat : 0)) /
                  (hasSilver ? 1 : oldWeight))
              .round()
              .clamp(8, 24);
      await _db.addProduct(Product(
        productId: 'MLT-$stamp',
        name: loc.t('melt'),
        category: 'Bullion',
        metalType: hasSilver ? 'Silver' : 'Gold',
        netWeight: oldWeight,
        purity: hasSilver ? 92.5 : weightedKarat.toDouble(),
        karat: hasSilver ? 0 : weightedKarat,
        purchaseCost: _oldTotal,
        salePrice: _oldTotal,
        status: 'In Stock',
      ));
    }

    // Ledger + customer balances
    final newTotal = customer.totalAmount + _gross;
    final newPaid = customer.paidAmount + _oldTotal + _cashValue;
    await _db.updateCustomerBalances(customer.id!, newTotal, newPaid);

    await _db.addLedgerEntry(LedgerEntry(
      customerId: customer.id!,
      customerName: customer.name,
      date: now,
      description: 'Exchange $exchangeId',
      debit: _gross,
      credit: _oldTotal,
      balance: _netAmount,
      source: 'Exchange',
      referenceId: exchangeId,
    ));
    if (_cashValue > 0) {
      await _db.addLedgerEntry(LedgerEntry(
        customerId: customer.id!,
        customerName: customer.name,
        date: now,
        description: 'Payment',
        debit: 0,
        credit: _cashValue,
        balance: _netAmount - _cashValue,
        source: 'Payment',
      ));
      await _db.addPayment(Payment(
        paymentId: 'PAY-$stamp',
        customerId: customer.id!,
        customerName: customer.name,
        date: now,
        amount: _cashValue,
        method: _paymentMethod,
        type: 'Received',
        reference: exchangeId,
        notes: 'Exchange $exchangeId',
      ));
    }

    // Audit
    await _db.addAuditLog(AuditLog(
      timestamp: now,
      userId: _appState.currentUser?.id ?? 0,
      username: _appState.currentUser?.username ?? '',
      action: 'Create',
      entityType: 'Exchange',
      entityId: exchangeId,
      details:
          'Old: ${_oldTotal.toStringAsFixed(0)} New: ${_gross.toStringAsFixed(0)}',
    ));

    if (!mounted) return;
    Navigator.pop(context, true);
    ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(loc.t('exchangeRecorded'))));
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = _appState.settings.currency;
    return AlertDialog(
      title: Text(loc.t('newExchange')),
      content: SizedBox(
        width: 620,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      DropdownButtonFormField<int>(
                        initialValue: _selectedCustomerId,
                        decoration: InputDecoration(
                            labelText: loc.t('selectCustomer')),
                        items: [
                          for (final c in _customers)
                            DropdownMenuItem(
                                value: c.id, child: Text(c.name)),
                        ],
                        onChanged: (v) =>
                            setState(() => _selectedCustomerId = v),
                      ),
                      const Divider(height: 24),

                      // ---- OLD JEWELLERY ----
                      Row(children: [
                        Expanded(
                          child: Text(loc.t('oldJewellery'),
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold)),
                        ),
                        TextButton.icon(
                          icon: const Icon(Icons.add, size: 16),
                          label: Text(loc.t('addOldItem')),
                          onPressed: () => _addOldItem(),
                        ),
                      ]),
                      for (var i = 0; i < _old.length; i++)
                        _oldRow(loc, i),
                      if (_old.isEmpty)
                        Text(loc.t('noRecords'),
                            style: TextStyle(
                                color: Colors.grey.shade600, fontSize: 12)),

                      const Divider(height: 24),

                      // ---- NEW JEWELLERY ----
                      Row(children: [
                        Expanded(
                          child: Text(loc.t('newJewellery'),
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold)),
                        ),
                        DropdownButton<int>(
                          hint: Text(loc.t('addNewItem')),
                          value: _newProductId,
                          items: [
                            for (final p in _products)
                              DropdownMenuItem(
                                  value: p.id,
                                  child: Text(
                                      '${p.productId} - ${p.name} (${loc.formatWeight(p.netWeight)}g)')),
                          ],
                          onChanged: (v) {
                            final p = _products.firstWhere((x) => x.id == v);
                            _addNewItem(p);
                          },
                        ),
                      ]),
                      for (var i = 0; i < _new.length; i++)
                        _newRow(loc, currency, i),

                      const Divider(height: 24),

                      // ---- CHARGES / PAYMENT ----
                      Row(children: [
                        Expanded(
                          child: TextField(
                            controller: _extraCharges,
                            keyboardType:
                                const TextInputType.numberWithOptions(
                                    decimal: true),
                            decoration: InputDecoration(
                                labelText: loc.t('makingCharges'),
                                isDense: true),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _discount,
                            keyboardType:
                                const TextInputType.numberWithOptions(
                                    decimal: true),
                            decoration: InputDecoration(
                                labelText: loc.t('discount'),
                                isDense: true),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 8),
                      Row(children: [
                        Expanded(
                          child: TextField(
                            controller: _cashReceived,
                            keyboardType:
                                const TextInputType.numberWithOptions(
                                    decimal: true),
                            decoration: InputDecoration(
                                labelText: loc.t('paid'), isDense: true),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButtonFormField<String>(
                            initialValue: _paymentMethod,
                            decoration: InputDecoration(
                                labelText: loc.t('paymentMethod'),
                                isDense: true),
                            items: [
                              for (final m in const [
                                'Cash',
                                'Bank',
                                'Card',
                                'JazzCash',
                                'Easypaisa'
                              ])
                                DropdownMenuItem(value: m, child: Text(m)),
                            ],
                            onChanged: (v) => setState(() {
                              _paymentMethod = v ?? 'Cash';
                            }),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 8),
                      TextField(
                        controller: _notes,
                        decoration: InputDecoration(
                            labelText: loc.t('notes'), isDense: true),
                      ),

                      const Divider(height: 24),
                      _summaryLine(loc, '${loc.t('oldValue')}:',
                          loc.formatMoney(_oldTotal, currency)),
                      _summaryLine(loc, '${loc.t('newValue')}:',
                          loc.formatMoney(_newMetalTotal, currency)),
                      _summaryLine(loc, '${loc.t('makingCharges')}:',
                          loc.formatMoney(
                              _makingTotal + _extraChargesValue, currency)),
                      _summaryLine(loc, '${loc.t('discount')}:',
                          loc.formatMoney(_discountValue, currency)),
                      _summaryLine(
                          loc,
                          loc.t('netAmount'),
                          loc.formatMoney(_netAmount, currency),
                          bold: true),
                      _summaryLine(loc, '${loc.t('remaining')}: ',
                          loc.formatMoney(_amountDue, currency),
                          bold: true,
                          color: _amountDue > 0 ? Colors.red : Colors.green),
                    ],
                  ),
                ),
              ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(loc.t('cancel'))),
        FilledButton(
            onPressed: _save, child: Text(loc.t('save'))),
      ],
    );
  }

  Widget _oldRow(dynamic loc, int i) {
    final e = _old[i];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        SizedBox(
          width: 90,
          child: DropdownButton<String>(
            value: e.metalType,
            isDense: true,
            items: const [
              DropdownMenuItem(value: 'Gold', child: Text('Gold')),
              DropdownMenuItem(value: 'Silver', child: Text('Silver')),
            ],
            onChanged: (v) {
              setState(() {
                e.metalType = v ?? 'Gold';
                if (e.metalType == 'Silver') e.karat = 0;
              });
              _updateOldRate(e);
            },
          ),
        ),
        const SizedBox(width: 8),
        if (e.metalType == 'Gold')
          SizedBox(
            width: 70,
            child: DropdownButton<int>(
              value: e.karat,
              isDense: true,
              items: const [
                DropdownMenuItem(value: 24, child: Text('24K')),
                DropdownMenuItem(value: 22, child: Text('22K')),
                DropdownMenuItem(value: 21, child: Text('21K')),
                DropdownMenuItem(value: 20, child: Text('20K')),
                DropdownMenuItem(value: 18, child: Text('18K')),
              ],
              onChanged: (v) {
                setState(() => e.karat = v ?? 22);
                _updateOldRate(e);
              },
            ),
          ),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            controller: e.weight,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
                labelText: '${loc.t('weight')} (g)', isDense: true),
            onChanged: (_) => setState(() {}),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 140,
          child: Text(
            '${loc.formatMoney(e.value, AppState.instance.settings.currency)}',
            textAlign: TextAlign.end,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        IconButton(
          icon: const Icon(Icons.close, size: 18),
          onPressed: () {
            setState(() {
              e.dispose();
              _old.removeAt(i);
            });
          },
        ),
      ]),
    );
  }

  Widget _newRow(dynamic loc, String currency, int i) {
    final e = _new[i];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Expanded(
          child: Text(
              '${e.product.productId} - ${e.product.name} (${e.product.karat}K)'),
        ),
        Text('${loc.formatWeight(e.product.netWeight)}g × '),
        Text(loc.formatMoney(e.rate, currency)),
        Text(' = '),
        Text(loc.formatMoney(e.metalValue, currency),
            style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(width: 8),
        IconButton(
          icon: const Icon(Icons.close, size: 18),
          onPressed: () => setState(() => _new.removeAt(i)),
        ),
      ]),
    );
  }

  Widget _summaryLine(dynamic loc, String label, String value,
      {bool bold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(children: [
        Expanded(child: Text(label)),
        Text(value,
            style: TextStyle(
                fontWeight: bold ? FontWeight.bold : FontWeight.normal,
                color: color,
                fontSize: bold ? 16 : null)),
      ]),
    );
  }
}