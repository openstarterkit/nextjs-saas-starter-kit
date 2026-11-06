/**
 * One CSV cell, quoted. A value that starts with =, +, -, @, a tab or a
 * carriage return is prefixed with an apostrophe: spreadsheet apps evaluate
 * such a cell as a formula even inside quotes, and some of these values come
 * from anonymous visitors (the newsletter form's `source`, an email address).
 * The apostrophe is the convention Excel and Sheets read as "this is text".
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${safe.replace(/"/g, '""')}"`
}
