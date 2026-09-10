class ExchangeItem {
  int? id;
  int exchangeId;
  String direction; // Old / New
  String metalType; // Gold / Silver
  int? productId; // 0 for Old items
  String productName;
  double grossWeight;
  double netWeight;
  double purity;
  int karat;
  double rate;
  double metalValue;
  double makingCharges;
  double stoneCharges;
  double lineTotal;

  ExchangeItem({
    this.id,
    this.exchangeId = 0,
    this.direction = 'Old',
    this.metalType = 'Gold',
    this.productId,
    this.productName = '',
    this.grossWeight = 0,
    this.netWeight = 0,
    this.purity = 0,
    this.karat = 22,
    this.rate = 0,
    this.metalValue = 0,
    this.makingCharges = 0,
    this.stoneCharges = 0,
    this.lineTotal = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'exchangeId': exchangeId,
      'direction': direction,
      'metalType': metalType,
      'productId': productId,
      'productName': productName,
      'grossWeight': grossWeight,
      'netWeight': netWeight,
      'purity': purity,
      'karat': karat,
      'rate': rate,
      'metalValue': metalValue,
      'makingCharges': makingCharges,
      'stoneCharges': stoneCharges,
      'lineTotal': lineTotal,
    };
  }

  factory ExchangeItem.fromMap(Map<String, dynamic> map) {
    return ExchangeItem(
      id: map['id'],
      exchangeId: map['exchangeId'] ?? 0,
      direction: map['direction'] ?? 'Old',
      metalType: map['metalType'] ?? 'Gold',
      productId: map['productId'],
      productName: map['productName'] ?? '',
      grossWeight: (map['grossWeight'] ?? 0).toDouble(),
      netWeight: (map['netWeight'] ?? 0).toDouble(),
      purity: (map['purity'] ?? 0).toDouble(),
      karat: map['karat'] ?? 0,
      rate: (map['rate'] ?? 0).toDouble(),
      metalValue: (map['metalValue'] ?? 0).toDouble(),
      makingCharges: (map['makingCharges'] ?? 0).toDouble(),
      stoneCharges: (map['stoneCharges'] ?? 0).toDouble(),
      lineTotal: (map['lineTotal'] ?? 0).toDouble(),
    );
  }
}

class Exchange {
  int? id;
  String exchangeId;
  int customerId;
  String customerName;
  DateTime? date;
  double oldTotalValue;
  double newTotalValue;
  double makingCharges;
  double stoneCharges;
  double discount;
  double netAmount; // gross (new + charges - discount) - oldTotalValue
  double cashReceived;
  double amountDue; // netAmount - cashReceived (>= 0)
  String paymentMethod;
  String notes;
  List<ExchangeItem> items;

  Exchange({
    this.id,
    required this.exchangeId,
    this.customerId = 0,
    this.customerName = '',
    this.date,
    this.oldTotalValue = 0,
    this.newTotalValue = 0,
    this.makingCharges = 0,
    this.stoneCharges = 0,
    this.discount = 0,
    this.netAmount = 0,
    this.cashReceived = 0,
    this.amountDue = 0,
    this.paymentMethod = 'Cash',
    this.notes = '',
    this.items = const [],
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'exchangeId': exchangeId,
      'customerId': customerId,
      'customerName': customerName,
      'date': date?.toIso8601String(),
      'oldTotalValue': oldTotalValue,
      'newTotalValue': newTotalValue,
      'makingCharges': makingCharges,
      'stoneCharges': stoneCharges,
      'discount': discount,
      'netAmount': netAmount,
      'cashReceived': cashReceived,
      'amountDue': amountDue,
      'paymentMethod': paymentMethod,
      'notes': notes,
    };
  }

  factory Exchange.fromMap(Map<String, dynamic> map) {
    return Exchange(
      id: map['id'],
      exchangeId: map['exchangeId'] ?? '',
      customerId: map['customerId'] ?? 0,
      customerName: map['customerName'] ?? '',
      date: map['date'] != null ? DateTime.tryParse(map['date']) : null,
      oldTotalValue: (map['oldTotalValue'] ?? 0).toDouble(),
      newTotalValue: (map['newTotalValue'] ?? 0).toDouble(),
      makingCharges: (map['makingCharges'] ?? 0).toDouble(),
      stoneCharges: (map['stoneCharges'] ?? 0).toDouble(),
      discount: (map['discount'] ?? 0).toDouble(),
      netAmount: (map['netAmount'] ?? 0).toDouble(),
      cashReceived: (map['cashReceived'] ?? 0).toDouble(),
      amountDue: (map['amountDue'] ?? 0).toDouble(),
      paymentMethod: map['paymentMethod'] ?? 'Cash',
      notes: map['notes'] ?? '',
    );
  }
}