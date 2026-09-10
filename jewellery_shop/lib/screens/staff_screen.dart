import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../models/user.dart';

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  final _db = DatabaseHelper.instance;
  final _appState = AppState.instance;
  List<User> _users = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final list = await _db.getAllUsers();
    if (!mounted) return;
    setState(() {
      _users = list;
      _loading = false;
    });
  }

  Future<void> _openForm([User? u]) async {
    await showDialog(context: context, builder: (_) => UserFormDialog(user: u));
    _load();
  }

  Future<void> _delete(User u) async {
    if (_appState.currentUser?.role != 'Owner' &&
        _appState.currentUser?.role != 'Manager') {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(context.loc.t('roleRequired'))));
      }
      return;
    }
    if (u.id == _appState.currentUser?.id) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(context.loc.t('cannotDeleteSelf'))));
      }
      return;
    }
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(ctx.loc.t('deleteUser')),
        content: Text('${u.username} (${u.fullName})?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(ctx.loc.t('cancel'))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: Text(ctx.loc.t('delete'))),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await _db.deleteUser(u.id!);
    await _db.addAuditLog(AuditLog(
      timestamp: DateTime.now(),
      userId: _appState.currentUser?.id ?? 0,
      username: _appState.currentUser?.username ?? '',
      action: 'Delete',
      entityType: 'User',
      entityId: u.username,
      details: 'Deleted user ${u.username}',
    ));
    if (mounted) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(context.loc.t('userDeleted'))));
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(
        title: Text(loc.t('staff')),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: loc.t('addUser'),
            onPressed: () => _openForm(),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: _users.length,
              itemBuilder: (context, i) {
                final u = _users[i];
                final isSelf = u.id == _appState.currentUser?.id;
                return Card(
                  margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: u.role == 'Owner' ? const Color(0xFFB8860B) : Colors.blueGrey,
                      child: Text(u.username.isNotEmpty
                          ? u.username[0].toUpperCase()
                          : '?'),
                    ),
                    title: Row(children: [
                      Flexible(
                          child: Text('${u.username}${isSelf ? ' (you)' : ''}',
                              style: const TextStyle(fontWeight: FontWeight.bold))),
                      const SizedBox(width: 8),
                      _roleChip(u.role),
                    ]),
                    subtitle: Text(u.fullName.isEmpty ? '-' : u.fullName),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                            icon: const Icon(Icons.edit),
                            onPressed: () => _openForm(u)),
                        IconButton(
                            icon: const Icon(Icons.delete),
                            onPressed: () => _delete(u)),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _roleChip(String role) {
    final color = switch (role) {
      'Owner' => Colors.amber,
      'Manager' => Colors.indigo,
      'Accountant' => Colors.teal,
      _ => Colors.grey,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(role, style: TextStyle(fontSize: 11, color: color.shade900)),
    );
  }
}

class UserFormDialog extends StatefulWidget {
  final User? user;
  const UserFormDialog({super.key, this.user});

  @override
  State<UserFormDialog> createState() => _UserFormDialogState();
}

class _UserFormDialogState extends State<UserFormDialog> {
  final _db = DatabaseHelper.instance;
  final _username = TextEditingController();
  final _fullName = TextEditingController();
  final _password = TextEditingController();
  final _pin = TextEditingController();
  String _role = 'Manager';
  bool _isActive = true;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    if (widget.user != null) {
      _username.text = widget.user!.username;
      _fullName.text = widget.user!.fullName;
      _password.text = widget.user!.passwordHash;
      _pin.text = widget.user!.pin;
      _role = widget.user!.role;
      _isActive = widget.user!.isActive;
    }
  }

  @override
  void dispose() {
    _username.dispose();
    _fullName.dispose();
    _password.dispose();
    _pin.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (_username.text.trim().isEmpty) return;
    setState(() => _saving = true);
    // Uniqueness check
    final existing = await _db.getUserByUsername(_username.text.trim());
    if (existing != null && existing.id != widget.user?.id) {
      setState(() => _saving = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${context.loc.t('username')} taken')));
      }
      return;
    }
    final u = User(
      id: widget.user?.id,
      username: _username.text.trim(),
      passwordHash: _password.text.trim().isEmpty
          ? (widget.user?.passwordHash ?? '')
          : _password.text.trim(),
      fullName: _fullName.text.trim(),
      role: _role,
      pin: _pin.text.trim().isEmpty ? (widget.user?.pin ?? '') : _pin.text.trim(),
      isActive: _isActive,
    );
    if (widget.user == null) {
      await _db.addUser(u);
    } else {
      await _db.updateUser(u);
    }
    final who = AppState.instance.currentUser;
    await _db.addAuditLog(AuditLog(
      timestamp: DateTime.now(),
      userId: who?.id ?? 0,
      username: who?.username ?? '',
      action: widget.user == null ? 'Create' : 'Edit',
      entityType: 'User',
      entityId: u.username,
      details: '${widget.user == null ? 'Created' : 'Edited'} user ${u.username} (${u.role})',
    ));
    if (mounted) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(context.loc.t('userSaved'))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return AlertDialog(
      title: Text(widget.user == null ? loc.t('addUser') : loc.t('editUser')),
      content: SizedBox(
        width: 380,
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(
                controller: _username,
                decoration: InputDecoration(labelText: loc.t('username'))),
            const SizedBox(height: 10),
            TextField(
                controller: _fullName,
                decoration: InputDecoration(labelText: loc.t('fullName'))),
            const SizedBox(height: 10),
            TextField(
                controller: _password,
                obscureText: true,
                decoration: InputDecoration(
                    labelText: '${loc.t('password')} (blank = keep current)')),
            const SizedBox(height: 10),
            TextField(
                controller: _pin,
                keyboardType: TextInputType.number,
                decoration: InputDecoration(labelText: loc.t('pin'))),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _role,
              decoration: const InputDecoration(
                  border: OutlineInputBorder(), labelText: 'Role'),
              items: const [
                DropdownMenuItem(value: 'Owner', child: Text('Owner')),
                DropdownMenuItem(value: 'Manager', child: Text('Manager')),
                DropdownMenuItem(value: 'Salesman', child: Text('Salesman')),
                DropdownMenuItem(value: 'Accountant', child: Text('Accountant')),
              ],
              onChanged: (v) => setState(() => _role = v ?? 'Manager'),
            ),
            const SizedBox(height: 12),
            Row(children: [
              const Text('Active'),
              Switch(
                  value: _isActive,
                  onChanged: (v) => setState(() => _isActive = v)),
            ]),
          ]),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(loc.t('cancel'))),
        TextButton(
          onPressed: _saving ? null : _save,
          child: Text(loc.t('save')),
        ),
      ],
    );
  }
}