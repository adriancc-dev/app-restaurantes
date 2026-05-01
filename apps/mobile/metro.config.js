const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// pnpm monorepo: watch entire monorepo so Metro finds all workspace packages
config.watchFolders = [monorepoRoot]

// Resolve from both the app and the monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

// pnpm uses symlinks — Metro must follow them
config.resolver.unstable_enableSymlinks = true

// Honor the "exports" field in package.json (needed for nativewind 4.2+)
config.resolver.unstable_enablePackageExports = true

module.exports = withNativeWind(config, { input: './global.css' })
