---
title: 'Show HN: a working authorization framework for delegated AI agents'
company: Gneiss Group
date: 2026-08-12
kind: launch
summary: 'Kessa shipped as an installable authorization system for AI agent delegation: each hop from human to agent to sub-agent gets a strictly narrower credential instead of inheriting full parent permissions, with every consequential action logged to a tamper-evident, hash-chained log an independent offline verifier can re-check. It ships three production binaries plus a separate verifier and Docker images, though the maintainer flags it as not production-hardened — key signing works via software keystore or macOS Secure Enclave only, and the transport layer is a documented mock.'
tags: [agents, security, dx]
source:
  label: 'Kessa — AI Agent Authorization Framework (GitHub)'
  url: https://github.com/Gneiss-Group/Kessa
related:
  - label: Guide — Developer experience & activation
    href: /guide/04-developer-experience-and-activation
---
