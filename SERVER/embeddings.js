import { AzureChatOpenAI, AzureOpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "langchain/document";

const model = new AzureChatOpenAI({
    temperature: 0.2,
});

const embeddings = new AzureOpenAIEmbeddings({
    temperature: 0.2,
    azureOpenAIApiEmbeddingsDeploymentName: process.env.AZURE_OPENAI_EMBEDDINGS_DEPLOYMENT_NAME,
});

async function loadStory() {
    const loader = new PDFLoader("./public/WildSheepChase+DndRules.pdf");
    const docs = await loader.load();

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const docsSplit = await textSplitter.splitDocuments(docs);
    console.log(`I created ${docsSplit.length} chunks`);

    const batches = [];
    const batchSize = 50;
    for (let i = 0; i < docsSplit.length; i += batchSize) {
        batches.push(docsSplit.slice(i, i + batchSize));
    }

    let allVectors = [];

    console.log(`Processing ${batches.length} batches...`);

    for (const [i, batch] of batches.entries()) {
        console.log(`Embedding batch ${i + 1}/${batches.length}`);
        const embedded = await embeddings.embedDocuments(batch.map(doc => doc.pageContent));

        const vectors = embedded.map((embedding, idx) => ({
            embedding,
            metadata: batch[idx].metadata,
            pageContent: batch[idx].pageContent,
        }));

        allVectors.push(...vectors);
    }

    const finalDocuments = allVectors.map(v => new Document({
        pageContent: v.pageContent,
        metadata: v.metadata
    }));

    const vectorStore = await FaissStore.fromDocuments(finalDocuments, embeddings);


    await vectorStore.save("vectordatabase");
    console.log("vectorstore created and saved");
}

await loadStory();
