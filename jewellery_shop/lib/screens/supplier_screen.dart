import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/supplier.dart';
import '../widgets/form_helpers.dart';

class SupplierScreen extends StatefulWidget {
  const SupplierScreen({super.key});

  @override
  State<SupplierScreen> createState() => _SupplierScreenState();
}

class _SupplierScreenState extends State<SupplierScreen> {
  final _db = DatabaseHelper.instance;
  List<Supplier> _suppliers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _db.getAllSuppliers();
    if (!mounted) return;
    setState(() {
      _suppliers = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('suppliers')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: loc.t('newSupplier'),
            onPressed: () async {
              await showDialog(
                  context: context, builder: (_) => const SupplierFormDialog());
              _load();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _suppliers.isEmpty
              ? Center(child: Text(loc.t('noRecords')))
              : ListView.builder(
                  itemCount: _suppliers.length,
                  itemBuilder: (context, i) {
                    final s = _suppliers[i];
                    return Card(
                      margin:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      child: ListTile(
                        leading: CircleAvatar(child: Text(s.name.isNotEmpty ? s.name[0].toUpperCase() : '?')),
                        title: Text(s.name),
                        subtitle: Text('${s.phone} • ${s.company}'),
                        trailing: Text(
                          loc.formatMoney(s.remaining, currency),
                          style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: s.remaining > 0 ? Colors.deepOrange : Colors.green),
                        ),
                        onTap: () async {
                          await showDialog(
                              context: context,
                              builder: (_) => SupplierFormDialog(supplier: s));
                          _load();
                        },
                      ),
                    );
                  },
                ),
    );
  }
}

class SupplierFormDialog extends StatefulWidget {
  final Supplier? supplier;
  const SupplierFormDialog({super.key, this.supplier});

  @override
  State<SupplierFormDialog> createState() => _SupplierFormDialogState();
}

class _SupplierFormDialogState extends State<SupplierFormDialog> {
  final _db = DatabaseHelper.instance;
  final _name = TextEditingController();
  final _company = TextEditingController();
  final _phone = TextEditingController();
  final _whatsapp = TextEditingController();
  final _address = TextEditingController();
  final _cnic = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final s = widget.supplier;
    _name.text = s?.name ?? '';
    _company.text = s?.company ?? '';
    _phone.text = s?.phone ?? '';
    _whatsapp.text = s?.whatsapp ?? '';
    _address.text = s?.address ?? '';
    _cnic.text = s?.cnic ?? '';
  }

  Future<void> _save() async {
    if (_name.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Name required')));
      return;
    }
    setState(() => _saving = true);
    final existing = widget.supplier;
    final s = Supplier(
      id: existing?.id,
      supplierId: existing?.supplierId ?? '',
      name: _name.text.trim(),
      company: _company.text.trim(),
      phone: _phone.text.trim(),
      whatsapp: _whatsapp.text.trim(),
      address: _address.text.trim(),
      cnic: _cnic.text.trim(),
      outstanding: existing?.outstanding ?? 0,
      paid: existing?.paid ?? 0,
      registeredDate: existing?.registeredDate ?? DateTime.now(),
    );
    if (s.supplierId.isEmpty) {
      final count = await _db.getAllSuppliers();
      s.supplierId = 'SUP-${1000 + count.length}';
    }
    if (existing == null) {
      await _db.addSupplier(s);
    } else {
      await _db.updateSupplier(s);
    }
    if (!mounted) return;
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _name.dispose();
    _company.dispose();
    _phone.dispose();
    _whatsapp.dispose();
    _address.dispose();
    _cnic.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return AlertDialog(
      title: Text(widget.supplier == null
          ? loc.t('newSupplier')
          : '${loc.t('edit')} - ${widget.supplier!.name}'),
      content: SizedBox(
        width: 500,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          LabeledField(
            label: loc.t('name'),
            required: true,
            child: TextField(
                controller: _name,
                decoration: const InputDecoration(
                    border: OutlineInputBorder(), isDense: true)),
          ),
          LabeledField(
            label: loc.t('company'),
            child: TextField(
                controller: _company,
                decoration: const InputDecoration(
                    border: OutlineInputBorder(), isDense: true)),
          ),
          Row(children: [
            Expanded(
              child: LabeledField(
                label: loc.t('phone'),
                child: TextField(
                    controller: _phone,
                    decoration: const InputDecoration(
                        border: OutlineInputBorder(), isDense: true)),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: LabeledField(
                label: loc.t('whatsapp'),
                child: TextField(
                    controller: _whatsapp,
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
          LabeledField(
            label: loc.t('cnic'),
            child: TextField(
                controller: _cnic,
                decoration: const InputDecoration(
                    border: OutlineInputBorder(), isDense: true)),
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
