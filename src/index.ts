import { create, getProvisioningKey } from "openrouter-key-manager";
import { writeFileSync } from "node:fs";
import { parseBlackboardCsv } from "./parser.js";
import type { ProcessOptions, KeyRecord } from "./types.js";
import { validateOptions, validateBlackboardCsv } from "./validation.js";

const DEFAULT_EMAIL_DOMAIN = "myseneca.ca";

/**
 * Process a Blackboard CSV and create OpenRouter API keys
 */
export async function processBlackboardCsv(
  csvPath: string,
  options: ProcessOptions,
): Promise<KeyRecord[]> {
  validateOptions(options);
  validateBlackboardCsv(csvPath);
  const students = parseBlackboardCsv(
    csvPath,
    options.emailDomain || DEFAULT_EMAIL_DOMAIN,
  );
  if (students.length === 0) {
    throw new Error("No students found in CSV file");
  }
  console.error(`Found ${students.length} students in ${csvPath}`);

  // Build tags from course info
  const tags = [options.courseCode, options.section, options.term, "student"];
  console.error(`Creating API keys with $${options.limit} USD limit`);
  console.error(`Tags: ${tags.filter(Boolean).join(", ")}`);

  // Create keys for each student
  const keyRecords: KeyRecord[] = [];
  const provisioningKey = getProvisioningKey(options.provisioningKey);

  for (let i = 0; i < students.length; i++) {
    const student = students[i];

    try {
      console.error(
        `Creating key ${i + 1}/${students.length} for ${student.username}...`,
      );

      const result = await create({
        provisioningKey,
        email: student.email,
        limit: options.limit,
        tags,
        date: options.date,
      });

      keyRecords.push({
        name: result.keyName,
        key: result.apiKey,
        hash: result.hash,
        username: student.username,
        studentId: student.studentId,
        email: student.email,
      });
    } catch (error: any) {
      console.error(
        `Failed to create key for ${student.username}: ${error.message}`,
      );
      throw error;
    }
  }

  const outputPath =
    options.output ||
    `${options.courseCode}-${options.section}-${options.term}-${
      options.date || new Date().toISOString().split("T")[0]
    }.csv`;

  // Format: name,key,hash,username,studentId,email
  // First 3 columns match openrouter-key-manager format
  // NOTE: extra columns at the end are ignored by bulk operations
  const outputLines = [
    "name,key,hash,username,studentId,email",
    ...keyRecords.map((record) =>
      [
        `"${record.name}"`,
        record.key,
        record.hash,
        record.username,
        record.studentId,
        record.email,
      ].join(","),
    ),
  ];

  writeFileSync(outputPath, outputLines.join("\n"));

  console.error(`\nCreated ${keyRecords.length} API keys`);
  console.error(`Output saved to: ${outputPath}`);

  return keyRecords;
}

export * from "./types.js";
