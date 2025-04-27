### Installatie instructies

## Client
De client kan direct worden gebruikt met liveserver.

## Server
Voor de server moet je de volgende stappen uitvoeren:
1. maak een env file aan. Vul vervolgens de volgende gegevens in als je een key van azure openAI hebt. De env file moet dit bevatten:
      AZURE_OPENAI_API_VERSION=
      AZURE_OPENAI_API_INSTANCE_NAME=
      AZURE_OPENAI_API_KEY=
      AZURE_OPENAI_API_DEPLOYMENT_NAME=
      AZURE_EMBEDDING_DEPLOYMENT_NAME=
2. Voer vervolgens in de terminal het commando "npm install" uit. Hiermee installeer je alle node modules die nodig zijn.
3. Voer vervolgens "node --env-file=.env server.js" uit om de server op te starten.
4. Het taalmodel is nu te bereiken door {url zoals localhost:3000}/ask.
5. (Optioneel) Als je eventueel een andere pdf wilt gebruiken voor het taalmodel, zou je de link naar het document in embeddings kunnen zetten.
   Vervolgens voer je "node --env-file=.env embeddings.js" uit om de pdf in de vectordatabase om te zetten naar json.
