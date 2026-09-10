import 'package:flutter_test/flutter_test.dart';

import 'package:jewellery_shop/models/customer.dart';
import 'package:jewellery_shop/models/product.dart';

void main() {
  test('Customer remaining amount calculation', () {
    final c = Customer(
      customerId: 'CUS-1000',
      name: 'Test',
      totalAmount: 500000,
      paidAmount: 350000,
    );
    expect(c.remainingAmount, 150000);
  });

  test('Product fine gold calculation', () {
    final p = Product(
      productId: 'JWL-1000',
      name: 'Ring',
      netWeight: 18.5,
      purity: 22,
    );
    expect(p.fineGoldWeight, closeTo(16.958, 0.01));
  });
}
