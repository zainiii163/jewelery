import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/repair.dart';
import '../models/customer.dart';
import '../widgets/form_helpers.dart';

class RepairScreen extends StatefulWidget {
  const RepairScreen({super.key});

  @override
  State<RepairScreen> createState() => _RepairScreenState();
}

class _RepairScreenState extends State<RepairScreen> {
  final _db = DatabaseHelper.instance;
  List<Repair> _repairs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _db.getAllRepairs();
    if (!mounted) return;
    setState(() {
      _repairs = list;
      _loading = false;
    });
  }

  static const _statusColors = {
    'Received': Colors.blue,
    'Inspection': Colors.orange,
    'In Repair': Colors.purple,
    'Ready': Colors.teal,
    'Delivered': Colors.green,
  };

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('repairs')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: loc.t('newRepair'),
            onPressed: () async {
              await showDialog(context: context, builder: (_) => const RepairFormDialog());
              _load();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _repairs.isEmpty
              ? Center(child: Text(loc.t('noRecords')))
              : ListView.builder(
                  itemCount: _repairs.length,
                  itemBuilder: (context, i) {
                    final r = _repairs[i];
                    final statusColor = _statusColors[r.status] ?? Colors.grey;
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      child: ListTile(
                        leading: Icon(Icons.build, color: statusColor),
                        title: Text('${r.repairId} • ${r.customerName}'),
                        subtitle: Text(
                            '${r.productName} • ${(r.receivedDate ?? DateTime.now()).toString().split(' ').first}'),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Chip(
                              label: Text(r.status, style: const TextStyle(color: Colors.white, fontSize: 11)),
                              backgroundColor: statusColor,
                              visualDensity: VisualDensity.compact,
                            ),
                            if (r.finalCharges > 0)
                              Text(loc.formatMoney(r.finalCharges, currency)),
                          ],
                        ),
                        onTap: () async {
                          await showDialog(
                              context: context, builder: (_) => RepairFormDialog(repair: r));
                          _load();
                        },
                      ),
                    );
                  },
                ),
    );
  }
}

class RepairFormDialog extends StatefulWidget {
  final Repair? repair;
  const RepairFormDialog({super.key, this.repair});

  @override
  State<RepairFormDialog> createState() => _RepairFormDialogState();
}

class _RepairFormDialogState extends State<RepairFormDialog> {
  final _db = DatabaseHelper.instance;
  final _problem = TextEditingController();
  final _product = TextEditingController();
  final _estimated = TextEditingController();
  final _finalCharges = TextEditingController();
  final _employee = TextEditingController();
  final _notes = TextEditingController();
  List<Customer> _customers = [];
  int? _customerId;
  String _status = 'Received';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final r = widget.repair;
    _problem.text = r?.problem ?? '';
    _product.text = r?.productName ?? '';
    _estimated.text = r?.estimatedCharges.toString() ?? '';
    _finalCharges.text = r?.finalCharges.toString() ?? '';
    _employee.text = r?.employee ?? '';
    _notes.text = r?.notes ?? '';
    _status = r?.status ?? 'Received';
    _customerId = r?.customerId;
    _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    final list = await _db.getAllCustomers();
    setState(() => _customers = list);
  }

  Future<void> _save() async {
    if (_problem.text.trim().isEmpty) return;
    setState(() => _saving = true);
    final existing = widget.repair;
    final r = Repair(
      id: existing?.id,
      repairId: existing?.repairId ?? '',
      customerId: _customerId ?? 0,
      customerName: _customers
              .firstWhere((c) => c.id == _customerId, orElse: () => Customer(customerId: '', name: ''))
              .name,
      productName: _product.text.trim(),
      problem: _problem.text.trim(),
      receivedDate: existing?.receivedDate ?? DateTime.now(),
      estimatedCharges: double.tryParse(_estimated.text) ?? 0,
      finalCharges: double.tryParse(_finalCharges.text) ?? 0,
      employee: _employee.text.trim(),
      notes: _notes.text.trim(),
      status: _status,
    );
    if (r.repairId.isEmpty) {
      final count = await _db.getAllRepairs();
      r.repairId = 'RPR-${1000 + count.length}';
    }
    if (existing == null) {
      await _db.addRepair(r);
    } else {
      await _db.updateRepair(r);
    }
    if (!mounted) return;
    Navigator.pop(context);
  }

  static const _statuses = [
    'Received', 'Inspection', 'In Repair', 'Ready', 'Delivered'
  ];

  @override
  void dispose() {
    _problem.dispose();
    _product.dispose();
    _estimated.dispose();
    _finalCharges.dispose();
    _employee.dispose();
    _notes.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return AlertDialog(
      title: Text(widget.repair == null ? loc.t('newRepair') : '${loc.t('edit')} - ${widget.repair!.repairId}'),
      content: SizedBox(
        width: 520,
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            DropdownButtonFormField<int?>(
              initialValue: _customerId,
              decoration: InputDecoration(
                labelText: loc.t('selectCustomer'),
                border: const OutlineInputBorder(),
                isDense: true,
              ),
              items: _customers
                  .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                  .toList(),
              onChanged: (v) => setState(() => _customerId = v),
            ),
            const SizedBox(height: 12),
            LabeledField(
              label: loc.t('productName'),
              child: TextField(
                  controller: _product,
                  decoration:
                      const InputDecoration(border: OutlineInputBorder(), isDense: true)),
            ),
            LabeledField(
              label: loc.t('problem'),
              child: TextField(
                  controller: _problem,
                  decoration:
                      const InputDecoration(border: OutlineInputBorder(), isDense: true)),
            ),
            Row(children: [
              Expanded(
                child: LabeledField(
                  label: loc.t('estimatedCharges'),
                  child: MoneyInput(controller: _estimated),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: LabeledField(
                  label: loc.t('finalCharges'),
                  child: MoneyInput(controller: _finalCharges),
                ),
              ),
            ]),
            Row(children: [
              Expanded(
                child: LabeledField(
                  label: loc.t('employee'),
                  child: TextField(
                      controller: _employee,
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(), isDense: true)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: LabeledField(
                  label: loc.t('status'),
                  child: DropdownButtonFormField<String>(
                    initialValue: _status,
                    items: _statuses
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (v) => setState(() => _status = v ?? 'Received'),
                    decoration: const InputDecoration(
                        border: OutlineInputBorder(), isDense: true),
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
