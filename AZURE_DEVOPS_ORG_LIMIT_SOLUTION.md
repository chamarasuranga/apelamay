# Azure DevOps Organization Limit - Solutions

## Error
```
VS850036: Maximum number of organizations reached.
```

## What This Means
Azure DevOps free tier allows **only 1 organization per Microsoft account**. You've already created an organization with your account.

---

## Solutions

### Solution 1: Use Your Existing Organization (Recommended) ✅

Instead of creating a new organization, use your existing one!

#### Step 1: Find Your Existing Organization

1. Go to https://dev.azure.com
2. You should see your existing organization(s)
3. Click on the organization you already have

#### Step 2: Create Project in Existing Organization

1. In your existing organization, click **+ New project**
2. Configure:
   - **Project name**: `Apelamay`
   - **Visibility**: Private
   - **Version control**: Git
3. Click **Create**

**That's it!** You can have unlimited projects within one organization.

#### Step 3: Continue with Setup

Follow the rest of the Azure DevOps setup guide using this project in your existing organization:
- Service connection
- Pipelines
- etc.

---

### Solution 2: Delete Unused Organization

If you have an old organization you don't need:

#### Step 1: View Your Organizations

1. Go to https://dev.azure.com
2. Click your profile picture (top right)
3. Click **My organizations**
4. You'll see all your organizations

#### Step 2: Delete Organization

1. Click on the organization you want to delete
2. Go to **Organization settings** (bottom left)
3. Click **Overview** (under Organization Settings)
4. Scroll down and click **Delete**
5. Follow the confirmation steps

**Warning:** This permanently deletes:
- All projects
- All repositories
- All pipelines
- All work items
- Cannot be undone!

**Wait 24 hours** after deletion before creating a new organization.

---

### Solution 3: Use Different Microsoft Account

Create a new Microsoft account for this project:

#### Step 1: Create New Microsoft Account

1. Go to https://signup.live.com
2. Create new account (e.g., `apelamay.dev@outlook.com`)
3. Complete verification

#### Step 2: Create Azure DevOps Organization

1. Go to https://dev.azure.com
2. Sign in with new account
3. Create organization
4. Create project

**Considerations:**
- Need separate Azure subscription access for deployment
- Can add your original account as member
- Free tier: 5 users per organization

---

### Solution 4: Use GitHub Actions Instead

If you prefer to avoid Azure DevOps limits, use GitHub Actions:

#### Advantages
- Unlimited repositories
- No organization limits
- Free for public repos
- 2,000 minutes/month for private repos (free tier)

#### Setup

**Step 1: Push to GitHub**

```powershell
cd c:\My_Stuff\development\apelamay

# Add GitHub remote
git remote add github https://github.com/yourusername/apelamay.git
git push github main
```

**Step 2: Create GitHub Action Workflows**

I can help you convert your Azure Pipelines YAML to GitHub Actions if you choose this option.

**Step 3: Add Azure Credentials**

1. In GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**
2. Add Azure credentials as secrets
3. Workflows will deploy to Azure

---

## Recommended Approach

### ⭐ Option 1: Use Existing Organization + New Project

**Why this is best:**
- ✅ Immediate - no waiting
- ✅ No account juggling
- ✅ Keep existing work
- ✅ Unlimited projects per organization
- ✅ One place for all your code

**How to do it:**

```
1. Go to https://dev.azure.com
2. Select your existing organization
3. Click "+ New project"
4. Name it "Apelamay"
5. Continue with pipeline setup
```

**Organization Structure:**
```
Your Existing Organization
├── Existing Project 1
├── Existing Project 2
└── Apelamay (NEW) ← Add this!
    ├── Repos
    ├── Pipelines (API, BFF)
    ├── Environments
    └── Service Connections
```

---

## FAQ

### Q: Can I have multiple projects in one organization?
**A: Yes!** Unlimited projects per organization.

### Q: Will projects interfere with each other?
**A: No.** Each project is isolated with its own:
- Repositories
- Pipelines
- Service connections
- Permissions
- Work items

### Q: Do I need separate service connections?
**A: No.** Service connections can be shared across projects in the same organization, or you can create project-specific ones.

### Q: Can I move a project between organizations?
**A: Not directly.** You'd need to:
1. Export code from old project
2. Import to new project
3. Recreate pipelines

### Q: How many organizations can I have?
**A: 1 per Microsoft account** (free tier)

---

## Next Steps

### If Using Existing Organization:

1. **Open your existing organization**:
   ```
   https://dev.azure.com/{your-existing-org-name}
   ```

2. **Create Apelamay project**:
   - Click **+ New project**
   - Name: `Apelamay`
   - Create

3. **Continue with setup**:
   - Follow `AZURE_DEVOPS_SETUP_COMPLETE.md`
   - Replace organization name with your existing one
   - Everything else stays the same

### Example URLs Will Be:

```
Organization: https://dev.azure.com/{your-existing-org}
Project: https://dev.azure.com/{your-existing-org}/Apelamay
Repos: https://dev.azure.com/{your-existing-org}/Apelamay/_git/Apelamay
Pipelines: https://dev.azure.com/{your-existing-org}/Apelamay/_build
```

---

## Verification

After creating project in existing organization:

```powershell
# List your projects (Azure CLI)
az devops project list --organization https://dev.azure.com/{your-org}

# You should see your new Apelamay project
```

---

## Alternative: GitHub Actions Quick Setup

If you prefer GitHub Actions over Azure DevOps:

### Advantages
- No organization limits
- Familiar Git workflow
- Great for open source
- Good free tier

### Setup Command
```powershell
# Create .github/workflows directory
mkdir -p .github/workflows

# I can create GitHub Actions workflows for you
# Just let me know if you want this option
```

**Deployment time is similar:**
- Azure DevOps: ~5-11 minutes
- GitHub Actions: ~5-11 minutes

**Both can deploy to Azure App Services!**

---

## Summary

| Solution | Pros | Cons | Time |
|----------|------|------|------|
| **Use existing org** | ✅ Immediate<br>✅ Simple<br>✅ No limits | Need existing org | 0 min |
| **Delete old org** | New clean start | ⏳ 24hr wait<br>⚠️ Lose data | 24 hrs |
| **New MS account** | Clean separation | Manage 2 accounts | 10 min |
| **GitHub Actions** | No limits<br>Popular | Different platform | 30 min |

---

## Recommended Action

**Do this now:**

1. Go to https://dev.azure.com
2. Click on your existing organization
3. Click **+ New project**
4. Name it **Apelamay**
5. Continue with the rest of the setup from `AZURE_DEVOPS_SETUP_COMPLETE.md`

**You'll be deploying in 30 minutes!** ✅

---

## Need Help?

If you want to:
- ✅ Set up in existing organization → Continue with setup guide
- ✅ Switch to GitHub Actions → Let me know, I'll create the workflows
- ✅ Create separate account → I can guide you through it

Just let me know what you prefer!
