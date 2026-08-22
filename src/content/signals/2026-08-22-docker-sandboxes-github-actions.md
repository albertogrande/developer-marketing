---
title: Docker Sandboxes land in GitHub Actions as an agent runtime
company: Docker
date: 2026-08-22
kind: release
summary: 'Docker Sandboxes are now a supported runtime in GitHub Agentic Workflows (gh-aw v0.82.9+), running CI agents inside a disposable microVM with its own kernel, filesystem and private Docker daemon so an agent gets full root inside the sandbox without widening the runner''s blast radius. It works on standard ubuntu-24.04 GitHub-hosted runners, with the same sandboxes available for local testing via `sbx run` and org-wide policy/audit controls through Docker AI Governance.'
tags: [dx, agents]
source:
  label: 'Docker Blog — Running AI agents in GitHub Actions with Docker Sandboxes'
  url: https://www.docker.com/blog/running-ai-agents-in-github-actions-with-docker-sandboxes
related:
  - label: Guide — Developer experience and activation
    href: /guide/04-developer-experience-and-activation
---
