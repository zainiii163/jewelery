class Purchase {
  int? id;
  String purchaseId;
  int supplierId;
  String supplierName;
  int productId;
  String productName;
  DateTime? purchaseDate;
  double grossWeight;
  double netWeight;
  double purity;
  int karat;
  double rate;
  double makingCharges;
  double totalCost;
  double paid;
  double remaining;
  String paymentMethod;
  String notes;
  String photosPath;

  Purchase({
    this.id,
    required this.purchaseId,
    this.supplierId = 0,
    this.supplierName = '',
    this.productId = 0,
    this.productName = '',
    this.purchaseDate,
    this.grossWeight = 0,
    this.netWeight = 0,
    this.purity = 0,
    this.karat = 0,
    this.rate = 0,
    this.makingCharges = 0,
    this.totalCost = 0,
    this.paid = 0,
    this.remaining = 0,
    this.paymentMethod = 'Cash',
    this.notes = '',
    this.photosPath = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'purchaseId': purchaseId,
      'supplierId': supplierId,
      'supplierName': supplierName,
      'productId': productId,
      'productName': productName,
      'purchaseDate': purchaseDate?.toIso8601String(),
      'grossWeight': grossWeight,
      'netWeight': netWeight,
      'purity': purity,
      'karat': karat,
      'rate': rate,
      'makingCharges': makingCharges,
      'totalCost': totalCost,
      'paid': paid,
      'remaining': remaining,
      'paymentMethod': paymentMethod,
      'notes': notes,
      'photosPath': photosPath,
    };
  }

  factory Purchase.fromMap(Map<String, dynamic> map) {
    return Purchase(
      id: map['id'],
      purchaseId: map['purchaseId'] ?? '',
      supplierId: map['supplierId'] ?? 0,
      supplierName: map['supplierName'] ?? '',
      productId: map['productId'] ?? 0,
      productName: map['productName'] ?? '',
      purchaseDate: map['purchaseDate'] != null
          ? DateTime.tryParse(map['purchaseDate'])
          : null,
      grossWeight: (map['grossWeight'] ?? 0).toDouble(),
      netWeight: (map['netWeight'] ?? 0).toDouble(),
      purity: (map['purity'] ?? 0).toDouble(),
      karat: map['karat'] ?? 0,
      rate: (map['rate'] ?? 0).toDouble(),
      makingCharges: (map['makingCharges'] ?? 0).toDouble(),
      totalCost: (map['totalCost'] ?? 0).toDouble(),
      paid: (map['paid'] ?? 0).toDouble(),
      remaining: (map['remaining'] ?? 0).toDouble(),
      paymentMethod: map['paymentMethod'] ?? 'Cash',
      notes: map['notes'] ?? '',
      photosPath: map['photosPath'] ?? '',
    );
  }
}
