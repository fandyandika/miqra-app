# scripts/migration/convert-sql-to-transliteration.py
import re
import json
import os
from pathlib import Path
from collections import defaultdict

# Paths - Use absolute path resolution
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
SQL_FILE = PROJECT_ROOT / 'assets' / 'quran' / 'transliterasi' / 'quran-indonesia.sql'
METADATA_FILE = PROJECT_ROOT / 'assets' / 'quran' / 'metadata' / 'surah_meta_final.json'
OUTPUT_DIR = PROJECT_ROOT / 'assets' / 'quran' / 'transliterasi'

# Create output directory if it doesn't exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def parse_sql_file(sql_path):
    """
    Parse SQL INSERT statements and extract transliteration data.
    Returns: {surah: {ayah: transliteration}} and validation stats
    """
    transliteration_data = defaultdict(dict)  # {surah: {ayah: transliteration}}
    total_inserted = 0
    errors = []

    # Regex to match INSERT statements
    # Format: INSERT INTO quran_id (...) VALUES (id, suraId, verseID, ayahText, indoText, readText);
    # More robust regex to handle quoted strings with commas and escaped quotes
    pattern = r'INSERT INTO quran_id\s*\([^)]+\)\s*VALUES\s*\(\s*\d+\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*"[^"]*"\s*,\s*"[^"]*"\s*,\s*"([^"]+)"\s*\);'

    with open(sql_path, 'r', encoding='utf-8') as f:
        for line_num, line in enumerate(f, start=1):
            line = line.strip()
            if not line or line.startswith('CREATE') or line.startswith('--'):
                continue

            match = re.search(pattern, line)
            if match:
                try:
                    sura_id = int(match.group(1))
                    verse_id = int(match.group(2))
                    read_text = match.group(3)

                    # Validation
                    if sura_id < 1 or sura_id > 114:
                        errors.append(f"Line {line_num}: Invalid suraId {sura_id}")
                        continue
                    if verse_id < 1:
                        errors.append(f"Line {line_num}: Invalid verseID {verse_id}")
                        continue
                    if not read_text or read_text.strip() == '':
                        errors.append(f"Line {line_num}: Empty readText for suraId {sura_id}, verseID {verse_id}")
                        continue

                    transliteration_data[sura_id][verse_id] = read_text.strip()
                    total_inserted += 1
                except Exception as e:
                    errors.append(f"Line {line_num}: Error parsing - {str(e)}")
            elif line.startswith('INSERT'):
                # INSERT statement but didn't match - potential format issue
                errors.append(f"Line {line_num}: INSERT statement didn't match pattern")

    return transliteration_data, total_inserted, errors

def load_surah_metadata():
    """Load surah names and ayat counts from metadata for validation"""
    with open(METADATA_FILE, 'r', encoding='utf-8') as f:
        metadata = json.load(f)

    # Create mapping: {number: {name, ayat_count}}
    surah_info = {}
    for surah in metadata:
        surah_info[surah['number']] = {
            'name': surah.get('name_id') or surah.get('name_translit') or f"Surah {surah['number']}",
            'ayat_count': surah.get('ayat_count', 0)
        }

    return surah_info

def validate_data(transliteration_data, surah_info):
    """Validate that all surahs and ayat are present"""
    validation_errors = []
    validation_warnings = []

    # Check all 114 surahs exist
    missing_surahs = []
    for surah_num in range(1, 115):
        if surah_num not in transliteration_data:
            missing_surahs.append(surah_num)
        elif surah_num in surah_info:
            # Check ayat count matches
            expected_count = surah_info[surah_num]['ayat_count']
            actual_count = len(transliteration_data[surah_num])
            if actual_count != expected_count:
                validation_warnings.append(
                    f"Surah {surah_num}: Expected {expected_count} ayat, found {actual_count}"
                )

            # Check for missing ayat numbers
            if actual_count > 0:
                ayat_nums = sorted(transliteration_data[surah_num].keys())
                for i in range(1, expected_count + 1):
                    if i not in transliteration_data[surah_num]:
                        validation_errors.append(
                            f"Surah {surah_num}: Missing ayat {i}"
                        )

    if missing_surahs:
        validation_errors.append(f"Missing surahs: {missing_surahs}")

    return validation_errors, validation_warnings

def generate_json_files(transliteration_data, surah_info):
    """Generate JSON files per surah in format matching translation JSON"""

    generated_count = 0
    total_ayat = 0

    for surah_num in sorted(transliteration_data.keys()):
        ayat_data = transliteration_data[surah_num]

        # Sort by ayah number
        sorted_ayat = sorted(ayat_data.items(), key=lambda x: x[0])

        # Build ayat array (format matches translation JSON)
        ayat_array = []
        for ayah_num, transliteration in sorted_ayat:
            ayat_array.append({
                "number": ayah_num,
                "transliteration": transliteration  # Field name matches what ReaderScreen expects
            })

        # Get surah name from metadata
        surah_name = "Unknown"
        if surah_num in surah_info:
            surah_name = surah_info[surah_num]['name']

        # Build output JSON (format matches translation JSON structure)
        output = {
            "number": surah_num,
            "name": surah_name,
            "ayat_count": len(ayat_array),
            "ayat": ayat_array,
            "source": {
                "dataset": "quran-indonesia-sql",
                "version": "1.0"
            }
        }

        # Write to file (naming matches translation files: surah_XXX.trans.json)
        output_file = OUTPUT_DIR / f'surah_{surah_num:03d}.trans.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        generated_count += 1
        total_ayat += len(ayat_array)
        # Print will be handled by log function in main
        if total_ayat % 100 == 0 or surah_num <= 5 or surah_num >= 110:
            print(f"✅ Generated: {output_file.name} ({len(ayat_array)} ayat)")

    return generated_count, total_ayat

def main():
    # Also write to log file for debugging
    log_file = OUTPUT_DIR / 'conversion_log.txt'
    log_messages = []

    def log(msg):
        print(msg)
        log_messages.append(msg)

    log("🔄 Converting SQL to Transliteration JSON files...")
    log(f"📂 Input: {SQL_FILE}")
    log(f"📂 Output: {OUTPUT_DIR}")
    log("")

    # Load metadata
    log("📖 Loading surah metadata...")
    surah_info = load_surah_metadata()
    log(f"✅ Loaded metadata for {len(surah_info)} surahs")
    log("")

    # Parse SQL
    log("📖 Parsing SQL file...")
    transliteration_data, total_inserted, parse_errors = parse_sql_file(SQL_FILE)

    if parse_errors:
        log(f"⚠️  Parse warnings/errors: {len(parse_errors)}")
        for error in parse_errors[:10]:  # Show first 10
            log(f"   {error}")
        if len(parse_errors) > 10:
            log(f"   ... and {len(parse_errors) - 10} more")
        log("")

    log(f"✅ Parsed {total_inserted} ayat from {len(transliteration_data)} surahs")
    log("")

    # Validate
    log("🔍 Validating data...")
    validation_errors, validation_warnings = validate_data(transliteration_data, surah_info)

    if validation_warnings:
        log(f"⚠️  Validation warnings: {len(validation_warnings)}")
        for warning in validation_warnings[:5]:
            log(f"   {warning}")
        if len(validation_warnings) > 5:
            log(f"   ... and {len(validation_warnings) - 5} more")
        log("")

    if validation_errors:
        log(f"❌ Validation errors: {len(validation_errors)}")
        for error in validation_errors[:10]:
            log(f"   {error}")
        if len(validation_errors) > 10:
            log(f"   ... and {len(validation_errors) - 10} more")
        log("")
        log("⚠️  Proceeding with generation despite errors...")
        log("")
    else:
        log("✅ Validation passed!")
        log("")

    # Generate JSON files
    log("📝 Generating JSON files...")
    generated_count, total_ayat = generate_json_files(transliteration_data, surah_info)
    log("")

    # Summary
    log("=" * 60)
    log("✅ Conversion complete!")
    log(f"   - {generated_count} surah files generated")
    log(f"   - {total_ayat} total ayat transliterations")
    log(f"   - Expected total ayat: 6236")
    log(f"   - Output directory: {OUTPUT_DIR}")
    log("")

    if total_ayat == 6236:
        log("✅ All 6236 ayat successfully converted!")
    else:
        log(f"⚠️  Expected 6236 ayat, but got {total_ayat} ({6236 - total_ayat} difference)")
    log("=" * 60)

    # Write log file
    with open(log_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(log_messages))

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        import traceback
        error_msg = f"Error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        # Write error to file
        error_file = OUTPUT_DIR / 'conversion_error.txt'
        with open(error_file, 'w', encoding='utf-8') as f:
            f.write(error_msg)
        raise

