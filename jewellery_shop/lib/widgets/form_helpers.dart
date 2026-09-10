import 'package:flutter/material.dart';
import '../l10n/app_localization_delegate.dart';

class LabeledField extends StatelessWidget {
  final String label;
  final Widget child;
  final bool required;
  const LabeledField({
    super.key,
    required this.label,
    required this.child,
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          if (required)
            const Text(' *', style: TextStyle(color: Colors.red)),
        ]),
        const SizedBox(height: 6),
        child,
        const SizedBox(height: 14),
      ],
    );
  }
}

class MoneyInput extends StatelessWidget {
  final TextEditingController controller;
  final String? label;
  final String? hint;
  final bool enabled;
  const MoneyInput({
    super.key,
    required this.controller,
    this.label,
    this.hint,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      enabled: enabled,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
    );
  }
}

class WeightInput extends StatelessWidget {
  final TextEditingController controller;
  final String? label;
  final bool enabled;
  const WeightInput({
    super.key,
    required this.controller,
    this.label,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      enabled: enabled,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      decoration: InputDecoration(
        labelText: label,
        suffixText: 'g',
        border: const OutlineInputBorder(),
        isDense: true,
      ),
    );
  }
}

class FormDialog extends StatelessWidget {
  final String title;
  final List<Widget> fields;
  final VoidCallback onSave;
  final bool saving;
  const FormDialog({
    super.key,
    required this.title,
    required this.fields,
    required this.onSave,
    this.saving = false,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title),
      content: SingleChildScrollView(
        child: SizedBox(
          width: 480,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: fields,
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: Text(context.loc.t('cancel')),
        ),
        FilledButton(
          onPressed: saving ? null : onSave,
          child: Text(saving ? '...' : context.loc.t('save')),
        ),
      ],
    );
  }
}
