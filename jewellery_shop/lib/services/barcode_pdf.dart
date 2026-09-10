import 'dart:typed_data';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../models/product.dart';
import '../models/user.dart';

/// Generates a sheet of product barcode labels (A4) using Code 128.
class BarcodePdf {
  static const double _labelW = 185; // pt
  static const double _labelH = 112; // pt
  static const double _pageH = 842; // A4 height pt

  static int get labelsPerColumn => (_pageH / _labelH).floor();

  static String _money(double v, ShopSettings s) {
    final n = v.toStringAsFixed(0);
    final buf = StringBuffer();
    final len = n.length;
    for (var i = 0; i < len; i++) {
      buf.write(n[i]);
      final rem = len - i - 1;
      if (rem > 0 && rem % 3 == 0) buf.write(',');
    }
    return '${s.currency} ${buf.toString()}';
  }

  static Future<Uint8List> bytes(List<Product> products, ShopSettings settings) {
    final perCol = labelsPerColumn;
    final doc = pw.Document();
    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(14),
        build: (context) => [
          for (var i = 0; i < products.length; i += perCol * 3)
            pw.Column(children: [
              for (var r = 0; r < perCol && i + r * 3 < products.length; r++)
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.center,
                  children: [
                    for (var c = 0; c < 3; c++)
                      pw.SizedBox(
                        width: _labelW + 4,
                        child: (i + r * 3 + c) < products.length
                            ? _label(products[i + r * 3 + c], settings)
                            : pw.SizedBox(height: _labelH),
                      ),
                  ],
                ),
            ]),
        ],
      ),
    );
    return doc.save();
  }

  static pw.Widget _label(Product p, ShopSettings s) {
    final code = p.barcode.isNotEmpty ? p.barcode : p.productId;
    return pw.Container(
      width: _labelW,
      height: _labelH,
      padding: const pw.EdgeInsets.all(6),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: PdfColors.grey500, width: 0.7),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(3)),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(
            p.name,
            style: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold),
            maxLines: 1,
          ),
          pw.Text(
            p.productId,
            style:
                const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey700),
            maxLines: 1,
          ),
          pw.SizedBox(height: 2),
          pw.Text(
            '${p.karat}K  •  ${p.netWeight.toStringAsFixed(3)}g  •  ${p.metalType}',
            style: const pw.TextStyle(fontSize: 7),
            maxLines: 1,
          ),
          pw.Text(_money(p.salePrice > 0 ? p.salePrice : p.purchaseCost, s),
              style: const pw.TextStyle(fontSize: 8)),
          pw.Spacer(),
          pw.Center(
            child: pw.BarcodeWidget(
              barcode: pw.Barcode.code128(),
              data: code,
              width: 120,
              height: 26,
            ),
          ),
        ],
      ),
    );
  }

  /// Opens the OS print dialog to print the label sheet.
  static Future<bool> printLabels(List<Product> products, ShopSettings settings) {
    return Printing.layoutPdf(
      name: 'product_labels',
      onLayout: (format) async => await bytes(products, settings),
    );
  }
}