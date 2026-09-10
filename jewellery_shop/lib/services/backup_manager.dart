import 'dart:io';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import '../data/cloud_config.dart';
import '../data/database_helper.dart';
import 'cloud_backup.dart';

/// Handles local rolling backups and (optionally) cloud pushes.
/// Uses SQLite's online backup API for consistent copies.
class BackupManager {
  static final BackupManager instance = BackupManager._();
  BackupManager._();

  static const int _keepLocal = 12;

  Future<Directory> _backupDir() async {
    final docs = await getDownloadsDirectory();
    final dir = Directory(p.join(
        docs?.path ?? Directory.systemTemp.path, 'JewelleryShopBackups'));
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }

  /// Creates a consistent local copy of the database. Returns its path.
  Future<String> createLocalBackup() async {
    final db = await DatabaseHelper.instance.database;
    final dir = await _backupDir();
    final stamp = DateTime.now()
        .toIso8601String()
        .replaceAll(':', '-')
        .split('.')
        .first;
    final dest = p.join(dir.path, 'backup_$stamp.db');
    // Consistent snapshot via SQLite's VACUUM INTO.
    final safe = dest.replaceAll("'", "''");
    await db.rawQuery("VACUUM INTO '$safe'");
    // Prune old backups, keep newest N.
    final files = dir
        .listSync()
        .whereType<File>()
        .where((f) => p.basename(f.path).startsWith('backup_') && f.path.endsWith('.db'))
        .toList()
      ..sort((a, b) => b.path.compareTo(a.path));
    for (final f in files.skip(_keepLocal)) {
      try {
        f.deleteSync();
      } catch (_) {}
    }
    return dest;
  }

  /// Called on app start (after login). Runs due local/cloud backups.
  Future<void> runOnStartup() async {
    final cfg = CloudConfig.instance;
    final now = DateTime.now();
    try {
      // Local rolling backup if due.
      final lastLocal = cfg.lastLocalAt ?? now.subtract(const Duration(hours: 24));
      if (cfg.localAuto &&
          now.difference(lastLocal).inMinutes >= cfg.localIntervalMin) {
        await createLocalBackup();
        cfg.lastLocalAt = DateTime.now();
        await cfg.save();
      }
    } catch (e) {
      // never block startup on backup failure
    }
    try {
      if (cfg.autoCloud && cfg.configured) {
        final lastCloud = cfg.lastCloudAt ?? now.subtract(const Duration(hours: 48));
        if (now.difference(lastCloud).inHours >= cfg.cloudIntervalHour) {
          await _pushCloud();
        }
      }
    } catch (e) {
      // offline or misconfigured — retry next time
    }
  }

  /// Forces a cloud upload. Returns the service message.
  Future<String> _pushCloud() async {
    final svc = CloudBackupService(CloudConfig.instance);
    final local = await createLocalBackup();
    final msg = await svc.pushBackup(File(local));
    final cfg = CloudConfig.instance;
    cfg.lastCloudAt = DateTime.now();
    cfg.lastCloudResult = '$msg at ${DateTime.now().toIso8601String()}';
    await cfg.save();
    return msg;
  }

  Future<String> pushCloud() {
    final cfg = CloudConfig.instance;
    if (!cfg.configured) {
      throw Exception(
          'Cloud not configured. Open Settings to add server URL + API token.');
    }
    return _pushCloud();
  }

  /// Restores the latest cloud backup over the local database (restart needed).
  Future<String> restoreFromCloud(String destPath) async {
    final svc = CloudBackupService(CloudConfig.instance);
    final size = await svc.fetchLatest(destPath);
    return 'Restored $size bytes. Restart the app to use it.';
  }
}