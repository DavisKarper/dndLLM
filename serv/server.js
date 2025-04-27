import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { HumanMessage, AIMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const messages = [
    new SystemMessage(`You are a Dungeon Master for a Dungeons and Dragons campaign. You have access to the rules of Dungeons and Dragons 5th edition and the Wild Sheep Chase adventure. You will lead the players through the adventure and answer their questions. You will also answer questions about the rules of Dungeons and Dragons 5th edition. You will not answer any other questions. You will only answer questions about the adventure and the rules of Dungeons and Dragons 5th edition. You will run the module and react based on the players prompts. You will also roll dice for the players when they ask you to. You also get a list of monsters that you can use in the adventure, but you don't need to use them immediatly. Use them as you see fit, maybe as the BBEG.`),
];

const model = new AzureChatOpenAI({
    temperature: 0.2,
});

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0.2,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME,
});

let vectorStore = await FaissStore.load("vectordatabase", embeddings);

function rollDiceFunction(amount, faces) {
    let total = 0;
    let individualRolls = [];
    for (let i = 0; i < amount; i++) {
        const roll = Math.floor(Math.random() * faces) + 1;
        total += roll;
        individualRolls.push(roll);
    }
    return { total, results: individualRolls };
}

const rollDice = tool(rollDiceFunction, {
    name: "rollDice",
    description: "Roll a number of dice with a given number of faces. The result is the total of the rolls and the individual rolls.",
    schema: {
        type: "object",
        properties: {
            amount: { type: "number", description: "The number of dice to roll" },
            faces: { type: "number", description: "The number of faces on the dice" },
        },
        required: ["amount", "faces"],
    },
    returns: {
        type: "object",
        properties: {
            total: { type: "number", description: "The total of the rolls" },
            results: { type: "array", items: { type: "number" }, description: "The individual rolls" },
        },
    },
});

let enemies = [];

async function fetchMonsters() {
    try {
        const response = await axios.get("https://www.dnd5eapi.co/api/monsters");
        const monsterList = response.data.results;
        const shuffledMonsters = monsterList.sort(() => 0.5 - Math.random());

        enemies = shuffledMonsters.slice(0, 5).map((monster) => ({
            name: monster.name,
            url: monster.url,
        }));

        console.log("Generated enemies:", enemies);

        messages.push(
            new SystemMessage(
                `You have access to the following monsters: ${enemies.map((enemy) => enemy.name).join(", ")}.`
            )
        );
    } catch (error) {
        console.error("Error fetching monsters:", error);
    }
}

await fetchMonsters();

async function sendPrompt(prompt) {
    const tools = [rollDice];
    const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));

    const relevantDocs = await vectorStore.similaritySearch(prompt, 60);
    console.log(relevantDocs[0]?.pageContent || "No relevant docs found.");
    const context = relevantDocs.map((doc) => doc.pageContent).join("\n");

    messages.push(new HumanMessage(prompt));
    let result = await model.invoke(messages);
    messages.push(new AIMessage(result.content));
    console.log(messages);

    for (const toolCall of result.tool_calls) {
        const selectedTool = toolsByName[toolCall.name];
        console.log("now trying to call " + toolCall.name);
        const toolMessage = await selectedTool.invoke(toolCall);
        messages.push(new ToolMessage(toolCall.name, toolMessage));
    }
    if (result.tool_calls.length > 0) {
        result = await model.invoke(messages);
        console.log(result.content);
    }

    return result.content;
}

app.post("/ask", async (req, res) => {
    let prompt = req.body.prompt;
    console.log("the user asked for");
    console.log(prompt);
    let result = await sendPrompt(prompt);
    console.log(result);
    res.json({ message: result });
});

app.post("/generate-monsters", async (req, res) => {
    await fetchMonsters();
    res.json({ message: "Monsters generated successfully", enemies });
});

app.listen(3000, () => console.log("server op poort 3000"));