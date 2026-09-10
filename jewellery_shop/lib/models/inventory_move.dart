class InventoryMove {
  int? id;
  int? productId;
  String productName;
  DateTime? date;
  String type; // Stock In / Stock Out / Adjustment / Damage / Lost / Transfer
  String metalType;
  double weight;
  double quantity;
  String notes;

  InventoryMove({
    this.id,
    this.productId,
    this.productName = '',
    this.date,
    this.type = 'Stock In',
    this.metalType = 'Gold',
    this.weight = 0,
    this.quantity = 0,
    this.notes = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'productId': productId,
      'productName': productName,
      'date': date?.toIso8601String(),
      'type': type,
      'metalType': metalType,
      'weight': weight,
      'quantity': quantity,
      'notes': notes,
    };
  }

  factory InventoryMove.fromMap(Map<String, dynamic> map) {
    return InventoryMove(
      id: map['id'],
      productId: map['productId'],
      productName: map['productName'] ?? '',
      date: map['date'] != null ? DateTime.tryParse(map['date']) : null,
      type: map['type'] ?? 'Stock In',
      metalType: map['metalType'] ?? 'Gold',
      weight: (map['weight'] ?? 0).toDouble(),
      quantity: (map['quantity'] ?? 0).toDouble(),
      notes: map['notes'] ?? '',
    );
  }
}