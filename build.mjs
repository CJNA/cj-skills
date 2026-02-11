#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, basename } from 'path';

const SKILLS_DIR = join(import.meta.dirname, 'skills');

// --- YAML frontmatter parser (minimal, no dependencies) ---

function unquote(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };

  const raw = match[1];
  const body = match[2];
  const meta = {};

  let currentKey = null;
  let currentList = null;

  for (const line of raw.split('\n')) {
    // List item (starts with "  - ")
    const listMatch = line.match(/^\s+-\s+(.*)/);
    if (listMatch && currentList) {
      const kvMatch = listMatch[1].match(/^([\w-]+):\s*(.*)/);
      if (kvMatch) {
        // Key-value list item — start a new object
        currentList.push({ [kvMatch[1]]: unquote(kvMatch[2]) });
      } else {
        currentList.push(unquote(listMatch[1]));
      }
      continue;
    }

    // Indented continuation of a list object (e.g. "    title: Greetings")
    const contMatch = line.match(/^\s{4,}([\w-]+):\s*(.*)/);
    if (contMatch && currentList && currentList.length > 0) {
      const lastItem = currentList[currentList.length - 1];
      if (typeof lastItem === 'object') {
        lastItem[contMatch[1]] = unquote(contMatch[2]);
      }
      continue;
    }

    // Top-level key-value pair
    const kvMatch = line.match(/^([\w-]+):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();
      if (value === '' || value === '[]') {
        meta[currentKey] = [];
        currentList = meta[currentKey];
      } else {
        meta[currentKey] = unquote(value);
        currentList = null;
      }
    }
  }

  return { meta, body };
}

// --- Build a single skill ---

function buildSkill(skillDir) {
  const skillName = basename(skillDir);
  const skillMdPath = join(skillDir, 'SKILL.md');
  const metadataPath = join(skillDir, 'metadata.json');
  const sectionsPath = join(skillDir, 'rules', '_sections.md');
  const rulesDir = join(skillDir, 'rules');

  // Read SKILL.md
  if (!existsSync(skillMdPath)) {
    console.error(`  Skipping ${skillName}: no SKILL.md found`);
    return false;
  }

  const skillContent = readFileSync(skillMdPath, 'utf-8');
  const { meta: skillMeta, body: skillBody } = parseFrontmatter(skillContent);

  // Read metadata.json
  let metadata = {};
  if (existsSync(metadataPath)) {
    metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
  }

  // Read sections
  let sections = [];
  if (existsSync(sectionsPath)) {
    const sectionsContent = readFileSync(sectionsPath, 'utf-8');
    const { meta: sectionsMeta } = parseFrontmatter(sectionsContent);
    if (Array.isArray(sectionsMeta.sections)) {
      sections = sectionsMeta.sections;
    }
  }

  // Read rule files
  const rules = [];
  if (existsSync(rulesDir)) {
    const ruleFiles = readdirSync(rulesDir)
      .filter(f => f.endsWith('.md') && !f.startsWith('_'))
      .sort();

    for (const file of ruleFiles) {
      const ruleContent = readFileSync(join(rulesDir, file), 'utf-8');
      const { meta, body } = parseFrontmatter(ruleContent);
      rules.push({ file, meta, body });
    }
  }

  // Group rules by section
  const rulesBySection = new Map();
  for (const rule of rules) {
    const sectionId = rule.meta.section || 'uncategorized';
    if (!rulesBySection.has(sectionId)) {
      rulesBySection.set(sectionId, []);
    }
    rulesBySection.get(sectionId).push(rule);
  }

  // --- Compile AGENTS.md ---

  const lines = [];

  // Header
  lines.push(`# ${skillMeta.name || skillName}`);
  lines.push('');
  if (skillMeta.description) {
    lines.push(`> ${skillMeta.description}`);
    lines.push('');
  }
  if (metadata.version) {
    lines.push(`*Version ${metadata.version}*`);
    lines.push('');
  }

  // Skill body (overview)
  if (skillBody.trim()) {
    lines.push(skillBody.trim());
    lines.push('');
  }

  // Table of contents
  if (sections.length > 0 || rules.length > 0) {
    lines.push('## Table of Contents');
    lines.push('');
    for (const section of sections) {
      const title = section.title || section.id;
      const anchor = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
      lines.push(`- [${title}](#${anchor})`);

      const sectionRules = rulesBySection.get(section.id) || [];
      for (const rule of sectionRules) {
        const ruleTitle = rule.meta.title || rule.file.replace('.md', '');
        const ruleAnchor = ruleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
        lines.push(`  - [${ruleTitle}](#${ruleAnchor})`);
      }
    }

    // Uncategorized rules
    const uncategorized = rulesBySection.get('uncategorized') || [];
    if (uncategorized.length > 0) {
      for (const rule of uncategorized) {
        const ruleTitle = rule.meta.title || rule.file.replace('.md', '');
        const ruleAnchor = ruleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');
        lines.push(`- [${ruleTitle}](#${ruleAnchor})`);
      }
    }
    lines.push('');
  }

  // Sections and rules
  for (const section of sections) {
    const title = section.title || section.id;
    lines.push(`## ${title}`);
    lines.push('');
    if (section.description) {
      lines.push(section.description);
      lines.push('');
    }

    const sectionRules = rulesBySection.get(section.id) || [];
    for (const rule of sectionRules) {
      lines.push(rule.body.trim());
      lines.push('');
    }
  }

  // Uncategorized rules
  const uncategorized = rulesBySection.get('uncategorized') || [];
  if (uncategorized.length > 0 && sections.length > 0) {
    lines.push('## Other');
    lines.push('');
  }
  for (const rule of uncategorized) {
    lines.push(rule.body.trim());
    lines.push('');
  }

  // Write AGENTS.md
  const outputPath = join(skillDir, 'AGENTS.md');
  writeFileSync(outputPath, lines.join('\n'));
  console.log(`  Built ${skillName}/AGENTS.md (${rules.length} rule${rules.length !== 1 ? 's' : ''})`);
  return true;
}

// --- Main ---

const targetSkill = process.argv[2];

if (targetSkill) {
  const skillDir = join(SKILLS_DIR, targetSkill);
  if (!existsSync(skillDir) || !statSync(skillDir).isDirectory()) {
    console.error(`Skill not found: ${targetSkill}`);
    process.exit(1);
  }
  console.log(`Building skill: ${targetSkill}`);
  buildSkill(skillDir);
} else {
  console.log('Building all skills...');
  const entries = readdirSync(SKILLS_DIR).filter(name => {
    const full = join(SKILLS_DIR, name);
    return statSync(full).isDirectory();
  });

  let built = 0;
  for (const name of entries) {
    if (buildSkill(join(SKILLS_DIR, name))) built++;
  }
  console.log(`Done. Built ${built} skill${built !== 1 ? 's' : ''}.`);
}
