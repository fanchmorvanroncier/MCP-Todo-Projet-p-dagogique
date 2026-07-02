import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { addTodo, deleteTodo, listPersons, listTodos, setTodoDone, updateTodo, type Todo } from "./storage.js";

const server = new McpServer({
  name: "todo-mcp-server",
  version: "1.0.0",
});

function formatTodo(t: Todo): string {
  return `${t.done ? "[x]" : "[ ]"} ${t.id} - ${t.title}`;
}

server.registerTool(
  "list_todos",
  {
    title: "Lister les todos",
    description: "Liste les todos d'une personne, avec filtre optionnel sur l'état",
    inputSchema: {
      person: z.string().describe("Nom de la personne propriétaire des todos"),
      filter: z.enum(["all", "done", "pending"]).default("all").describe("Filtrer par état"),
    },
  },
  async ({ person, filter }) => {
    const todos = await listTodos(person);
    const filtered = todos.filter((t) => {
      if (filter === "done") return t.done;
      if (filter === "pending") return !t.done;
      return true;
    });
    const text = filtered.length === 0
      ? `Aucun todo pour ${person}.`
      : filtered.map(formatTodo).join("\n");
    return { content: [{ type: "text", text }] };
  }
);

server.registerTool(
  "add_todo",
  {
    title: "Ajouter un todo",
    description: "Crée un nouveau todo pour une personne",
    inputSchema: {
      person: z.string().describe("Nom de la personne propriétaire du todo"),
      title: z.string().min(1).describe("Intitulé du todo"),
    },
  },
  async ({ person, title }) => {
    const todo = await addTodo(person, title);
    return { content: [{ type: "text", text: `Todo créé pour ${person} : ${formatTodo(todo)}` }] };
  }
);

server.registerTool(
  "update_todo",
  {
    title: "Modifier un todo",
    description: "Modifie l'intitulé d'un todo existant",
    inputSchema: {
      person: z.string().describe("Nom de la personne propriétaire du todo"),
      id: z.coerce.number().int().describe("Identifiant du todo à modifier"),
      title: z.string().min(1).describe("Nouvel intitulé"),
    },
  },
  async ({ person, id, title }) => {
    const todo = await updateTodo(person, id, title);
    return { content: [{ type: "text", text: `Todo mis à jour : ${formatTodo(todo)}` }] };
  }
);

server.registerTool(
  "complete_todo",
  {
    title: "Marquer un todo terminé/en cours",
    description: "Change l'état terminé/en cours d'un todo",
    inputSchema: {
      person: z.string().describe("Nom de la personne propriétaire du todo"),
      id: z.coerce.number().int().describe("Identifiant du todo"),
      done: z.boolean().default(true).describe("true = terminé, false = à faire"),
    },
  },
  async ({ person, id, done }) => {
    const todo = await setTodoDone(person, id, done);
    return { content: [{ type: "text", text: `Todo mis à jour : ${formatTodo(todo)}` }] };
  }
);

server.registerTool(
  "delete_todo",
  {
    title: "Supprimer un todo",
    description: "Supprime définitivement un todo",
    inputSchema: {
      person: z.string().describe("Nom de la personne propriétaire du todo"),
      id: z.coerce.number().int().describe("Identifiant du todo à supprimer"),
    },
  },
  async ({ person, id }) => {
    await deleteTodo(person, id);
    return { content: [{ type: "text", text: `Todo ${id} supprimé pour ${person}.` }] };
  }
);

server.registerResource(
  "todos",
  new ResourceTemplate("todo://{person}/todos", {
    list: async () => {
      const persons = await listPersons();
      return {
        resources: persons.map((person) => ({
          uri: `todo://${person}/todos`,
          name: `todos-${person}`,
          title: `Todos de ${person}`,
          mimeType: "application/json",
        })),
      };
    },
  }),
  {
    title: "Todos d'une personne",
    description: "Contenu JSON complet de la todo list d'une personne (lecture seule)",
    mimeType: "application/json",
  },
  async (uri, { person }) => {
    const todos = await listTodos(String(person));
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(todos, null, 2),
        },
      ],
    };
  }
);

server.registerPrompt(
  "todo_status_report",
  {
    title: "Rapport de statut todo",
    description: "Prépare un message qui embarque la todo list d'une personne et demande un résumé de son état",
    argsSchema: {
      person: z.string().describe("Nom de la personne dont on veut le rapport"),
    },
  },
  async ({ person }) => {
    const todos = await listTodos(person);
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "resource",
            resource: {
              uri: `todo://${person}/todos`,
              mimeType: "application/json",
              text: JSON.stringify(todos, null, 2),
            },
          },
        },
        {
          role: "user",
          content: {
            type: "text",
            text: `Voici la todo list de ${person} (ci-dessus, au format JSON). Fais-en un résumé en français : nombre total, combien terminés/en cours, et signale les todos qui semblent prioritaires ou en retard.`,
          },
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Serveur MCP todo démarré (stdio).");
}

main().catch((err) => {
  console.error("Erreur fatale du serveur MCP:", err);
  process.exit(1);
});
