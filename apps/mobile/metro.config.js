// 모노레포용 Metro 설정: 루트 워크스페이스를 감시하고 공유 패키지를 해석.
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1) 워크스페이스 전체 감시 (packages/core 변경 반영)
config.watchFolders = [workspaceRoot];

// 2) node_modules 탐색 경로 (앱 → 루트 순)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
