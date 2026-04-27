# Vercel Deployment TODO

- [x] Understand project structure and Vercel requirements
- [x] Identify issues (vite devDependency import, nanoid transitive dep, static path resolution, invalid vercel.json env)
- [x] Update `server/vite.ts`: dynamic import for `vite`, replace `nanoid`, fix `serveStatic` paths
- [x] Update `vercel.json`: remove invalid `env` field
- [x] Update `package.json`: add `vercel-build` script
- [x] Commit changes to git
- [x] Fix `server/storage.ts`: complete DatabaseStorage, export correct storage based on DATABASE_URL
- [x] Fix `server/routes.ts`: remove unnecessary Passport session code
- [x] Fix `server/db.ts`: proper typing
- [x] Update `vercel.json`: ensure client builds before serverless
- [ ] Vercel deployment: requires user login & env vars setup

