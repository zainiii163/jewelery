import 'package:flutter/material.dart';
import '../data/cloud_config.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/website.dart';
import '../services/cloud_sync.dart';
import '../services/sync_engine.dart';

class WebsiteScreen extends StatefulWidget {
  const WebsiteScreen({super.key});

  @override
  State<WebsiteScreen> createState() => _WebsiteScreenState();
}

class _WebsiteScreenState extends State<WebsiteScreen> {
  final _sync = CloudSyncService(CloudConfig.instance);
  List<OnlineOrder> _orders = [];
  List<WebsiteAppointment> _appointments = [];
  List<WebsiteCustomRequest> _customRequests = [];
  bool _loading = true;
  int _tab = 0;

  @override
  void initState() {
    super.initState();
    _init();
  }

  /// Offline-first: show the latest cached data immediately, then refresh
  /// from the server in the background.
  Future<void> _init() async {
    if (!_sync.configured) {
      setState(() => _loading = false);
      return;
    }
    final orders = await SyncEngine.instance.cachedOrders();
    final apts = await SyncEngine.instance.cachedAppointments();
    final reqs = await SyncEngine.instance.cachedCustomRequests();
    if (!mounted) return;
    setState(() {
      _orders = orders;
      _appointments = apts;
      _customRequests = reqs;
      _loading = false;
    });
    _pull();
  }

  Future<void> _pull() async {
    if (!_sync.configured) {
      setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    try {
      final orders = await _sync.fetchOrders();
      final apts = await _sync.fetchAppointments();
      final reqs = await _sync.fetchCustomRequests();
      if (!mounted) return;
      setState(() {
        _orders = orders;
        _appointments = apts;
        _customRequests = reqs;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final usedCache = _orders.isNotEmpty ||
          _appointments.isNotEmpty ||
          _customRequests.isNotEmpty;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('$e${usedCache ? ' · ${context.loc.t('offlineData')}' : ''}')));
    }
  }

  Future<void> _setOrderStatus(OnlineOrder o, String status) async {
    try {
      await _sync.updateOrder(o.id, status: status);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('$e')));
      return;
    }
    if (!mounted) return;
    setState(() {
      final i = _orders.indexWhere((x) => x.id == o.id);
      if (i != -1) _orders[i].status = status;
    });
  }

  Future<void> _setAppointmentStatus(
      WebsiteAppointment a, String status) async {
    try {
      await _sync.updateAppointment(a.id, status: status);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('$e')));
      return;
    }
    if (!mounted) return;
    setState(() {
      final i = _appointments.indexWhere((x) => x.id == a.id);
      if (i != -1) _appointments[i].status = status;
    });
  }

  Future<void> _setRequestStatus(
      WebsiteCustomRequest r, String status) async {
    try {
      await _sync.updateCustomRequest(r.id, status: status);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text('$e')));
      return;
    }
    if (!mounted) return;
    setState(() {
      final i = _customRequests.indexWhere((x) => x.id == r.id);
      if (i != -1) _customRequests[i].status = status;
    });
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('website')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: loc.t('pullFromWebsite'),
            onPressed: _loading ? null : _pull,
          ),
        ],
      ),
      body: !_sync.configured
          ? Center(child: Text(loc.t('configureCloudFirst')))
          : DefaultTabController(
              length: 3,
              child: Column(children: [
                TabBar(
                  onTap: (i) => setState(() => _tab = i),
                  tabs: [
                    Tab(text: loc.t('orders')),
                    Tab(text: loc.t('appointments')),
                    Tab(text: loc.t('customRequests')),
                  ],
                ),
                Expanded(
                  child: _loading
                      ? const Center(child: CircularProgressIndicator())
                      : IndexedStack(
                          index: _tab,
                          children: [
                            _ordersTab(loc),
                            _appointmentsTab(loc),
                            _customRequestsTab(loc),
                          ],
                        ),
                ),
              ]),
            ),
    );
  }

  Widget _ordersTab(dynamic loc) {
    if (_orders.isEmpty) return Center(child: Text(loc.t('noRecords')));
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _orders.length,
      itemBuilder: (context, i) {
        final o = _orders[i];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text(o.orderNumber,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15)),
                const Spacer(),
                Chip(
                  label: Text(o.status,
                      style: const TextStyle(fontSize: 11)),
                  backgroundColor: o.status == 'Pending'
                      ? Colors.orange.shade100
                      : Colors.green.shade100,
                  visualDensity: VisualDensity.compact,
                ),
              ]),
              const SizedBox(height: 4),
              Text('${o.customerName}  ${o.city.isNotEmpty ? '• ${o.city}' : ''}',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              Text(
                  '${o.customerPhone}${o.customerPhone.isNotEmpty && o.address.isNotEmpty ? ' • ' : ''}${o.address}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[700])),
              const SizedBox(height: 6),
              ...o.items
                  .map((it) => Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Text(
                            '• ${it.productName} ×${it.qty} — ${loc.formatMoney(it.lineTotal, 'Rs.')}',
                            style: const TextStyle(fontSize: 13)),
                      )),
              const Divider(height: 14),
              Row(children: [
                Text(
                    '${loc.t('total')}: ${loc.formatMoney(o.grandTotal, 'Rs.')}',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                Text(loc.t('payments'), style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 6),
                DropdownButton<String>(
                  value: o.status,
                  isDense: true,
                  onChanged: (v) => v == null ? null : _setOrderStatus(o, v),
                  items: WebsiteStatuses.orders
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                ),
              ]),
            ]),
          ),
        );
      },
    );
  }

  Widget _appointmentsTab(dynamic loc) {
    if (_appointments.isEmpty) return Center(child: Text(loc.t('noRecords')));
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _appointments.length,
      itemBuilder: (context, i) {
        final a = _appointments[i];
        final d = a.date;
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: ListTile(
            title: Text('${a.name} — ${a.purpose}',
                style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(
                '${d != null ? '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}' : '?'}'
                ' ${a.time} • ${a.phone}'),
            trailing: DropdownButton<String>(
              value: a.status,
              isDense: true,
              onChanged: (v) => v == null ? null : _setAppointmentStatus(a, v),
              items: WebsiteStatuses.appointments
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
            ),
          ),
        );
      },
    );
  }

  Widget _customRequestsTab(dynamic loc) {
    if (_customRequests.isEmpty) return Center(child: Text(loc.t('noRecords')));
    return ListView.builder(
      padding: const EdgeInsets.all(8),
      itemCount: _customRequests.length,
      itemBuilder: (context, i) {
        final r = _customRequests[i];
        return Card(
          margin: const EdgeInsets.symmetric(vertical: 4),
          child: ListTile(
            title: Text(r.name, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text(
                '${r.jewelleryType} (${r.metal}${r.karat != null ? ' ${r.karat}K' : ''})'
                '${r.budget != null ? ' • ${loc.formatMoney(r.budget!, 'Rs.')}' : ''}\n'
                '${r.description} • ${r.phone}'),
            isThreeLine: true,
            trailing: DropdownButton<String>(
              value: r.status,
              isDense: true,
              onChanged: (v) => v == null ? null : _setRequestStatus(r, v),
              items: WebsiteStatuses.customRequests
                  .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                  .toList(),
            ),
          ),
        );
      },
    );
  }
}