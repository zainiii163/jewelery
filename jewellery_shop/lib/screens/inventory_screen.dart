import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/inventory_move.dart';
import '../models/product.dart';
import '../models/user.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _db = DatabaseHelper.instance;

  List<Product> _products = [];
  List<InventoryMove> _moves = [];
  Map<String, dynamic> _summary = {};
  String _search = '';
  String _statusFilter = 'All';
  bool _loading = true;

  static const List<String> _statuses = [
    'All',
    'In Stock',
    'Sold',
    'Reserved',
    'Repair',
    'Exchanged',
    'Returned',
    'Lost',
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final products = await _db.getAllProducts();
    final moves = await _db.getInventoryMoves();
    final summary = await _db.getInventorySummary();
    if (!mounted) return;
    setState(() {
      _products = products;
      _moves = moves;
      _summary = summary;
      _loading = false;
    });
  }

  List<Product> get _filtered {
    final q = _search.toLowerCase();
    return _products.where((p) {
      final matchStatus =
          _statusFilter == 'All' || p.status == _statusFilter;
      if (!matchStatus) return false;
      if (q.isEmpty) return true;
      return p.name.toLowerCase().contains(q) ||
          p.productId.toLowerCase().contains(q) ||
          p.barcode.toLowerCase().contains(q);
    }).toList();
  }

  Future<void> _adjust(Product p) async {
    final loc = context.loc;
    String? status = p.status;
    final note = TextEditingController();
    final changed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('${loc.t('adjustStock')} - ${p.name}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: status,
              decoration: InputDecoration(labelText: loc.t('status')),
              items: [
                for (final s in const [
                  'In Stock',
                  'Reserved',
                  'Sold',
                  'Repair',
                  'Exchanged',
                  'Returned',
                  'Lost'
                ])
                  DropdownMenuItem(value: s, child: Text(s)),
              ],
              onChanged: (v) => status = v,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: note,
              decoration:
                  InputDecoration(labelText: loc.t('notes'), isDense: true),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(loc.t('cancel'))),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(loc.t('save'))),
        ],
      ),
    );
    if (changed != true || status == null) return;
    await _db.updateProductStatus(p.id!, status!);
    await _db.addInventoryMove(InventoryMove(
      productId: p.id,
      productName: p.name,
      date: DateTime.now(),
      type: 'Adjustment',
      metalType: p.metalType,
      weight: p.netWeight,
      quantity: p.quantity.toDouble(),
      notes: 'Status: ${p.status} -> $status. $note.text',
    ));
    await _db.addAuditLog(AuditLog(
      timestamp: DateTime.now(),
      userId: AppState.instance.currentUser?.id ?? 0,
      username: AppState.instance.currentUser?.username ?? '',
      action: 'Edit',
      entityType: 'Inventory',
      entityId: p.productId,
      details: 'Status: ${p.status} -> $status',
    ));
    _load();
  }

  Future<void> _recordMove(Product p) async {
    final loc = context.loc;
    String type = 'Stock Out';
    final weight = TextEditingController(text: p.netWeight.toStringAsFixed(3));
    final qty = TextEditingController(text: p.quantity.toString());
    final note = TextEditingController();
    final saved = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('${loc.t('recordMove')} - ${p.name}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: type,
              decoration: InputDecoration(labelText: loc.t('moveType')),
              items: [
                for (final t in const [
                  'Stock In',
                  'Stock Out',
                  'Transfer',
                  'Adjustment',
                  'Damage',
                  'Lost'
                ])
                  DropdownMenuItem(value: t, child: Text(t)),
              ],
              onChanged: (v) => type = v ?? 'Stock Out',
            ),
            const SizedBox(height: 8),
            TextField(
              controller: weight,
              keyboardType:
                  const TextInputType.numberWithOptions(decimal: true),
              decoration:
                  InputDecoration(labelText: '${loc.t('weight')} (g)'),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: qty,
              keyboardType: const TextInputType.numberWithOptions(),
              decoration: InputDecoration(labelText: loc.t('quantity')),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: note,
              decoration:
                  InputDecoration(labelText: loc.t('notes'), isDense: true),
            ),
          ],
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(loc.t('cancel'))),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(loc.t('save'))),
        ],
      ),
    );
    if (saved != true) return;
    await _db.addInventoryMove(InventoryMove(
      productId: p.id,
      productName: p.name,
      date: DateTime.now(),
      type: type,
      metalType: p.metalType,
      weight: double.tryParse(weight.text) ?? p.netWeight,
      quantity: double.tryParse(qty.text) ?? p.quantity.toDouble(),
      notes: note.text,
    ));
    await _db.addAuditLog(AuditLog(
      timestamp: DateTime.now(),
      userId: AppState.instance.currentUser?.id ?? 0,
      username: AppState.instance.currentUser?.username ?? '',
      action: 'Create',
      entityType: 'Inventory',
      entityId: p.productId,
      details: '$type ${weight.text}g',
    ));
    _load();
  }

  Future<void> _showProductMoves(Product p) async {
    final loc = context.loc;
    final moves = await _db.getInventoryMoves(productId: p.id);
    if (!mounted) return;
    final currency = AppState.instance.settings.currency;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('${loc.t('inventoryMoves')} - ${p.name}'),
        content: SizedBox(
          width: 460,
          child: moves.isEmpty
              ? Text(loc.t('noRecords'))
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: moves.length,
                  itemBuilder: (context, i) {
                    final m = moves[i];
                    return ListTile(
                      dense: true,
                      leading: Icon(_typeIcon(m.type)),
                      title: Text(m.type),
                      subtitle: Text(
                          '${m.date?.toLocal().toString().split(' ').first ?? ''}'
                          '${m.notes.isNotEmpty ? ' - ${m.notes}' : ''}'),
                      trailing: Text(
                          '${loc.formatWeight(m.weight)}g ($currency${m.quantity})',
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                    );
                  },
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

  IconData _typeIcon(String type) {
    switch (type) {
      case 'Stock In':
        return Icons.south;
      case 'Stock Out':
        return Icons.north;
      case 'Damage':
        return Icons.warning_amber;
      case 'Lost':
        return Icons.dangerous;
      case 'Adjustment':
        return Icons.tune;
      default:
        return Icons.swap_horiz;
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(loc.t('inventory')),
          bottom: TabBar(
            tabs: [
              Tab(text: loc.t('inventorySummary')),
              Tab(text: loc.t('inventoryMoves')),
            ],
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                children: [
                  _productsTab(loc),
                  _historyTab(loc),
                ],
              ),
      ),
    );
  }

  Widget _productsTab(dynamic loc) {
    final currency = AppState.instance.settings.currency;
    return Column(children: [
      _summaryRow(loc, currency),
      Padding(
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
        child: TextField(
          onChanged: (v) => setState(() => _search = v),
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.search),
            hintText: loc.t('search'),
            isDense: true,
          ),
        ),
      ),
      SizedBox(
        height: 40,
        child: ListView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          children: [
            for (final s in _statuses)
              Padding(
                padding: const EdgeInsets.all(4),
                child: ChoiceChip(
                  label: Text(s),
                  selected: _statusFilter == s,
                  onSelected: (_) => setState(() => _statusFilter = s),
                ),
              ),
          ],
        ),
      ),
      Expanded(
        child: _filtered.isEmpty
            ? Center(child: Text(loc.t('noRecords')))
            : ListView.builder(
                itemCount: _filtered.length,
                itemBuilder: (context, i) {
                  final p = _filtered[i];
                  return Card(
                    margin: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    child: ListTile(
                      dense: true,
                      leading: Icon(
                        p.metalType == 'Gold'
                            ? Icons.workspace_premium
                            : Icons.circle_outlined,
                        color: const Color(0xFFB8860B),
                      ),
                      title: Text('${p.productId} - ${p.name}'),
                      subtitle: Text(
                          '${p.metalType} ${p.karat}K | ${loc.formatWeight(p.netWeight)}g | '
                          '${loc.formatMoney(p.salePrice, currency)}'),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Chip(
                            label: Text(p.status,
                                style: const TextStyle(fontSize: 11)),
                            visualDensity: VisualDensity.compact,
                          ),
                          PopupMenuButton<String>(
                            onSelected: (v) {
                              if (v == 'adjust') _adjust(p);
                              if (v == 'move') _recordMove(p);
                              if (v == 'history') _showProductMoves(p);
                            },
                            itemBuilder: (_) => [
                              PopupMenuItem(
                                  value: 'adjust',
                                  child: Text(loc.t('adjustStock'))),
                              PopupMenuItem(
                                  value: 'move',
                                  child: Text(loc.t('recordMove'))),
                              PopupMenuItem(
                                  value: 'history',
                                  child: Text(loc.t('inventoryMoves'))),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    ]);
  }

  Widget _summaryRow(dynamic loc, String currency) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(children: [
        _summaryCard(loc, loc.t('goldStock'),
            '${loc.formatWeight((_summary['goldWeight'] ?? 0).toDouble())}g',
            const Color(0xFFB8860B)),
        _summaryCard(loc, loc.t('silverStock'),
            '${loc.formatWeight((_summary['silverWeight'] ?? 0).toDouble())}g',
            Colors.blueGrey),
        _summaryCard(loc, loc.t('stockInCount'),
            '${_summary['inStock'] ?? 0}', Colors.green),
        _summaryCard(loc, loc.t('lossDamaged'),
            '${_summary['damaged'] ?? 0}', Colors.red),
      ]),
    );
  }

  Widget _summaryCard(dynamic loc, String label, String value, Color color) {
    return Expanded(
      child: Card(
        color: color.withValues(alpha: 0.08),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(children: [
            Text(label,
                style: const TextStyle(fontSize: 12),
                overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(value,
                style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: color)),
          ]),
        ),
      ),
    );
  }

  Widget _historyTab(dynamic loc) {
    if (_moves.isEmpty) return Center(child: Text(loc.t('noRecords')));
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _moves.length,
      itemBuilder: (context, i) {
        final m = _moves[i];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 2),
          child: ListTile(
            dense: true,
            leading: Icon(_typeIcon(m.type)),
            title: Text('${m.productName} - ${m.type}'),
            subtitle: Text(
                '${m.date?.toLocal().toString().split(' ').first ?? ''}'
                '${m.notes.isNotEmpty ? ' - ${m.notes}' : ''}'),
            trailing: Text(
                '${loc.formatWeight(m.weight)}g (qty ${m.quantity})',
                style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        );
      },
    );
  }
}