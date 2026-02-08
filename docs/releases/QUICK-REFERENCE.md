# Release Process Quick Reference

Quick reference for common release operations. For detailed documentation, see [RELEASE.md](../RELEASE.md).

## Quick Commands

### Standard Release

```bash
# 1. Create release branch
git checkout -b release/v1.2.0

# 2. Update versions
pnpm changeset version

# 3. Build and test
pnpm clean && pnpm build && pnpm test

# 4. Commit and push
git add .
git commit -m "chore: release v1.2.0"
git push origin release/v1.2.0

# 5. Merge PR to main, then:
git checkout main && git pull
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0

# 6. Publish
pnpm run changeset:publish
```

### Hotfix Release

```bash
# 1. Create from tag
git checkout v1.2.0
git checkout -b hotfix/v1.2.1

# 2. Fix, version, test
# ... make fixes ...
pnpm changeset version
pnpm build && pnpm test

# 3. Merge and tag
git checkout main
git merge hotfix/v1.2.1
git tag -a v1.2.1 -m "Hotfix v1.2.1"
git push origin main v1.2.1

# 4. Publish
pnpm run changeset:publish
```

### Beta Release

```bash
# 1. Add changeset with prerelease
pnpm changeset pre enter beta
pnpm changeset version

# 2. Build and test
pnpm build && pnpm test

# 3. Publish with beta tag
pnpm run release:beta

# 4. Exit prerelease mode
pnpm changeset pre exit
```

## Version Bumping Quick Guide

| Change Type | Example | Version |
|-------------|---------|---------|
| Breaking change | Removed API | `1.0.0` → `2.0.0` |
| New feature | Added feature | `1.0.0` → `1.1.0` |
| Bug fix | Fixed bug | `1.0.0` → `1.0.1` |
| Security fix | CVE patch | `1.0.0` → `1.0.1` |

## Common Tasks

### Check Release Readiness

```bash
# Quick validation
pnpm build && pnpm test && pnpm lint && pnpm run type-check
```

### Dry Run Publish

```bash
pnpm publish:dry-run
```

### View Published Versions

```bash
npm view @ainative/ai-kit-core versions
```

### Deprecate a Version

```bash
npm deprecate @ainative/ai-kit-core@1.2.0 "Use v1.2.1 instead"
```

### Update Latest Tag

```bash
npm dist-tag add @ainative/ai-kit-core@1.1.0 latest
```

## Pre-Release Checklist (1 Minute)

```bash
# Run all checks
pnpm build      # ✓ Build succeeds
pnpm test       # ✓ Tests pass
pnpm lint       # ✓ No lint errors
pnpm type-check # ✓ No type errors

# Verify versions
grep -r "version" packages/*/package.json | grep -v node_modules

# Check changelog
cat CHANGELOG.md | head -20
```

## Troubleshooting

### Publishing Failed?

```bash
# Check authentication
npm whoami

# Re-login if needed
npm login

# Check access
npm access ls-packages @ainative
```

### Wrong Version Published?

```bash
# Deprecate it
npm deprecate @ainative/ai-kit-core@X.Y.Z "Published in error, use X.Y.Z+1"

# Publish correct version
# (bump version and re-publish)
```

### Tag Already Exists?

```bash
# Delete and recreate
git tag -d v1.2.0
git push origin --delete v1.2.0
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

## Release Schedule

- **Regular**: First Tuesday of month
- **Hotfix**: As needed, within 24h
- **Beta**: 1-2 weeks before stable
- **Major**: Announce 1 month ahead

## Communication Checklist

After release:
- [ ] GitHub Release created
- [ ] GitHub Discussion posted
- [ ] Twitter announcement
- [ ] Discord notification
- [ ] Update docs site
- [ ] Close related issues

## Emergency Contacts

For release emergencies:
- **GitHub**: @maintainer1, @maintainer2
- **Slack**: #releases channel
- **Email**: releases@ainative.studio

---

**Last Updated:** February 8, 2026
**See Also:** [Full Release Process](../RELEASE.md)
