class Customer {
  int? id;
  String customerId;
  String name;
  String fatherName;
  String cnic;
  String mobile;
  String whatsapp;
  String address;
  String city;
  String email;
  String notes;
  String photoPath;
  String cnicFrontPath;
  String cnicBackPath;
  String documentsPath;
  DateTime? registeredDate;
  double totalAmount;
  double paidAmount;

  Customer({
    this.id,
    required this.customerId,
    required this.name,
    this.fatherName = '',
    this.cnic = '',
    this.mobile = '',
    this.whatsapp = '',
    this.address = '',
    this.city = '',
    this.email = '',
    this.notes = '',
    this.photoPath = '',
    this.cnicFrontPath = '',
    this.cnicBackPath = '',
    this.documentsPath = '',
    this.registeredDate,
    this.totalAmount = 0,
    this.paidAmount = 0,
  });

  double get remainingAmount => totalAmount - paidAmount;

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'customerId': customerId,
      'name': name,
      'fatherName': fatherName,
      'cnic': cnic,
      'mobile': mobile,
      'whatsapp': whatsapp,
      'address': address,
      'city': city,
      'email': email,
      'notes': notes,
      'photoPath': photoPath,
      'cnicFrontPath': cnicFrontPath,
      'cnicBackPath': cnicBackPath,
      'documentsPath': documentsPath,
      'registeredDate': registeredDate?.toIso8601String(),
      'totalAmount': totalAmount,
      'paidAmount': paidAmount,
    };
  }

  factory Customer.fromMap(Map<String, dynamic> map) {
    return Customer(
      id: map['id'],
      customerId: map['customerId'] ?? '',
      name: map['name'] ?? '',
      fatherName: map['fatherName'] ?? '',
      cnic: map['cnic'] ?? '',
      mobile: map['mobile'] ?? '',
      whatsapp: map['whatsapp'] ?? '',
      address: map['address'] ?? '',
      city: map['city'] ?? '',
      email: map['email'] ?? '',
      notes: map['notes'] ?? '',
      photoPath: map['photoPath'] ?? '',
      cnicFrontPath: map['cnicFrontPath'] ?? '',
      cnicBackPath: map['cnicBackPath'] ?? '',
      documentsPath: map['documentsPath'] ?? '',
      registeredDate: map['registeredDate'] != null
          ? DateTime.tryParse(map['registeredDate'])
          : null,
      totalAmount: (map['totalAmount'] ?? 0).toDouble(),
      paidAmount: (map['paidAmount'] ?? 0).toDouble(),
    );
  }
}
