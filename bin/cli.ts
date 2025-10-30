#!/usr/bin/env node

import { Command } from "commander";
import { processBlackboardCsv } from "../src/index.js";

import packageJson from "../package.json" with { type: "json" };
import { ValidationError } from "../src/validation.js";
const { version } = packageJson;

const program = new Command();

program
  .name("blackboard2openrouter")
  .description("Generate OpenRouter API keys from Blackboard CSV exports")
  .version(version);

program
  .argument("<csv-file>", "Blackboard CSV export file")
  .requiredOption(
    "-l, --limit <amount>",
    "Spending limit in US dollars",
    parseFloat,
  )
  .requiredOption("-c, --course <code>", "Course code (e.g., CCP555)")
  .requiredOption("-s, --section <section>", "Section (e.g., NSA)")
  .requiredOption("-t, --term <term>", "Term (e.g., fall)")
  .option(
    "-d, --date <date>",
    "Issue date in YYYY-MM-DD format (default: today)",
  )
  .option(
    "-e, --email-domain <domain>",
    "Email domain to use when creating email addresses (default: myseneca.ca)",
  )
  .option("-o, --output <file>", "Output CSV filename")
  .option(
    "--provisioning-key <key>",
    "OpenRouter provisioning API key " +
      "(or set OPENROUTER_PROVISIONING_KEY env var)",
  )
  .action(async (csvFile, options) => {
    try {
      await processBlackboardCsv(csvFile, {
        provisioningKey: options.provisioningKey,
        limit: options.limit,
        courseCode: options.course,
        section: options.section,
        term: options.term,
        date: options.date,
        output: options.output,
        emailDomain: options.emailDomain,
      });
    } catch (error: any) {
      if (error instanceof ValidationError) {
        console.error("Validation Error:");
        console.error(error.message);
      } else {
        console.error("Error:", error.message);
      }
      process.exit(1);
    }
  });

program.parse();
