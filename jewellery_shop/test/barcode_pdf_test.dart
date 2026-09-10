import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:jewellery_shop/models/product.dart';
import 'package:jewellery_shop/models/user.dart';
import 'package:jewellery_shop/services/barcode_pdf.dart';

void main() {
  test('barcode label PDF generates', () async {
    final products = List.generate(
      25,
      (i) => Product(
        productId: 'JWL-$i',
        barcode: 'JWL-${1000 + i}',
        name: 'Gold Ring $i',
        karat: 22,
        netWeight: 10 + i.toDouble(),
        salePrice: 500000 + i.toDouble(),
        metalType: 'Gold',
        status: 'In Stock',
      ),
    );
    final s = ShopSettings(currency: 'Rs.');
    final b = await BarcodePdf.bytes(products, s);
    expect(b.length, greaterThan(1000));
    expect(String.fromCharCodes(b.take(5)), '%PDF-');
    Directory('build').createSync(recursive: true);
    File('build/labels_sample.pdf').writeAsBytesSync(b);
  });
}