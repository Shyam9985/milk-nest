const { validateQueryAndValues } = require("../utils/db.utils");

// ============================================================
// TEST RUNNER
// ============================================================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(testName, testFunction) {
  totalTests++;

  try {
    testFunction();

    passedTests++;

    console.log(`✅ PASS: ${testName}`);
  } catch (error) {
    failedTests++;

    console.log(`❌ FAIL: ${testName}`);
    console.log(`   Error: ${error.message}`);
  }
}

function expectNoError(testFunction) {
  testFunction();
}

function expectError(testFunction) {
  let errorThrown = false;

  try {
    testFunction();
  } catch (error) {
    errorThrown = true;
  }

  if (!errorThrown) {
    throw new Error("Expected function to throw an error, but it did not.");
  }
}

// ============================================================
// START TESTS
// ============================================================

console.log("\n");
console.log("============================================================");
console.log("        validateQueryAndValues() TEST CASES");
console.log("============================================================");
console.log("\n");

// ============================================================
// 1. BASIC QUERY VALIDATION
// ============================================================

console.log("------------------------------------------------------------");
console.log("1. BASIC QUERY VALIDATION");
console.log("------------------------------------------------------------");

runTest("Valid SELECT query", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users", []);
  });
});

runTest("Reject null query", () => {
  expectError(() => {
    validateQueryAndValues(null, []);
  });
});

runTest("Reject undefined query", () => {
  expectError(() => {
    validateQueryAndValues(undefined, []);
  });
});

runTest("Reject number as query", () => {
  expectError(() => {
    validateQueryAndValues(123, []);
  });
});

runTest("Reject object as query", () => {
  expectError(() => {
    validateQueryAndValues({}, []);
  });
});

runTest("Reject empty query", () => {
  expectError(() => {
    validateQueryAndValues("", []);
  });
});

runTest("Reject whitespace-only query", () => {
  expectError(() => {
    validateQueryAndValues("     ", []);
  });
});

// ============================================================
// 2. VALUES VALIDATION
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("2. VALUES VALIDATION");
console.log("------------------------------------------------------------");

runTest("Accept empty values array", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users", []);
  });
});

runTest("Accept string value", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE name = ?", ["Syam"]);
  });
});

runTest("Accept number value", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE id = ?", [10]);
  });
});

runTest("Accept boolean value", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE active = ?", [true]);
  });
});

runTest("Accept null value", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE deleted_at IS ?", [null]);
  });
});

runTest("Accept multiple valid values", () => {
  expectNoError(() => {
    validateQueryAndValues(
      `SELECT * FROM users WHERE id = ? AND name = ? AND active = ? AND deleted_at IS ?`,
      [10, "Syam", true, null],
    );
  });
});

runTest("Reject string as values", () => {
  expectError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE id = ?", "10");
  });
});

runTest("Reject object as values", () => {
  expectError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE id = ?", { id: 10 });
  });
});

runTest("Reject number as values", () => {
  expectError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE id = ?", 10);
  });
});

runTest("Reject bigint value", () => {
  expectError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE id = ?", [10n]);
  });
});

runTest("Reject function value", () => {
  expectError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE id = ?", [() => {}]);
  });
});

runTest("Reject symbol value", () => {
  expectError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE id = ?", [Symbol("id")]);
  });
});

// ============================================================
// 3. SINGLE STATEMENT VALIDATION
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("3. SINGLE STATEMENT VALIDATION");
console.log("------------------------------------------------------------");

runTest("Accept one SELECT statement", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users", []);
  });
});

runTest("Accept trailing semicolon", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users;", []);
  });
});

runTest("Reject multiple SQL statements", () => {
  expectError(() => {
    validateQueryAndValues("SELECT * FROM users; SELECT * FROM orders;", []);
  });
});

runTest("Reject three SQL statements", () => {
  expectError(() => {
    validateQueryAndValues(
      `SELECT * FROM users; SELECT * FROM orders; SELECT * FROM products;`,
      [],
    );
  });
});

// ============================================================
// 4. UPDATE WHERE VALIDATION
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("4. UPDATE WHERE VALIDATION");
console.log("------------------------------------------------------------");

runTest("Reject UPDATE without WHERE", () => {
  expectError(() => {
    validateQueryAndValues("UPDATE users SET name = ?", ["Syam"]);
  });
});

runTest("Accept UPDATE with WHERE", () => {
  expectNoError(() => {
    validateQueryAndValues("UPDATE users SET name = ? WHERE id = ?", [
      "Syam",
      10,
    ]);
  });
});

runTest("Accept UPDATE with multiple conditions", () => {
  expectNoError(() => {
    validateQueryAndValues(
      `UPDATE users SET name = ? WHERE id = ? AND active = ?`,
      ["Syam", 10, true],
    );
  });
});

runTest("Reject UPDATE with multiple SET values but no WHERE", () => {
  expectError(() => {
    validateQueryAndValues(`UPDATE users SET name = ?, email = ?, active = ?`, [
      "Syam",
      "syam@example.com",
      true,
    ]);
  });
});

// ============================================================
// 5. DELETE WHERE VALIDATION
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("5. DELETE WHERE VALIDATION");
console.log("------------------------------------------------------------");

runTest("Reject DELETE without WHERE", () => {
  expectError(() => {
    validateQueryAndValues("DELETE FROM users", []);
  });
});

runTest("Accept DELETE with WHERE", () => {
  expectNoError(() => {
    validateQueryAndValues("DELETE FROM users WHERE id = ?", [10]);
  });
});

runTest("Accept DELETE with multiple conditions", () => {
  expectNoError(() => {
    validateQueryAndValues(`DELETE FROM users WHERE id = ? AND active = ?`, [
      10,
      false,
    ]);
  });
});

// ============================================================
// 6. SELECT VALIDATION
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("6. SELECT VALIDATION");
console.log("------------------------------------------------------------");

runTest("Allow SELECT without WHERE", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users", []);
  });
});

runTest("Allow SELECT with WHERE", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM users WHERE id = ?", [10]);
  });
});

runTest("Allow SELECT with JOIN", () => {
  expectNoError(() => {
    validateQueryAndValues(
      `SELECT u.id, o.order_id FROM users u INNER JOIN orders o ON u.id = o.user_id`,
      [],
    );
  });
});

runTest("Allow SELECT with subquery", () => {
  expectNoError(() => {
    validateQueryAndValues(
      `SELECT * FROM users WHERE id IN (SELECT user_id FROM orders)`,
      [],
    );
  });
});

// ============================================================
// 7. CTE VALIDATION
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("7. CTE VALIDATION");
console.log("------------------------------------------------------------");

runTest("Allow CTE SELECT", () => {
  const query = `WITH inactive_users AS (
                SELECT id FROM users WHERE status = 'inactive')
                SELECT *FROM inactive_users`;

  expectNoError(() => {
    validateQueryAndValues(query, []);
  });
});

runTest("Allow multiple CTE SELECT", () => {
  const query = `
            WITH
            inactive_users AS (
                SELECT id FROM users WHERE status = 'inactive'),
            user_orders AS (
                SELECT user_id FROM orders WHERE status = 'pending'
            )
            SELECT * FROM inactive_users
        `;

  expectNoError(() => {
    validateQueryAndValues(query, []);
  });
});

runTest("Allow CTE UPDATE with WHERE", () => {
  const query = `
            WITH inactive_users AS (
                SELECT id FROM users WHERE status = 'inactive'
            )
            UPDATE users
            SET status = 'archived'
            WHERE id IN (SELECT id FROM inactive_users)
        `;

  expectNoError(() => {
    validateQueryAndValues(query, []);
  });
});

runTest("Reject CTE UPDATE without final WHERE", () => {
  const query = `
            WITH inactive_users AS (
                SELECT id FROM users WHERE status = 'inactive'
            )
            UPDATE users SET status = 'archived'
        `;

  expectError(() => {
    validateQueryAndValues(query, []);
  });
});

runTest("Allow CTE DELETE with WHERE", () => {
  const query = `
            WITH inactive_users AS (
                SELECT id FROM users WHERE status = 'inactive'
            )
            DELETE FROM users
            WHERE id IN (SELECT id FROM inactive_users)
        `;

  expectNoError(() => {
    validateQueryAndValues(query, []);
  });
});

// ============================================================
// 8. SUBQUERY / MULTIPLE WHERE
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("8. SUBQUERY / MULTIPLE WHERE");
console.log("------------------------------------------------------------");

runTest("Allow UPDATE with subquery WHERE", () => {
  const query = `
            UPDATE users
            SET status = 'inactive'
            WHERE id IN (
                SELECT user_id
                FROM orders
                WHERE status = 'cancelled'
            )
        `;

  expectNoError(() => {
    validateQueryAndValues(query, []);
  });
});

runTest("Allow DELETE with subquery WHERE", () => {
  const query = `
            DELETE FROM users
            WHERE id IN (SELECT user_id FROM orders WHERE status = 'cancelled')
        `;

  expectNoError(() => {
    validateQueryAndValues(query, []);
  });
});

// ============================================================
// 9. DANGEROUS KEYWORDS
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("9. DANGEROUS KEYWORDS");
console.log("------------------------------------------------------------");

const dangerousQueries = [
  {
    name: "CREATE",
    query: "CREATE TABLE users (id INT)",
  },

  {
    name: "ALTER",
    query: "ALTER TABLE users ADD COLUMN age INT",
  },

  {
    name: "DROP",
    query: "DROP TABLE users",
  },

  {
    name: "TRUNCATE",
    query: "TRUNCATE TABLE users",
  },

  {
    name: "RENAME",
    query: "RENAME TABLE users TO customers",
  },

  {
    name: "GRANT",
    query: "GRANT SELECT ON users TO user1",
  },

  {
    name: "REVOKE",
    query: "REVOKE SELECT ON users FROM user1",
  },

  {
    name: "COMMIT",
    query: "COMMIT",
  },

  {
    name: "ROLLBACK",
    query: "ROLLBACK",
  },

  {
    name: "START TRANSACTION",
    query: "START TRANSACTION",
  },

  {
    name: "BEGIN",
    query: "BEGIN",
  },

  {
    name: "SAVEPOINT",
    query: "SAVEPOINT test_point",
  },

  {
    name: "RELEASE SAVEPOINT",
    query: "RELEASE SAVEPOINT test_point",
  },

  {
    name: "KILL",
    query: "KILL 123",
  },

  {
    name: "SHUTDOWN",
    query: "SHUTDOWN",
  },
];

for (const item of dangerousQueries) {
  runTest(`Reject dangerous keyword: ${item.name}`, () => {
    expectError(() => {
      validateQueryAndValues(item.query, []);
    });
  });
}

// ============================================================
// 10. CASE / FORMATTING
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("10. CASE / FORMATTING");
console.log("------------------------------------------------------------");

runTest("Accept uppercase SQL", () => {
  expectNoError(() => {
    validateQueryAndValues("SELECT * FROM USERS WHERE ID = ?", [1]);
  });
});

runTest("Accept lowercase SQL", () => {
  expectNoError(() => {
    validateQueryAndValues("select * from users where id = ?", [1]);
  });
});

runTest("Accept mixed-case SQL", () => {
  expectNoError(() => {
    validateQueryAndValues("SeLeCt * FrOm users WhErE id = ?", [1]);
  });
});

runTest("Accept query with extra spaces", () => {
  expectNoError(() => {
    validateQueryAndValues(`SELECT * FROM users WHERE id = ?`, [1]);
  });
});

// ============================================================
// 11. COMPLEX QUERIES
// ============================================================

console.log("\n------------------------------------------------------------");
console.log("11. COMPLEX QUERIES");
console.log("------------------------------------------------------------");

runTest("Allow SELECT with CASE expression", () => {
  const query = `SELECT id, name, CASE WHEN active = 1 THEN 'Active' ELSE 'Inactive' END AS status FROM users`;

  expectNoError(() => {
    validateQueryAndValues(query, []);
  });
});

runTest("Allow SELECT with GROUP BY", () => {
  const query = `
            SELECT department, COUNT(*) AS total
            FROM employees
            GROUP BY department
        `;

  expectNoError(() => {
    validateQueryAndValues(query, []);
  });
});

runTest("Allow SELECT with ORDER BY and LIMIT", () => {
  const query = `SELECT * FROM users WHERE active = ? ORDER BY created_at DESC LIMIT ?`;

  expectNoError(() => {
    validateQueryAndValues(query, [true, 10]);
  });
});

runTest("Allow INSERT query", () => {
  expectNoError(() => {
    validateQueryAndValues("INSERT INTO users (name, age) VALUES (?, ?)", [
      "Syam",
      25,
    ]);
  });
});

runTest("Allow INSERT with multiple rows", () => {
  expectNoError(() => {
    validateQueryAndValues(
      `INSERT INTO users (name, age) VALUES (?, ?), (?, ?)`,
      ["Syam", 25, "Prasad", 26],
    );
  });
});

// ============================================================
// FINAL RESULT
// ============================================================

console.log("\n");
console.log("============================================================");
console.log("                    TEST SUMMARY");
console.log("============================================================");

console.log(`Total Tests : ${totalTests}`);
console.log(`Passed      : ${passedTests}`);
console.log(`Failed      : ${failedTests}`);

console.log("============================================================");

if (failedTests === 0) {
  console.log("🎉 ALL TESTS PASSED");
} else {
  console.log("⚠️ SOME TESTS FAILED");
}

console.log("============================================================");
console.log("\n");
