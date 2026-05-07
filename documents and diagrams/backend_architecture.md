# Backend Architecture Diagram

![Backend Architecture](file:///c:/Users/Meet/Desktop/BNP/backend_architecture.png)

This diagram illustrates the multi-agent architecture and data flow of the Finmate Flask backend.

```mermaid
graph TD
    subgraph API_Layer ["API Layer (Flask 3)"]
        Routes[API Routes / Blueprints]
        Controllers[Controllers / Business Logic]
    end

    subgraph Agent_Orchestration ["Multi-Agent Architecture"]
        MulyaAI[MulyaAI - Chat Agent]
        PortfolioAgent[Portfolio Agent]
        RiskAgent[Risk Agent]
        AssetAgent[Asset Agent]
        TransAgent[Transaction Processing Agent]
        TrimAgent[Trim Agent]
    end

    subgraph Data_Persistence ["Data Persistence"]
        SQLAlchemy[SQLAlchemy ORM]
        DB[(PostgreSQL / SQLite)]
    end

    subgraph External_Integrations ["External Integrations"]
        Groq[Groq LLM API]
        Pinecone[Pinecone Vector DB]
        YahooFinance[Yahoo Finance API]
    end

    Routes --> Controllers
    Controllers --> Agent_Orchestration
    
    MulyaAI --> Groq
    PortfolioAgent --> Groq
    RiskAgent --> Groq
    
    TransAgent --> Pinecone
    AssetAgent --> YahooFinance
    
    Agent_Orchestration --> SQLAlchemy
    SQLAlchemy --> DB
    
    Controllers --> SQLAlchemy
```

## Technologies Used
- **Framework**: Flask 3
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL (Production) / SQLite (Development)
- **AI Inference**: Groq API
- **Vector Search**: Pinecone
- **External Data**: Yahoo Finance
