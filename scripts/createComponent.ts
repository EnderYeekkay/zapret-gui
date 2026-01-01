import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { log } from 'console'
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const component_name = process.argv[2]
if (!component_name || !component_name.match(/^[a-z]+$/)) throw new Error(`Wrong component name: ${component_name}`)

const component_path = path.resolve(__dirname, '../public/mainwindowr/src/Components', component_name)
fs.mkdirSync(component_path)

const ts_functional_template = `import './${capitalize(component_name)}.scss'

export default function ${capitalize(component_name)}() {
    return <div>
\t\t
    </div>
}\n`

const ts_class_template = `import React, { Component } from 'react';
import './${capitalize(component_name)}.scss';

export default class ${capitalize(component_name)} extends Component {
  render() {
    return (
      <div className="${component_name}">
        
      </div>
    );
  }
}
\n`;
fs.writeFileSync(
    path.resolve(component_path, `${component_name}.tsx`),
    process.argv[3] == 'c' ? ts_class_template : ts_functional_template
)
fs.writeFileSync(
    path.resolve(component_path, `${component_name}.scss`),
    ''
)
log('Component is ready:', component_path)
function capitalize (str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};
