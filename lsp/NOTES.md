# Hera LSP

Adapted from sample code for <https://code.visualstudio.com/api/language-extensions/language-server-extension-guide>

## Structure

```plain
.
├── src
│   ├── extension.ts // Language Client entry point
│   └── server.ts    // Language Server entry point
├── server // Language Server
│   └── src
├── syntaxes
│   ├── hera-configuration.json // Controls comment behavior in .hera files
│   └── hera.json               // TextMate grammar for syntax highlighting
├── test // End to End tests for Language Client / Server
└── package.json // The extension manifest.

```

## Running the Sample

- Run `yarn` in this folder.
- Open VS Code on this folder.
- Press Ctrl+Shift+B to start compiling the client and server in [watch mode](https://code.visualstudio.com/docs/editor/tasks#:~:text=The%20first%20entry%20executes,the%20HelloWorld.js%20file.).
- Switch to the Run and Debug View in the Sidebar (Ctrl+Shift+D).
- Select `Launch Client` from the drop down (if it is not already).
- Press ▷ to run the launch config (F5).
- If you want to debug the server as well, use the launch configuration `Attach to Server`
- In the [Extension Development Host](https://code.visualstudio.com/api/get-started/your-first-extension#:~:text=Then%2C%20inside%20the%20editor%2C%20press%20F5.%20This%20will%20compile%20and%20run%20the%20extension%20in%20a%20new%20Extension%20Development%20Host%20window.) instance of VSCode, open a 'hera' file.

## Questions and Answers

### How to publish and install the extension?

<https://code.visualstudio.com/api/working-with-extensions/publishing-extension>

### How to minimize extension girth?

<https://code.visualstudio.com/api/working-with-extensions/bundling-extension>

Node modules is a known fatty what is the best way to only include the files
that are actually necessary? Tree shaking? What tool is best?

Webpack sucked the last time I used it so giving esbuild a shot.

How does this work with with `new LanguageClient` creating a server as a
separate process?

<https://code.visualstudio.com/api/extension-guides/web-extensions>

### How to view crashed extension logs?

Installing the extension from vsix isn't exactly the same as lanuching from the
dev env. To see the logs: `Ctrl+Shift+P` -> Search Show Logs -> Extension Host

You can also view the files at `C:\Users\duder\.vscode\extensions\danielx.hera-lsp-0.0.1`

ProTip:tm: Using `yarn link` for development will break the extension so make
sure to unlink before publishing.

### How to highlight source code?

<https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide>

Add a grammars section in package.json to register a textmate grammar.

```json
"grammars": [
      {
        "language": "hera",
        "scopeName": "source.hera",
        "embeddedLanguages": {
          "meta.embedded.block.javascript": "javascript"
        },
        "path": "./syntaxes/hera.json"
      }
    ]
```

### How to set ctrl+click to jump to things?

Maybe DocumentLink? Nope, that is for permanently underlined links.

Use `definitionProvider`, that will allow for Ctrl+Click to go to the
definition, will underline when hovering with Ctrl held, and will automatically
display a helpful UI preview of the target source location.

To link to a line / column append `#${line}:#{column}` with count starting from
1.

### How to have nested symbols in the outline?

Walk down the parse nodes and recurse into the AST node's children children
collecting and transforming them into the `children` property for the returned
`DocumentSymbol`.

### How to find all references?

<https://code.visualstudio.com/api/language-extensions/programmatic-language-features#find-all-references-to-a-symbol>

### How to display documentation when hovering a symbol or identifier?

### How to specify comment behavior in a custom language?

<https://stackoverflow.com/questions/34822552/how-to-customize-comment-block-characters-in-visual-studio-code>
<https://code.visualstudio.com/api/references/vscode-api#CommentRule>

### How to send auto-completion lists based on location in document?

### Why does quitting the launched VSCode client instance by closing the window open up a big ol' json file in the editor?

## TODO

- [x] Fix `/` choice expression highlighting (getting eaten by regex)
