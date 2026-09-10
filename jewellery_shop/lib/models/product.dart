class Product {
  int? id;
  String productId;
  String sku;
  String barcode;
  String name;
  String category;
  String subcategory;
  String metalType; // Gold / Silver / Other
  String designNumber;
  double grossWeight;
  double stoneWeight;
  double netWeight;
  double purity; // e.g. 22 (karat) or percent
  int karat;
  double makingCharges;
  double labourCharges;
  double stoneCharges;
  double purchaseCost;
  double salePrice;
  int supplierId;
  String location;
  DateTime? datePurchased;
  String status; // In Stock / Sold / Reserved / Returned / Exchanged / Repair / Lost
  String photosPath;
  String videoPath;
  String certificatePath;
  String description;
  int quantity;
  bool published;

  Product({
    this.id,
    required this.productId,
    this.sku = '',
    this.barcode = '',
    required this.name,
    this.category = '',
    this.subcategory = '',
    this.metalType = 'Gold',
    this.designNumber = '',
    this.grossWeight = 0,
    this.stoneWeight = 0,
    this.netWeight = 0,
    this.purity = 22,
    this.karat = 22,
    this.makingCharges = 0,
    this.labourCharges = 0,
    this.stoneCharges = 0,
    this.purchaseCost = 0,
    this.salePrice = 0,
    this.supplierId = 0,
    this.location = '',
    this.datePurchased,
    this.status = 'In Stock',
    this.photosPath = '',
    this.videoPath = '',
    this.certificatePath = '',
    this.description = '',
    this.quantity = 1,
    this.published = false,
  });

  double get fineGoldWeight {
    if (netWeight <= 0) return 0;
    return (netWeight * purity) / 24;
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'productId': productId,
      'sku': sku,
      'barcode': barcode,
      'name': name,
      'category': category,
      'subcategory': subcategory,
      'metalType': metalType,
      'designNumber': designNumber,
      'grossWeight': grossWeight,
      'stoneWeight': stoneWeight,
      'netWeight': netWeight,
      'purity': purity,
      'karat': karat,
      'makingCharges': makingCharges,
      'labourCharges': labourCharges,
      'stoneCharges': stoneCharges,
      'purchaseCost': purchaseCost,
      'salePrice': salePrice,
      'supplierId': supplierId,
      'location': location,
      'datePurchased': datePurchased?.toIso8601String(),
      'status': status,
      'photosPath': photosPath,
      'videoPath': videoPath,
      'certificatePath': certificatePath,
'description': description,
        'quantity': quantity,
        'published': published ? 1 : 0,
      };
  }

  factory Product.fromMap(Map<String, dynamic> map) {
    return Product(
      id: map['id'],
      productId: map['productId'] ?? '',
      sku: map['sku'] ?? '',
      barcode: map['barcode'] ?? '',
      name: map['name'] ?? '',
      category: map['category'] ?? '',
      subcategory: map['subcategory'] ?? '',
      metalType: map['metalType'] ?? 'Gold',
      designNumber: map['designNumber'] ?? '',
      grossWeight: (map['grossWeight'] ?? 0).toDouble(),
      stoneWeight: (map['stoneWeight'] ?? 0).toDouble(),
      netWeight: (map['netWeight'] ?? 0).toDouble(),
      purity: (map['purity'] ?? 0).toDouble(),
      karat: map['karat'] ?? 0,
      makingCharges: (map['makingCharges'] ?? 0).toDouble(),
      labourCharges: (map['labourCharges'] ?? 0).toDouble(),
      stoneCharges: (map['stoneCharges'] ?? 0).toDouble(),
      purchaseCost: (map['purchaseCost'] ?? 0).toDouble(),
      salePrice: (map['salePrice'] ?? 0).toDouble(),
      supplierId: map['supplierId'] ?? 0,
      location: map['location'] ?? '',
      datePurchased: map['datePurchased'] != null
          ? DateTime.tryParse(map['datePurchased'])
          : null,
      status: map['status'] ?? 'In Stock',
      photosPath: map['photosPath'] ?? '',
      videoPath: map['videoPath'] ?? '',
      certificatePath: map['certificatePath'] ?? '',
      description: map['description'] ?? '',
      quantity: map['quantity'] ?? 1,
      published: (map['published'] ?? 0) == 1,
    );
  }
}
