const tsPlugin = require("@typescript-eslint/eslint-plugin")
const tsParser = require("@typescript-eslint/parser")

module.exports = [
    {
        files: ["src/**/*.ts", "src/**/*.tsx"],
        plugins: {"@typescript-eslint": tsPlugin},
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: "module",
                ecmaFeatures: {jsx: true},
                project: "./tsconfig.json"
            }
        },
        rules: {
            "@typescript-eslint/explicit-function-return-type": "off"
        }
    }
]
