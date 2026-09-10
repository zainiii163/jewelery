import 'package:flutter/material.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/user.dart';
import '../widgets/form_helpers.dart';

class GoldRateScreen extends StatefulWidget {
  const GoldRateScreen({super.key});

  @override
  State<GoldRateScreen> createState() => _GoldRateScreenState();
}

class _GoldRateScreenState extends State<GoldRateScreen> {
  final _db = DatabaseHelper.instance;
  final _r24 = TextEditingController();
  final _r22 = TextEditingController();
  final _r21 = TextEditingController();
  final _r20 = TextEditingController();
  final _r18 = TextEditingController();
  final _silver = TextEditingController();
  List<GoldRate> _history = [];
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final latest = await _db.getLatestGoldRate();
    final history = await _db.getAllGoldRates();
    if (!mounted) return;
    if (latest.rate22k > 0) {
      _r24.text = latest.rate24k == 0 ? '' : latest.rate24k.toString();
      _r22.text = latest.rate22k.toString();
      _r21.text = latest.rate21k == 0 ? '' : latest.rate21k.toString();
      _r20.text = latest.rate20k == 0 ? '' : latest.rate20k.toString();
      _r18.text = latest.rate18k == 0 ? '' : latest.rate18k.toString();
      _silver.text = latest.silverRate == 0 ? '' : latest.silverRate.toString();
    }
    setState(() => _history = history);
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final r = GoldRate(
      date: DateTime.now(),
      rate24k: double.tryParse(_r24.text) ?? 0,
      rate22k: double.tryParse(_r22.text) ?? 0,
      rate21k: double.tryParse(_r21.text) ?? 0,
      rate20k: double.tryParse(_r20.text) ?? 0,
      rate18k: double.tryParse(_r18.text) ?? 0,
      silverRate: double.tryParse(_silver.text) ?? 0,
    );
    await _db.saveGoldRate(r);
    setState(() => _saving = false);
    await _load();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Rates updated successfully')));
  }

  @override
  void dispose() {
    _r24.dispose();
    _r22.dispose();
    _r21.dispose();
    _r20.dispose();
    _r18.dispose();
    _silver.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(title: Text(loc.t('goldRateManagement'))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                Row(children: [
                  Expanded(
                      child: MoneyInput(controller: _r24, label: loc.t('rate24k'))),
                  const SizedBox(width: 12),
                  Expanded(
                      child: MoneyInput(controller: _r22, label: loc.t('rate22k'))),
                ]),
                Row(children: [
                  Expanded(
                      child: MoneyInput(controller: _r21, label: loc.t('rate21k'))),
                  const SizedBox(width: 12),
                  Expanded(
                      child: MoneyInput(controller: _r20, label: loc.t('rate20k'))),
                ]),
                Row(children: [
                  Expanded(
                      child: MoneyInput(controller: _r18, label: loc.t('rate18k'))),
                  const SizedBox(width: 12),
                  Expanded(
                      child: MoneyInput(controller: _silver, label: loc.t('silverRate'))),
                ]),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _saving ? null : _save,
                  icon: const Icon(Icons.save),
                  label: Text(loc.t('updateRates')),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          Text(loc.t('recentTransactions'),
              style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Card(
            child: _history.isEmpty
                ? Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(loc.t('noRecords')))
                : ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: _history.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, i) {
                      final r = _history[i];
                      return ListTile(
                        dense: true,
                        title: Text('${loc.t('rate22k')}: ${r.rate22k.toStringAsFixed(0)}'),
                        subtitle: Text((r.date ?? DateTime.now()).toString().split(' ').first),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
