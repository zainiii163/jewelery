import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'l10n/app_localization_delegate.dart';
import 'l10n/app_localizations.dart';
import 'data/app_state.dart';
import 'data/cloud_config.dart';
import 'data/database_helper.dart';
import 'models/user.dart';
import 'screens/login_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize SQLite FFI for desktop (Windows/Linux)
  if (Platform.isWindows || Platform.isLinux) {
    sqfliteFfiInit();
    // Required so the global openDatabase API uses the FFI factory on desktop
    databaseFactory = databaseFactoryFfi;
  }

  // Load cloud/backup preferences
  await CloudConfig.instance.load();

  // Set up database in a stable app-directory location
  final appState = AppState.instance;
  try {
    final docsDir = await getApplicationSupportDirectory();
    DatabaseHelper.instance.setDbDirectory(docsDir.path);
  } catch (_) {
    // fallback to default databases path
  }
  await appState.init();

  // Create default owner account if no users exist
  final users = await _ensureDefaultUser();

  runApp(JewelleryApp(appState: appState, hasDefaultUser: users));

  // Apply locale direction for RTL (handled in JewelleryApp)
}

Future<bool> _ensureDefaultUser() async {
  final db = DatabaseHelper.instance;
  final existing = await db.getAllUsers();
  if (existing.isEmpty) {
    await db.addUser(User(
      username: 'admin',
      passwordHash: 'admin',
      fullName: 'Owner',
      role: 'Owner',
      pin: '1234',
    ));
    return false; // no users existed, default created, first login required
  }
  return true;
}

class JewelleryApp extends StatefulWidget {
  final AppState appState;
  final bool hasDefaultUser;
  const JewelleryApp(
      {super.key, required this.appState, required this.hasDefaultUser});

  @override
  State<JewelleryApp> createState() => _JewelleryAppState();
}

class _JewelleryAppState extends State<JewelleryApp> {
  @override
  Widget build(BuildContext context) {
    final isRTL = AppLocalizations.isRTL(widget.appState.locale);
    return MaterialApp(
      title: 'Jewellery Shop Manager',
      debugShowCheckedModeBanner: false,
      theme: _buildTheme(),
      locale: widget.appState.locale,
      localizationsDelegates: const [
        AppLocalizationDelegate(),
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [Locale('en'), Locale('ur')],
      // Rebuild MaterialApp when appState changes (language change)
      builder: (context, child) {
        return AnimatedBuilder(
          animation: widget.appState,
          builder: (context, _) {
            return Directionality(
              textDirection:
                  isRTL ? TextDirection.rtl : TextDirection.ltr,
              child: child ?? const SizedBox(),
            );
          },
        );
      },
      home: const LoginScreen(),
    );
  }

  ThemeData _buildTheme() {
    final scheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFFB8860B),
      brightness: Brightness.light,
    );
    return ThemeData(
      colorScheme: scheme,
      useMaterial3: true,
      appBarTheme: AppBarTheme(
        backgroundColor: scheme.primary,
        foregroundColor: Colors.white,
      ),
      cardTheme: const CardThemeData(elevation: 2),
    );
  }
}
