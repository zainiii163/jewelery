import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/customer.dart';
import '../models/exchange.dart';
import '../widgets/form_helpers.dart';

// ================= Customer Form =================
class CustomerFormDialog extends StatefulWidget {
  final Customer? customer;
  const CustomerFormDialog({super.key, this.customer});

  @override
  State<CustomerFormDialog> createState() => _CustomerFormDialogState();
}

class _CustomerFormDialogState extends State<CustomerFormDialog> {
  final _db = DatabaseHelper.instance;
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.customer?.name ?? '');
  late final _father = TextEditingController(
      text: widget.customer?.fatherName ?? '');
  late final _cnic = TextEditingController(text: widget.customer?.cnic ?? '');
  late final _mobile =
      TextEditingController(text: widget.customer?.mobile ?? '');
  late final _whatsapp =
      TextEditingController(text: widget.customer?.whatsapp ?? '');
  late final _address =
      TextEditingController(text: widget.customer?.address ?? '');
  late final _city = TextEditingController(text: widget.customer?.city ?? '');
  late final _email = TextEditingController(text: widget.customer?.email ?? '');
  late final _notes = TextEditingController(text: widget.customer?.notes ?? '');
  late String _photoPath = widget.customer?.photoPath ?? '';
  late String _cnicFrontPath = widget.customer?.cnicFrontPath ?? '';
  late String _cnicBackPath = widget.customer?.cnicBackPath ?? '';
  late String _documentsPath = widget.customer?.documentsPath ?? '';
  bool _saving = false;

  Future<void> _pickFile({required String label, required FileType type,
      List<String>? allowedExtensions}) async {
    final picked = await FilePicker.pickFile(
        type: type, allowedExtensions: allowedExtensions);
    if (picked == null || picked.path == null) return;
    setState(() {
      switch (label) {
        case 'photo':
          _photoPath = picked.path!;
        case 'front':
          _cnicFrontPath = picked.path!;
        case 'back':
          _cnicBackPath = picked.path!;
        case 'doc':
          _documentsPath = picked.path!;
      }
    });
  }

  String _fileName(String path) {
    final parts = path.split(RegExp(r'[\\/]'));
    return parts.isEmpty ? path : parts.last;
  }

  Widget _mediaRow(BuildContext context, String label, String path,
      {required VoidCallback onPick}) {
    final loc = context.loc;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        SizedBox(
          width: 130,
          child: Text(label,
              style: const TextStyle(fontWeight: FontWeight.w600)),
        ),
        Expanded(
          child: path.isEmpty
              ? Text('-', style: TextStyle(color: Colors.grey.shade500))
              : Text(_fileName(path),
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 12)),
        ),
        TextButton.icon(
          icon: const Icon(Icons.attach_file, size: 16),
          label: Text(path.isEmpty ? loc.t('addPhoto') : loc.t('addDocument')),
          onPressed: onPick,
        ),
      ]),
    );
  }

  @override
  void dispose() {
    _name.dispose();
    _father.dispose();
    _cnic.dispose();
    _mobile.dispose();
    _whatsapp.dispose();
    _address.dispose();
    _city.dispose();
    _email.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final existing = widget.customer;
    final c = Customer(
      id: existing?.id,
      customerId: existing?.customerId ?? '',
      name: _name.text.trim(),
      fatherName: _father.text.trim(),
      cnic: _cnic.text.trim(),
      mobile: _mobile.text.trim(),
      whatsapp: _whatsapp.text.trim(),
      address: _address.text.trim(),
      city: _city.text.trim(),
      email: _email.text.trim(),
      notes: _notes.text.trim(),
      photoPath: _photoPath,
      cnicFrontPath: _cnicFrontPath,
      cnicBackPath: _cnicBackPath,
      documentsPath: _documentsPath,
      registeredDate: existing?.registeredDate ?? DateTime.now(),
      totalAmount: existing?.totalAmount ?? 0,
      paidAmount: existing?.paidAmount ?? 0,
    );

    if (c.customerId.isEmpty) {
      final count = await _db.getAllCustomers();
      c.customerId = 'CUS-${1000 + count.length}';
    }

    if (existing == null) {
      await _db.addCustomer(c);
    } else {
      await _db.updateCustomer(c);
    }
    if (!mounted) return;
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return AlertDialog(
      title: Text(
          widget.customer == null
              ? loc.t('newCustomer')
              : loc.t('editCustomer')),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 560,
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LabeledField(
                  label: loc.t('name'),
                  required: true,
                  child: TextFormField(
                    controller: _name,
                    validator: (v) => (v == null || v.isEmpty)
                        ? '${loc.t('name')} *'
                        : null,
                    decoration: const InputDecoration(
                        border: OutlineInputBorder(), isDense: true),
                  ),
                ),
                LabeledField(
                  label: loc.t('fatherName'),
                  child: TextField(
                      controller: _father,
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(), isDense: true)),
                ),
                Row(children: [
                  Expanded(
                    child: LabeledField(
                      label: loc.t('cnic'),
                      child: TextField(
                          controller: _cnic,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LabeledField(
                      label: loc.t('mobile'),
                      child: TextField(
                          controller: _mobile,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                ]),
                Row(children: [
                  Expanded(
                    child: LabeledField(
                      label: loc.t('whatsapp'),
                      child: TextField(
                          controller: _whatsapp,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LabeledField(
                      label: loc.t('email'),
                      child: TextField(
                          controller: _email,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                ]),
                LabeledField(
                  label: loc.t('address'),
                  child: TextField(
                      controller: _address,
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(), isDense: true)),
                ),
                Row(children: [
                  Expanded(
                    child: LabeledField(
                      label: loc.t('city'),
                      child: TextField(
                          controller: _city,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(child: SizedBox()),
                ]),
                LabeledField(
                  label: loc.t('notes'),
                  child: TextField(
                      controller: _notes,
                      maxLines: 2,
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(), isDense: true)),
                ),
                const Divider(),
                Text(loc.t('attachments'),
                    style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                _mediaRow(
                    context,
                    loc.t('photo'),
                    _photoPath,
                    onPick: () => _pickFile(
                        label: 'photo',
                        type: FileType.media)),
                _mediaRow(
                    context,
                    '${loc.t('cnic')} Front',
                    _cnicFrontPath,
                    onPick: () => _pickFile(
                        label: 'front',
                        type: FileType.image)),
                _mediaRow(
                    context,
                    '${loc.t('cnic')} Back',
                    _cnicBackPath,
                    onPick: () => _pickFile(
                        label: 'back',
                        type: FileType.image)),
                _mediaRow(
                    context,
                    loc.t('document'),
                    _documentsPath,
                    onPick: () => _pickFile(
                        label: 'doc',
                        type: FileType.custom,
                        allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'])),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context), child: Text(loc.t('cancel'))),
        FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? '...' : loc.t('save'))),
      ],
    );
  }
}

// ================= Customer Profile =================
class CustomerProfileScreen extends StatefulWidget {
  final Customer customer;
  final Future<void> Function()? onChanged;
  const CustomerProfileScreen(
      {super.key, required this.customer, this.onChanged});

  @override
  State<CustomerProfileScreen> createState() => _CustomerProfileScreenState();
}

class _CustomerProfileScreenState extends State<CustomerProfileScreen>
    with SingleTickerProviderStateMixin {
  late Customer _customer = widget.customer;
  final _db = DatabaseHelper.instance;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _reload();
  }

  Future<void> _reload() async {
    final fresh = await _db.getCustomer(_customer.id!);
    if (fresh != null) setState(() => _customer = fresh);
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(
        title: Text(_customer.name),
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: loc.t('customerProfile')),
            Tab(text: loc.t('ledger')),
            Tab(text: loc.t('sales')),
            Tab(text: loc.t('payments')),
            Tab(text: loc.t('exchange')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _profileTab(context),
          LedgerTab(customerId: _customer.id!),
          SalesTab(customerId: _customer.id!),
          PaymentsTab(customerId: _customer.id!),
          ExchangesTab(customerId: _customer.id!),
        ],
      ),
    );
  }

  Widget _profileTab(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: Column(children: [
            CircleAvatar(
              radius: 40,
              child: Text(_customer.name.isNotEmpty
                  ? _customer.name[0].toUpperCase()
                  : '?'),
            ),
            const SizedBox(height: 8),
            Text(_customer.name,
                style: const TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold)),
            Text('${loc.t('customerId')}: ${_customer.customerId}'),
          ]),
        ),
        const SizedBox(height: 16),
        _infoRow(loc.t('fatherName'), _customer.fatherName),
        _infoRow(loc.t('cnic'), _customer.cnic),
        _infoRow(loc.t('mobile'), _customer.mobile),
        _infoRow(loc.t('whatsapp'), _customer.whatsapp),
        _infoRow(loc.t('email'), _customer.email),
        _infoRow(loc.t('city'), _customer.city),
        _infoRow(loc.t('address'), _customer.address),
        _infoRow(
            loc.t('registeredDate'),
            _customer.registeredDate?.toLocal().toString().split(' ').first ??
                ''),
        const Divider(height: 24),
        _bigRow(
            loc.t('totalAmount'), loc.formatMoney(_customer.totalAmount, currency)),
        _bigRow(loc.t('paid'), loc.formatMoney(_customer.paidAmount, currency)),
        _bigRow(
            loc.t('remaining'),
            loc.formatMoney(_customer.remainingAmount, currency),
            color: _customer.remainingAmount > 0 ? Colors.red : Colors.green,
            bold: true),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 140, child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
          Expanded(child: Text(value.isEmpty ? '-' : value)),
        ],
      ),
    );
  }

  Widget _bigRow(String label, String value, {Color? color, bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600))),
          Text(value, style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal, color: color, fontSize: bold ? 16 : null)),
        ],
      ),
    );
  }
}

class LedgerTab extends StatefulWidget {
  final int customerId;
  const LedgerTab({super.key, required this.customerId});

  @override
  State<LedgerTab> createState() => _LedgerTabState();
}

class _LedgerTabState extends State<LedgerTab> {
  final _db = DatabaseHelper.instance;
  List<dynamic> _entries = [];
  double _total = 0, _paid = 0, _balance = 0;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final entries = await _db.getLedgerForCustomer(widget.customerId);
    final c = await _db.getCustomer(widget.customerId);
    if (!mounted) return;
    setState(() {
      _entries = entries;
      _total = c?.totalAmount ?? 0;
      _paid = c?.paidAmount ?? 0;
      _balance = (c?.remainingAmount ?? 0);
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    if (_loading) return const Center(child: CircularProgressIndicator());
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(12),
        child: Row(children: [
          _summary(loc.t('totalAmount'), loc.formatMoney(_total, currency), Colors.blue,
              loc, currency),
          _summary(loc.t('paid'), loc.formatMoney(_paid, currency), Colors.green, loc,
              currency),
          _summary(loc.t('remaining'), loc.formatMoney(_balance, currency),
              _balance > 0 ? Colors.red : Colors.green, loc, currency),
        ]),
      ),
      Expanded(
        child: _entries.isEmpty
            ? Center(child: Text(loc.t('noRecords')))
            : ListView.builder(
                itemCount: _entries.length,
                itemBuilder: (context, i) {
                  final e = _entries[i];
                  return ListTile(
                    dense: true,
                    title: Text(e.description ?? ''),
                    subtitle: Text((e.date ?? '').toString().split(' ').first),
                    trailing: Text(
                      '${e.credit != null && (e.credit as num).toDouble() > 0 ? '' : ''}${loc.formatMoney(((e.debit ?? 0) - (e.credit ?? 0)).toDouble(), currency)}',
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: ((e.debit ?? 0) - (e.credit ?? 0)).toDouble() > 0
                              ? Colors.red
                              : Colors.green),
                    ),
                  );
                },
              ),
      ),
    ]);
  }

  Widget _summary(String label, String value, Color color, dynamic loc, String cur) {
    return Expanded(
      child: Card(
        color: color.withOpacity(0.1),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(children: [
            Text(label, style: const TextStyle(fontSize: 12)),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(fontWeight: FontWeight.bold, color: color)),
          ]),
        ),
      ),
    );
  }
}

class SalesTab extends StatefulWidget {
  final int customerId;
  const SalesTab({super.key, required this.customerId});

  @override
  State<SalesTab> createState() => _SalesTabState();
}

class _SalesTabState extends State<SalesTab> {
  final _db = DatabaseHelper.instance;
  List<dynamic> _sales = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final sales = await _db.getSalesForCustomer(widget.customerId);
    if (!mounted) return;
    setState(() {
      _sales = sales;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    if (_loading) return const Center(child: CircularProgressIndicator());
    return _sales.isEmpty
        ? Center(child: Text(loc.t('noRecords')))
        : ListView.builder(
            itemCount: _sales.length,
            itemBuilder: (context, i) {
              final s = _sales[i];
              return ListTile(
                leading: const Icon(Icons.receipt_long),
                title: Text(s.invoiceId ?? ''),
                subtitle: Text((s.saleDate ?? '').toString().split(' ').first),
                trailing: Text(loc.formatMoney(((s.total ?? 0)).toDouble(), currency),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
              );
            },
          );
  }
}

class PaymentsTab extends StatefulWidget {
  final int customerId;
  const PaymentsTab({super.key, required this.customerId});

  @override
  State<PaymentsTab> createState() => _PaymentsTabState();
}

class _PaymentsTabState extends State<PaymentsTab> {
  final _db = DatabaseHelper.instance;
  List<dynamic> _payments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final payments = await _db.getPaymentsForCustomer(widget.customerId);
    if (!mounted) return;
    setState(() {
      _payments = payments;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    if (_loading) return const Center(child: CircularProgressIndicator());
    return _payments.isEmpty
        ? Center(child: Text(loc.t('noRecords')))
        : ListView.builder(
            itemCount: _payments.length,
            itemBuilder: (context, i) {
              final p = _payments[i];
              return ListTile(
                leading: const Icon(Icons.paid, color: Colors.green),
                title: Text(p.reference ?? p.paymentId ?? ''),
                subtitle: Text(
                    '${(p.date ?? '').toString().split(' ').first} • ${p.method ?? ''}'),
                trailing: Text(
                    '+${loc.formatMoney(((p.amount ?? 0)).toDouble(), currency)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.green)),
              );
            },
          );
  }
}

class ExchangesTab extends StatefulWidget {
  final int customerId;
  const ExchangesTab({super.key, required this.customerId});

  @override
  State<ExchangesTab> createState() => _ExchangesTabState();
}

class _ExchangesTabState extends State<ExchangesTab> {
  final _db = DatabaseHelper.instance;
  List<Exchange> _exchanges = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final exchanges =
        await _db.getExchangesForCustomer(widget.customerId);
    if (!mounted) return;
    setState(() {
      _exchanges = exchanges;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    if (_loading) return const Center(child: CircularProgressIndicator());
    return _exchanges.isEmpty
        ? Center(child: Text(loc.t('noRecords')))
        : ListView.builder(
            itemCount: _exchanges.length,
            itemBuilder: (context, i) {
              final ex = _exchanges[i];
              return ListTile(
                leading: const Icon(Icons.swap_horiz,
                    color: Color(0xFFB8860B)),
                title: Text(ex.exchangeId),
                subtitle: Text(
                    '${ex.date?.toLocal().toString().split(' ').first ?? ''} '
                    '• ${loc.t('oldValue')}: ${loc.formatMoney(ex.oldTotalValue, currency)} '
                    '• ${loc.t('newValue')}: ${loc.formatMoney(ex.newTotalValue, currency)}'),
                trailing: Text(
                  loc.formatMoney(ex.amountDue, currency),
                  style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: ex.amountDue > 0 ? Colors.red : Colors.green),
                ),
              );
            },
          );
  }
}
