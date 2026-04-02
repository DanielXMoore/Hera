# Hera Language Server

This Language Server works for `.hera` files. It has the following language features:

- Syntax Highlighting
- Go to definition
- Find all references
- Completions
- Comment/Uncomment
- Embedded JS Language highlighting
- Symbols outline
- Diagnostics regenerated on each file change or configuration change

## Configuration

Use `hera.language` to control how handler bodies are interpreted.

Supported values:

- `javascript`
- `typescript`
- `civet`

In VS Code settings:

```json
{
  "hera.language": "civet"
}
```

Or in your workspace `package.json`:

```json
{
  "hera": {
    "language": "civet"
  }
}
```
