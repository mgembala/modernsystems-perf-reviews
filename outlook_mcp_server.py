"""
outlook_mcp_server.py
---------------------
A minimal MCP server that exposes outlook_manager tools to Bob.

Install the MCP SDK:
    pip install mcp

Then register this server in .bob/mcp.json (see mcp_config_template.json).
"""

import json
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

from outlook_manager.auth import get_access_token
from outlook_manager.graph import list_messages, send_reply, send_new_message, mark_as_read
from outlook_manager.summariser import summarise
from outlook_manager.filing_rules import run_filing

import io
import sys

app = Server("outlook-manager")


@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="get_inbox_digest",
            description="Return a ranked summary of the top unread/important messages in the inbox.",
            inputSchema={
                "type": "object",
                "properties": {
                    "top_n": {"type": "integer", "description": "Max messages to show (default 10)", "default": 10}
                },
            },
        ),
        Tool(
            name="list_inbox_messages",
            description="Return raw message metadata for the inbox (subject, from, date, preview).",
            inputSchema={
                "type": "object",
                "properties": {
                    "top": {"type": "integer", "description": "Number of messages to fetch (default 25)", "default": 25}
                },
            },
        ),
        Tool(
            name="auto_file_inbox",
            description="Apply filing rules to move inbox messages into folders. Use dry_run=true to preview.",
            inputSchema={
                "type": "object",
                "properties": {
                    "dry_run": {"type": "boolean", "description": "Preview only — no changes made", "default": False}
                },
            },
        ),
        Tool(
            name="reply_to_message",
            description="Send a reply to a specific email by message ID.",
            inputSchema={
                "type": "object",
                "required": ["message_id", "body_html"],
                "properties": {
                    "message_id": {"type": "string", "description": "The Graph message ID"},
                    "body_html":  {"type": "string", "description": "HTML body of the reply"},
                },
            },
        ),
        Tool(
            name="send_email",
            description="Send a new email.",
            inputSchema={
                "type": "object",
                "required": ["to", "subject", "body_html"],
                "properties": {
                    "to":        {"type": "array", "items": {"type": "string"}, "description": "Recipient email addresses"},
                    "subject":   {"type": "string"},
                    "body_html": {"type": "string", "description": "HTML body"},
                },
            },
        ),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    token = get_access_token()

    if name == "get_inbox_digest":
        messages = list_messages(token, folder="inbox", top=50)
        buf = io.StringIO()
        old_stdout = sys.stdout
        sys.stdout = buf
        summarise(messages, top_n=arguments.get("top_n", 10))
        sys.stdout = old_stdout
        return [TextContent(type="text", text=buf.getvalue())]

    if name == "list_inbox_messages":
        messages = list_messages(token, folder="inbox", top=arguments.get("top", 25))
        return [TextContent(type="text", text=json.dumps(messages, indent=2))]

    if name == "auto_file_inbox":
        actions = run_filing(token, dry_run=arguments.get("dry_run", False))
        result = "\n".join(
            f"{'[DRY RUN] ' if arguments.get('dry_run') else ''}{a['action']} ← {a['from']}  \"{a['subject']}\""
            for a in actions
        ) or "No messages matched the filing rules."
        return [TextContent(type="text", text=result)]

    if name == "reply_to_message":
        send_reply(token, arguments["message_id"], arguments["body_html"])
        return [TextContent(type="text", text="Reply sent.")]

    if name == "send_email":
        send_new_message(token, arguments["to"], arguments["subject"], arguments["body_html"])
        return [TextContent(type="text", text="Email sent.")]

    return [TextContent(type="text", text=f"Unknown tool: {name}")]


if __name__ == "__main__":
    import asyncio
    asyncio.run(stdio_server(app))
