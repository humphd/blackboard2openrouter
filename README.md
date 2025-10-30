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

- `-l, --limit <amount>` - Spending limit in US dollars (e.g., `15`)
- `-c, --course <code>` - Course code (e.g., `CCP555`)
- `-s, --section <section>` - Section (e.g., `NAA`, `NBB`)
- `-t, --term <term>` - Term (e.g., `fall`, `winter`, `summer`,
  `fall2025`)

### Optional

- `-d, --date <date>` - Issue date in `YYYY-MM-DD` format
  (default: today)
- `-e, --email-domain <example.com>` - Sets the email domain to use when creating
  email addresses (default: `myseneca.ca`)
- `-o, --output <file>` - Output CSV filename (default: auto-generated)
- `--provisioning-key <key>` - OpenRouter provisioning API key
  (or use `OPENROUTER_PROVISIONING_KEY` env var)

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
  --section B \
  --term winter2025 \
  --output dps909-keys.csv \
  gc_DSP909NSA.02834.2257_fullgc_2025-10-08-18-35-41.csv
```

### Specify Date

```bash
blackboard2openrouter \
  --limit 15 \
  --course CCP555 \
  --section A \
  --term fall2025 \
  --date 2025-09-01 \
  grades.csv
```

## Input Format

The tool expects a Blackboard CSV export with at least these columns:

- `Username` - Student's username (required)
- `Student ID` - Student's ID number (required)

Other columns (grades, names, etc.) are ignored.

## Output Format

The tool generates a CSV file with these columns:

- `email` - Student's email
- `studentId` - Student's ID
- `name` - Full key name (username + tags + date)
- `key` - The actual API key (distribute to students)
- `hash` - Key hash for management operations

**Example Output:**

```csv
username,studentId,name,key,hash
abhinav1,131252231,"abhinav1 CCP555 A fall2025 student 2025-09-01",sk-or-v1-...,hash-...
bchen102,160370227,"bchen102 CCP555 A fall2025 student 2025-09-01",sk-or-v1-...,hash-...
```

**Default Filename:** `{course}-{section}-{term}-{date}.csv`

## Key Naming

Keys are automatically named using this format:

```
{username} {course} {section} {term} student {date}
```

**Examples:**

- `abhinav1 CCP555 A fall2025 student 2025-09-01`
- `bchen102 DPS909 B winter2025 student 2025-01-15`

## Distributing Keys to Students

After generating keys, you can:

1. **Extract just username and key columns:**

   ```bash
   cut -d',' -f1,4 CCP555-A-fall2025-2025-09-01.csv > keys-to-distribute.csv
   ```

2. **Import into your LMS** (Blackboard, Canvas, etc.)

3. **Email individually** using a mail merge tool

4. **Create a script** to send personalized emails

## Managing Keys

Use [openrouter-key-manager](https://www.npmjs.com/package/openrouter-key-manager)
to manage the generated keys:

```bash
# List all keys for a course
openrouter-key-manager list --pattern "*CCP555*"

# Generate usage report
openrouter-key-manager report --pattern "*CCP555*A*fall2025*"

# Increase limits mid-semester
openrouter-key-manager set-limit \
  --pattern "*CCP555*A*fall2025*" \
  --limit 25 -y

# Disable a student's key
openrouter-key-manager disable --pattern "abhinav1*" -y

# Delete all keys at semester end
openrouter-key-manager bulk-delete CCP555-A-fall2025-2025-09-01.csv -y
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
  --section A \
  --term fall2025 \
  gc_CCP555_A_fullgc_2025-09-01.csv
```

### 3. Distribute Keys

Extract and distribute the keys to students:

```bash
# Create distribution file (username and key only)
cut -d',' -f1,4 CCP555-A-fall2025-2025-09-01.csv | \
  tail -n +2 > distribute.csv
```

### 4. Monitor Usage

```bash
# Weekly check
openrouter-key-manager list --pattern "*CCP555*A*fall2025*"

# Detailed report
openrouter-key-manager report \
  --pattern "*CCP555*A*fall2025*" \
  --output weekly-report.html
```

### 5. Adjust Limits

```bash
# Increase for all students
openrouter-key-manager set-limit \
  --pattern "*CCP555*A*fall2025*" \
  --limit 25 -y

# Increase for specific student
openrouter-key-manager set-limit \
  --pattern "abhinav1*CCP555*" \
  --limit 30 -y
```

### 6. End of Semester Cleanup

```bash
# Delete all keys using the original output CSV
openrouter-key-manager bulk-delete \
  CCP555-A-fall2025-2025-09-01.csv -y
```

## Best Practices

1. **Keep the output CSV** - You'll need it for management operations

2. **Use consistent naming** - Stick to a term naming convention
   (e.g., `fall2025`, `winter2025`)

3. **Set appropriate limits** - Start conservative, increase as needed

4. **Monitor regularly** - Generate weekly reports to track usage

5. **Secure distribution** - Use secure channels to distribute API keys

6. **Document the process** - Keep notes on limits, dates, and any
   adjustments

7. **Plan for multiple sections** - Run the tool separately for each
   section if you want different limits or tracking

## Troubleshooting

### "Missing required columns" error

Make sure your Blackboard CSV has `Username` and `Student ID` columns.
The tool is case-sensitive for column names.

### "No students found" error

Check that:

- The CSV file is not empty
- The CSV has a header row
- Student rows have values in Username and Student ID columns

### Provisioning key not found

Set the environment variable:

```bash
export OPENROUTER_PROVISIONING_KEY=your_key_here
```

Or pass it via `--provisioning-key` option.

## Related Tools

- [openrouter-key-manager](https://www.npmjs.com/package/openrouter-key-manager) -
  Manage OpenRouter API keys
- [OpenRouter.ai](https://openrouter.ai/) - Unified API for LLMs
