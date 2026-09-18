# Outlook Manager

Three tools to take email off your plate:

| Tool | What it does |
|---|---|
| **Python script** | Digest + auto-file your inbox from the terminal |
| **MCP server** | Lets Bob read, file, and reply to email in any conversation |
| **Email templates** | 10 ready-to-use templates for common scenarios |

---

## Quick start

### 1. Register an Azure app

1. Go to [Microsoft Entra App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)
2. Click **New registration** → give it a name → **Register**
3. Note the **Application (client) ID** and **Directory (tenant) ID**
4. Go to **API permissions** → Add → Microsoft Graph → Delegated:
   - `Mail.ReadWrite`
   - `Mail.Send`
5. Click **Grant admin consent**

### 2. Configure credentials

```bash
cp outlook_manager/.env.example outlook_manager/.env
# Edit .env and fill in AZURE_CLIENT_ID and AZURE_TENANT_ID
```

> ⚠️ Never commit `.env` to version control. It is already in `.gitignore`.

### 3. Install dependencies

```bash
pip install -r outlook_manager/requirements.txt
# For the MCP server also install:
pip install mcp
```

### 4. Run the script

```bash
# Show a ranked inbox digest
python -m outlook_manager --digest

# Preview what the filing rules would do (no changes)
python -m outlook_manager --file --dry-run

# Actually file your inbox
python -m outlook_manager --file

# Both digest + file in one go
python -m outlook_manager --digest --file
```

The first run opens a browser for a one-time Microsoft login. The token is cached locally so
subsequent runs are silent.

---

## Customise filing rules

Edit [`outlook_manager/filing_rules.py`](outlook_manager/filing_rules.py) — add, remove, or
change entries in `FILING_RULES`:

```python
FILING_RULES = [
    {"match_field": "from",    "keyword": "noreply@github.com", "folder": "GitHub", "mark_read": True},
    {"match_field": "subject", "keyword": "invoice",            "folder": "Finance/Invoices"},
    # add your own…
]
```

`match_field` can be `"from"`, `"subject"`, or `"body_preview"`. Rules are first-match-wins.

---

## Enable Bob to manage email (MCP server)

1. Copy [`outlook_manager/mcp_config_template.json`](outlook_manager/mcp_config_template.json)
   to `.bob/mcp.json` in this workspace (or `~/.bob/settings/mcp.json` for all workspaces)
2. Replace `REPLACE_WITH_YOUR_CLIENT_ID` and `REPLACE_WITH_YOUR_TENANT_ID` with your real values
3. Save — Bob hot-reloads MCP config automatically

Bob will then have these tools available in every conversation:

| Tool | Description |
|---|---|
| `get_inbox_digest` | Ranked summary of important messages |
| `list_inbox_messages` | Raw message list |
| `auto_file_inbox` | File by rules (supports dry_run) |
| `reply_to_message` | Reply to a message by ID |
| `send_email` | Send a new email |

---

## Email templates

See [`outlook_manager/email_templates.md`](outlook_manager/email_templates.md) for 10 ready-to-use
templates:

1. Status update
2. Meeting request
3. Follow-up (no response)
4. Action required
5. Meeting decline
6. Quick acknowledgement
7. Escalation
8. Introduction
9. Approval request
10. Thank you / recognition

---

## File structure

```
outlook_manager/
  __main__.py          Entry point (python -m outlook_manager)
  auth.py              MSAL device-code authentication + token cache
  graph.py             Microsoft Graph API wrapper
  filing_rules.py      Rule-based auto-filing engine ← customise here
  summariser.py        Importance-scored inbox digest
  email_templates.md   10 reusable email templates
  requirements.txt     Python dependencies
  .env.example         Credential template (copy → .env)
  mcp_config_template.json  Bob MCP server config template

outlook_mcp_server.py  MCP server exposing tools to Bob
```
