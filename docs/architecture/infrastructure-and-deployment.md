# Infrastructure and Deployment

## Infrastructure as Code
- **Tool:** None (Simple deployment)
- **Approach:** Manual or Script-based setup for local environment.

## Deployment Strategy
- **Strategy:** Rolling Update (for Web) / Pull (for Local)
- **CI/CD Platform:** GitHub Actions
- **Pipeline Configuration:** `.github/workflows/ci.yml` (Test & Build), `.github/workflows/deploy.yml` (Deploy)

## Environments
- **Development:** Local machine, hot-reloading.
- **Production:** Live URL (e.g., Vercel) or Local Production Build.

---
