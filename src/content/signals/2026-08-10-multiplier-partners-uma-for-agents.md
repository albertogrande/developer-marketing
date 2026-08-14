---
title: A UMA co-creator ships an open-source pre-action authorization framework for agents
company: Multiplier Partners
date: 2026-08-10
kind: release
summary: 'User-Managed Access co-creator Eve Maler and Nick Gamb published U4A on 2026-08-06, an Apache-2.0 proof-of-concept that adapts UMA so a resource owner — not just an agent''s identity provider — grants per-operation, single-use access when an agent shows up asking for something. It targets the gap the MCP spec and the new Agent Plugins standard both leave open: who authorizes an individual agent action, not just which agent gets a token.'
tags: [mcp, agents, security, positioning]
source:
  label: 'Multiplier Partners — Let Them: A Developer''s Guide to UMA for Agents'
  url: https://multiplierpartners.ai/blog/2026-08-06-let-them-a-developers-guide-to-u4a
related:
  - label: Guide — Channels & distribution
    href: /guide/06-channels-and-distribution
---

A proof-of-concept from the protocol's own co-creator, not a vendor announcement
— worth tracking rather than acting on. It is the resource-owner-mediated
counterpart to Auth0's Cross App Access (2026-08-06): XAA routes app-to-app
authorization through the customer's IdP, U4A routes it through the resource
owner at the moment of the request. Two different answers to the same open
question — where pre-action authorization for agents settles — arriving in the
same week.
