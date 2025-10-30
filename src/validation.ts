import { readFileSync } from "node:fs";
import type { ProcessOptions } from "./types.js";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate that a string has no spaces
 */
function hasNoSpaces(value: string): boolean {
  return !/\s/.test(value);
}

/**
 * Validate that a string is a valid domain (no @ symbol, basic format)
 */
function isValidDomain(domain: string): boolean {
  // Basic domain validation: no @, has at least one dot, no spaces
  return (
    !domain.includes("@") &&
    domain.includes(".") &&
    hasNoSpaces(domain) &&
    domain.length > 3 &&
    /^[a-z0-9.-]+$/i.test(domain)
  );
}

/**
 * Validate that a date string is in YYYY-MM-DD format
 */
function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate process options
 */
export function validateOptions(options: ProcessOptions): void {
  const errors: string[] = [];

  // Validate limit
  if (typeof options.limit !== "number" || isNaN(options.limit)) {
    errors.push("limit must be a valid number");
  } else if (options.limit <= 0) {
    errors.push("limit must be greater than 0");
  } else if (!Number.isFinite(options.limit)) {
    errors.push("limit must be a finite number");
  }

  // Validate courseCode
  if (!options.courseCode || typeof options.courseCode !== "string") {
    errors.push("courseCode is required");
  } else if (options.courseCode.trim().length === 0) {
    errors.push("courseCode cannot be empty");
  } else if (!hasNoSpaces(options.courseCode)) {
    errors.push("courseCode cannot contain spaces");
  }

  // Validate section
  if (!options.section || typeof options.section !== "string") {
    errors.push("section is required");
  } else if (options.section.trim().length === 0) {
    errors.push("section cannot be empty");
  } else if (!hasNoSpaces(options.section)) {
    errors.push("section cannot contain spaces");
  }

  // Validate term
  if (!options.term || typeof options.term !== "string") {
    errors.push("term is required");
  } else if (options.term.trim().length === 0) {
    errors.push("term cannot be empty");
  } else if (!hasNoSpaces(options.term)) {
    errors.push("term cannot contain spaces");
  }

  // Validate date (optional)
  if (options.date !== undefined) {
    if (typeof options.date !== "string") {
      errors.push("date must be a string in YYYY-MM-DD format");
    } else if (!isValidDate(options.date)) {
      errors.push("date must be in YYYY-MM-DD format");
    }
  }

  // Validate emailDomain (optional)
  if (options.emailDomain !== undefined) {
    if (typeof options.emailDomain !== "string") {
      errors.push("emailDomain must be a string");
    } else if (options.emailDomain.trim().length === 0) {
      errors.push("emailDomain cannot be empty");
    } else if (!isValidDomain(options.emailDomain)) {
      errors.push(
        "emailDomain must be a valid domain (e.g., myseneca.ca) without @ symbol",
      );
    }
  }

  // Validate output (optional)
  if (options.output !== undefined) {
    if (typeof options.output !== "string") {
      errors.push("output must be a string");
    } else if (options.output.trim().length === 0) {
      errors.push("output cannot be empty");
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(
      `Validation failed:\n  - ${errors.join("\n  - ")}`,
    );
  }
}

/**
 * Validate that the CSV has the required columns
 */
export function validateBlackboardCsv(filePath: string): void {
  const content = readFileSync(filePath, "utf-8");
  const firstLine = content.split("\n")[0];

  const requiredColumns = ["Username", "Student ID"];
  const missingColumns = requiredColumns.filter(
    (col) => !firstLine.includes(col),
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `Missing required columns: ${missingColumns.join(", ")}\n` +
        `Expected columns: ${requiredColumns.join(", ")}`,
    );
  }
}
