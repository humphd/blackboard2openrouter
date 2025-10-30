# blackboard2openrouter

Generate OpenRouter API keys for students from Blackboard CSV exports.

This tool processes a Blackboard grade export CSV and creates OpenRouter
API keys for each student, using their username and student ID.

## Installation

```bash
npm install -g blackboard2openrouter
```

Or run directly with `npx`:

```bash
npx blackboard2openrouter@latest [options] <csv-file>
```

## Prerequisites

You need an **OpenRouter.ai Provisioning API Key**. Get one from your
[OpenRouter.ai account dashboard](https://openrouter.ai/settings/keys).

Set your provisioning key as an environment variable:

```bash
export OPENROUTER_PROVISIONING_KEY=your_provisioning_key_here
```

Or pass it via the `--provisioning-key` option.

## Usage

```bash
blackboard2openrouter [options] <csv-file>
```

### Required Options

- `-l, --limit <amount>` - Spending limit in **US dollars** (e.g., `15`)
- `-c, --course <code>` - Course code without spaces (e.g., `CCP555`)
- `-s, --section <section>` - Section without spaces (e.g., `NAA`, `NBB`)
- `-t, --term <term>` - Term without spaces (e.g., `fall`, `winter`, `summer`, `fall2025`)

### Optional

- `-d, --date <date>` - Issue date in `YYYY-MM-DD` format (default: today)
- `-e, --email-domain <domain>` - Email domain to use when creating email addresses (default: `myseneca.ca`)
- `-o, --output <file>` - Output CSV filename (default: auto-generated)
- `--provisioning-key <key>` - OpenRouter provisioning API key (or use `OPENROUTER_PROVISIONING_KEY` env var)

### Validation Rules

The tool validates all options before processing:

- **limit**: Must be a positive number greater than 0
- **course, section, term**: Must be non-empty strings without spaces
- **email-domain**: Must be a valid domain without `@` symbol (e.g., `myseneca.ca`, not `@myseneca.ca`)
- **date**: Must be in `YYYY-MM-DD` format if provided

## Examples

The following examples assume that you have already exported your course
grade book in CSV format from Blackboard, producing a file with a name like:

`gc_CCP555NAA.02834.2257_fullgc_2025-10-08-18-35-41.csv`

### Basic Usage

```bash
# Export course CSV from Blackboard, then:
blackboard2openrouter \
  --limit 15 \
  --course CCP555 \
  --section NAA \
  --term fall2025 \
  gc_CCP555NAA.02834.2257_fullgc_2025-10-08-18-35-41.csv
```

### Custom Output Filename

```bash
blackboard2openrouter \
  --limit 20 \
  --course DPS909 \
  --section NBB \
  --term winter2025 \
  --output dps909-keys.csv \
  gc_DPS909NBB.02834.2257_fullgc_2025-10-08-18-35-41.csv
```

### Specify Date

```bash
blackboard2openrouter \
  --limit 15 \
  --course CCP555 \
  --section NAA \
  --term fall2025 \
  --date 2025-09-01 \
  gc_CCP555NAA.02834.2257_fullgc_2025-09-01.csv
```

### Custom Email Domain

```bash
blackboard2openrouter \
  --limit 15 \
  --course CCP555 \
  --section NAA \
  --term fall2025 \
  --email-domain example.edu \
  gc_CCP555NAA.02834.2257_fullgc_2025-09-01.csv
```

## Input Format

The tool expects a Blackboard CSV export with at least these columns:

- `Username` - Student's username (required)
- `Student ID` - Student's ID number (required)

Other columns (grades, names, etc.) are ignored.

## Output Format

The tool generates a CSV file compatible with [openrouter-key-manager](https://www.npmjs.com/package/openrouter-key-manager) bulk operations.

The first three columns (`name`, `key`, `hash`) match the standard format, with additional student information columns at the end:

- `name` - Full key name (email + tags + date)
- `key` - The actual API key (distribute to students)
- `hash` - Key hash for management operations
- `username` - Student's username
- `studentId` - Student's ID
- `email` - Generated email address

**Default Filename:** `{course}-{section}-{term}-{date}.csv`

**Note:** The extra columns at the end are ignored by `openrouter-key-manager` bulk operations, making this file compatible with both tools.

## Key Naming

Keys are automatically named using this format:

```text
{email} {course} {section} {term} student {date}
```

## Managing Keys

The output CSV is fully compatible with [openrouter-key-manager](https://www.npmjs.com/package/openrouter-key-manager) bulk operations:

```bash
# List all keys for a course
openrouter-key-manager list --pattern "*CCP555*"

# Generate usage report
openrouter-key-manager report --pattern "*CCP555*NAA*fall2025*"

# Increase limits mid-semester using the CSV file
openrouter-key-manager bulk-set-limit \
  --limit 25 \
  CCP555-NAA-fall2025-2025-09-01.csv -y

# Disable a student's key
openrouter-key-manager disable --pattern "studentname*" -y

# Rotate all keys at semester end
openrouter-key-manager bulk-rotate CCP555-NAA-fall2025-2025-09-01.csv -y

# Delete all keys using the CSV file
openrouter-key-manager bulk-delete CCP555-NAA-fall2025-2025-09-01.csv -y
```

## Complete Workflow

### 1. Export from Blackboard

In Blackboard:

1. Go to your course
2. Navigate to Grade Center
3. Click "Work Offline" → "Download"
4. Select "Full Grade Center"
5. Choose "Comma Delimited" format
6. Download the CSV file

### 2. Generate API Keys

```bash
blackboard2openrouter \
  --limit 15 \
  --course CCP555 \
  --section NAA \
  --term fall2025 \
  gc_CCP555NAA.02834.2257_fullgc_2025-09-01.csv
```

## Related Tools

- [openrouter-key-manager](https://www.npmjs.com/package/openrouter-key-manager) - Manage OpenRouter API keys
- [OpenRouter.ai](https://openrouter.ai/) - Unified API for LLMs

## License

BSD-2-Clause
