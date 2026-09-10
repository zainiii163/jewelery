import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/customer.dart';
import '../models/payment.dart';
import '../models/ledger_entry.dart';
import '../widgets/form_helpers.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _db = DatabaseHelper.instance;
  List<Payment> _payments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _db.getAllPayments();
    if (!mounted) return;
    setState(() {
      _payments = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('payments')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: loc.t('receivePayment'),
            onPressed: () async {
              await showDialog(context: context, builder: (_) => const PaymentFormDialog());
              _load();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _payments.isEmpty
              ? Center(child: Text(loc.t('noRecords')))
              : ListView.builder(
                  itemCount: _payments.length,
                  itemBuilder: (context, i) {
                    final p = _payments[i];
                    final isReceived = p.type == 'Received';
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      child: ListTile(
                        leading: Icon(
                          isReceived ? Icons.arrow_downward : Icons.arrow_upward,
                          color: isReceived ? Colors.green : Colors.red,
                        ),
                        title: Text('${p.customerName} • ${p.reference}'),
                        subtitle: Text('${(p.date ?? DateTime.now()).toString().split(' ').first} • ${p.method}'),
                        trailing: Text(
                          '${isReceived ? '+' : '-'}${loc.formatMoney(p.amount, currency)}',
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isReceived ? Colors.green : Colors.red),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

class PaymentFormDialog extends StatefulWidget {
  const PaymentFormDialog({super.key});

  @override
  State<PaymentFormDialog> createState() => _PaymentFormDialogState();
}

class _PaymentFormDialogState extends State<PaymentFormDialog> {
  final _db = DatabaseHelper.instance;
  final _amount = TextEditingController();
  final _reference = TextEditingController();
  List<Customer> _customers = [];
  int? _customerId;
  String _method = 'Cash';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    final list = await _db.getAllCustomers();
    setState(() => _customers = list);
  }

  Future<void> _save() async {
    if (_customerId == null || _amount.text.trim().isEmpty) return;
    setState(() => _saving = true);
    final count = await _db.getAllPayments();
    final customer = _customers.firstWhere((c) => c.id == _customerId);
    final amount = double.tryParse(_amount.text) ?? 0;

    final p = Payment(
      paymentId: 'PAY-${1000 + count.length}',
      customerId: customer.id!,
      customerName: customer.name,
      date: DateTime.now(),
      amount: amount,
      method: _method,
      type: 'Received',
      reference: _reference.text.trim(),
    );
    await _db.addPayment(p);

    // Update balances and ledger
    final newPaid = customer.paidAmount + amount;
    await _db.updateCustomerBalances(customer.id!, customer.totalAmount, newPaid);
    await _db.addLedgerEntry(LedgerEntry(
      customerId: customer.id!,
      customerName: customer.name,
      date: DateTime.now(),
      description: _reference.text.trim().isEmpty ? 'Payment' : _reference.text.trim(),
      debit: 0,
      credit: amount,
      balance: customer.totalAmount - newPaid,
      source: 'Payment',
    ));

    if (!mounted) return;
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _amount.dispose();
    _reference.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return AlertDialog(
      title: Text(loc.t('receivePayment')),
      content: SizedBox(
        width: 440,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          DropdownButtonFormField<int?>(
            value: _customerId,
            decoration: InputDecoration(
              labelText: loc.t('selectCustomer'),
              border: const OutlineInputBorder(),
              isDense: true,
            ),
            items: _customers
                .map((c) => DropdownMenuItem(value: c.id, child: Text('${c.name} (${c.remainingAmount.toStringAsFixed(0)})')))
                .toList(),
            onChanged: (v) => setState(() => _customerId = v),
          ),
          const SizedBox(height: 12),
          LabeledField(
            label: loc.t('total'),
            child: MoneyInput(controller: _amount),
          ),
          Row(children: [
            Expanded(
              child: LabeledField(
                label: loc.t('paymentMethod'),
                child: DropdownButtonFormField<String>(
                  value: _method,
                  items: const [
                    DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                    DropdownMenuItem(value: 'Bank', child: Text('Bank')),
                    DropdownMenuItem(value: 'Card', child: Text('Card')),
                    DropdownMenuItem(value: 'JazzCash', child: Text('JazzCash')),
                    DropdownMenuItem(value: 'Easypaisa', child: Text('Easypaisa')),
                  ],
                  onChanged: (v) => setState(() => _method = v ?? 'Cash'),
                  decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                ),
              ),
            ),
          ]),
          LabeledField(
            label: loc.t('reference'),
            child: TextField(
                controller: _reference,
                decoration:
                    const InputDecoration(border: OutlineInputBorder(), isDense: true)),
          ),
        ]),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(loc.t('cancel'))),
        FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? '...' : loc.t('save'))),
      ],
    );
  }
}
