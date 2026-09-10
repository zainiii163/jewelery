import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

const _livePath =
    r'C:\Users\zainii\AppData\Roaming\com.jewelleryshop\jewellery_shop\jewellery_shop.db';
const _fixturePath =
    r'C:\Users\zainii\AppData\Local\Temp\opencode\migration_test.db';

void main() {
  test('live v1 DB migrates to v4 (exchange/inventory/login_history/published)',
      () async {
    final src = File(_livePath);
    if (!src.existsSync()) {
      markTestSkipped('live DB fixture not available on this machine');
      return;
    }
    // Fresh copy each run so the pre-migration state is deterministic.
    final fixture = File(_fixturePath);
    src.copySync(fixture.path);

    sqfliteFfiInit();
    databaseFactory = databaseFactoryFfi;
    final db = await databaseFactory.openDatabase(
      _fixturePath,
      options: OpenDatabaseOptions(version: 1),
    );
    final before =
        await db.rawQuery("SELECT name FROM sqlite_master WHERE type='table'");
    await db.close();
    final beforeNames = before.map((r) => r['name']).toSet();
    expect(beforeNames, isNot(contains('exchanges')));
    expect(beforeNames, isNot(contains('inventory_moves')));

    final db2 = await databaseFactory.openDatabase(
      _fixturePath,
      options: OpenDatabaseOptions(
        version: 4,
        onUpgrade: (db, oldV, newV) async {
          if (oldV < 2) {
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
          if (oldV < 3) {
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
          if (oldV < 4) {
            await db.execute(
                'ALTER TABLE products ADD COLUMN published INTEGER DEFAULT 0');
          }
        },
      ),
    );
    final after =
        await db2.rawQuery("SELECT name FROM sqlite_master WHERE type='table'");
    final integrity = await db2.rawQuery('PRAGMA integrity_check');
    final cols = await db2.rawQuery('PRAGMA table_info(products)');
    final names = after.map((r) => r['name']).toSet();
    expect(names, containsAll(
        ['exchanges', 'exchange_items', 'inventory_moves', 'login_history']));
    expect(cols.map((c) => c['name']), contains('published'));
    expect(integrity.first['integrity_check'], 'ok');
    await db2.close();
  });
}