# 🚀 HOW TO PUSH THIS TO GITHUB

## Step 1 — Initialize the repo locally
```bash
cd rebulb-storyatlas
git init
git add .
git commit -m "feat: initial StoryAtlas full-stack setup"
```

## Step 2 — Connect to GitHub
```bash
git remote add origin https://github.com/Rebulb-Studio/rebulb-storyatlas.git
git branch -M main
git push -u origin main
```

## Step 3 — Add the Anthropic API key to GitHub Secrets
1. Go to your repo on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `ANTHROPIC_API_KEY`
5. Value: your Anthropic API key (from console.anthropic.com)

## Step 4 — Enable branch protection (so Claude review is required)
1. Settings → Branches → Add branch protection rule
2. Branch name pattern: `main`
3. Check: "Require status checks to pass before merging"
4. Add: `Claude Reviews PR`
5. Save

---

## How the Claude workflow runs after that:
- You (or Claude) create a branch, update `CLAUDE_PLAN.md`, make changes
- Open a PR to `main`
- GitHub automatically runs Claude review
- Claude posts its analysis as a comment
- If Claude says `APPROVED` → PR can merge
- If Claude says `REQUEST_CHANGES` → PR is blocked until fixed
