import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/customer.dart';
import 'customer_dialogs.dart';

class CustomerScreen extends StatefulWidget {
  const CustomerScreen({super.key});

  @override
  State<CustomerScreen> createState() => _CustomerScreenState();
}

class _CustomerScreenState extends State<CustomerScreen> {
  final _db = DatabaseHelper.instance;
  List<Customer> _customers = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _db.getAllCustomers();
    if (!mounted) return;
    setState(() {
      _customers = list;
      _loading = false;
    });
  }

  Future<void> _searchQuery(String q) async {
    final list = q.isEmpty
        ? await _db.getAllCustomers()
        : await _db.searchCustomers(q);
    if (!mounted) return;
    setState(() => _customers = list);
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('customers')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: loc.t('newCustomer'),
            onPressed: () => _openForm(context),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: TextField(
              onChanged: _searchQuery,
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
                : _customers.isEmpty
                    ? Center(child: Text(loc.t('noRecords')))
                    : ListView.builder(
                        itemCount: _customers.length,
                        itemBuilder: (context, i) {
                          final c = _customers[i];
                          return Card(
                            margin: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            child: ListTile(
                              leading: CircleAvatar(
                                child: c.photoPath.isNotEmpty
                                    ? null
                                    : Text(c.name.isNotEmpty
                                        ? c.name[0].toUpperCase()
                                        : '?'),
                              ),
                              title: Text(c.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold)),
                              subtitle: Text(
                                '${c.mobile}${c.city.isNotEmpty ? ' • ${c.city}' : ''}',
                              ),
                              trailing: c.remainingAmount > 0
                                  ? Text(
                                      loc.formatMoney(c.remainingAmount,
                                          _currency),
                                      style: const TextStyle(
                                          color: Colors.red,
                                          fontWeight: FontWeight.bold),
                                    )
                                  : const Text('0'),
                              onTap: () => _openProfile(context, c),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Future<void> _openForm(BuildContext context, [Customer? existing]) async {
    await showDialog(
      context: context,
      builder: (_) => CustomerFormDialog(customer: existing),
    );
    _load();
  }

  Future<void> _openProfile(BuildContext context, Customer c) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CustomerProfileScreen(
          customer: c,
          onChanged: _load,
        ),
      ),
    );
  }

  String get _currency => AppState.instance.settings.currency;
}
