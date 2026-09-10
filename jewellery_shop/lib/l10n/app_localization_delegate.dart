import 'package:flutter/material.dart';
import 'app_localizations.dart';

class AppLocalizationDelegate extends LocalizationsDelegate<AppLocalizations> {
  const AppLocalizationDelegate();

  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('ur'),
  ];

  @override
  bool isSupported(Locale locale) =>
      locale.languageCode == 'en' || locale.languageCode == 'ur';

  @override
  Future<AppLocalizations> load(Locale locale) async {
    return AppLocalizations(locale);
  }

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) =>
      false;
}

extension AppLocExt on BuildContext {
  AppLocalizations get loc => Localizations.of<AppLocalizations>(this, AppLocalizations)!;
}

abstract class AppLocalizationsDirection {
  static Locale localeOf(BuildContext context) =>
      Localizations.localeOf(context);
  static bool isRTL(BuildContext context) =>
      AppLocalizations.isRTL(localeOf(context));
}
