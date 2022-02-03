# Commands

This directory is dynamically loaded by `deploy-commands.js` and imports all `commands`.
To add more modules with unique commands just uses this template:

```
import { SlashCommandBuilder } from '@discordjs/builders';

const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
]

export { commands }
```

Certain modules can be ignored by adding to the `config.ignoreModule` list.