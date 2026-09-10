import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:path/path.dart' as p;
import '../models/customer.dart';
import '../models/product.dart';
import '../models/sale.dart';
import '../models/purchase.dart';
import '../models/supplier.dart';
import '../models/payment.dart';
import '../models/expense.dart';
import '../models/repair.dart';
import '../models/ledger_entry.dart';
import '../models/user.dart';
import '../models/exchange.dart';
import '../models/inventory_move.dart';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._();
  static Database? _database;
  String dbDirectory = '';

  DatabaseHelper._();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB();
    return _database!;
  }

  Future<Database> _initDB() async {
    sqfliteFfiInit();
    // Ensure the global databaseFactory uses the FFI factory on desktop
    databaseFactory = databaseFactoryFfi;
    // Use a stable path in the user's documents/AppData for the database
    final dbPath = dbDirectory.isNotEmpty
        ? p.join(dbDirectory, 'jewellery_shop.db')
        : p.join(await getDatabasesPath(), 'jewellery_shop.db');

    return openDatabase(
      dbPath,
      version: 4,
      onCreate: _createTables,
      onUpgrade: _onUpgrade,
    );
  }

  void setDbDirectory(String dir) {
    dbDirectory = dir;
  }

  Future<String> currentDbPath() async {
    if (dbDirectory.isNotEmpty) return p.join(dbDirectory, 'jewellery_shop.db');
    return p.join(await getDatabasesPath(), 'jewellery_shop.db');
  }

  Future<void> _createTables(Database db, int version) async {
    await db.execute('''
      CREATE TABLE users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        passwordHash TEXT,
        fullName TEXT,
        role TEXT,
        pin TEXT,
        isActive INTEGER
      )
    ''');
    await db.execute('''
      CREATE TABLE shop_settings(
        id INTEGER PRIMARY KEY CHECK (id = 1),
        shopName TEXT,
        address TEXT,
        phone TEXT,
        whatsapp TEXT,
        logoPath TEXT,
        language TEXT,
        invoiceLanguage TEXT,
        currency TEXT,
        taxRate REAL
      )
    ''');
    await db.execute('''
      CREATE TABLE gold_rates(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        rate24k REAL,
        rate22k REAL,
        rate21k REAL,
        rate20k REAL,
        rate18k REAL,
        silverRate REAL
      )
    ''');
    await db.execute('''
      CREATE TABLE customers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId TEXT,
        name TEXT,
        fatherName TEXT,
        cnic TEXT,
        mobile TEXT,
        whatsapp TEXT,
        address TEXT,
        city TEXT,
        email TEXT,
        notes TEXT,
        photoPath TEXT,
        cnicFrontPath TEXT,
        cnicBackPath TEXT,
        documentsPath TEXT,
        registeredDate TEXT,
        totalAmount REAL,
        paidAmount REAL
      )
    ''');
    await db.execute('''
      CREATE TABLE suppliers(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplierId TEXT,
        name TEXT,
        company TEXT,
        phone TEXT,
        whatsapp TEXT,
        address TEXT,
        cnic TEXT,
        notes TEXT,
        outstanding REAL,
        paid REAL,
        registeredDate TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId TEXT,
        sku TEXT,
        barcode TEXT,
        name TEXT,
        category TEXT,
        subcategory TEXT,
        metalType TEXT,
        designNumber TEXT,
        grossWeight REAL,
        stoneWeight REAL,
        netWeight REAL,
        purity REAL,
        karat INTEGER,
        makingCharges REAL,
        labourCharges REAL,
        stoneCharges REAL,
        purchaseCost REAL,
        salePrice REAL,
        supplierId INTEGER,
        location TEXT,
        datePurchased TEXT,
        status TEXT,
        photosPath TEXT,
        videoPath TEXT,
        certificatePath TEXT,
        description TEXT,
        quantity INTEGER,
        published INTEGER DEFAULT 0
      )
    ''');
    await db.execute('''
      CREATE TABLE sales(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceId TEXT,
        customerId INTEGER,
        customerName TEXT,
        saleDate TEXT,
        subtotal REAL,
        totalDiscount REAL,
        tax REAL,
        total REAL,
        paid REAL,
        remaining REAL,
        paymentMethod TEXT,
        notes TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE sale_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        saleId INTEGER,
        productId INTEGER,
        productName TEXT,
        grossWeight REAL,
        netWeight REAL,
        purity REAL,
        karat INTEGER,
        goldRate REAL,
        metalValue REAL,
        makingCharges REAL,
        stoneCharges REAL,
        discount REAL,
        lineTotal REAL,
        quantity INTEGER
      )
    ''');
    await db.execute('''
      CREATE TABLE purchases(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchaseId TEXT,
        supplierId INTEGER,
        supplierName TEXT,
        productId INTEGER,
        productName TEXT,
        purchaseDate TEXT,
        grossWeight REAL,
        netWeight REAL,
        purity REAL,
        karat INTEGER,
        rate REAL,
        makingCharges REAL,
        totalCost REAL,
        paid REAL,
        remaining REAL,
        paymentMethod TEXT,
        notes TEXT,
        photosPath TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE payments(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        paymentId TEXT,
        customerId INTEGER,
        customerName TEXT,
        date TEXT,
        amount REAL,
        method TEXT,
        type TEXT,
        reference TEXT,
        notes TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE ledger_entries(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customerId INTEGER,
        customerName TEXT,
        date TEXT,
        description TEXT,
        debit REAL,
        credit REAL,
        balance REAL,
        source TEXT,
        referenceId TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE expenses(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        expenseId TEXT,
        date TEXT,
        category TEXT,
        description TEXT,
        amount REAL,
        paymentMethod TEXT,
        notes TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE repairs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repairId TEXT,
        customerId INTEGER,
        customerName TEXT,
        productId INTEGER,
        productName TEXT,
        problem TEXT,
        receivedDate TEXT,
        expectedDate TEXT,
        estimatedCharges REAL,
        finalCharges REAL,
        employee TEXT,
        notes TEXT,
        status TEXT,
        photosPath TEXT,
        videosPath TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE audit_logs(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        userId INTEGER,
        username TEXT,
        action TEXT,
        entityType TEXT,
        entityId TEXT,
        details TEXT
      )
    ''');
    await _createExchangeTables(db);
    await _createInventoryTables(db);
    await _createSecurityTables(db);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await _createExchangeTables(db);
      await _createInventoryTables(db);
    }
    if (oldVersion < 3) {
      await _createSecurityTables(db);
    }
    if (oldVersion < 4) {
      await db.execute(
          'ALTER TABLE products ADD COLUMN published INTEGER DEFAULT 0');
    }
  }

  Future<void> _createExchangeTables(Database db) async {
    await db.execute('''
      CREATE TABLE exchanges(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exchangeId TEXT,
        customerId INTEGER,
        customerName TEXT,
        date TEXT,
        oldTotalValue REAL,
        newTotalValue REAL,
        makingCharges REAL,
        stoneCharges REAL,
        discount REAL,
        netAmount REAL,
        cashReceived REAL,
        amountDue REAL,
        paymentMethod TEXT,
        notes TEXT
      )
    ''');
    await db.execute('''
      CREATE TABLE exchange_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        exchangeId INTEGER,
        direction TEXT,
        metalType TEXT,
        productId INTEGER,
        productName TEXT,
        grossWeight REAL,
        netWeight REAL,
        purity REAL,
        karat INTEGER,
        rate REAL,
        metalValue REAL,
        makingCharges REAL,
        stoneCharges REAL,
        lineTotal REAL
      )
    ''');
  }

  Future<void> _createInventoryTables(Database db) async {
    await db.execute('''
      CREATE TABLE inventory_moves(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER,
        productName TEXT,
        date TEXT,
        type TEXT,
        metalType TEXT,
        weight REAL,
        quantity REAL,
        notes TEXT
      )
    ''');
  }

  Future<void> _createSecurityTables(Database db) async {
    await db.execute('''
      CREATE TABLE login_history(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER,
        username TEXT,
        timestamp TEXT,
        outcome TEXT,
        details TEXT
      )
    ''');
  }

  // ---------- USERS ----------
  Future<int> addUser(User u) async {
    final db = await database;
    return db.insert('users', u.toMap());
  }

  Future<User?> getUserByUsername(String username) async {
    final db = await database;
    final res = await db.query('users',
        where: 'username = ?', whereArgs: [username], limit: 1);
    if (res.isEmpty) return null;
    return User.fromMap(res.first);
  }

  Future<List<User>> getAllUsers() async {
    final db = await database;
    final res = await db.query('users', orderBy: 'id ASC');
    return res.map(User.fromMap).toList();
  }

  Future<void> updateUser(User u) async {
    final db = await database;
    await db.update('users', u.toMap(),
        where: 'id = ?', whereArgs: [u.id]);
  }

  Future<void> deleteUser(int id) async {
    final db = await database;
    await db.delete('users', where: 'id = ?', whereArgs: [id]);
  }

  // ---------- SETTINGS ----------
  Future<ShopSettings> getSettings() async {
    final db = await database;
    final res = await db.query('shop_settings', limit: 1);
    if (res.isEmpty) {
      final def = ShopSettings();
      await db.insert('shop_settings', def.toMap());
      return def;
    }
    return ShopSettings.fromMap(res.first);
  }

  Future<void> saveSettings(ShopSettings s) async {
    final db = await database;
    final existing = await db.query('shop_settings', limit: 1);
    if (existing.isEmpty) {
      await db.insert('shop_settings', s.toMap());
    } else {
      await db.update('shop_settings', s.toMap(),
          where: 'id = ?', whereArgs: [existing.first['id']]);
    }
  }

  // ---------- GOLD RATES ----------
  Future<GoldRate> getLatestGoldRate() async {
    final db = await database;
    final res = await db.query('gold_rates', orderBy: 'id DESC', limit: 1);
    if (res.isEmpty) {
      return GoldRate();
    }
    return GoldRate.fromMap(res.first);
  }

  Future<int> saveGoldRate(GoldRate g) async {
    final db = await database;
    return db.insert('gold_rates', g.toMap());
  }

  Future<List<GoldRate>> getAllGoldRates() async {
    final db = await database;
    final res = await db.query('gold_rates', orderBy: 'id DESC');
    return res.map(GoldRate.fromMap).toList();
  }

  // ---------- CUSTOMERS ----------
  Future<int> addCustomer(Customer c) async {
    final db = await database;
    return db.insert('customers', c.toMap());
  }

  Future<int> updateCustomer(Customer c) async {
    final db = await database;
    return db.update('customers', c.toMap(),
        where: 'id = ?', whereArgs: [c.id]);
  }

  Future<int> deleteCustomer(int id) async {
    final db = await database;
    return db.delete('customers', where: 'id = ?', whereArgs: [id]);
  }

  Future<List<Customer>> getAllCustomers() async {
    final db = await database;
    final res = await db.query('customers', orderBy: 'name ASC');
    return res.map(Customer.fromMap).toList();
  }

  Future<Customer?> getCustomer(int id) async {
    final db = await database;
    final res =
        await db.query('customers', where: 'id = ?', whereArgs: [id], limit: 1);
    if (res.isEmpty) return null;
    return Customer.fromMap(res.first);
  }

  Future<List<Customer>> searchCustomers(String query) async {
    final db = await database;
    final res = await db.rawQuery('''
      SELECT * FROM customers
      WHERE name LIKE ? OR mobile LIKE ? OR cnic LIKE ? OR customerId LIKE ?
      ORDER BY name ASC
    ''', ['%$query%', '%$query%', '%$query%', '%$query%']);
    return res.map(Customer.fromMap).toList();
  }

  Future<void> updateCustomerBalances(
      int customerId, double total, double paid) async {
    final db = await database;
    await db.rawUpdate(
        'UPDATE customers SET totalAmount = ?, paidAmount = ? WHERE id = ?',
        [total, paid, customerId]);
  }

  // ---------- SUPPLIERS ----------
  Future<int> addSupplier(Supplier s) async {
    final db = await database;
    return db.insert('suppliers', s.toMap());
  }

  Future<int> updateSupplier(Supplier s) async {
    final db = await database;
    return db.update('suppliers', s.toMap(),
        where: 'id = ?', whereArgs: [s.id]);
  }

  Future<List<Supplier>> getAllSuppliers() async {
    final db = await database;
    final res = await db.query('suppliers', orderBy: 'name ASC');
    return res.map(Supplier.fromMap).toList();
  }

  Future<Supplier?> getSupplier(int id) async {
    final db = await database;
    final res =
        await db.query('suppliers', where: 'id = ?', whereArgs: [id], limit: 1);
    if (res.isEmpty) return null;
    return Supplier.fromMap(res.first);
  }

  // ---------- PRODUCTS ----------
  Future<int> addProduct(Product p) async {
    final db = await database;
    return db.insert('products', p.toMap());
  }

  Future<int> updateProduct(Product p) async {
    final db = await database;
    return db.update('products', p.toMap(),
        where: 'id = ?', whereArgs: [p.id]);
  }

  Future<List<Product>> getAllProducts() async {
    final db = await database;
    final res = await db.query('products', orderBy: 'productId ASC');
    return res.map(Product.fromMap).toList();
  }

  Future<Product?> getProduct(int id) async {
    final db = await database;
    final res =
        await db.query('products', where: 'id = ?', whereArgs: [id], limit: 1);
    if (res.isEmpty) return null;
    return Product.fromMap(res.first);
  }

  Future<Product?> getProductBySku(String sku) async {
    final db = await database;
    final res = await db.query('products',
        where: 'sku = ? OR productId = ?',
        whereArgs: [sku, sku],
        limit: 1);
    if (res.isEmpty) return null;
    return Product.fromMap(res.first);
  }

  Future<List<Product>> searchProducts(String query) async {
    final db = await database;
    final res = await db.rawQuery('''
      SELECT * FROM products
      WHERE name LIKE ? OR productId LIKE ? OR barcode LIKE ? OR sku LIKE ?
      ORDER BY productId ASC
    ''', ['%$query%', '%$query%', '%$query%', '%$query%']);
    return res.map(Product.fromMap).toList();
  }

  Future<void> updateProductStatus(int productId, String status) async {
    final db = await database;
    await db.update('products', {'status': status},
        where: 'id = ?', whereArgs: [productId]);
  }

  // ---------- SALES ----------
  Future<int> addSale(Sale sale, List<SaleItem> items) async {
    final db = await database;
    return db.transaction((txn) async {
      final saleId = await txn.insert('sales', sale.toMap());
      for (final item in items) {
        await txn.insert('sale_items', {
          ...item.toMap(),
          'saleId': saleId,
        });
      }
      return saleId;
    });
  }

  Future<List<Sale>> getAllSales() async {
    final db = await database;
    final res = await db.query('sales', orderBy: 'id DESC');
    return res.map(Sale.fromMap).toList();
  }

  Future<List<Sale>> getSalesBetween(DateTime start, DateTime end) async {
    final db = await database;
    final res = await db.query('sales',
        where: 'saleDate >= ? AND saleDate <= ?',
        whereArgs: [start.toIso8601String(), end.toIso8601String()],
        orderBy: 'id DESC');
    return res.map(Sale.fromMap).toList();
  }

  Future<List<SaleItem>> getSaleItems(int saleId) async {
    final db = await database;
    final res = await db.query('sale_items',
        where: 'saleId = ?', whereArgs: [saleId]);
    return res.map(SaleItem.fromMap).toList();
  }

  Future<List<Sale>> getSalesForCustomer(int customerId) async {
    final db = await database;
    final res = await db.query('sales',
        where: 'customerId = ?', whereArgs: [customerId], orderBy: 'id DESC');
    return res.map(Sale.fromMap).toList();
  }

  Future<Sale?> getSale(int id) async {
    final db = await database;
    final res = await db.query('sales', where: 'id = ?', whereArgs: [id], limit: 1);
    if (res.isEmpty) return null;
    return Sale.fromMap(res.first);
  }

  Future<double> getTotalSales() async {
    final db = await database;
    final res = await db.rawQuery('SELECT COALESCE(SUM(total),0) AS t FROM sales');
    return res.first['t'] as double? ?? 0;
  }

  // ---------- PURCHASES ----------
  Future<int> addPurchase(Purchase p) async {
    final db = await database;
    return db.insert('purchases', p.toMap());
  }

  Future<List<Purchase>> getAllPurchases() async {
    final db = await database;
    final res = await db.query('purchases', orderBy: 'id DESC');
    return res.map(Purchase.fromMap).toList();
  }

  Future<double> getTotalPurchases() async {
    final db = await database;
    final res = await db.rawQuery('SELECT COALESCE(SUM(totalCost),0) AS t FROM purchases');
    return res.first['t'] as double? ?? 0;
  }

  // ---------- PAYMENTS ----------
  Future<int> addPayment(Payment p) async {
    final db = await database;
    return db.insert('payments', p.toMap());
  }

  Future<List<Payment>> getAllPayments() async {
    final db = await database;
    final res = await db.query('payments', orderBy: 'id DESC');
    return res.map(Payment.fromMap).toList();
  }

  Future<List<Payment>> getPaymentsForCustomer(int customerId) async {
    final db = await database;
    final res = await db.query('payments',
        where: 'customerId = ?', whereArgs: [customerId], orderBy: 'id DESC');
    return res.map(Payment.fromMap).toList();
  }

  Future<double> getTotalReceived() async {
    final db = await database;
    final res = await db.rawQuery(
        'SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE type=?',
        ['Received']);
    return res.first['t'] as double? ?? 0;
  }

  // ---------- LEDGER ----------
  Future<int> addLedgerEntry(LedgerEntry e) async {
    final db = await database;
    return db.insert('ledger_entries', e.toMap());
  }

  Future<List<LedgerEntry>> getLedgerForCustomer(int customerId) async {
    final db = await database;
    final res = await db.query('ledger_entries',
        where: 'customerId = ?', whereArgs: [customerId], orderBy: 'id ASC');
    return res.map(LedgerEntry.fromMap).toList();
  }

  Future<List<LedgerEntry>> getAllLedger() async {
    final db = await database;
    final res = await db.query('ledger_entries', orderBy: 'id DESC');
    return res.map(LedgerEntry.fromMap).toList();
  }

  Future<double> getTotalReceivables() async {
    final db = await database;
    final res = await db.rawQuery(
        'SELECT COALESCE(SUM(totalAmount - paidAmount),0) AS t FROM customers');
    return res.first['t'] as double? ?? 0;
  }

  Future<double> getTotalPayables() async {
    final db = await database;
    final res = await db.rawQuery(
        'SELECT COALESCE(SUM(outstanding - paid),0) AS t FROM suppliers');
    return res.first['t'] as double? ?? 0;
  }

  // ---------- EXPENSES ----------
  Future<int> addExpense(Expense e) async {
    final db = await database;
    return db.insert('expenses', e.toMap());
  }

  Future<List<Expense>> getAllExpenses() async {
    final db = await database;
    final res = await db.query('expenses', orderBy: 'id DESC');
    return res.map(Expense.fromMap).toList();
  }

  Future<double> getTotalExpenses() async {
    final db = await database;
    final res = await db.rawQuery('SELECT COALESCE(SUM(amount),0) AS t FROM expenses');
    return res.first['t'] as double? ?? 0;
  }

  // ---------- REPAIRS ----------
  Future<int> addRepair(Repair r) async {
    final db = await database;
    return db.insert('repairs', r.toMap());
  }

  Future<int> updateRepair(Repair r) async {
    final db = await database;
    return db.update('repairs', r.toMap(),
        where: 'id = ?', whereArgs: [r.id]);
  }

  Future<List<Repair>> getAllRepairs() async {
    final db = await database;
    final res = await db.query('repairs', orderBy: 'id DESC');
    return res.map(Repair.fromMap).toList();
  }

  Future<List<Repair>> getPendingRepairs() async {
    final db = await database;
    final res = await db.query('repairs',
        where: "status != ?", whereArgs: ['Delivered'], orderBy: 'id DESC');
    return res.map(Repair.fromMap).toList();
  }

  // ---------- AUDIT LOGS ----------
  Future<int> addAuditLog(AuditLog a) async {
    final db = await database;
    return db.insert('audit_logs', a.toMap());
  }

  Future<List<AuditLog>> getAllAuditLogs() async {
    final db = await database;
    final res = await db.query('audit_logs', orderBy: 'id DESC', limit: 500);
    return res.map(AuditLog.fromMap).toList();
  }

  // ---------- DASHBOARD SUMMARY ----------
  Future<Map<String, dynamic>> getDashboardSummary() async {
    final db = await database;
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    final endOfDay =
        startOfDay.add(const Duration(days: 1, milliseconds: -1));

    final todaySales = await db.rawQuery(
        'SELECT COALESCE(SUM(total),0) AS t FROM sales WHERE saleDate >= ? AND saleDate <= ?',
        [startOfDay.toIso8601String(), endOfDay.toIso8601String()]);
    final todayPaid = await db.rawQuery(
        'SELECT COALESCE(SUM(paid),0) AS t FROM sales WHERE saleDate >= ? AND saleDate <= ?',
        [startOfDay.toIso8601String(), endOfDay.toIso8601String()]);
    final customerCount = await db.rawQuery('SELECT COUNT(*) AS c FROM customers');
    final productCount = await db.rawQuery('SELECT COUNT(*) AS c FROM products');
    final goldStock = await db.rawQuery(
        'SELECT COALESCE(SUM(netWeight),0) AS w FROM products WHERE metalType=? AND status=?',
        ['Gold', 'In Stock']);
    final silverStock = await db.rawQuery(
        'SELECT COALESCE(SUM(netWeight),0) AS w FROM products WHERE metalType=? AND status=?',
        ['Silver', 'In Stock']);
    final pendingRepairs =
        await db.rawQuery("SELECT COUNT(*) AS c FROM repairs WHERE status != ?",
            ['Delivered']);

    final cashReceived = await db.rawQuery(
        'SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE type=?',
        ['Received']);
    final cashPaid = await db.rawQuery(
        'SELECT COALESCE(SUM(amount),0) AS t FROM payments WHERE type=?',
        ['Paid']);
    final expenses = await db.rawQuery('SELECT COALESCE(SUM(amount),0) AS t FROM expenses');
    final purchases = await db.rawQuery('SELECT COALESCE(SUM(totalCost),0) AS t FROM purchases');

    final receivables = await db.rawQuery(
        'SELECT COALESCE(SUM(totalAmount - paidAmount),0) AS t FROM customers');
    final payables = await db.rawQuery(
        'SELECT COALESCE(SUM(outstanding - paid),0) AS t FROM suppliers');

    final monthStart = DateTime(today.year, today.month, 1);
    final monthSales = await db.rawQuery(
        'SELECT COALESCE(SUM(total),0) AS t FROM sales WHERE saleDate >= ?',
        [monthStart.toIso8601String()]);

    final lowStock = await db.rawQuery(
        'SELECT COUNT(*) AS c FROM products WHERE quantity <= 0 AND status=?',
        ['In Stock']);

    final totalSales = await db.rawQuery('SELECT COALESCE(SUM(total),0) AS t FROM sales');

    // Profit estimate: sales total - (purchase cost) - expenses
    final costT = await db.rawQuery(
        'SELECT COALESCE(SUM(p.purchaseCost * si.quantity),0) AS t FROM sale_items si INNER JOIN products p ON si.productId = p.id');
    final salesT = totalSales.first['t'] as double? ?? 0;
    final costV = costT.first['t'] as double? ?? 0;
    final expV = expenses.first['t'] as double? ?? 0;
    final profit = salesT - costV - expV;

    return {
      'todaySales': todaySales.first['t'] as double? ?? 0,
      'todayPaid': todayPaid.first['t'] as double? ?? 0,
      'totalCustomers': customerCount.first['c'] as int? ?? 0,
      'totalProducts': productCount.first['c'] as int? ?? 0,
      'goldStock': goldStock.first['w'] as double? ?? 0,
      'silverStock': silverStock.first['w'] as double? ?? 0,
      'pendingRepairs': pendingRepairs.first['c'] as int? ?? 0,
      'cashBalance': (cashReceived.first['t'] as double? ?? 0) -
          (cashPaid.first['t'] as double? ?? 0) -
          (expenses.first['t'] as double? ?? 0) -
          (purchases.first['t'] as double? ?? 0),
      'receivables': receivables.first['t'] as double? ?? 0,
      'payables': payables.first['t'] as double? ?? 0,
      'monthlySales': monthSales.first['t'] as double? ?? 0,
      'lowStock': lowStock.first['c'] as int? ?? 0,
      'profit': profit,
    };
  }

  Future<List<Map<String, dynamic>>> getRecentTransactions({int limit = 10}) async {
    final db = await database;
    final sales = await db.rawQuery('''
      SELECT '', invoiceId AS refId, saleDate AS date, total AS amount, 'Sale' AS type, customerName
      FROM sales ORDER BY id DESC LIMIT $limit
    ''');
    final payments = await db.rawQuery('''
      SELECT '', paymentId AS refId, date, amount, 'Payment' AS type, customerName
      FROM payments ORDER BY id DESC LIMIT $limit
    ''');
    final purchases = await db.rawQuery('''
      SELECT '', purchaseId AS refId, purchaseDate AS date, totalCost AS amount, 'Purchase' AS type, supplierName
      FROM purchases ORDER BY id DESC LIMIT $limit
    ''');
    final combined = [...sales, ...payments, ...purchases];
    combined.sort((a, b) =>
        ((b['date'] ?? '') as String).compareTo((a['date'] ?? '') as String));
    return combined.take(limit).toList();
  }

  // ---------- EXCHANGES ----------
  Future<int> addExchange(Exchange ex, List<ExchangeItem> items) async {
    final db = await database;
    return db.transaction((txn) async {
      final exId = await txn.insert('exchanges', ex.toMap());
      for (final item in items) {
        await txn.insert('exchange_items', {
          ...item.toMap(),
          'exchangeId': exId,
        });
      }
      return exId;
    });
  }

  Future<List<Exchange>> getAllExchanges() async {
    final db = await database;
    final res = await db.query('exchanges', orderBy: 'id DESC');
    return res.map(Exchange.fromMap).toList();
  }

  Future<List<Exchange>> getExchangesForCustomer(int customerId) async {
    final db = await database;
    final res = await db.query('exchanges',
        where: 'customerId = ?', whereArgs: [customerId], orderBy: 'id DESC');
    return res.map(Exchange.fromMap).toList();
  }

  Future<List<ExchangeItem>> getExchangeItems(int exchangeId) async {
    final db = await database;
    final res = await db.query('exchange_items',
        where: 'exchangeId = ?', whereArgs: [exchangeId]);
    return res.map(ExchangeItem.fromMap).toList();
  }

  // ---------- LOGIN HISTORY ----------
  Future<int> addLoginRecord(
      int userId, String username, String outcome, String details) async {
    final db = await database;
    return db.insert('login_history', {
      'userId': userId,
      'username': username,
      'timestamp': DateTime.now().toIso8601String(),
      'outcome': outcome,
      'details': details,
    });
  }

  Future<List<Map<String, dynamic>>> getLoginHistory({int limit = 200}) async {
    final db = await database;
    final res = await db.query('login_history',
        orderBy: 'id DESC', limit: limit);
    return res;
  }

  // ---------- REPORTS / AGGREGATIONS ----------
  Future<List<Map<String, dynamic>>> getProductSalesSummary() async {
    final db = await database;
    final res = await db.rawQuery('''
      SELECT si.productId AS pid, MAX(p.name) AS name,
             SUM(si.quantity) AS qty,
             SUM(si.metalValue + si.makingCharges + si.stoneCharges) AS revenue,
             COALESCE(MAX(p.purchaseCost),0) AS cost
      FROM sale_items si LEFT JOIN products p ON si.productId = p.id
      GROUP BY si.productId
      ORDER BY revenue DESC
    ''');
    return res;
  }

  // ---------- INVENTORY MOVES ----------
  Future<int> addInventoryMove(InventoryMove m) async {
    final db = await database;
    return db.insert('inventory_moves', m.toMap());
  }

  Future<List<InventoryMove>> getInventoryMoves({int? productId}) async {
    final db = await database;
    final where = productId != null ? 'productId = ?' : null;
    final args = productId != null ? [productId] : null;
    final res = await db.query('inventory_moves',
        where: where, whereArgs: args, orderBy: 'id DESC');
    return res.map(InventoryMove.fromMap).toList();
  }

  Future<Map<String, dynamic>> getInventorySummary() async {
    final db = await database;
    final goldStock = await db.rawQuery(
        'SELECT COALESCE(SUM(netWeight),0) AS w, COUNT(*) AS c FROM products WHERE metalType=? AND status=?',
        ['Gold', 'In Stock']);
    final silverStock = await db.rawQuery(
        'SELECT COALESCE(SUM(netWeight),0) AS w, COUNT(*) AS c FROM products WHERE metalType=? AND status=?',
        ['Silver', 'In Stock']);
    final inStock = await db.rawQuery(
        "SELECT COUNT(*) AS c FROM products WHERE status='In Stock'");
    final sold = await db.rawQuery(
        "SELECT COUNT(*) AS c FROM products WHERE status='Sold'");
    final reserved = await db.rawQuery(
        "SELECT COUNT(*) AS c FROM products WHERE status='Reserved'");
    final damaged = await db.rawQuery(
        "SELECT COUNT(*) AS c FROM products WHERE status='Lost'");
    final inRepair = await db.rawQuery(
        "SELECT COUNT(*) AS c FROM products WHERE status='Repair'");
    return {
      'goldWeight': goldStock.first['w'] as double? ?? 0,
      'goldCount': goldStock.first['c'] as int? ?? 0,
      'silverWeight': silverStock.first['w'] as double? ?? 0,
      'silverCount': silverStock.first['c'] as int? ?? 0,
      'inStock': inStock.first['c'] as int? ?? 0,
      'sold': sold.first['c'] as int? ?? 0,
      'reserved': reserved.first['c'] as int? ?? 0,
      'damaged': damaged.first['c'] as int? ?? 0,
      'inRepair': inRepair.first['c'] as int? ?? 0,
    };
  }
}
