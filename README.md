# MCP Todo (nominatif)

Petit serveur **MCP (Model Context Protocol)** pédagogique : une todo list en CRUD complet, nominative (un fichier JSON par personne), pour comprendre par la pratique comment fonctionne le MCP.

> MCP est un protocole ouvert qui permet de brancher des outils/données externes sur un assistant IA (Claude Desktop, Claude Code...) pour qu'il puisse agir dessus — lire, créer, modifier, supprimer — au lieu de juste discuter. Un serveur MCP expose une liste d'"outils" ; n'importe quel client compatible peut s'y connecter et les appeler.

## Prérequis

- [Node.js](https://nodejs.org/) 18 ou plus récent (testé avec Node 22)
- npm (fourni avec Node)

## Démarrage rapide

```bash
git clone https://github.com/fanchmorvanroncier/MCP-Todo-Projet-p-dagogique.git
cd MCP-Todo-Projet-p-dagogique
npm install
npm run build
```

## Outils exposés

| Outil | Paramètres | Rôle |
|---|---|---|
| `list_todos` | `person`, `filter?` (`all` \| `done` \| `pending`) | Liste les todos d'une personne |
| `add_todo` | `person`, `title` | Crée un todo |
| `update_todo` | `person`, `id`, `title` | Modifie l'intitulé d'un todo |
| `complete_todo` | `person`, `id`, `done?` | Marque un todo terminé / à faire |
| `delete_todo` | `person`, `id` | Supprime un todo |

Les todos sont numérotés par personne (`1`, `2`, `3`...), pas d'UUID — plus simple à manipuler à la main pendant les tests. `id` accepte un nombre ou une chaîne numérique (`1` ou `"1"`), car certains clients MCP envoient les paramètres en string.

## Comment tester

### Option A — MCP Inspector (recommandé pour découvrir le protocole)

Outil officiel avec une UI web : on appelle chaque outil à la main et on voit les requêtes/réponses JSON-RPC brutes échangées entre client et serveur.

```bash
npm run inspector
```

Une URL locale s'affiche dans le terminal → l'ouvrir dans le navigateur → **Connect** → onglet **Tools** → tester `add_todo`, `list_todos`, etc.

### Option B — Directement dans Claude Code

Le fichier `.mcp.json` à la racine du projet déclare déjà le serveur (`command: node`, `args: dist/index.js`). Il suffit d'ouvrir une session Claude Code dans ce dossier après un `npm run build` : le serveur `todo` est proposé automatiquement (avec une demande d'approbation de sécurité à la première connexion), et ses outils deviennent utilisables directement dans la conversation.

### Option C — Claude Desktop

Éditer le fichier de config de Claude Desktop et ajouter une entrée `todo` :

- Windows : `%APPDATA%\Claude\claude_desktop_config.json`
- macOS : `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "todo": {
      "command": "node",
      "args": ["/chemin/absolu/vers/MCP-Todo-Projet-p-dagogique/dist/index.js"]
    }
  }
}
```

Remplacer le chemin par le chemin absolu réel sur ta machine. Faire `npm run build` avant (Claude Desktop lance le JS compilé, pas le TS directement), puis redémarrer Claude Desktop.

## Scripts npm

| Script | Rôle |
|---|---|
| `npm run dev` | Lance le serveur en TypeScript direct (via `tsx`), pratique pendant le dev |
| `npm run build` | Compile `src/` vers `dist/` |
| `npm start` | Lance le serveur compilé (`node dist/index.js`) |
| `npm run inspector` | Lance MCP Inspector connecté au serveur |

## Structure du projet

```
src/
  index.ts    -> serveur MCP : déclare les 5 outils (schémas zod), transport stdio
  storage.ts  -> lecture/écriture des fichiers JSON (le CRUD, un fichier par personne)
data/
  todos-<nom>.json  -> créé automatiquement au premier todo ajouté par cette personne
.mcp.json     -> déclaration du serveur pour Claude Code (scope projet)
```

## Stockage

Pas de vraie base de données — c'est volontaire, pour rester simple et se concentrer sur la compréhension du protocole MCP plutôt que sur la couche persistance. Chaque personne a son propre fichier `data/todos-<nom-normalisé>.json` (nom mis en minuscules, caractères spéciaux remplacés). Ces fichiers sont ignorés par Git (`.gitignore`) puisque ce sont des données locales de test.

## Aller plus loin

- Le code se lit en ~10 minutes : `src/storage.ts` puis `src/index.ts`.
- Piste d'évolution : remplacer le stockage JSON par une vraie base (SQLite, Postgres...) sans toucher à la couche MCP — bonne façon de vérifier que le protocole est indépendant du stockage.
- Doc officielle du protocole : [modelcontextprotocol.io](https://modelcontextprotocol.io)
