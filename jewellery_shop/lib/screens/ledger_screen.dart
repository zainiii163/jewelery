import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/ledger_entry.dart';
import '../models/customer.dart';

class LedgerScreen extends StatefulWidget {
  const LedgerScreen({super.key});

  @override
  State<LedgerScreen> createState() => _LedgerScreenState();
}

class _LedgerScreenState extends State<LedgerScreen> {
  final _db = DatabaseHelper.instance;
  List<Customer> _customers = [];
  List<LedgerEntry> _entries = [];
  int? _selectedCustomerId;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final customers = await _db.getAllCustomers();
    final allEntries =
        await _db.getLedgerForCustomer(_selectedCustomerId ?? -1);
    if (!mounted) return;
    setState(() {
      _customers = customers;
      _entries = allEntries;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return Scaffold(
      appBar: AppBar(title: Text(loc.t('customerLedger'))),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: DropdownButtonFormField<int?>(
            initialValue: _selectedCustomerId,
            decoration: InputDecoration(
              labelText: loc.t('selectCustomer'),
              border: const OutlineInputBorder(),
              isDense: true,
            ),
            items: [
              const DropdownMenuItem(value: null, child: Text('-')),
              ..._customers
                  .map((c) =>
                      DropdownMenuItem(value: c.id, child: Text(c.name))),
            ],
            onChanged: (v) {
              setState(() => _selectedCustomerId = v);
              _load();
            },
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _entries.isEmpty
                  ? Center(child: Text(loc.t('selectCustomer')))
                  : SingleChildScrollView(
                      child: DataTable(
                        columns: [
                          DataColumn(label: Text(loc.t('date'))),
                          DataColumn(label: Text(loc.t('description'))),
                          DataColumn(label: Text(loc.t('debit'))),
                          DataColumn(label: Text(loc.t('creditAmount'))),
                          DataColumn(label: Text(loc.t('balance'))),
                        ],
                        rows: _entries.map((e) {
                          final dateStr =
                              (e.date ?? DateTime.now()).toLocal().toString().split(' ').first;
                          return DataRow(cells: [
                            DataCell(Text(dateStr)),
                            DataCell(Text(e.description)),
                            DataCell(Text(e.debit > 0 ? loc.formatMoney(e.debit, currency) : '')),
                            DataCell(Text(e.credit > 0 ? loc.formatMoney(e.credit, currency) : '')),
                            DataCell(Text(loc.formatMoney(e.balance, currency),
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: e.balance > 0 ? Colors.red : Colors.green))),
                          ]);
                        }).toList(),
                      ),
                    ),
        ),
      ]),
    );
  }
}
