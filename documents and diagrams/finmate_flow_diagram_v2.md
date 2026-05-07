# Finmate Flow Diagram V2

![Finmate Flow Diagram V2](file:///c:/Users/Meet/Desktop/BNP/finmate_flow_diagram_v2.png)

This diagram illustrates the complete end-to-end user journey and data flow within the Finmate platform, as per the latest implementation.

```mermaid
graph TD
    User([User]) -->|Register/Login| Auth[Authentication Layer]
    Auth -->|Questionnaire| RiskAgent[Risk Agent]
    RiskAgent -->|Score & Category| PortfolioAgent[Portfolio Agent]
    PortfolioAgent -->|Generate Strategy| Portfolio[(User Portfolio)]
    
    User -->|Upload CSV/Excel| TransAgent[Transaction Processing Agent]
    TransAgent -->|Semantic Categorization| Pinecone[(Pinecone Vector DB)]
    TransAgent -->|Processed Data| TransDB[(Transaction Database)]
    
    Portfolio --> Dashboard[Central Dashboard]
    TransDB --> Dashboard
    
    User -->|Ask Questions| MulyaAI[MulyaAI Chatbot]
    MulyaAI -->|Reference Profile/Portfolio/Trans| Groq[Groq LLM]
    Dashboard --> MulyaAI
    
    Dashboard -->|Real-time Market Data| AssetAgent[Asset Agent]
    AssetAgent -->|Ticker Updates| YahooFinance[Yahoo Finance API]
    
    Dashboard -->|Budget Optimization| TrimAgent[Trim Agent]
    TrimAgent -->|Recommendations| Optimization[Portfolio Rebalancing]
```

## Journey Highlights
1. **Risk Discovery**: The journey begins with a psychological risk assessment.
2. **Automated Strategy**: A personalized portfolio is generated immediately after assessment.
3. **Smart Categorization**: Transactions are processed using Vector Embeddings for high accuracy.
4. **Intelligent Assistant**: MulyaAI provides a RAG-like experience by combining LLM power with user-specific financial data.
5. **Continuous Optimization**: The Asset and Trim agents ensure the user's financial health is constantly monitored and optimized.
