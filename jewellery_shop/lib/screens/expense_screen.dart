import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/expense.dart';
import '../widgets/form_helpers.dart';

class ExpenseScreen extends StatefulWidget {
  const ExpenseScreen({super.key});

  @override
  State<ExpenseScreen> createState() => _ExpenseScreenState();
}

class _ExpenseScreenState extends State<ExpenseScreen> {
  final _db = DatabaseHelper.instance;
  List<Expense> _expenses = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _db.getAllExpenses();
    if (!mounted) return;
    setState(() {
      _expenses = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('expenses')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: loc.t('newExpense'),
            onPressed: () async {
              await showDialog(context: context, builder: (_) => const ExpenseFormDialog());
              _load();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _expenses.isEmpty
              ? Center(child: Text(loc.t('noRecords')))
              : ListView.builder(
                  itemCount: _expenses.length,
                  itemBuilder: (context, i) {
                    final e = _expenses[i];
                    return Card(
                      margin:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      child: ListTile(
                        leading: const Icon(Icons.receipt_long, color: Colors.red),
                        title: Text('${e.category} - ${e.description}'),
                        subtitle: Text((e.date ?? DateTime.now()).toString().split(' ').first),
                        trailing: Text(loc.formatMoney(e.amount, currency),
                            style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                      ),
                    );
                  },
                ),
    );
  }
}

class ExpenseFormDialog extends StatefulWidget {
  const ExpenseFormDialog({super.key});

  @override
  State<ExpenseFormDialog> createState() => _ExpenseFormDialogState();
}

class _ExpenseFormDialogState extends State<ExpenseFormDialog> {
  final _db = DatabaseHelper.instance;
  final _description = TextEditingController();
  final _amount = TextEditingController();
  final _notes = TextEditingController();
  String _category = 'Other';
  String _method = 'Cash';
  bool _saving = false;

  static const _categories = [
    'Rent', 'Electricity', 'Salaries', 'Transport', 'Packaging',
    'Repair', 'Marketing', 'Other'
  ];

  Future<void> _save() async {
    if (_amount.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Amount required')));
      return;
    }
    setState(() => _saving = true);
    final count = await _db.getAllExpenses();
    final e = Expense(
      expenseId: 'EXP-${1000 + count.length}',
      date: DateTime.now(),
      category: _category,
      description: _description.text.trim(),
      amount: double.tryParse(_amount.text) ?? 0,
      paymentMethod: _method,
      notes: _notes.text.trim(),
    );
    await _db.addExpense(e);
    if (!mounted) return;
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _description.dispose();
    _amount.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return AlertDialog(
      title: Text(loc.t('newExpense')),
      content: SizedBox(
        width: 480,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          LabeledField(
            label: loc.t('expenseCategory'),
            child: DropdownButtonFormField<String>(
              value: _category,
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setState(() => _category = v ?? 'Other'),
              decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
            ),
          ),
          LabeledField(
            label: loc.t('description'),
            child: TextField(
                controller: _description,
                decoration:
                    const InputDecoration(border: OutlineInputBorder(), isDense: true)),
          ),
          Row(children: [
            Expanded(
              child: LabeledField(
                label: loc.t('total'),
                child: MoneyInput(controller: _amount),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: LabeledField(
                label: loc.t('paymentMethod'),
                child: DropdownButtonFormField<String>(
                  value: _method,
                  items: const [
                    DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                    DropdownMenuItem(value: 'Bank', child: Text('Bank')),
                    DropdownMenuItem(value: 'Card', child: Text('Card')),
                  ],
                  onChanged: (v) => setState(() => _method = v ?? 'Cash'),
                  decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                ),
              ),
            ),
          ]),
          LabeledField(
            label: loc.t('notes'),
            child: TextField(
                controller: _notes,
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
