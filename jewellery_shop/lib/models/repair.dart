class Repair {
  int? id;
  String repairId;
  int customerId;
  String customerName;
  int productId;
  String productName;
  String problem;
  DateTime? receivedDate;
  DateTime? expectedDate;
  double estimatedCharges;
  double finalCharges;
  String employee;
  String notes;
  String status; // Received / Inspection / In Repair / Ready / Delivered
  String photosPath;
  String videosPath;

  Repair({
    this.id,
    required this.repairId,
    this.customerId = 0,
    this.customerName = '',
    this.productId = 0,
    this.productName = '',
    this.problem = '',
    this.receivedDate,
    this.expectedDate,
    this.estimatedCharges = 0,
    this.finalCharges = 0,
    this.employee = '',
    this.notes = '',
    this.status = 'Received',
    this.photosPath = '',
    this.videosPath = '',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'repairId': repairId,
      'customerId': customerId,
      'customerName': customerName,
      'productId': productId,
      'productName': productName,
      'problem': problem,
      'receivedDate': receivedDate?.toIso8601String(),
      'expectedDate': expectedDate?.toIso8601String(),
      'estimatedCharges': estimatedCharges,
      'finalCharges': finalCharges,
      'employee': employee,
      'notes': notes,
      'status': status,
      'photosPath': photosPath,
      'videosPath': videosPath,
    };
  }

  factory Repair.fromMap(Map<String, dynamic> map) {
    return Repair(
      id: map['id'],
      repairId: map['repairId'] ?? '',
      customerId: map['customerId'] ?? 0,
      customerName: map['customerName'] ?? '',
      productId: map['productId'] ?? 0,
      productName: map['productName'] ?? '',
      problem: map['problem'] ?? '',
      receivedDate: map['receivedDate'] != null
          ? DateTime.tryParse(map['receivedDate'])
          : null,
      expectedDate: map['expectedDate'] != null
          ? DateTime.tryParse(map['expectedDate'])
          : null,
      estimatedCharges: (map['estimatedCharges'] ?? 0).toDouble(),
      finalCharges: (map['finalCharges'] ?? 0).toDouble(),
      employee: map['employee'] ?? '',
      notes: map['notes'] ?? '',
      status: map['status'] ?? 'Received',
      photosPath: map['photosPath'] ?? '',
      videosPath: map['videosPath'] ?? '',
    );
  }
}
