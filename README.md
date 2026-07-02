# MCP Todo (nominatif)

Petit serveur MCP (Model Context Protocol) pédagogique : un CRUD de todos, un fichier JSON par personne (`data/todos-<nom>.json`).

## Outils exposés

- `list_todos(person, filter?)` — liste les todos d'une personne (`all` | `done` | `pending`)
- `add_todo(person, title)` — crée un todo
- `update_todo(person, id, title)` — modifie l'intitulé
- `complete_todo(person, id, done?)` — marque terminé / à faire
- `delete_todo(person, id)` — supprime un todo

## Installation

```bash
npm install
```

## Lancer en dev

```bash
npm run dev
```

## Compiler / lancer en prod

```bash
npm run build
npm start
```

## Tester avec MCP Inspector (recommandé pour développer)

```bash
npm run inspector
```

Ça ouvre une UI web où tu peux appeler chaque outil à la main et voir les requêtes/réponses JSON-RPC brutes — utile pour comprendre le protocole.

## Brancher sur Claude Desktop

Éditer `claude_desktop_config.json` (menu Claude Desktop > Settings > Developer > Edit Config) et ajouter :

```json
{
  "mcpServers": {
    "todo": {
      "command": "node",
      "args": ["C:/Users/fanch.morvanroncier/OneDrive - CLOITRE IMPRIMEURS/Bureau/test mpc/dist/index.js"]
    }
  }
}
```

Penser à faire `npm run build` avant (Claude Desktop lance le JS compilé, pas le TS). Redémarrer Claude Desktop ensuite.

## Structure

```
src/
  index.ts    -> serveur MCP + déclaration des 5 outils (transport stdio)
  storage.ts  -> lecture/écriture des fichiers JSON (un par personne)
data/
  todos-<nom>.json  -> créé automatiquement au premier todo ajouté
```
