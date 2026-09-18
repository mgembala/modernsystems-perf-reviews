"""
outlook_manager/graph.py
------------------------
Thin wrapper around the Microsoft Graph REST API for mail operations.
"""

import requests
from typing import Any

GRAPH_BASE = "https://graph.microsoft.com/v1.0/me"


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ── Read ──────────────────────────────────────────────────────────────────────

def list_messages(token: str, folder: str = "inbox", top: int = 25) -> list[dict]:
    """Return up to `top` messages from the given well-known folder name."""
    url = f"{GRAPH_BASE}/mailFolders/{folder}/messages"
    params = {
        "$top": top,
        "$select": "id,subject,from,receivedDateTime,isRead,bodyPreview,importance",
        "$orderby": "receivedDateTime desc",
    }
    resp = requests.get(url, headers=_headers(token), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json().get("value", [])


def get_message_body(token: str, message_id: str) -> str:
    """Return the plain-text body of a single message."""
    url = f"{GRAPH_BASE}/messages/{message_id}"
    params = {"$select": "body"}
    resp = requests.get(url, headers=_headers(token), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json().get("body", {}).get("content", "")


# ── Organise ──────────────────────────────────────────────────────────────────

def list_mail_folders(token: str) -> list[dict]:
    """Return all top-level mail folders."""
    url = f"{GRAPH_BASE}/mailFolders"
    params = {"$select": "id,displayName"}
    resp = requests.get(url, headers=_headers(token), params=params, timeout=30)
    resp.raise_for_status()
    return resp.json().get("value", [])


def create_folder(token: str, name: str) -> dict:
    """Create a top-level mail folder and return it."""
    url = f"{GRAPH_BASE}/mailFolders"
    resp = requests.post(url, headers=_headers(token), json={"displayName": name}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def move_message(token: str, message_id: str, destination_folder_id: str) -> None:
    """Move a message to another folder by folder ID."""
    url = f"{GRAPH_BASE}/messages/{message_id}/move"
    resp = requests.post(
        url,
        headers=_headers(token),
        json={"destinationId": destination_folder_id},
        timeout=30,
    )
    resp.raise_for_status()


def mark_as_read(token: str, message_id: str) -> None:
    """Mark a message as read."""
    url = f"{GRAPH_BASE}/messages/{message_id}"
    resp = requests.patch(
        url, headers=_headers(token), json={"isRead": True}, timeout=30
    )
    resp.raise_for_status()


# ── Send / Reply ───────────────────────────────────────────────────────────────

def send_reply(token: str, message_id: str, body_html: str) -> None:
    """Send a reply to a message."""
    url = f"{GRAPH_BASE}/messages/{message_id}/reply"
    payload = {"message": {"body": {"contentType": "HTML", "content": body_html}}}
    resp = requests.post(url, headers=_headers(token), json=payload, timeout=30)
    resp.raise_for_status()


def send_new_message(
    token: str,
    to: list[str],
    subject: str,
    body_html: str,
) -> None:
    """Send a brand-new message."""
    url = f"{GRAPH_BASE}/sendMail"
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": body_html},
            "toRecipients": [
                {"emailAddress": {"address": addr}} for addr in to
            ],
        }
    }
    resp = requests.post(url, headers=_headers(token), json=payload, timeout=30)
    resp.raise_for_status()
