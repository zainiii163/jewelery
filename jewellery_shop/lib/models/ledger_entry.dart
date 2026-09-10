class LedgerEntry {
  int? id;
  int customerId;
  String customerName;
  DateTime? date;
  String description;
  double debit;
  double credit;
  double balance;
  String source; // Sale / Payment / Adjustment / Exchange
  String referenceId;

  LedgerEntry({
    this.id,
    this.customerId = 0,
    this.customerName = '',
    this.date,
    this.description = '',
    this.debit = 0,
    this.credit = 0,
    this.balance = 0,
    this.source = '',
    this.referenceId = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'customerId': customerId,
      'customerName': customerName,
      'date': date?.toIso8601String(),
      'description': description,
      'debit': debit,
      'credit': credit,
      'balance': balance,
      'source': source,
      'referenceId': referenceId,
    };
  }

  factory LedgerEntry.fromMap(Map<String, dynamic> map) {
    return LedgerEntry(
      id: map['id'],
      customerId: map['customerId'] ?? 0,
      customerName: map['customerName'] ?? '',
      date: map['date'] != null ? DateTime.tryParse(map['date']) : null,
      description: map['description'] ?? '',
      debit: (map['debit'] ?? 0).toDouble(),
      credit: (map['credit'] ?? 0).toDouble(),
      balance: (map['balance'] ?? 0).toDouble(),
      source: map['source'] ?? '',
      referenceId: map['referenceId'] ?? '',
    );
  }
}
