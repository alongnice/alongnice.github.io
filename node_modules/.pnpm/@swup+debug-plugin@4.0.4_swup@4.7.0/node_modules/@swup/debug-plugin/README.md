# Swup Debug Plugin

A [swup](https://swup.js.org) plugin for debugging and helping in development.

- Output all triggered hooks to the console as they happen
- Rewrites swup's `log` method so that any output provided by plugins is visible
- Detect common mistakes and suggest solutions in the console

## Installation

Install the plugin from npm and import it into your bundle.

```bash
npm install @swup/debug-plugin
```

```js
import SwupDebugPlugin from '@swup/debug-plugin';
```

Or include the minified production file from a CDN:

```html
<script src="https://unpkg.com/@swup/debug-plugin@4"></script>
```

## Usage

To run this plugin, include an instance in the swup options.

```javascript
const swup = new Swup({
  plugins: [new SwupDebugPlugin()]
});
```

## Options

### globalInstance

If `true`, the plugin will store the swup instance on the global window object, making swup
available at `window.swup`. Defaults to `false`.

```javascript
{
  globalInstance: true
}
```
