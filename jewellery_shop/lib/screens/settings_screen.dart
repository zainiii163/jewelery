import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/user.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _appState = AppState.instance;
  final _name = TextEditingController();
  final _address = TextEditingController();
  final _phone = TextEditingController();
  final _whatsapp = TextEditingController();
  final _currency = TextEditingController();
  final _tax = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final s = _appState.settings;
    _name.text = s.shopName;
    _address.text = s.address;
    _phone.text = s.phone;
    _whatsapp.text = s.whatsapp;
    _currency.text = s.currency;
    _tax.text = s.taxRate.toString();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final s = ShopSettings(
      shopName: _name.text.trim(),
      address: _address.text.trim(),
      phone: _phone.text.trim(),
      whatsapp: _whatsapp.text.trim(),
      logoPath: _appState.settings.logoPath,
      language: _appState.settings.language,
      invoiceLanguage: _appState.settings.invoiceLanguage,
      currency: _currency.text.trim().isEmpty ? 'Rs.' : _currency.text.trim(),
      taxRate: double.tryParse(_tax.text) ?? 0,
    );
    await _appState.saveShopSettings(s);
    setState(() => _saving = false);
    if (!mounted) return;
    ScaffoldMessenger.of(context)
        .showSnackBar(const SnackBar(content: Text('Settings saved')));
  }

  @override
  void dispose() {
    _name.dispose();
    _address.dispose();
    _phone.dispose();
    _whatsapp.dispose();
    _currency.dispose();
    _tax.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(title: Text(loc.t('settings'))),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Text(loc.t('shopName'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                TextField(
                    controller: _name,
                    decoration: const InputDecoration(
                        border: OutlineInputBorder(), isDense: true)),
                const SizedBox(height: 12),
                TextField(
                    controller: _address,
                    decoration: InputDecoration(
                        labelText: loc.t('address'),
                        border: const OutlineInputBorder(),
                        isDense: true)),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                      child: TextField(
                          controller: _phone,
                          decoration: InputDecoration(
                              labelText: loc.t('phone'),
                              border: const OutlineInputBorder(),
                              isDense: true))),
                  const SizedBox(width: 12),
                  Expanded(
                      child: TextField(
                          controller: _whatsapp,
                          decoration: InputDecoration(
                              labelText: loc.t('whatsapp'),
                              border: const OutlineInputBorder(),
                              isDense: true))),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                      child: TextField(
                          controller: _currency,
                          decoration: InputDecoration(
                              labelText: loc.t('currency'),
                              border: const OutlineInputBorder(),
                              isDense: true))),
                  const SizedBox(width: 12),
                  Expanded(
                      child: TextField(
                          controller: _tax,
                          keyboardType:
                              const TextInputType.numberWithOptions(decimal: true),
                          decoration: InputDecoration(
                              labelText: loc.t('taxRate'),
                              border: const OutlineInputBorder(),
                              isDense: true))),
                ]),
                const SizedBox(height: 16),
                FilledButton.icon(
                    onPressed: _saving ? null : _save,
                    icon: const Icon(Icons.save),
                    label: Text(loc.t('save'))),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Text(loc.t('language'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                RadioListTile<String>(
                  title: Text(loc.t('english')),
                  value: 'en',
                  groupValue: _appState.settings.language,
                  onChanged: (v) {
                    _appState.setLanguage(v!);
                    setState(() {});
                  },
                ),
                RadioListTile<String>(
                  title: Text(loc.t('urdu')),
                  value: 'ur',
                  groupValue: _appState.settings.language,
                  onChanged: (v) {
                    _appState.setLanguage(v!);
                    setState(() {});
                  },
                ),
                const Divider(),
                Text(loc.t('invoiceLanguage'),
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                RadioListTile<String>(
                  title: Text(loc.t('english')),
                  value: 'en',
                  groupValue: _appState.settings.invoiceLanguage,
                  onChanged: (v) {
                    _appState.setInvoiceLanguage(v!);
                    setState(() {});
                  },
                ),
                RadioListTile<String>(
                  title: Text(loc.t('urdu')),
                  value: 'ur',
                  groupValue: _appState.settings.invoiceLanguage,
                  onChanged: (v) {
                    _appState.setInvoiceLanguage(v!);
                    setState(() {});
                  },
                ),
                RadioListTile<String>(
                  title: Text(loc.t('both')),
                  value: 'both',
                  groupValue: _appState.settings.invoiceLanguage,
                  onChanged: (v) {
                    _appState.setInvoiceLanguage(v!);
                    setState(() {});
                  },
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
