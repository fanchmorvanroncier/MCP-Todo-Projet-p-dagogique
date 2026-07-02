# MCP Todo — Projet pédagogique

## Objectif

On s'intéresse à ce que Claude peut apporter à l'équipe. Ce mini-projet sert à comprendre par la pratique le **MCP (Model Context Protocol)** : un protocole ouvert qui permet de brancher des outils/données externes (bases, APIs, fichiers...) sur un assistant IA comme Claude, pour qu'il puisse agir dessus (lire, créer, modifier, supprimer) au lieu de juste discuter.

## C'est quoi le MCP, en 3 phrases

- MCP = un standard (créé par Anthropic, open) qui définit comment un assistant IA peut découvrir et appeler des "outils" exposés par un serveur externe.
- Un **serveur MCP** expose une liste d'outils (ex: `add_todo`, `list_todos`...) avec leur description et leurs paramètres. Le client IA (Claude Desktop, Claude Code, etc.) les découvre automatiquement et peut les appeler pendant la conversation.
- Concrètement : au lieu de coder une intégration sur-mesure pour chaque outil externe, on écrit un serveur MCP une fois, et n'importe quel client compatible MCP peut s'y connecter.

## Ce qu'on a construit

Un serveur MCP "todo list" **nominatif** (chaque personne a ses propres todos) avec un CRUD complet, stocké dans de simples fichiers JSON (pas de vraie base de données — volontaire, pour rester simple et se concentrer sur le MCP).

**5 outils exposés :**

| Outil | Rôle |
|---|---|
| `list_todos(person, filter?)` | Liste les todos d'une personne (`all` \| `done` \| `pending`) |
| `add_todo(person, title)` | Crée un todo |
| `update_todo(person, id, title)` | Modifie l'intitulé |
| `complete_todo(person, id, done?)` | Marque terminé / à faire |
| `delete_todo(person, id)` | Supprime un todo |

Les todos sont numérotés simplement (1, 2, 3...) par personne, et stockés dans `data/todos-<nom>.json` — un fichier par personne.

## Architecture

```
src/
  index.ts    -> le serveur MCP : déclare les 5 outils, transport stdio
  storage.ts  -> lecture/écriture des fichiers JSON (le "CRUD")
data/
  todos-<nom>.json   -> créé automatiquement au premier todo ajouté par cette personne
```

**Stack :** TypeScript + Node.js, SDK officiel `@modelcontextprotocol/sdk`, validation des entrées avec `zod`.

## Le repo

https://github.com/fanchmorvanroncier/MCP-Todo-Projet-p-dagogique

## Comment le tester soi-même

### 0. Récupérer le projet

```bash
git clone https://github.com/fanchmorvanroncier/MCP-Todo-Projet-p-dagogique.git
cd MCP-Todo-Projet-p-dagogique
npm install
```

### Option 1 — MCP Inspector (le plus simple pour explorer)

Outil officiel avec une interface web, qui permet d'appeler chaque outil à la main et de voir les échanges bruts du protocole (utile pour *voir* concrètement ce qu'est le MCP).

```bash
npm run inspector
```

Une URL locale s'affiche dans le terminal → l'ouvrir dans le navigateur → "Connect" → onglet "Tools" → tester `add_todo`, `list_todos`, etc.

### Option 2 — Directement dans Claude Code

Le fichier `.mcp.json` à la racine du projet déclare déjà le serveur. Il suffit de :

```bash
npm run build
```

puis d'ouvrir une session Claude Code dans ce dossier — le serveur `todo` est proposé automatiquement (avec une validation de sécurité à l'ouverture), et ses outils deviennent utilisables directement dans la conversation.

## Pour aller plus loin

- Le code est court et commenté juste ce qu'il faut — se lit en 10 minutes (`src/storage.ts` puis `src/index.ts`).
- Prochaine étape possible : remplacer le stockage JSON par une vraie base (SQLite, Postgres...) sans toucher à la couche MCP, pour voir que le protocole est indépendant du stockage.
- Doc officielle du protocole : modelcontextprotocol.io
