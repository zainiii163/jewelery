class OnlineOrderItem {
  int id;
  int orderId;
  int? productId;
  String sku;
  String productName;
  int qty;
  double unitPrice;
  double lineTotal;

  OnlineOrderItem({
    this.id = 0,
    this.orderId = 0,
    this.productId,
    this.sku = '',
    this.productName = '',
    this.qty = 1,
    this.unitPrice = 0,
    this.lineTotal = 0,
  });

  factory OnlineOrderItem.fromJson(Map<String, dynamic> j) => OnlineOrderItem(
        id: (j['id'] ?? 0) is int ? j['id'] : int.tryParse('${j['id']}') ?? 0,
        orderId: (j['order_id'] ?? 0) is int
            ? j['order_id']
            : int.tryParse('${j['order_id']}') ?? 0,
        productId: j['product_id'] == null
            ? null
            : int.tryParse('${j['product_id']}'),
        sku: j['sku'] ?? '',
        productName: j['product_name'] ?? '',
        qty: (j['qty'] ?? 1) is int ? j['qty'] : int.tryParse('${j['qty']}') ?? 1,
        unitPrice: (j['unit_price'] ?? 0).toDouble(),
        lineTotal: (j['line_total'] ?? 0).toDouble(),
      );
}

class OnlineOrder {
  int id;
  String orderNumber;
  String customerName;
  String customerPhone;
  String customerEmail;
  String address;
  String city;
  String paymentMethod;
  String paymentStatus;
  String status;
  double subtotal;
  double shipping;
  double discount;
  double grandTotal;
  String notes;
  DateTime? orderDate;
  List<OnlineOrderItem> items;

  OnlineOrder({
    this.id = 0,
    this.orderNumber = '',
    this.customerName = '',
    this.customerPhone = '',
    this.customerEmail = '',
    this.address = '',
    this.city = '',
    this.paymentMethod = 'cod',
    this.paymentStatus = 'pending',
    this.status = 'Pending',
    this.subtotal = 0,
    this.shipping = 0,
    this.discount = 0,
    this.grandTotal = 0,
    this.notes = '',
    this.orderDate,
    this.items = const [],
  });

  factory OnlineOrder.fromJson(Map<String, dynamic> j) => OnlineOrder(
        id: (j['id'] ?? 0) is int ? j['id'] : int.tryParse('${j['id']}') ?? 0,
        orderNumber: j['order_number'] ?? '',
        customerName: j['customer_name'] ?? '',
        customerPhone: j['customer_phone'] ?? '',
        customerEmail: j['customer_email'] ?? '',
        address: j['address'] ?? '',
        city: j['city'] ?? '',
        paymentMethod: j['payment_method'] ?? 'cod',
        paymentStatus: j['payment_status'] ?? 'pending',
        status: j['status'] ?? 'Pending',
        subtotal: (j['subtotal'] ?? 0).toDouble(),
        shipping: (j['shipping'] ?? 0).toDouble(),
        discount: (j['discount'] ?? 0).toDouble(),
        grandTotal: (j['grand_total'] ?? 0).toDouble(),
        notes: j['notes'] ?? '',
        orderDate: j['order_date'] != null
            ? DateTime.tryParse('${j['order_date']}')
            : null,
        items: (j['items'] as List?)
                ?.map((e) => OnlineOrderItem.fromJson(e))
                .toList() ??
            [],
      );
}

class WebsiteAppointment {
  int id;
  String name;
  String phone;
  DateTime? date;
  String time;
  String purpose;
  String status;
  String notes;

  WebsiteAppointment({
    this.id = 0,
    this.name = '',
    this.phone = '',
    this.date,
    this.time = '',
    this.purpose = '',
    this.status = 'Pending',
    this.notes = '',
  });

  factory WebsiteAppointment.fromJson(Map<String, dynamic> j) =>
      WebsiteAppointment(
        id: (j['id'] ?? 0) is int ? j['id'] : int.tryParse('${j['id']}') ?? 0,
        name: j['name'] ?? '',
        phone: j['phone'] ?? '',
        date: j['date'] != null ? DateTime.tryParse('${j['date']}') : null,
        time: j['time'] ?? '',
        purpose: j['purpose'] ?? '',
        status: j['status'] ?? 'Pending',
        notes: j['notes'] ?? '',
      );
}

class WebsiteCustomRequest {
  int id;
  String name;
  String phone;
  String jewelleryType;
  String metal;
  int? karat;
  double? budget;
  String description;
  String status;

  WebsiteCustomRequest({
    this.id = 0,
    this.name = '',
    this.phone = '',
    this.jewelleryType = '',
    this.metal = '',
    this.karat,
    this.budget,
    this.description = '',
    this.status = 'New',
  });

  factory WebsiteCustomRequest.fromJson(Map<String, dynamic> j) =>
      WebsiteCustomRequest(
        id: (j['id'] ?? 0) is int ? j['id'] : int.tryParse('${j['id']}') ?? 0,
        name: j['name'] ?? '',
        phone: j['phone'] ?? '',
        jewelleryType: j['jewellery_type'] ?? '',
        metal: j['metal'] ?? '',
        karat: j['karat'] == null ? null : int.tryParse('${j['karat']}'),
        budget: j['budget'] == null ? null : (j['budget'] as num).toDouble(),
        description: j['description'] ?? '',
        status: j['status'] ?? 'New',
      );
}

/// Order/appointment status options exposed to the shop app UI.
class WebsiteStatuses {
  static const orders = [
    'Pending', 'Confirmed', 'Processing', 'Ready',
    'Shipped', 'Delivered', 'Cancelled', 'Returned',
  ];
  static const appointments = [
    'Pending', 'Confirmed', 'Completed', 'Cancelled',
  ];
  static const customRequests = [
    'New', 'Contacted', 'Quoted', 'Accepted', 'Declined',
  ];
}