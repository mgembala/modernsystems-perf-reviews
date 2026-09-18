"""
outlook_manager/summariser.py
------------------------------
Summarises your inbox into a digest printed to the terminal.
No LLM needed — uses rule-based importance scoring.

Importance score per message (higher = more urgent):
  +3  marked High importance in Outlook
  +2  subject contains action words (see ACTION_WORDS)
  +1  unread
  -1  subject contains low-signal words (see LOW_SIGNAL_WORDS)
"""

from __future__ import annotations
import textwrap
from datetime import datetime, timezone

ACTION_WORDS = {"action required", "urgent", "deadline", "asap", "approve", "decision", "respond", "review"}
LOW_SIGNAL_WORDS = {"newsletter", "unsubscribe", "fyi", "no action", "out of office"}


def _score(msg: dict) -> int:
    score = 0
    subject_lower = msg.get("subject", "").lower()
    preview_lower = msg.get("bodyPreview", "").lower()
    combined = subject_lower + " " + preview_lower

    if msg.get("importance") == "high":
        score += 3
    if not msg.get("isRead"):
        score += 1
    for word in ACTION_WORDS:
        if word in combined:
            score += 2
            break
    for word in LOW_SIGNAL_WORDS:
        if word in combined:
            score -= 1
            break

    return score


def _format_date(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.astimezone().strftime("%d %b %H:%M")
    except Exception:
        return iso


def summarise(messages: list[dict], top_n: int = 10) -> None:
    """Print a ranked digest of the most important messages."""
    scored = sorted(messages, key=_score, reverse=True)
    print("\n" + "═" * 64)
    print(f"  INBOX DIGEST — top {min(top_n, len(scored))} of {len(scored)} messages")
    print("═" * 64)

    for msg in scored[:top_n]:
        subject = msg.get("subject") or "(no subject)"
        sender = msg.get("from", {}).get("emailAddress", {}).get("address", "unknown")
        received = _format_date(msg.get("receivedDateTime", ""))
        preview = msg.get("bodyPreview", "")[:120]
        read_flag = "  " if msg.get("isRead") else "● "
        importance = "⚑ " if msg.get("importance") == "high" else "  "
        score = _score(msg)

        print(f"\n{read_flag}{importance}[score {score:+d}]  {received}")
        print(f"  From:    {sender}")
        print(f"  Subject: {subject}")
        print(f"  {textwrap.fill(preview, width=58, subsequent_indent='  ')}")

    print("\n" + "═" * 64 + "\n")
