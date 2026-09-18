"""
outlook_manager/filing_rules.py
--------------------------------
Rule-based auto-filing engine.

Define your rules in FILING_RULES below. Each rule is a dict with:
  - "match_field": one of "subject", "from", "body_preview"
  - "keyword":     case-insensitive substring to look for
  - "folder":      display name of the destination folder (created if missing)
  - "mark_read":   (optional) bool — mark as read after filing (default False)

Rules are evaluated top-to-bottom; the first match wins.
"""

from __future__ import annotations
from typing import Any
import outlook_manager.graph as graph

# ── Customise these rules for your inbox ─────────────────────────────────────
FILING_RULES: list[dict] = [
    {"match_field": "from",         "keyword": "noreply@github.com",      "folder": "GitHub",          "mark_read": True},
    {"match_field": "from",         "keyword": "notifications@jira",       "folder": "Jira",            "mark_read": True},
    {"match_field": "subject",      "keyword": "invoice",                  "folder": "Finance/Invoices"},
    {"match_field": "subject",      "keyword": "statement",                "folder": "Finance/Invoices"},
    {"match_field": "subject",      "keyword": "newsletter",               "folder": "Newsletters",     "mark_read": True},
    {"match_field": "subject",      "keyword": "unsubscribe",              "folder": "Newsletters",     "mark_read": True},
    {"match_field": "body_preview", "keyword": "action required",          "folder": "Action Required"},
    {"match_field": "from",         "keyword": "@ibm.com",                 "folder": "IBM Internal"},
]
# ─────────────────────────────────────────────────────────────────────────────


def _get_or_create_folder(token: str, name: str, folder_cache: dict) -> str:
    """Return folder ID, creating the folder if it doesn't exist yet."""
    if name in folder_cache:
        return folder_cache[name]

    # Refresh folder list from Graph
    folders = graph.list_mail_folders(token)
    for f in folders:
        folder_cache[f["displayName"]] = f["id"]

    if name not in folder_cache:
        new_folder = graph.create_folder(token, name)
        folder_cache[name] = new_folder["id"]

    return folder_cache[name]


def _matches(message: dict, rule: dict) -> bool:
    field = rule["match_field"]
    keyword = rule["keyword"].lower()

    if field == "from":
        value = message.get("from", {}).get("emailAddress", {}).get("address", "").lower()
    elif field == "subject":
        value = message.get("subject", "").lower()
    elif field == "body_preview":
        value = message.get("bodyPreview", "").lower()
    else:
        return False

    return keyword in value


def run_filing(token: str, dry_run: bool = False) -> list[dict]:
    """
    Fetch unread inbox messages, apply FILING_RULES, and file/mark them.

    Set dry_run=True to see what *would* happen without making any changes.
    Returns a list of action records for reporting.
    """
    messages = graph.list_messages(token, folder="inbox", top=50)
    folder_cache: dict[str, str] = {}
    actions: list[dict] = []

    for msg in messages:
        for rule in FILING_RULES:
            if _matches(msg, rule):
                folder_name = rule["folder"]
                folder_id = _get_or_create_folder(token, folder_name, folder_cache)
                action = {
                    "subject": msg.get("subject", "(no subject)"),
                    "from": msg.get("from", {}).get("emailAddress", {}).get("address", ""),
                    "action": f"move → {folder_name}",
                    "mark_read": rule.get("mark_read", False),
                }
                if not dry_run:
                    graph.move_message(token, msg["id"], folder_id)
                    if rule.get("mark_read"):
                        graph.mark_as_read(token, msg["id"])
                actions.append(action)
                break  # first-match-wins

    return actions
