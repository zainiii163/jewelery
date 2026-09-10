import 'package:flutter/material.dart';
import '../models/user.dart';
import 'database_helper.dart';

class AppState extends ChangeNotifier {
  AppState._();
  static final AppState instance = AppState._();

  DatabaseHelper get db => DatabaseHelper.instance;
  User? currentUser;
  ShopSettings _settings = ShopSettings();
  bool initialized = false;

  ShopSettings get settings => _settings;
  String get language => _settings.language;

  Future<void> init() async {
    _settings = await db.getSettings();
    initialized = true;
    notifyListeners();
  }

  Future<void> setLanguage(String lang) async {
    _settings.language = lang;
    await db.saveSettings(_settings);
    notifyListeners();
  }

  Future<void> setInvoiceLanguage(String lang) async {
    _settings.invoiceLanguage = lang;
    await db.saveSettings(_settings);
    notifyListeners();
  }

  Future<void> saveShopSettings(ShopSettings s) async {
    _settings = s;
    await db.saveSettings(_settings);
    notifyListeners();
  }

  Locale get locale => Locale(language);

  void setCurrentUser(User user) {
    currentUser = user;
    notifyListeners();
  }

  void logout() {
    currentUser = null;
    notifyListeners();
  }
}
