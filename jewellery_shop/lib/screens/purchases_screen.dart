import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/purchase.dart';
import '../models/product.dart';
import '../models/supplier.dart';
import '../widgets/form_helpers.dart';

class PurchasesScreen extends StatefulWidget {
  const PurchasesScreen({super.key});

  @override
  State<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  final _db = DatabaseHelper.instance;
  List<Purchase> _purchases = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _db.getAllPurchases();
    if (!mounted) return;
    setState(() {
      _purchases = list;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('purchases')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: loc.t('newPurchase'),
            onPressed: () async {
              await showDialog(
                  context: context, builder: (_) => const PurchaseFormDialog());
              _load();
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _purchases.isEmpty
              ? Center(child: Text(loc.t('noRecords')))
              : ListView.builder(
                  itemCount: _purchases.length,
                  itemBuilder: (context, i) {
                    final p = _purchases[i];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      child: ListTile(
                        leading: const Icon(Icons.shopping_bag, color: Colors.orange),
                        title: Text(p.productName),
                        subtitle: Text(
                            '${p.purchaseId} • ${p.supplierName} • ${(p.purchaseDate ?? DateTime.now()).toString().split(' ').first}'),
                        trailing: Text(loc.formatMoney(p.totalCost, currency),
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    );
                  },
                ),
    );
  }
}

class PurchaseFormDialog extends StatefulWidget {
  const PurchaseFormDialog({super.key});

  @override
  State<PurchaseFormDialog> createState() => _PurchaseFormDialogState();
}

class _PurchaseFormDialogState extends State<PurchaseFormDialog> {
  final _db = DatabaseHelper.instance;
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _gross = TextEditingController();
  final _stone = TextEditingController();
  final _net = TextEditingController();
  final _rate = TextEditingController();
  final _making = TextEditingController();
  final _paid = TextEditingController();
  List<Supplier> _suppliers = [];
  int? _supplierId;
  String _metalType = 'Gold';
  int _karat = 22;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadSuppliers();
  }

  Future<void> _loadSuppliers() async {
    final list = await _db.getAllSuppliers();
    setState(() => _suppliers = list);
  }

  double get _total {
    final net = double.tryParse(_net.text) ?? 0;
    final rate = double.tryParse(_rate.text) ?? 0;
    final making = double.tryParse(_making.text) ?? 0;
    return (net * rate) + making;
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final count = await _db.getAllPurchases();
    final purchaseId = 'PUR-${1000 + count.length}';
    final total = _total;
    final paid = double.tryParse(_paid.text) ?? 0;

    final p = Purchase(
      purchaseId: purchaseId,
      supplierId: _supplierId ?? 0,
      supplierName: _suppliers
              .firstWhere((s) => s.id == _supplierId, orElse: () => Supplier(supplierId: '', name: ''))
              .name,
      productName: _name.text.trim(),
      purchaseDate: DateTime.now(),
      grossWeight: double.tryParse(_gross.text) ?? 0,
      netWeight: double.tryParse(_net.text) ?? 0,
      purity: _karat.toDouble(),
      karat: _karat,
      rate: double.tryParse(_rate.text) ?? 0,
      makingCharges: double.tryParse(_making.text) ?? 0,
      totalCost: total,
      paid: paid,
      remaining: total - paid,
      paymentMethod: paid >= total ? 'Cash' : 'Credit',
    );
    await _db.addPurchase(p);

    // Create the product and add to inventory
    final prodCount = await _db.getAllProducts();
    final skuBase = _metalType == 'Gold' ? 'JWL' : (_metalType == 'Silver' ? 'SLV' : 'OTH');
    final product = Product(
      productId: '$skuBase-${1000 + prodCount.length}',
      sku: p.purchaseId,
      name: p.productName,
      metalType: _metalType,
      karat: _karat,
      purity: _karat.toDouble(),
      grossWeight: p.grossWeight,
      netWeight: p.netWeight,
      purchaseCost: p.totalCost,
      salePrice: p.totalCost,
      supplierId: p.supplierId,
      quantity: 1,
      status: 'In Stock',
    );
    await _db.addProduct(product);

    // Update supplier outstanding
    if (p.supplierId != 0) {
      final supp = await _db.getSupplier(p.supplierId);
      if (supp != null) {
        supp.outstanding += p.totalCost;
        supp.paid += paid;
        await _db.updateSupplier(supp);
      }
    }

    if (!mounted) return;
    Navigator.pop(context);
  }

  @override
  void dispose() {
    _name.dispose();
    _gross.dispose();
    _stone.dispose();
    _net.dispose();
    _rate.dispose();
    _making.dispose();
    _paid.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final currency = AppState.instance.settings.currency;
    return AlertDialog(
      title: Text(loc.t('newPurchase')),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 560,
          child: Form(
            key: _formKey,
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              DropdownButtonFormField<int?>(
                value: _supplierId,
                decoration: InputDecoration(
                  labelText: loc.t('supplier'),
                  border: const OutlineInputBorder(),
                  isDense: true,
                ),
                items: _suppliers
                    .map((s) => DropdownMenuItem(value: s.id, child: Text(s.name)))
                    .toList(),
                onChanged: (v) => setState(() => _supplierId = v),
              ),
              const SizedBox(height: 12),
              LabeledField(
                label: loc.t('productName'),
                required: true,
                child: TextFormField(
                  controller: _name,
                  validator: (v) => (v == null || v.isEmpty)
                      ? '${loc.t('productName')} *'
                      : null,
                  decoration: const InputDecoration(
                      border: OutlineInputBorder(), isDense: true),
                ),
              ),
              Row(children: [
                Expanded(
                  child: LabeledField(
                    label: loc.t('metalType'),
                    child: DropdownButtonFormField<String>(
                      value: _metalType,
                      items: [
                        DropdownMenuItem(value: 'Gold', child: Text(loc.t('gold'))),
                        DropdownMenuItem(value: 'Silver', child: Text(loc.t('silver'))),
                      ],
                      onChanged: (v) => setState(() => _metalType = v ?? 'Gold'),
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(), isDense: true),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: LabeledField(
                    label: loc.t('karat'),
                    child: DropdownButtonFormField<int>(
                      value: _karat,
                      items: [24, 22, 21, 20, 18]
                          .map((k) => DropdownMenuItem(value: k, child: Text('${k}K')))
                          .toList(),
                      onChanged: (v) => setState(() => _karat = v ?? 22),
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(), isDense: true),
                    ),
                  ),
                ),
              ]),
              Row(children: [
                Expanded(
                    child: WeightInput(controller: _gross, label: loc.t('grossWeight'))),
                const SizedBox(width: 12),
                Expanded(
                    child: WeightInput(controller: _stone, label: loc.t('stoneWeight'))),
                const SizedBox(width: 12),
                Expanded(
                    child: WeightInput(controller: _net, label: loc.t('netWeight'))),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                    child: MoneyInput(controller: _rate, label: loc.t('rate'))),
                const SizedBox(width: 12),
                Expanded(
                    child: MoneyInput(
                        controller: _making, label: loc.t('makingCharges'))),
                const SizedBox(width: 12),
                Expanded(
                    child: MoneyInput(controller: _paid, label: loc.t('paid'))),
              ]),
              const Divider(height: 24),
              Row(children: [
                Expanded(child: Text(loc.t('total'))),
                Text(loc.formatMoney(_total, currency),
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ]),
            ]),
          ),
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
