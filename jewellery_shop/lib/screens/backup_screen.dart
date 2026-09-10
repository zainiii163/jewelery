import 'dart:io';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as p;
import '../data/cloud_config.dart';
import '../data/database_helper.dart';
import '../l10n/app_localization_delegate.dart';
import '../services/backup_manager.dart';
import '../services/cloud_backup.dart';

class BackupScreen extends StatefulWidget {
  const BackupScreen({super.key});

  @override
  State<BackupScreen> createState() => _BackupScreenState();
}

class _BackupScreenState extends State<BackupScreen> {
  final _db = DatabaseHelper.instance;
  bool _working = false;
  String? _message;
  final _url = TextEditingController();
  final _token = TextEditingController();
  final _shopCode = TextEditingController();
  final _password = TextEditingController();
  bool _autoCloud = false;
  CloudConfig get _cfg => CloudConfig.instance;

  @override
  void initState() {
    super.initState();
    _syncFromConfig();
  }

  void _syncFromConfig() {
    _url.text = _cfg.baseUrl;
    _token.text = _cfg.apiToken;
    _shopCode.text = _cfg.shopCode;
    _autoCloud = _cfg.autoCloud;
  }

  @override
  void dispose() {
    _url.dispose();
    _token.dispose();
    _shopCode.dispose();
    _password.dispose();
    super.dispose();
  }

  void _setWorking(bool v) => setState(() => _working = v);

  void _msg(String? m) => setState(() => _message = m);

  Future<void> _saveConfig() async {
    _cfg.baseUrl = _url.text;
    _cfg.apiToken = _token.text;
    _cfg.shopCode = _shopCode.text;
    _cfg.autoCloud = _autoCloud;
    await _cfg.save();
  }

  Future<void> _backupNow() async {
    _setWorking(true);
    _msg(null);
    try {
      final dest = await BackupManager.instance.createLocalBackup();
      _msg('Local backup created: $dest');
    } catch (e) {
      _msg('Backup failed: $e');
    } finally {
      _setWorking(false);
    }
  }

  Future<void> _restore() async {
    _setWorking(true);
    _msg(null);
    try {
      final picked = await FilePicker.pickFile(
          type: FileType.custom, allowedExtensions: ['db']);
      if (picked == null || picked.path == null) {
        _setWorking(false);
        return;
      }
      final src = File(picked.path!);
      final dbPath = await _db.currentDbPath();
      await src.copy(dbPath);
      _msg('Restore complete. Please restart the application.');
    } catch (e) {
      _msg('Restore failed: $e');
    } finally {
      _setWorking(false);
    }
  }

  Future<void> _test() async {
    await _saveConfig();
    _setWorking(true);
    _msg(null);
    try {
      if (!_cfg.configured) {
        _msg('Not configured — set server URL + API token first.');
        return;
      }
      final r = await CloudBackupService(_cfg).ping();
      _msg(r);
    } catch (e) {
      _msg('$e');
    } finally {
      _setWorking(false);
    }
  }

  Future<void> _login() async {
    await _saveConfig();
    _setWorking(true);
    _msg(null);
    try {
      if (_shopCode.text.trim().isEmpty || _password.text.trim().isEmpty) {
        _msg('Enter shop code and password.');
        return;
      }
      final r =
          await CloudBackupService(_cfg).login(_password.text.trim());
      _msg(r);
      _syncFromConfig();
      _password.clear();
    } catch (e) {
      _msg('$e');
    } finally {
      _setWorking(false);
    }
  }

  Future<void> _pushCloud() async {
    await _saveConfig();
    _setWorking(true);
    _msg(null);
    try {
      final r = await BackupManager.instance.pushCloud();
      _msg('Cloud backup: $r');
    } catch (e) {
      _msg('$e');
    } finally {
      _setWorking(false);
    }
  }

  Future<void> _restoreCloud() async {
    await _saveConfig();
    _setWorking(true);
    _msg(null);
    try {
      final tmp = Directory.systemTemp.path;
      final dl = p.join(tmp, 'jewellery_shop_cloud_restore.db');
      final r = await BackupManager.instance.restoreFromCloud(dl);
      await File(dl).copy(await _db.currentDbPath());
      _msg(r);
    } catch (e) {
      _msg('$e');
    } finally {
      _setWorking(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    return Scaffold(
      appBar: AppBar(title: Text(loc.t('backup'))),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 620),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ---- Local ----
                Text('LOCAL (SQLite)',
                    style: TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.green.shade700)),
                const SizedBox(height: 8),
                Row(children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _working ? null : _backupNow,
                      icon: const Icon(Icons.save),
                      label: Text(loc.t('backupNow')),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _working ? null : _restore,
                      icon: const Icon(Icons.restore),
                      label: Text(loc.t('restore')),
                    ),
                  ),
                ]),
                const Divider(height: 40),
                // ---- Cloud ----
                Text('CLOUD BACKUP & SYNC (Laravel API)',
                    style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.indigo.shade700)),
                const SizedBox(height: 12),
                TextField(
                    controller: _url,
                    decoration: const InputDecoration(
                        labelText: 'Server URL',
                        hintText: 'https://shop.example.com',
                        border: OutlineInputBorder())),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(
                    child: TextField(
                        controller: _shopCode,
                        decoration: const InputDecoration(
                            labelText: 'Shop Code',
                            border: OutlineInputBorder())),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                        controller: _token,
                        obscureText: true,
                        decoration: const InputDecoration(
                            labelText: 'API Token',
                            border: OutlineInputBorder())),
                  ),
                ]),
                const SizedBox(height: 10),
                TextField(
                    controller: _password,
                    obscureText: true,
                    decoration: const InputDecoration(
                        labelText: 'Shop Password (login)',
                        border: OutlineInputBorder())),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _working ? null : _test,
                      icon: const Icon(Icons.wifi_tethering),
                      label: const Text('Test Connection'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _working ? null : _login,
                      icon: const Icon(Icons.login),
                      label: const Text('Login'),
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(
                    child: FilledButton.icon(
                      onPressed: _working ? null : _pushCloud,
                      icon: const Icon(Icons.cloud_upload),
                      label: const Text('Backup to Cloud'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _working ? null : _restoreCloud,
                      icon: const Icon(Icons.cloud_download),
                      label: const Text('Restore from Cloud'),
                    ),
                  ),
                ]),
                const SizedBox(height: 12),
                SwitchListTile(
                  value: _autoCloud,
                  title: const Text('Automatic cloud backup'),
                  subtitle: const Text('On startup, if due'),
                  onChanged: (v) {
                  setState(() => _autoCloud = v);
                  _cfg.autoCloud = v;
                  _cfg.save();
                },
                  contentPadding: EdgeInsets.zero,
                ),
                if (_cfg.configured) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Last cloud backup: ${_cfg.lastCloudAt?.toLocal().toString() ?? 'never'}\n${_cfg.lastCloudResult}',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
                if (_message != null) ...[
                  const SizedBox(height: 16),
                  Text(_message!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.teal)),
                ],
                const Divider(height: 40),
                Text(loc.t('encryptionNote'),
                    style: TextStyle(
                        fontSize: 12,
                        color: Colors.amber.shade800,
                        height: 1.4)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}