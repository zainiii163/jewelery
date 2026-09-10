class Payment {
  int? id;
  String paymentId;
  int customerId;
  String customerName;
  DateTime? date;
  double amount;
  String method; // Cash / Bank / Card / JazzCash / Easypaisa
  String type; // Received (from customer) / Paid (to supplier)
  String reference;
  String notes;

  Payment({
    this.id,
    required this.paymentId,
    this.customerId = 0,
    this.customerName = '',
    this.date,
    this.amount = 0,
    this.method = 'Cash',
    this.type = 'Received',
    this.reference = '',
    this.notes = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'paymentId': paymentId,
      'customerId': customerId,
      'customerName': customerName,
      'date': date?.toIso8601String(),
      'amount': amount,
      'method': method,
      'type': type,
      'reference': reference,
      'notes': notes,
    };
  }

  factory Payment.fromMap(Map<String, dynamic> map) {
    return Payment(
      id: map['id'],
      paymentId: map['paymentId'] ?? '',
      customerId: map['customerId'] ?? 0,
      customerName: map['customerName'] ?? '',
      date: map['date'] != null ? DateTime.tryParse(map['date']) : null,
      amount: (map['amount'] ?? 0).toDouble(),
      method: map['method'] ?? 'Cash',
      type: map['type'] ?? 'Received',
      reference: map['reference'] ?? '',
      notes: map['notes'] ?? '',
    );
  }
}
