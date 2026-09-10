import 'package:shared_preferences/shared_preferences.dart';

/// Cloud connection settings (server URL, shop credentials, backup policy).
/// Stored in shared_preferences so it also helps data recovery for OCR/backups.
class CloudConfig {
  static const String kBaseUrl = 'cloud_base_url';
  static const String kApiToken = 'cloud_api_token';
  static const String kShopCode = 'cloud_shop_code';
  static const String kDeviceName = 'cloud_device_name';
  static const String kAutoCloud = 'cloud_auto_backup';
  static const String kLocalIntervalMin = 'cloud_local_interval_min';
  static const String kCloudIntervalHour = 'cloud_interval_hour';
  static const String kLastCloudAt = 'cloud_last_backup_at';
  static const String kLastCloudResult = 'cloud_last_backup_result';
  static const String kLocalAuto = 'cloud_local_auto_backup';
  static const String kLastLocalAt = 'cloud_last_local_at';

  String baseUrl = '';
  String apiToken = '';
  String shopCode = '';
  String deviceName = '';
  bool autoCloud = false;
  bool localAuto = true;
  int localIntervalMin = 180;
  int cloudIntervalHour = 24;
  DateTime? lastCloudAt;
  DateTime? lastLocalAt;
  String lastCloudResult = '';

  static final CloudConfig instance = CloudConfig._();

  CloudConfig._();

  Future<void> load() async {
    final sp = await SharedPreferences.getInstance();
    baseUrl = sp.getString(kBaseUrl) ?? '';
    apiToken = sp.getString(kApiToken) ?? '';
    shopCode = sp.getString(kShopCode) ?? '';
    deviceName = sp.getString(kDeviceName) ?? '';
    autoCloud = sp.getBool(kAutoCloud) ?? false;
    localAuto = sp.getBool(kLocalAuto) ?? true;
    localIntervalMin = sp.getInt(kLocalIntervalMin) ?? 180;
    cloudIntervalHour = sp.getInt(kCloudIntervalHour) ?? 24;
    final last = sp.getString(kLastCloudAt);
    lastCloudAt = last != null ? DateTime.tryParse(last) : null;
    lastCloudResult = sp.getString(kLastCloudResult) ?? '';
    final ll = sp.getString(kLastLocalAt);
    lastLocalAt = ll != null ? DateTime.tryParse(ll) : null;
  }

  Future<void> save() async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(kBaseUrl, baseUrl.trim());
    await sp.setString(kApiToken, apiToken.trim());
    await sp.setString(kShopCode, shopCode.trim());
    await sp.setString(kDeviceName, deviceName.trim());
    await sp.setBool(kAutoCloud, autoCloud);
    await sp.setBool(kLocalAuto, localAuto);
    await sp.setInt(kLocalIntervalMin, localIntervalMin);
    await sp.setInt(kCloudIntervalHour, cloudIntervalHour);
    await sp.setString(kLastCloudAt, lastCloudAt?.toIso8601String() ?? '');
    await sp.setString(kLastCloudResult, lastCloudResult);
    await sp.setString(kLastLocalAt, lastLocalAt?.toIso8601String() ?? '');
  }

  /// True when a cloud service (URL + token) is configured.
  bool get configured => baseUrl.isNotEmpty && apiToken.isNotEmpty;

  /// Resolve an endpoint relative to the configured base URL.
  String endpoint(String path) {
    var base = baseUrl.trim();
    if (base.endsWith('/')) base = base.substring(0, base.length - 1);
    return '$base$path';
  }
}