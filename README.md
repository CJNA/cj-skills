# cj-skills

A public repository of shareable [Claude Code](https://claude.ai/claude-code) skills.

Each skill lives in `skills/<name>/` and contains modular rule files that get compiled into a single `AGENTS.md` via the build script.

## Installing a skill

Copy a skill directory into your Claude Code skills folder:

```bash
cp -r skills/<skill-name> ~/.claude/skills/
```

Then rebuild its `AGENTS.md`:

```bash
node build.mjs <skill-name>
```

## Creating a new skill

Use `skills/example-skill/` as a starting template:

```bash
cp -r skills/example-skill skills/my-new-skill
```

Each skill has this structure:

```
skills/my-new-skill/
├── SKILL.md           # Skill definition (YAML frontmatter + overview)
├── README.md          # Human-readable docs
├── metadata.json      # Version, author, references
└── rules/
    ├── _sections.md   # Section definitions & ordering
    ├── _template.md   # Template for new rules
    └── *.md           # Individual rule files
```

## Building

Compile all skills:

```bash
node build.mjs
```

Compile a single skill:

```bash
node build.mjs example-skill
```

This reads the rule files in each skill's `rules/` directory and generates a single `AGENTS.md` per skill. Generated `AGENTS.md` files are gitignored.

## License

MIT
