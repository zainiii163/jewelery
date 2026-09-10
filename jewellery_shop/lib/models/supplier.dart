class Supplier {
  int? id;
  String supplierId;
  String name;
  String company;
  String phone;
  String whatsapp;
  String address;
  String cnic;
  String notes;
  double outstanding;
  double paid;
  DateTime? registeredDate;

  Supplier({
    this.id,
    required this.supplierId,
    required this.name,
    this.company = '',
    this.phone = '',
    this.whatsapp = '',
    this.address = '',
    this.cnic = '',
    this.notes = '',
    this.outstanding = 0,
    this.paid = 0,
    this.registeredDate,
  });

  double get remaining => outstanding - paid;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'supplierId': supplierId,
      'name': name,
      'company': company,
      'phone': phone,
      'whatsapp': whatsapp,
      'address': address,
      'cnic': cnic,
      'notes': notes,
      'outstanding': outstanding,
      'paid': paid,
      'registeredDate': registeredDate?.toIso8601String(),
    };
  }

  factory Supplier.fromMap(Map<String, dynamic> map) {
    return Supplier(
      id: map['id'],
      supplierId: map['supplierId'] ?? '',
      name: map['name'] ?? '',
      company: map['company'] ?? '',
      phone: map['phone'] ?? '',
      whatsapp: map['whatsapp'] ?? '',
      address: map['address'] ?? '',
      cnic: map['cnic'] ?? '',
      notes: map['notes'] ?? '',
      outstanding: (map['outstanding'] ?? 0).toDouble(),
      paid: (map['paid'] ?? 0).toDouble(),
      registeredDate: map['registeredDate'] != null
          ? DateTime.tryParse(map['registeredDate'])
          : null,
    );
  }
}
