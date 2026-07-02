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

## Resources et prompts

En plus des outils (les *tools*, qui font une action), le serveur expose les deux autres primitives du protocole MCP :

- **Resource** `todo://{person}/todos` (template dynamique) — expose le contenu JSON brut de la todo list d'une personne, en lecture seule. Le client peut la lister (`resources/list`, une entrée par fichier `data/todos-*.json` existant) ou la lire directement par URI (`resources/read`).
- **Prompt** `todo_status_report(person)` — génère un message pré-rempli qui embarque la todo list de la personne (via la resource ci-dessus) suivi d'une instruction demandant un résumé en français (total, terminés/en cours, priorités). Utile pour voir comment un prompt MCP peut assembler du contexte pour l'assistant plutôt que de laisser l'utilisateur le taper à la main.
- **Prompt** `plan_my_day(person)` — embarque uniquement les todos en attente et demande un ordre de priorité, en suggérant d'utiliser `complete_todo`/`update_todo` si un todo semble déjà fait ou obsolète. Montre qu'un prompt peut orienter l'assistant vers l'usage d'autres outils plutôt que de simplement lire.

Pour tester sans UI, l'Inspector a un mode CLI non-interactif :

```bash
npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/templates/list
npx @modelcontextprotocol/inspector --cli node dist/index.js --method resources/read --uri "todo://fanch/todos"
npx @modelcontextprotocol/inspector --cli node dist/index.js --method prompts/get --prompt-name todo_status_report --prompt-args person=fanch
```

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

1. Faire `npm run build` si ce n'est pas déjà fait (Claude Desktop lance le JS compilé dans `dist/`, pas le TS directement — voir [Démarrage rapide](#démarrage-rapide)).
2. Ouvrir Claude Desktop.
3. Cliquer sur le menu de l'application **Claude** (en haut à gauche de la fenêtre) → **Paramètres...**. Attention : ce n'est pas l'icône de réglages à l'intérieur d'une conversation, mais bien le menu de l'application elle-même.
4. Dans la fenêtre qui s'ouvre, aller sur l'onglet **Développeur** (dans la barre latérale).
5. Cliquer sur **Modifier la configuration**. Ce bouton ouvre directement le fichier `claude_desktop_config.json` dans ton éditeur de texte par défaut (et le crée s'il n'existe pas encore) — inutile de le chercher toi-même. Sous Windows, il se trouve normalement dans `%APPDATA%\Claude\claude_desktop_config.json` ; si l'app est installée via le Microsoft Store (MSIX), le fichier réellement lu est plutôt dans `%LOCALAPPDATA%\Packages\Claude_<identifiant>\LocalCache\Roaming\Claude\claude_desktop_config.json` — mais le bouton **Modifier la configuration** ouvre déjà le bon fichier automatiquement, pas besoin de choisir.
6. Dans ce fichier, coller (ou fusionner s'il y a déjà d'autres serveurs déclarés) :

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

7. Remplacer le chemin par le chemin absolu réel du dossier cloné sur ta machine (sous Windows, penser à doubler les antislashs dans le JSON, ex. `"C:\\Users\\toi\\...\\MCP-Todo-Projet-p-dagogique\\dist\\index.js"`).
8. Enregistrer le fichier, puis **quitter et rouvrir Claude Desktop entièrement** (pas juste fermer la fenêtre) pour qu'il recharge la config.
9. Une fois reconnecté, un indicateur d'outils (icône en forme de marteau 🔨 dans les versions classiques ; le nom/l'emplacement exact peut varier selon la version de l'app) apparaît près de la zone de saisie de la conversation. Le test le plus fiable reste néanmoins de l'utiliser directement : ouvrir une **nouvelle conversation** et demander par exemple *« Ajoute un todo "test" pour \<ton prénom> avec l'outil add_todo »* — Claude doit proposer d'utiliser l'outil (demande d'approbation), puis créer l'entrée dans `data/todos-<prénom>.json`.

**En cas de souci :**
- Vérifier dans **Paramètres → Développeur** que le serveur `todo` apparaît avec un statut connecté.
- Consulter les logs : `%APPDATA%\Claude\logs\mcp*.log` sous Windows (ou `%LOCALAPPDATA%\Packages\Claude_<identifiant>\LocalCache\Roaming\Claude\logs\mcp*.log` pour une install MSIX). Une ligne `Server started and connected successfully` dans `mcp-server-todo.log` confirme que la connexion fonctionne réellement, même si l'interface ne l'affiche pas clairement.

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
- Doc officielle du protocole : [modelcontextprotocol.io](https://modelcontextprotocol.io)
