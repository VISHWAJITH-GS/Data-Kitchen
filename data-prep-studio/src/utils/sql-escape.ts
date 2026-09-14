/**
 * Safely escapes a SQL identifier (like a column or table name).
 * Wraps in double quotes and escapes internal double quotes.
 */
export function escapeIdentifier(name: string): string {
  if (!name) return name;
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * Safely escapes a SQL string literal (like a filename or constant value).
 * Escapes single quotes with double single quotes.
 */
export function escapeSqlString(value: string): string {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}
