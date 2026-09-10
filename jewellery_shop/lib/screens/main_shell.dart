import 'dart:async';
import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/cloud_config.dart';
import '../l10n/app_localization_delegate.dart';
import '../services/backup_manager.dart';
import '../services/sync_engine.dart';
import 'dashboard_screen.dart';
import 'customer_screen.dart';
import 'product_screen.dart';
import 'inventory_screen.dart';
import 'sales_screen.dart';
import 'exchange_screen.dart';
import 'purchases_screen.dart';
import 'supplier_screen.dart';
import 'expense_screen.dart';
import 'repair_screen.dart';
import 'ledger_screen.dart';
import 'payment_screen.dart';
import 'reports_screen.dart';
import 'staff_screen.dart';
import 'audit_log_screen.dart';
import 'backup_screen.dart';
import 'settings_screen.dart';
import 'gold_rate_screen.dart';
import 'website_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;
  final AppState _appState = AppState.instance;
  static const int _idleMinutes = 15;
  Timer? _idleTimer;
  DateTime _lastActivity = DateTime.now();

  @override
  void initState() {
    super.initState();
    // Fire-and-forget: run due local/cloud backups after login.
    BackupManager.instance.runOnStartup();
    // Automatic website sync (publish dirty products, pull activity).
    SyncEngine.instance.startAutoTimer();
    _idleTimer =
        Timer.periodic(const Duration(seconds: 20), (_) => _checkIdle());
  }

  @override
  void dispose() {
    _idleTimer?.cancel();
    super.dispose();
  }

  void _onActivity() => _lastActivity = DateTime.now();

  void _checkIdle() {
    final idle = DateTime.now().difference(_lastActivity);
    if (idle > const Duration(minutes: _idleMinutes)) {
      _logout();
    }
  }

  void _logout() {
    _idleTimer?.cancel();
    final loc = context.loc;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
          content: Text('${loc.t('logoutAfterIdle')} ($_idleMinutes '
              '${loc.t('idleMinutes')})')));
    _appState.logout();
    Navigator.of(context).pushNamedAndRemoveUntil('/', (_) => false);
  }

  final List<Widget> _screens = const [
    DashboardScreen(),
    CustomerScreen(),
    ProductScreen(),
    InventoryScreen(),
    SalesScreen(),
    ExchangeScreen(),
    PurchasesScreen(),
    SupplierScreen(),
    ExpenseScreen(),
    RepairScreen(),
    LedgerScreen(),
    PaymentScreen(),
    ReportsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('appTitle')),
        actions: [
          _buildSyncBadge(context),
          _buildOfflineBadge(context),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'settings') {
                Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const SettingsScreen()));
              } else if (value == 'rates') {
                Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const GoldRateScreen()));
              } else if (value == 'backup') {
                Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const BackupScreen()));
              } else if (value == 'website') {
                Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const WebsiteScreen()));
              } else if (value == 'sync') {
                _runSyncNow();
              } else if (value == 'staff') {
                Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const StaffScreen()));
              } else if (value == 'audit') {
                Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const AuditLogScreen()));
              } else if (value == 'logout') {
                _logout();
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(value: 'rates', child: Text(loc.t('goldRateManagement'))),
              PopupMenuItem(value: 'website', child: Text(loc.t('onlineOrders'))),
              PopupMenuItem(value: 'sync', child: Text(loc.t('syncNow'))),
              PopupMenuItem(value: 'staff', child: Text(loc.t('staff'))),
              PopupMenuItem(value: 'audit', child: Text(loc.t('auditLogs'))),
              PopupMenuItem(value: 'backup', child: Text(loc.t('backup'))),
              PopupMenuItem(value: 'settings', child: Text(loc.t('settings'))),
              PopupMenuItem(value: 'logout', child: Text(loc.t('logout'))),
            ],
          ),
        ],
      ),
      body: Listener(
        onPointerDown: (_) => _onActivity(),
        onPointerMove: (_) => _onActivity(),
        child: Row(
          children: [
            NavigationRail(
            selectedIndex: _selectedIndex,
            onDestinationSelected: (i) => setState(() => _selectedIndex = i),
            labelType: NavigationRailLabelType.all,
            backgroundColor: const Color(0xFFF5F5F5),
            destinations: [
              _rail(Icons.dashboard, loc.t('dashboard')),
              _rail(Icons.people, loc.t('customers')),
              _rail(Icons.diamond, loc.t('products')),
              _rail(Icons.inventory_2, loc.t('inventory')),
              _rail(Icons.shopping_cart, loc.t('sales')),
              _rail(Icons.swap_horiz, loc.t('exchange')),
              _rail(Icons.shopping_bag, loc.t('purchases')),
              _rail(Icons.factory, loc.t('suppliers')),
              _rail(Icons.payments, loc.t('expenses')),
              _rail(Icons.build, loc.t('repairs')),
              _rail(Icons.menu_book, loc.t('ledger')),
              _rail(Icons.paid, loc.t('payments')),
              _rail(Icons.bar_chart, loc.t('reports')),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 200),
              child: KeyedSubtree(
                key: ValueKey(_selectedIndex),
                child: _screens[_selectedIndex],
              ),
            ),
          ),
        ],
        ),
      ),
    );
  }

  NavigationRailDestination _rail(IconData icon, String label) {
    return NavigationRailDestination(
      icon: Icon(icon),
      label: Text(label, overflow: TextOverflow.ellipsis),
    );
  }

  Future<void> _runSyncNow() async {
    final result = await SyncEngine.instance.fullSync();
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(result)));
  }

  Widget _buildSyncBadge(BuildContext context) {
    final loc = context.loc;
    return ListenableBuilder(
      listenable: SyncEngine.instance,
      builder: (context, _) {
        final sync = SyncEngine.instance;
        if (!CloudConfig.instance.configured) return const SizedBox.shrink();
        final String tooltip;
        final String label;
        Widget icon;
        if (sync.isSyncing) {
          tooltip = loc.t('syncNow');
          label = loc.t('syncing');
          icon = const SizedBox(
              width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2));
        } else if (sync.pendingCount > 0) {
          tooltip = '${loc.t('pendingSync')}: ${sync.pendingCount}';
          label = '${loc.t('pendingSync')}: ${sync.pendingCount}';
          icon = const Icon(Icons.cloud_upload, size: 16, color: Colors.orange);
        } else if (sync.lastError != null) {
          tooltip = sync.lastError!;
          label = loc.t('syncFailed');
          icon = const Icon(Icons.cloud_off, size: 16, color: Colors.red);
        } else {
          final when = sync.lastSyncAt;
          tooltip = when == null
              ? loc.t('syncNow')
              : '${loc.t('synced')}: ${_fmt(when)}';
          label = loc.t('synced');
          icon = const Icon(Icons.cloud_done, size: 16, color: Color(0xFF00875A));
        }
        return Padding(
          padding: const EdgeInsets.only(right: 4),
          child: Tooltip(
            message: tooltip,
            child: Chip(
              avatar: icon,
              label: Text(label, style: const TextStyle(fontSize: 12)),
              backgroundColor: Colors.blue.shade50,
              visualDensity: VisualDensity.compact,
            ),
          ),
        );
      },
    );
  }

  String _fmt(DateTime t) {
    final now = DateTime.now();
    final d = now.difference(t);
    if (d.inMinutes < 1) return '${d.inSeconds}s';
    if (d.inHours < 1) return '${d.inMinutes}m';
    if (d.inDays < 1) return '${d.inHours}h';
    return '${d.inDays}d';
  }

  Widget _buildOfflineBadge(BuildContext context) {
    final loc = context.loc;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: Chip(
        avatar: const Icon(Icons.cloud_off, size: 16, color: Colors.green),
        label: Text(
          loc.t('offlineMode'),
          style: const TextStyle(fontSize: 12),
        ),
        backgroundColor: Colors.green.shade50,
      ),
    );
  }
}
