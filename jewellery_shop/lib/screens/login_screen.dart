import 'package:flutter/material.dart';
import '../data/app_state.dart';
import '../l10n/app_localization_delegate.dart';
import 'main_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _loading = false;
  String? _error;

  final AppState _appState = AppState.instance;

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final username = _usernameCtrl.text.trim();
      final user = await _appState.db.getUserByUsername(username);
      if (user == null) {
        await _appState.db
            .addLoginRecord(0, username, 'Failed', 'User not found');
        setState(() {
          _error = 'Invalid username or password';
          _loading = false;
        });
        return;
      }
      if (user.passwordHash != _passwordCtrl.text) {
        await _appState.db
            .addLoginRecord(user.id ?? 0, user.username, 'Failed', 'Wrong password');
        setState(() {
          _error = 'Invalid username or password';
          _loading = false;
        });
        return;
      }
      await _appState.db
          .addLoginRecord(user.id ?? 0, user.username, 'Success', '');
      _appState.setCurrentUser(user);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainShell()),
      );
    } catch (e) {
      setState(() {
        _error = 'Error: $e';
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loc = context.loc;
    final rtl = AppLocalizationsDirection.isRTL(context);
    return Scaffold(
      backgroundColor: const Color(0xFF1E1E2E),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Card(
              elevation: 8,
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.diamond,
                        size: 64, color: Color(0xFFB8860B)),
                    const SizedBox(height: 16),
                    Text(
                      loc.t('appTitle'),
                      style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      rtl ? 'آف لائن جیولری مینجمنٹ' : 'Offline Jewellery Management',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _usernameCtrl,
                      decoration: InputDecoration(
                        labelText: loc.t('username'),
                        prefixIcon: const Icon(Icons.person),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passwordCtrl,
                      obscureText: true,
                      onSubmitted: (_) => _login(),
                      decoration: InputDecoration(
                        labelText: loc.t('password'),
                        prefixIcon: const Icon(Icons.lock),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!,
                          style: const TextStyle(color: Colors.red)),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: _loading ? null : _login,
                        icon: const Icon(Icons.login),
                        label: Text(loc.t('signIn')),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
