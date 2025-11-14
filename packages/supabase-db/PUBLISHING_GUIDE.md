# Publishing Guide - mcp-supabase-db v3.0.0

## ✅ Pre-Publish Checklist

Your package is now **ready to publish** with the following configurations:

### Package Configuration

- ✅ **Version**: 3.0.0
- ✅ **Tests Excluded**: `tests/` directory will NOT be included in published package
- ✅ **Files Whitelisted**: Only production files included via `files` field
- ✅ **Metadata Complete**: Keywords, repository, license, author all set
- ✅ **Build Script**: TypeScript compilation automated
- ✅ **Pre-publish Hook**: `prepublishOnly` runs build and tests automatically

### What Gets Published

**Total Files**: 80 files
**Package Size**: 65.5 KB
**Unpacked Size**: 272.4 KB

**Included**:
```
✅ index.js                          (Entry point)
✅ src/**/*.js                       (Compiled JavaScript)
✅ src/**/*.ts                       (TypeScript source)
✅ src/**/*.d.ts                     (Type definitions)
✅ README.md                         (Main documentation)
✅ CHANGELOG.md                      (Version history)
✅ CODE_EXECUTION_GUIDE.md           (Usage guide)
✅ CODE_EXECUTION_ANALYSIS.md        (Architecture)
✅ IMPLEMENTATION_COMPLETE.md        (Implementation summary)
✅ RELEASE_NOTES_v3.0.0.md          (Release notes)
✅ LICENSE                           (MIT License - if present)
```

**Excluded** (via `.npmignore` and `files` field):
```
❌ tests/                           (All test files)
❌ babel.config.cjs                 (Build config)
❌ jest.config.cjs                  (Test config)
❌ tsconfig.json                    (TypeScript config)
❌ .env                             (Environment files)
❌ mcp-config.json                  (Local config)
❌ backups/                         (Backup files)
❌ coverage/                        (Test coverage)
❌ node_modules/                    (Dependencies)
```

---

## 📦 Publishing Commands

### 1. Dry Run (Verify Package Contents)

```bash
npm pack --dry-run
```

This shows exactly what will be included. **Already verified** - no test files present!

### 2. Create Package Locally (Test Installation)

```bash
npm pack
```

This creates `mcp-supabase-db-3.0.0.tgz` that you can test:

```bash
# Test in another directory
cd /tmp
npm install /path/to/mcp-supabase-db-3.0.0.tgz
```

### 3. Publish to npm

**First time publishing?**
```bash
# Login to npm
npm login

# Publish
npm publish
```

**Subsequent releases:**
```bash
npm publish
```

**Publishing with tag** (for beta/alpha releases):
```bash
npm publish --tag beta
npm publish --tag next
```

---

## 🔐 Pre-Publish Script

Your `package.json` includes a `prepublishOnly` script that automatically:

1. ✅ Compiles TypeScript (`npm run build`)
2. ✅ Runs all tests (`npm test`)

This ensures you **never publish broken code**. The publish will fail if:
- TypeScript doesn't compile
- Any tests fail
- Coverage thresholds not met

To skip (not recommended):
```bash
npm publish --ignore-scripts
```

---

## 🌍 Environment Variables for Publishing

### Required for Testing
```bash
export POSTGRES_URL_NON_POOLING="postgresql://user:pass@localhost:5432/testdb"
export SUPABASE_URL="http://localhost"
export SUPABASE_SECRET_KEY="dummy_key"
export OPENAI_API_KEY="dummy_key"
```

### For Production Package
The published package does **NOT** require these to be bundled - users will set their own.

---

## 📊 Package Verification

### Check Package Contents
```bash
# Preview files that will be published
npm pack --dry-run

# Verify no test files
npm pack --dry-run | grep -i test
# (Should return no results)

# Check package size
npm pack --dry-run | grep "package size"
```

### Validate package.json
```bash
npm pkg get name version
# Should show: mcp-supabase-db 3.0.0

npm pkg get files
# Should show the files array

npm pkg get scripts.prepublishOnly
# Should show: npm run build && npm test
```

---

## 🚀 Publishing Workflow

### Standard Release (v3.0.0)

```bash
# 1. Ensure you're on the right branch
git status

# 2. Build and test
npm run build
npm test

# 3. Dry run to verify
npm pack --dry-run

# 4. Create local package for testing
npm pack

# 5. Test package locally
cd /tmp
npm install /path/to/mcp-supabase-db-3.0.0.tgz
# Test it works

# 6. Publish to npm
cd /path/to/packages/supabase-db
npm publish

# 7. Verify on npm
npm info mcp-supabase-db
```

### Beta Release

```bash
# Update version to beta
npm version 3.0.0-beta.1 --no-git-tag-version

# Publish with beta tag
npm publish --tag beta

# Users install with:
# npm install mcp-supabase-db@beta
```

---

## 📝 Post-Publishing

### 1. Verify on npm
```bash
npm info mcp-supabase-db

# Check latest version
npm view mcp-supabase-db version

# Check package contents
npm view mcp-supabase-db files
```

### 2. Test Installation
```bash
# In a new directory
npm install mcp-supabase-db

# Verify it works
node -e "import('./node_modules/mcp-supabase-db/index.js')"
```

### 3. Update Documentation
- Update GitHub README with npm installation instructions
- Add npm badge to README
- Announce on relevant channels

---

## 🏷️ Version Management

### Semantic Versioning

- **3.0.0** - Major release (breaking changes)
- **3.1.0** - Minor release (new features, backward compatible)
- **3.0.1** - Patch release (bug fixes)

### Update Version

```bash
# Patch (3.0.0 → 3.0.1)
npm version patch

# Minor (3.0.0 → 3.1.0)
npm version minor

# Major (3.0.0 → 4.0.0)
npm version major

# Pre-release (3.0.0 → 3.0.1-beta.0)
npm version prerelease --preid=beta
```

---

## ⚠️ Important Notes

### DO NOT Publish
- ❌ Test files (already excluded)
- ❌ .env files (already excluded)
- ❌ Local configuration (already excluded)
- ❌ Backups (already excluded)

### DO Publish
- ✅ All source code (TypeScript + compiled JavaScript)
- ✅ Type definitions (.d.ts files)
- ✅ Documentation files
- ✅ LICENSE file

### Security
- Never commit credentials
- Review .npmignore before each publish
- Use `npm pack --dry-run` to verify
- Consider using `npm audit` before publishing

---

## 🔍 Troubleshooting

### "Files missing in published package"
- Check `files` field in package.json
- Verify .npmignore isn't too aggressive
- Use `npm pack --dry-run` to preview

### "Package too large"
- Current size: 65.5 KB (good!)
- npm limit: 100 MB (you're well under)
- If needed, exclude more files in .npmignore

### "Tests included in package"
- ✅ Already verified excluded
- Run: `npm pack --dry-run | grep test`
- Should return no results

### "prepublishOnly failing"
- Build errors: Fix TypeScript compilation
- Test errors: Fix failing tests
- Skip (not recommended): `npm publish --ignore-scripts`

---

## 📋 Final Checklist

Before running `npm publish`:

- [ ] Tests passing: `npm test` ✅
- [ ] TypeScript compiles: `npm run build` ✅
- [ ] No test files in package: `npm pack --dry-run | grep test` ✅
- [ ] Package size reasonable: `npm pack --dry-run | grep "package size"` ✅
- [ ] Version correct: `npm pkg get version` ✅
- [ ] Changelog updated: `CHANGELOG.md` ✅
- [ ] README accurate: `README.md` ✅
- [ ] Logged into npm: `npm whoami` ⏳
- [ ] On correct branch: `git status` ⏳

---

## 🎯 Quick Publish

If you're confident everything is ready:

```bash
# One-liner publish
npm run build && npm test && npm publish
```

The `prepublishOnly` hook will run build and tests again automatically, but this ensures you catch errors early.

---

## 📞 Support

- **Issues**: https://github.com/anthropics/mcp-servers/issues
- **npm Package**: https://www.npmjs.com/package/mcp-supabase-db (after publishing)
- **Documentation**: See README.md and guides in package

---

**Your package is ready to publish! 🎉**

Run `npm publish` when ready to share with the world!
