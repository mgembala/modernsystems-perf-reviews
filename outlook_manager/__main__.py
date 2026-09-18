"""
outlook_manager/__main__.py
----------------------------
Entry point. Run with:

    python -m outlook_manager [--digest] [--file] [--dry-run]

Options:
  --digest    Show a ranked inbox digest (default if no flags given)
  --file      Auto-file messages using rules in filing_rules.py
  --dry-run   Preview what --file would do without moving anything
"""

import argparse
from outlook_manager.auth import get_access_token
from outlook_manager.graph import list_messages
from outlook_manager.summariser import summarise
from outlook_manager.filing_rules import run_filing


def main() -> None:
    parser = argparse.ArgumentParser(description="Outlook inbox manager via Microsoft Graph")
    parser.add_argument("--digest",  action="store_true", help="Show a ranked inbox digest")
    parser.add_argument("--file",    action="store_true", help="Auto-file messages by rules")
    parser.add_argument("--dry-run", action="store_true", help="Preview filing without changes")
    args = parser.parse_args()

    # Default to digest if nothing specified
    if not args.file and not args.digest:
        args.digest = True

    print("Authenticating with Microsoft Graph…")
    token = get_access_token()
    print("Authenticated ✓\n")

    if args.digest:
        print("Fetching inbox…")
        messages = list_messages(token, folder="inbox", top=50)
        summarise(messages)

    if args.file or args.dry_run:
        mode = "DRY RUN — no changes will be made" if args.dry_run else "Filing messages…"
        print(mode)
        actions = run_filing(token, dry_run=args.dry_run)
        if not actions:
            print("Nothing matched the filing rules.")
        else:
            for a in actions:
                prefix = "[DRY RUN] " if args.dry_run else ""
                read_note = " + marked read" if a["mark_read"] else ""
                print(f"  {prefix}{a['action']}{read_note}  ← {a['from']}  \"{a['subject']}\"")
        print(f"\nDone. {len(actions)} message(s) processed.")


if __name__ == "__main__":
    main()
