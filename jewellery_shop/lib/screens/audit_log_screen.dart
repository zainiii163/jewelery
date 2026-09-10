import 'package:flutter/material.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/user.dart';

class AuditLogScreen extends StatefulWidget {
  const AuditLogScreen({super.key});

  @override
  State<AuditLogScreen> createState() => _AuditLogScreenState();
}

class _AuditLogScreenState extends State<AuditLogScreen> {
  final _db = DatabaseHelper.instance;
  List<AuditLog> _logs = [];
  List<Map<String, dynamic>> _logins = [];
  bool _loading = true;
  String _filter = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final all = await _db.getAllAuditLogs();
    final logins = await _db.getLoginHistory();
    if (!mounted) return;
    setState(() {
      _logs = all;
      _logins = logins;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: Text(loc.t('auditLogs')),
          bottom: TabBar(
            tabs: [
              Tab(text: loc.t('activityLogs')),
              Tab(text: loc.t('loginHistoryTitle')),
            ],
          ),
        ),
        body: TabBarView(
          children: [_auditTab(loc), _loginTab(loc)],
        ),
      ),
    );
  }

  Widget _auditTab(dynamic loc) {
    final filtered = _filter.isEmpty
        ? _logs
        : _logs
            .where((l) =>
                l.entityType.toLowerCase().contains(_filter.toLowerCase()) ||
                l.action.toLowerCase().contains(_filter.toLowerCase()) ||
                l.username.toLowerCase().contains(_filter.toLowerCase()) ||
                l.entityId.toLowerCase().contains(_filter.toLowerCase()))
            .toList();
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(10),
        child: TextField(
          onChanged: (v) => setState(() => _filter = v),
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
            : filtered.isEmpty
                ? Center(child: Text(loc.t('noRecords')))
                : ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, i) {
                      final l = filtered[i];
                      return Card(
                        margin: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 3),
                        child: ListTile(
                          leading: _iconFor(l.action),
                          title: Text(
                              '${l.username}  •  ${l.action} ${l.entityType}'),
                          subtitle: Text(
                              '${l.entityId}  →  ${l.details}\n${_fmtTime(l.timestamp)}'),
                          dense: true,
                        ),
                      );
                    },
                  ),
      ),
    ]);
  }

  Widget _loginTab(dynamic loc) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_logins.isEmpty) return Center(child: Text(loc.t('noRecords')));
    return ListView.builder(
      itemCount: _logins.length,
      itemBuilder: (context, i) {
        final r = _logins[i];
        final success = r['outcome'] == 'Success';
        return Card(
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor:
                  (success ? Colors.green : Colors.red).withValues(alpha: 0.15),
              child: Icon(
                success ? Icons.check_circle : Icons.cancel,
                size: 18,
                color: success ? Colors.green : Colors.red,
              ),
            ),
            title: Text(r['username'] ?? ''),
            subtitle: Text(
                '${r['outcome'] ?? ''} — ${_fmtFromStr(r['timestamp'] ?? '')}'
                '${(r['details'] ?? '').toString().isNotEmpty ? ' (${r['details']})' : ''}'),
            dense: true,
          ),
        );
      },
    );
  }

  String _fmtFromStr(String iso) {
    final dt = DateTime.tryParse(iso);
    return dt == null ? iso : _fmtTime(dt);
  }

  Widget _iconFor(String action) {
    final icon = switch (action.toLowerCase()) {
      'invoice' => Icons.receipt,
      'delete' => Icons.delete,
      'pricechange' => Icons.price_change,
      'weightchange' => Icons.scale,
      'paymentchange' => Icons.payments,
      'create' => Icons.add_circle,
      'edit' => Icons.edit,
      _ => Icons.history,
    };
    return CircleAvatar(
      backgroundColor: const Color(0xFFB8860B).withValues(alpha: 0.15),
      child: Icon(icon, size: 18, color: const Color(0xFFB8860B)),
    );
  }

  String _fmtTime(DateTime? dt) {
    if (dt == null) return '-';
    final d = '${dt.day}'.padLeft(2, '0');
    final m = '${dt.month}'.padLeft(2, '0');
    final h = '${dt.hour}'.padLeft(2, '0');
    final mi = '${dt.minute}'.padLeft(2, '0');
    return '$d/$m/${dt.year} $h:$mi';
  }
}