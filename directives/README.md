# Directives

SOPs (Standard Operating Procedures) written in Markdown.

Each directive defines:
- **Goal** — What the task accomplishes
- **Inputs** — Required data or context
- **Tools/Scripts** — Which `execution/` scripts to use
- **Outputs** — Expected deliverables
- **Edge Cases** — Known gotchas and how to handle them
- **Team Config** *(optional)* — Multi-agent roles for complex tasks

## Creating a New Directive

```markdown
# Directive: [Name]

## Goal
[What this accomplishes]

## Inputs
- [Required inputs]

## Tools
- `execution/script_name.py` — [what it does]

## Outputs
- [Expected deliverables]

## Edge Cases
- [Known issues and mitigations]

## Team Config (optional)
- Researcher: [scope]
- Developer: [scope]
- Tester: [scope]

## Learnings
- [Updated as the system self-anneals]
```
