module.exports = {
    parser: '@typescript-eslint/parser', // Define ESLint's parser.
    extends: ['plugin:@typescript-eslint/recommended'], // Defines subspecs for file inheritance
    plugins: ['@typescript-eslint'], // Defines the plugins that the eslint file depends on
    env: {                          // Specify the runtime environment of the code
        browser: true,
        node: true,
    },
    rules: {
        '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
        '@typescript-eslint/no-unused-vars': ['off'],
        '@typescript-eslint/explicit-function-return-type': ['off'],
        '@typescript-eslint/no-explicit-any': ['off'],
        '@typescript-eslint/explicit-module-boundary-types': ['off'],
    }
}