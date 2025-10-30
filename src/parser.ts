import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { BlackboardStudent } from "./types.js";

/**
 * Parse a Blackboard CSV export file and extract student information
 */
export function parseBlackboardCsv(
  filePath: string,
  emailDomain: string,
): BlackboardStudent[] {
  const content = readFileSync(filePath, "utf-8");

  // Parse CSV with quoted fields
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
  });

  // Extract only the fields we need
  const students: BlackboardStudent[] = records.map((record: any) => {
    // Handle both quoted and unquoted column names
    const lastName = record["Last Name"] || record.lastName || "";
    const firstName = record["First Name"] || record.firstName || "";
    const username = record["Username"] || record.username || "";
    const studentId = record["Student ID"] || record.studentId || "";

    if (!username || !studentId) {
      throw new Error(
        `Missing required fields for student: ${JSON.stringify(record)}`,
      );
    }

    return {
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      username: username.trim(),
      studentId: studentId.trim(),
      email: `${username.trim()}@${emailDomain.trim()}`,
    };
  });

  return students;
}
