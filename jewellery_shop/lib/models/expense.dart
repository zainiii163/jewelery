class Expense {
  int? id;
  String expenseId;
  DateTime? date;
  String category; // Rent / Electricity / Salaries / Transport / Packaging / Repair / Marketing / Other
  String description;
  double amount;
  String paymentMethod;
  String notes;

  Expense({
    this.id,
    required this.expenseId,
    this.date,
    this.category = 'Other',
    this.description = '',
    this.amount = 0,
    this.paymentMethod = 'Cash',
    this.notes = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'expenseId': expenseId,
      'date': date?.toIso8601String(),
      'category': category,
      'description': description,
      'amount': amount,
      'paymentMethod': paymentMethod,
      'notes': notes,
    };
  }

  factory Expense.fromMap(Map<String, dynamic> map) {
    return Expense(
      id: map['id'],
      expenseId: map['expenseId'] ?? '',
      date: map['date'] != null ? DateTime.tryParse(map['date']) : null,
      category: map['category'] ?? 'Other',
      description: map['description'] ?? '',
      amount: (map['amount'] ?? 0).toDouble(),
      paymentMethod: map['paymentMethod'] ?? 'Cash',
      notes: map['notes'] ?? '',
    );
  }
}
