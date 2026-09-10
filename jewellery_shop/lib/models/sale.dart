class SaleItem {
  int? id;
  int productId;
  String productName;
  double grossWeight;
  double netWeight;
  double purity;
  int karat;
  double goldRate;
  double metalValue;
  double makingCharges;
  double stoneCharges;
  double discount;
  double lineTotal;
  int quantity;

  SaleItem({
    this.id,
    required this.productId,
    this.productName = '',
    this.grossWeight = 0,
    this.netWeight = 0,
    this.purity = 0,
    this.karat = 0,
    this.goldRate = 0,
    this.metalValue = 0,
    this.makingCharges = 0,
    this.stoneCharges = 0,
    this.discount = 0,
    this.lineTotal = 0,
    this.quantity = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'productId': productId,
      'productName': productName,
      'grossWeight': grossWeight,
      'netWeight': netWeight,
      'purity': purity,
      'karat': karat,
      'goldRate': goldRate,
      'metalValue': metalValue,
      'makingCharges': makingCharges,
      'stoneCharges': stoneCharges,
      'discount': discount,
      'lineTotal': lineTotal,
      'quantity': quantity,
    };
  }

  factory SaleItem.fromMap(Map<String, dynamic> map) {
    return SaleItem(
      id: map['id'],
      productId: map['productId'] ?? 0,
      productName: map['productName'] ?? '',
      grossWeight: (map['grossWeight'] ?? 0).toDouble(),
      netWeight: (map['netWeight'] ?? 0).toDouble(),
      purity: (map['purity'] ?? 0).toDouble(),
      karat: map['karat'] ?? 0,
      goldRate: (map['goldRate'] ?? 0).toDouble(),
      metalValue: (map['metalValue'] ?? 0).toDouble(),
      makingCharges: (map['makingCharges'] ?? 0).toDouble(),
      stoneCharges: (map['stoneCharges'] ?? 0).toDouble(),
      discount: (map['discount'] ?? 0).toDouble(),
      lineTotal: (map['lineTotal'] ?? 0).toDouble(),
      quantity: map['quantity'] ?? 1,
    );
  }
}

class Sale {
  int? id;
  String invoiceId;
  int customerId;
  String customerName;
  DateTime? saleDate;
  double subtotal;
  double totalDiscount;
  double tax;
  double total;
  double paid;
  double remaining;
  String paymentMethod; // Cash / Bank / Card / JazzCash / Easypaisa / Partial / Credit
  String notes;
  List<SaleItem> items;

  Sale({
    this.id,
    required this.invoiceId,
    this.customerId = 0,
    this.customerName = '',
    this.saleDate,
    this.subtotal = 0,
    this.totalDiscount = 0,
    this.tax = 0,
    this.total = 0,
    this.paid = 0,
    this.remaining = 0,
    this.paymentMethod = 'Cash',
    this.notes = '',
    this.items = const [],
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'invoiceId': invoiceId,
      'customerId': customerId,
      'customerName': customerName,
      'saleDate': saleDate?.toIso8601String(),
      'subtotal': subtotal,
      'totalDiscount': totalDiscount,
      'tax': tax,
      'total': total,
      'paid': paid,
      'remaining': remaining,
      'paymentMethod': paymentMethod,
      'notes': notes,
    };
  }

  factory Sale.fromMap(Map<String, dynamic> map) {
    return Sale(
      id: map['id'],
      invoiceId: map['invoiceId'] ?? '',
      customerId: map['customerId'] ?? 0,
      customerName: map['customerName'] ?? '',
      saleDate: map['saleDate'] != null
          ? DateTime.tryParse(map['saleDate'])
          : null,
      subtotal: (map['subtotal'] ?? 0).toDouble(),
      totalDiscount: (map['totalDiscount'] ?? 0).toDouble(),
      tax: (map['tax'] ?? 0).toDouble(),
      total: (map['total'] ?? 0).toDouble(),
      paid: (map['paid'] ?? 0).toDouble(),
      remaining: (map['remaining'] ?? 0).toDouble(),
      paymentMethod: map['paymentMethod'] ?? 'Cash',
      notes: map['notes'] ?? '',
    );
  }
}
