import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _summary;
  List<Map<String, dynamic>> _transactions = [];
  final AppState _appState = AppState.instance;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final db = DatabaseHelper.instance;
    final summary = await db.getDashboardSummary();
    final txn = await db.getRecentTransactions(limit: 8);
    if (!mounted) return;
    setState(() {
      _summary = summary;
      _transactions = txn;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final s = _summary;
    return RefreshIndicator(
      onRefresh: _load,
      child: s == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(loc.t('dashboard'),
                    style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 16),
                // Today's key figures
                Row(children: [
                  _statCard(context, loc.t('todaySales'),
                      loc.formatMoney(s['todaySales'], currencySymbol),
                      Icons.today, Colors.blue),
                  _statCard(context, loc.t('todayPurchases'),
                      loc.formatMoney(s['todayPurchases'], currencySymbol),
                      Icons.shopping_bag, Colors.orange),
                  _statCard(context, loc.t('profit'),
                      loc.formatMoney(s['profit'], currencySymbol),
                      Icons.trending_up, Colors.green),
                ]),
                const SizedBox(height: 16),
                Row(children: [
                  _statCard(context, loc.t('totalCustomers'),
                      '${s['totalCustomers']}', Icons.people, Colors.purple),
                  _statCard(context, loc.t('totalProducts'),
                      '${s['totalProducts']}', Icons.diamond, Colors.teal),
                  _statCard(context, loc.t('monthlySales'),
                      loc.formatMoney(s['monthlySales'], currencySymbol),
                      Icons.calendar_month, Colors.indigo),
                ]),
                const SizedBox(height: 16),
                Row(children: [
                  _statCard(context, loc.t('goldStock'),
                      '${loc.formatKg(s['goldStock'])} g', Icons.circle,
                      const Color(0xFFB8860B)),
                  _statCard(context, loc.t('silverStock'),
                      '${loc.formatKg(s['silverStock'])} g', Icons.circle_outlined,
                      Colors.blueGrey),
                  _statCard(context, loc.t('cashBalance'),
                      loc.formatMoney(s['cashBalance'], currencySymbol),
                      Icons.payments, Colors.cyan),
                ]),
                const SizedBox(height: 16),
                Row(children: [
                  _statCard(context, loc.t('receivables'),
                      loc.formatMoney(s['receivables'], currencySymbol),
                      Icons.arrow_upward, Colors.red),
                  _statCard(context, loc.t('payables'),
                      loc.formatMoney(s['payables'], currencySymbol),
                      Icons.arrow_downward, Colors.deepOrange),
                  _statCard(context, loc.t('pendingRepairs'),
                      '${s['pendingRepairs']}', Icons.build, Colors.brown),
                ]),
                const SizedBox(height: 24),
                Text(loc.t('recentTransactions'),
                    style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                Card(
                  child: _transactions.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(16),
                          child: Text(loc.t('noRecords')))
                      : ListView.separated(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: _transactions.length,
                          separatorBuilder: (_, _) =>
                              const Divider(height: 1),
                          itemBuilder: (context, i) {
                            final t = _transactions[i];
                            return ListTile(
                              dense: true,
                              leading: Icon(
                                t['type'] == 'Sale'
                                    ? Icons.shopping_cart
                                    : t['type'] == 'Payment'
                                        ? Icons.paid
                                        : Icons.shopping_bag,
                                color: t['type'] == 'Sale'
                                    ? Colors.green
                                    : t['type'] == 'Payment'
                                        ? Colors.blue
                                        : Colors.orange,
                              ),
                              title: Text('${t['type']} - ${t['name'] ?? ''}'),
                              subtitle: Text(t['refId'] ?? ''),
                              trailing: Text(
                                loc.formatMoney(
                                    (t['amount'] ?? 0).toDouble(),
                                    currencySymbol),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
    );
  }

  String get currencySymbol => _appState.settings.currency;

  Widget _statCard(BuildContext context, String title, String value,
      IconData icon, Color color) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(title,
                      style: const TextStyle(fontSize: 12),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis),
                ),
              ]),
              const SizedBox(height: 8),
              Text(value,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}
