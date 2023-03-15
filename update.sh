find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
rm pnpm-lock.yaml
pnpm i
pnpm up -r