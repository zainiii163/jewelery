import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:jewellery_shop/models/sale.dart';
import 'package:jewellery_shop/models/user.dart';
import 'package:jewellery_shop/services/invoice_pdf.dart';

void main() {
  test('invoice PDF generates for Urdu invoice', () async {
    final font = ByteData.sublistView(
        File('assets/fonts/NotoNaskhArabic.ttf').readAsBytesSync());
    final sale = Sale(
      invoiceId: 'INV-1001',
      customerId: 1,
      customerName: 'Acme Jewellers',
      saleDate: DateTime(2026, 9, 9, 14, 30),
      subtotal: 1000000,
      totalDiscount: 0,
      tax: 0,
      total: 1000000,
      paid: 500000,
      remaining: 500000,
      paymentMethod: 'Cash',
      items: [
        SaleItem(
          productId: 1,
          productName: 'Gold Ring',
          quantity: 1,
          karat: 22,
          netWeight: 10.5,
          goldRate: 120000,
          makingCharges: 2000,
          stoneCharges: 0,
          lineTotal: 1000000,
        ),
      ],
    );
    final sUr = ShopSettings(
        shopName: 'Test Shop', address: 'Main Bazaar', phone: '03000000000',
        invoiceLanguage: 'ur', currency: 'Rs.');
    final sEn = ShopSettings(
        shopName: 'Test Shop', address: 'Main Bazaar', phone: '03000000000',
        invoiceLanguage: 'en', currency: 'Rs.');
    final b = await InvoicePdf.bytes(sale, sUr, fontData: font);
    expect(b.length, greaterThan(1000));
    expect(String.fromCharCodes(b.take(5)), '%PDF-');

    Directory('build').createSync(recursive: true);
    File('build/invoice_sample_ur.pdf').writeAsBytesSync(b);
    File('build/invoice_sample_en.pdf').writeAsBytesSync(
        await InvoicePdf.bytes(sale, sEn, fontData: font));
  });
}