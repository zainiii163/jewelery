class User {
  int? id;
  String username;
  String passwordHash;
  String fullName;
  String role; // Owner / Manager / Salesman / Accountant
  String pin;
  bool isActive;

  User({
    this.id,
    required this.username,
    this.passwordHash = '',
    this.fullName = '',
    this.role = 'Owner',
    this.pin = '',
    this.isActive = true,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'username': username,
      'passwordHash': passwordHash,
      'fullName': fullName,
      'role': role,
      'pin': pin,
      'isActive': isActive ? 1 : 0,
    };
  }

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'],
      username: map['username'] ?? '',
      passwordHash: map['passwordHash'] ?? '',
      fullName: map['fullName'] ?? '',
      role: map['role'] ?? 'Owner',
      pin: map['pin'] ?? '',
      isActive: (map['isActive'] ?? 1) == 1,
    );
  }
}

class GoldRate {
  int? id;
  DateTime? date;
  double rate24k;
  double rate22k;
  double rate21k;
  double rate20k;
  double rate18k;
  double silverRate;

  GoldRate({
    this.id,
    this.date,
    this.rate24k = 0,
    this.rate22k = 0,
    this.rate21k = 0,
    this.rate20k = 0,
    this.rate18k = 0,
    this.silverRate = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'date': date?.toIso8601String(),
      'rate24k': rate24k,
      'rate22k': rate22k,
      'rate21k': rate21k,
      'rate20k': rate20k,
      'rate18k': rate18k,
      'silverRate': silverRate,
    };
  }

  factory GoldRate.fromMap(Map<String, dynamic> map) {
    return GoldRate(
      id: map['id'],
      date: map['date'] != null ? DateTime.tryParse(map['date']) : null,
      rate24k: (map['rate24k'] ?? 0).toDouble(),
      rate22k: (map['rate22k'] ?? 0).toDouble(),
      rate21k: (map['rate21k'] ?? 0).toDouble(),
      rate20k: (map['rate20k'] ?? 0).toDouble(),
      rate18k: (map['rate18k'] ?? 0).toDouble(),
      silverRate: (map['silverRate'] ?? 0).toDouble(),
    );
  }

  double getRateForKarat(int karat) {
    switch (karat) {
      case 24:
        return rate24k;
      case 22:
        return rate22k;
      case 21:
        return rate21k;
      case 20:
        return rate20k;
      case 18:
        return rate18k;
      default:
        return rate24k * (karat / 24);
    }
  }
}

class AuditLog {
  int? id;
  DateTime? timestamp;
  int userId;
  String username;
  String action; // Create / Edit / Delete / PriceChange / WeightChange / PaymentChange / Invoice
  String entityType; // Customer / Product / Sale / etc.
  String entityId;
  String details;

  AuditLog({
    this.id,
    this.timestamp,
    this.userId = 0,
    this.username = '',
    this.action = '',
    this.entityType = '',
    this.entityId = '',
    this.details = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'timestamp': timestamp?.toIso8601String(),
      'userId': userId,
      'username': username,
      'action': action,
      'entityType': entityType,
      'entityId': entityId,
      'details': details,
    };
  }

  factory AuditLog.fromMap(Map<String, dynamic> map) {
    return AuditLog(
      id: map['id'],
      timestamp: map['timestamp'] != null
          ? DateTime.tryParse(map['timestamp'])
          : null,
      userId: map['userId'] ?? 0,
      username: map['username'] ?? '',
      action: map['action'] ?? '',
      entityType: map['entityType'] ?? '',
      entityId: map['entityId'] ?? '',
      details: map['details'] ?? '',
    );
  }
}

class ShopSettings {
  String shopName;
  String address;
  String phone;
  String whatsapp;
  String logoPath;
  String language; // en / ur
  String invoiceLanguage; // en / ur / both
  String currency;
  double taxRate;

  ShopSettings({
    this.shopName = '',
    this.address = '',
    this.phone = '',
    this.whatsapp = '',
    this.logoPath = '',
    this.language = 'en',
    this.invoiceLanguage = 'en',
    this.currency = 'Rs.',
    this.taxRate = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'shopName': shopName,
      'address': address,
      'phone': phone,
      'whatsapp': whatsapp,
      'logoPath': logoPath,
      'language': language,
      'invoiceLanguage': invoiceLanguage,
      'currency': currency,
      'taxRate': taxRate,
    };
  }

  factory ShopSettings.fromMap(Map<String, dynamic> map) {
    return ShopSettings(
      shopName: map['shopName'] ?? '',
      address: map['address'] ?? '',
      phone: map['phone'] ?? '',
      whatsapp: map['whatsapp'] ?? '',
      logoPath: map['logoPath'] ?? '',
      language: map['language'] ?? 'en',
      invoiceLanguage: map['invoiceLanguage'] ?? 'en',
      currency: map['currency'] ?? 'Rs.',
      taxRate: (map['taxRate'] ?? 0).toDouble(),
    );
  }
}
