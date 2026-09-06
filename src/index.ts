import {
  create,
  createWorkspace,
  getProvisioningKey,
  resolveWorkspace,
} from "openrouter-key-manager";
import { writeFileSync } from "node:fs";
import { parseBlackboardCsv } from "./parser.js";
import type { ProcessOptions, KeyRecord } from "./types.js";
import { validateOptions, validateBlackboardCsv } from "./validation.js";

const DEFAULT_EMAIL_DOMAIN = "myseneca.ca";
const DEFAULT_WORKSPACE_PREFIX = "Seneca-Acad-";

async function resolveWorkspaceId(
  provisioningKey: string,
  workspacePrefix: string,
  courseCode: string,
): Promise<{ workspaceId: string; workspaceName: string } | null> {
  const workspaceName = `${workspacePrefix}${courseCode}`;
  const workspaceSlug = courseCode;

  // Make sure the workspace exists, otherwise create it
  try {
    const workspace = await resolveWorkspace(provisioningKey, workspaceName);
    if (!workspace) {
      throw new Error(`Could not find workspace "${workspace}"`);
    }

    return { workspaceId: workspace.id, workspaceName: workspace.name };
    // oxlint-disable-next-line no-unused-vars
  } catch (_) {
    try {
      // Try to create it
      const workspace = await createWorkspace({
        name: workspaceName,
        slug: workspaceSlug,
      });
      return { workspaceId: workspace.id, workspaceName: workspace.name };
      // oxlint-disable-next-line no-unused-vars
    } catch (_) {
      console.error(`Unable to find or create workspace "${workspaceName}"`);
      return null;
    }
  }
}

/**
 * Process a Blackboard CSV and create OpenRouter API keys
 */
export async function processBlackboardCsv(
  csvPath: string,
  options: ProcessOptions,
): Promise<KeyRecord[]> {
  validateOptions(options);
  validateBlackboardCsv(csvPath);
  const provisioningKey = getProvisioningKey(options.provisioningKey);

  const students = parseBlackboardCsv(
    csvPath,
    options.emailDomain || DEFAULT_EMAIL_DOMAIN,
  );
  if (students.length === 0) {
    throw new Error("No students found in CSV file");
  }
  console.error(`Found ${students.length} students in ${csvPath}`);

  // Build the workspace for the course
  const workspacePrefix = options.workspacePrefix ?? DEFAULT_WORKSPACE_PREFIX;
  const workspace = await resolveWorkspaceId(
    provisioningKey,
    workspacePrefix,
    options.courseCode,
  );
  if (!workspace) {
    process.exit(1);
  }

  // Build tags from course info
  const tags = [options.section, options.term, "student"];
  console.error(
    `Creating API keys with $${options.limit} USD limit in workspace "${workspace.workspaceName}"`,
  );
  console.error(`Tags: ${tags.filter(Boolean).join(", ")}`);

  // Create keys for each student
  const keyRecords: KeyRecord[] = [];

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
