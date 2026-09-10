import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/cloud_config.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/product.dart';
import '../services/barcode_pdf.dart';
import '../services/cloud_sync.dart';
import '../services/sync_engine.dart';
import '../widgets/form_helpers.dart';

class ProductScreen extends StatefulWidget {
  const ProductScreen({super.key});

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> {
  final _db = DatabaseHelper.instance;
  List<Product> _products = [];
  bool _loading = true;
  String _search = '';
  String _statusFilter = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    var list = await _db.getAllProducts();
    if (_statusFilter.isNotEmpty) {
      list = list.where((p) => p.status == _statusFilter).toList();
    }
    if (_search.isNotEmpty) {
      list = list
          .where((p) =>
              p.name.toLowerCase().contains(_search.toLowerCase()) ||
              p.productId.toLowerCase().contains(_search.toLowerCase()) ||
              p.barcode.toLowerCase().contains(_search.toLowerCase()))
          .toList();
    }
    if (!mounted) return;
    setState(() {
      _products = list;
      _loading = false;
    });
  }

  Future<void> _openForm([Product? p]) async {
    await showDialog(
        context: context, builder: (_) => ProductFormDialog(product: p));
    _load();
  }

  Future<void> _printLabels() async {
    if (_products.isEmpty) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Print Labels'),
        content: Text('Print labels for ${_products.length} products?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('PRINT / PDF')),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await BarcodePdf.printLabels(
          _products, AppState.instance.settings);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('products')),
        actions: [
          DropdownButton<String>(
            value: _statusFilter.isEmpty ? null : _statusFilter,
            hint: Text(loc.t('status')),
            underline: const SizedBox(),
            dropdownColor: Colors.white,
            items: [
              DropdownMenuItem(value: '', child: Text(loc.t('status'))),
              DropdownMenuItem(value: 'In Stock', child: Text(loc.t('inStock'))),
              DropdownMenuItem(value: 'Sold', child: Text(loc.t('sold'))),
            ],
            onChanged: (v) {
              setState(() => _statusFilter = v ?? '');
              _load();
            },
          ),
          IconButton(
            icon: const Icon(Icons.qr_code_2),
            tooltip: 'Print Labels',
            onPressed: _printLabels,
          ),
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: loc.t('newProduct'),
            onPressed: () => _openForm(),
          ),
        ],
      ),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            onChanged: (v) {
              _search = v;
              _load();
            },
            decoration: InputDecoration(
              hintText: loc.t('search'),
              prefixIcon: const Icon(Icons.search),
              border: const OutlineInputBorder(),
            ),
          ),
        ),
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _products.isEmpty
                  ? Center(child: Text(loc.t('noRecords')))
                  : ListView.builder(
                      itemCount: _products.length,
                      itemBuilder: (context, i) {
                        final p = _products[i];
                        return Card(
                          margin: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          child: ListTile(
                            leading: CircleAvatar(
                              backgroundColor: p.metalType == 'Gold'
                                  ? const Color(0xFFB8860B)
                                  : p.metalType == 'Silver'
                                      ? Colors.blueGrey
                                      : Colors.teal,
                              child: Text(
                                p.metalType == 'Gold'
                                    ? 'G'
                                    : p.metalType == 'Silver'
                                        ? 'S'
                                        : 'O',
                                style: const TextStyle(color: Colors.white),
                              ),
                            ),
                            title: Row(children: [
                              Flexible(
                                child: Text(p.name,
                                    style: const TextStyle(
                                        fontWeight: FontWeight.bold),
                                    overflow: TextOverflow.ellipsis),
                              ),
                              const SizedBox(width: 8),
                              Text('${p.metalType}-${p.karat}K',
                                  style: const TextStyle(
                                      color: Color(0xFFB8860B),
                                      fontSize: 12)),
                            ]),
                            subtitle: Text(
                                '${p.productId} • ${p.netWeight.toStringAsFixed(3)}g • ${p.status}'),
                            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                              if (p.published)
                                const Padding(
                                  padding: EdgeInsets.only(right: 6),
                                  child: Icon(Icons.public,
                                      color: Colors.teal, size: 20),
                                ),
                              IconButton(
                                icon: const Icon(Icons.edit),
                                onPressed: () => _openForm(p),
                              ),
                            ]),
                            onTap: () => _openForm(p),
                          ),
                        );
                      },
                    ),
        ),
      ]),
    );
  }
}

class ProductFormDialog extends StatefulWidget {
  final Product? product;
  const ProductFormDialog({super.key, this.product});

  @override
  State<ProductFormDialog> createState() => _ProductFormDialogState();
}

class _ProductFormDialogState extends State<ProductFormDialog> {
  final _db = DatabaseHelper.instance;
  final _formKey = GlobalKey<FormState>();
  late final _name = TextEditingController(text: widget.product?.name ?? '');
  late final _sku = TextEditingController(text: widget.product?.sku ?? '');
  late final _category =
      TextEditingController(text: widget.product?.category ?? '');
  late final _subcategory =
      TextEditingController(text: widget.product?.subcategory ?? '');
  late final _design = TextEditingController(
      text: widget.product?.designNumber ?? '');
  late final _gross = TextEditingController(
      text: widget.product?.grossWeight.toString() ?? '');
  late final _stone = TextEditingController(
      text: widget.product?.stoneWeight.toString() ?? '');
  late final _net = TextEditingController(
      text: widget.product?.netWeight.toString() ?? '');
  late final _making = TextEditingController(
      text: widget.product?.makingCharges.toString() ?? '');
  late final _purchaseCost = TextEditingController(
      text: widget.product?.purchaseCost.toString() ?? '');
  late final _salePrice = TextEditingController(
      text: widget.product?.salePrice.toString() ?? '');
  late final _location =
      TextEditingController(text: widget.product?.location ?? '');
  late final _description =
      TextEditingController(text: widget.product?.description ?? '');

  late String _metalType = widget.product?.metalType ?? 'Gold';
  late int _karat = widget.product?.karat ?? 22;
  late String _status = widget.product?.status ?? 'In Stock';
  late int _quantity = widget.product?.quantity ?? 1;
  late bool _published = widget.product?.published ?? false;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _sku.dispose();
    _category.dispose();
    _subcategory.dispose();
    _design.dispose();
    _gross.dispose();
    _stone.dispose();
    _net.dispose();
    _making.dispose();
    _purchaseCost.dispose();
    _salePrice.dispose();
    _location.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final loc = context.loc;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _saving = true);

    final p = Product(
      id: widget.product?.id,
      productId: widget.product?.productId ?? '',
      sku: _sku.text.trim(),
      barcode: widget.product?.barcode ?? _sku.text.trim(),
      name: _name.text.trim(),
      category: _category.text.trim(),
      subcategory: _subcategory.text.trim(),
      metalType: _metalType,
      designNumber: _design.text.trim(),
      grossWeight: double.tryParse(_gross.text) ?? 0,
      stoneWeight: double.tryParse(_stone.text) ?? 0,
      netWeight: double.tryParse(_net.text) ?? 0,
      purity: _karat.toDouble(),
      karat: _karat,
      makingCharges: double.tryParse(_making.text) ?? 0,
      purchaseCost: double.tryParse(_purchaseCost.text) ?? 0,
      salePrice: double.tryParse(_salePrice.text) ?? 0,
      supplierId: widget.product?.supplierId ?? 0,
      location: _location.text.trim(),
      datePurchased: widget.product?.datePurchased ?? DateTime.now(),
      status: _status,
      photosPath: widget.product?.photosPath ?? '',
      description: _description.text.trim(),
      quantity: _quantity,
      published: _published,
    );

    if (p.productId.isEmpty) {
      final count = await _db.getAllProducts();
      final skuBase = _metalType == 'Gold' ? 'JWL' : (_metalType == 'Silver' ? 'SLV' : 'OTH');
      p.productId = '$skuBase-${1000 + count.length}';
    }

    if (widget.product == null) {
      await _db.addProduct(p);
    } else {
      await _db.updateProduct(p);
    }

    String? syncMsg;
    if (_published || widget.product?.published == true) {
      final sync = CloudSyncService(CloudConfig.instance);
      try {
        final msg = await sync.publishProduct(p, publish: _published);
        if (_published) {
          final n = await sync.pushProductMedia(p);
          syncMsg = '$msg · $n files';
        } else {
          syncMsg = msg;
        }
      } catch (e) {
        syncMsg = '${loc.t('websiteSyncFailed')}: $e';
      }
      // Guarantee eventual sync: keep this SKU dirty for the auto sync engine,
      // which retries when the server becomes reachable.
      await SyncEngine.instance.markDirty(p.sku.isNotEmpty
          ? p.sku
          : p.productId);
    }

    if (!mounted) return;
    Navigator.pop(context);
    messenger.showSnackBar(
        SnackBar(content: Text(syncMsg ?? loc.t('saved'))));
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return AlertDialog(
      title: Text(widget.product == null
          ? loc.t('newProduct')
          : '${loc.t('edit')} - ${widget.product!.name}'),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 620,
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                          DropdownMenuItem(value: 'Other', child: Text(loc.t('other'))),
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
                  const SizedBox(width: 12),
                  Expanded(
                    child: LabeledField(
                      label: loc.t('quantity'),
                      child: DropdownButtonFormField<int>(
                        value: _quantity,
                        items: [1, 2, 3, 4, 5]
                            .map((q) => DropdownMenuItem(value: q, child: Text('$q')))
                            .toList(),
                        onChanged: (v) => setState(() => _quantity = v ?? 1),
                        decoration: const InputDecoration(
                            border: OutlineInputBorder(), isDense: true),
                      ),
                    ),
                  ),
                ]),
                Row(children: [
                  Expanded(
                    child: WeightInput(
                        controller: _gross, label: loc.t('grossWeight')),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: WeightInput(
                        controller: _stone, label: loc.t('stoneWeight')),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: WeightInput(
                        controller: _net, label: loc.t('netWeight')),
                  ),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: MoneyInput(
                        controller: _making, label: loc.t('makingCharges')),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: MoneyInput(
                        controller: _purchaseCost, label: loc.t('purchaseCost')),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: MoneyInput(
                        controller: _salePrice, label: loc.t('salePrice')),
                  ),
                ]),
                Row(children: [
                  Expanded(
                    child: LabeledField(
                      label: loc.t('sku'),
                      child: TextField(
                          controller: _sku,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LabeledField(
                      label: loc.t('category'),
                      child: TextField(
                          controller: _category,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LabeledField(
                      label: loc.t('subcategory'),
                      child: TextField(
                          controller: _subcategory,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                ]),
                Row(children: [
                  Expanded(
                    child: LabeledField(
                      label: loc.t('designNumber'),
                      child: TextField(
                          controller: _design,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: LabeledField(
                      label: loc.t('location'),
                      child: TextField(
                          controller: _location,
                          decoration: const InputDecoration(
                              border: OutlineInputBorder(), isDense: true)),
                    ),
                  ),
                ]),
                LabeledField(
                  label: loc.t('status'),
                  child: DropdownButtonFormField<String>(
                    value: _status,
                    items: [
                      'In Stock', 'Sold', 'Reserved', 'Returned',
                      'Exchanged', 'Repair', 'Lost/Damaged'
                    ]
                        .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                        .toList(),
                    onChanged: (v) => setState(() => _status = v ?? 'In Stock'),
                    decoration: const InputDecoration(
                        border: OutlineInputBorder(), isDense: true),
                  ),
                ),
                const SizedBox(height: 8),
                SwitchListTile(
                  title: Text(loc.t('publishOnline')),
                  subtitle: Text(loc.t('publishOnlineHint')),
                  value: _published,
                  contentPadding: EdgeInsets.zero,
                  onChanged: (v) => setState(() => _published = v),
                ),
                const SizedBox(height: 8),
                LabeledField(
                  label: loc.t('description'),
                  child: TextField(
                      controller: _description,
                      maxLines: 2,
                      decoration: const InputDecoration(
                          border: OutlineInputBorder(), isDense: true)),
                ),
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
