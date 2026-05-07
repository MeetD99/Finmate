# Finmate — AI-Powered Personal Finance Management System

## Project Report

---

## 1. Brief Motivation

Managing personal finances effectively remains a significant challenge for individuals, particularly in the Indian context, where a lack of automated, personalized tools goes beyond simple expense tracking. Most generic budgeting applications fail to provide intelligent, context-aware transaction categorization; they rely on rigid keyword matching rather than understanding the semantic meaning behind bank transaction descriptions such as "UPI-SWIGGY-FOOD" or "NEFT-HDFC-MUTUAL FUND." Furthermore, these tools seldom offer actionable, risk-adjusted investment advice tailored to a user's specific financial profile — including factors like age, income, EMI burden, number of dependants, and growth preference. This project addresses this critical gap by building **Finmate**, a full-stack financial management dashboard that integrates Retrieval-Augmented Generation (RAG) for intelligent transaction classification and a multi-factor risk scoring engine for personalized portfolio optimization. The real-world relevance of this work is substantial: by combining AI-driven spending analysis with algorithmic investment advisory, Finmate empowers individual users to make data-driven financial decisions, reduce non-essential expenditures by 10–20%, and build long-term wealth aligned with their personal risk appetite.

---

## 2. Objectives

- **To design** a full-stack financial management dashboard using React (Vite) for the frontend and Flask (Python) for the backend, following a RESTful API architecture with session-based authentication.
- **To develop** an automated transaction categorization pipeline using Retrieval-Augmented Generation (RAG) that leverages Pinecone as a vector database and Groq's Llama-4-Scout LLM for few-shot classification of bank transactions into six distinct categories: Mandatory/Utilities, Non-Mandatory, Luxury/Discretionary, Travel, Investment/Savings, and Adjustment.
- **To implement** a multi-factor risk scoring engine that evaluates user demographics (age, income, dependants, EMI burden, employment type, emergency fund coverage, investment horizon, volatility tolerance, and growth preference) to compute a numeric risk score (0–100) and assign a risk category (Conservative, Moderate, or Aggressive) with corresponding portfolio allocation ratios.
- **To analyze** user spending patterns and generate a dynamic "trim" pipeline that computes personalized percentage-based reductions in luxury and non-mandatory spending, producing an investable monthly surplus.
- **To improve** user financial habits through an AI-driven spending optimization advisory (Trim Bot) and a risk-based investment advisory (Risk Advisor) powered by the Groq API, utilizing models such as Llama-3.3-70b-versatile and Llama-4-Scout-17b-16e-instruct.
- **To enhance** user decision-making by providing interactive data visualizations (spending vs. savings trends, portfolio allocation pie charts, category-wise spending breakdowns) using the Recharts library, alongside an AI-driven Knowledge Hub that generates personalized, multi-step educational roadmaps tailored to the user's portfolio.
- **To evaluate** the effectiveness of RAG-based transaction classification against traditional keyword-based methods by measuring confidence scores and classification accuracy across diverse real-world transaction descriptions.

---

## 3. Methodology

Finmate utilizes a decoupled **Client-Server** architecture designed for modularity and AI-driven financial intelligence.

**Frontend Architecture:** Developed as a Single-Page Application using **React 19** with **Vite 7** for fast builds and hot module reload. The UI leverages **Tailwind CSS 4** for responsive styling, **React Router DOM 7** for client-side navigation, **Recharts 3** for interactive financial charts (spending vs. savings trends, portfolio allocation pie charts), and **Axios** for RESTful API communication. Global authentication state is managed via React's **Context API**. The frontend comprises seven page components — Landing, Login, Register, Dashboard (with Excel upload and AI-generated insight cards), Risk Appetite Wizard (capturing eight demographic parameters), Personalised Portfolio (with trim optimization sliders and twelve-month return projections), and an AI-driven Investment Knowledge Center.

**Backend API:** Built with **Flask 3.0** (Python), exposing 18+ RESTful endpoints organized into six modules — Authentication, Risk Profile, Transactions, Summary, Portfolio, and AI Services. **SQLAlchemy ORM** manages a **SQLite** relational database with five tables (User, RiskProfile, Transaction, Summary, Portfolio). Session-based authentication is secured with **Werkzeug** password hashing, and **Flask-CORS** enables cross-origin frontend communication.

**Data Ingestion and Preprocessing:** Users upload bank transaction data as Excel files (`.xlsx`/`.xls`). The backend parses files using **Pandas**, validates required columns (Date, Description, Withdrawal, Deposit, Balance), sorts rows chronologically to compute opening balance, and derives monthly summaries using the formula: *Savings = (Opening Balance + Total Income) − Total Spending*. A separate seeding script generates 1024-dimensional embeddings from curated description–category pairs using the **llama-text-embed-v2** model and upserts them into a **Pinecone** serverless vector index (AWS, cosine similarity).

**AI-Driven Automation Pipeline:**

**RAG-Based Transaction Categorization:** Each transaction description is embedded via `llama-text-embed-v2`, queried against Pinecone to retrieve the top-5 semantically similar examples, and then classified by the **Groq Llama-4-Scout-17b-16e-instruct** LLM using few-shot prompting (temperature 0.3) into one of six categories — Mandatory/Utilities, Non-Mandatory, Luxury/Discretionary, Travel, Investment/Savings, or Adjustment — with a confidence score and justification.

**Multi-Factor Risk Scoring Engine:** A rules-based algorithm evaluates five dimensions (age, income, dependents, EMI burden, growth preference) to compute a numeric risk score (0–100) and assign a category — Conservative (≤35), Moderate (36–65), or Aggressive (>65) — each with predefined Low/Medium/High allocation ratios and maximum drawdown estimates.

**Portfolio Optimization and Asset Selection:** The risk category is mapped to a curated catalog of 18 Indian financial instruments (FDs, Debt Funds, Index Funds, Equity MFs, Smallcases, Crypto), each annotated with CAGR, volatility, downside deviation, and risk score. The **Llama-3.3-70b-versatile** model (Groq) generates personalized investment advisory and selects specific assets per risk tier.

**Spending Trim Pipeline:** A factor-adjusted algorithm computes personalized trim percentages for luxury (base 20%) and non-mandatory (base 15%) spending by aggregating adjustments across nine profile dimensions (age, income, EMI, dependents, employment, emergency fund, horizon, volatility, growth). The **Llama-4-Scout** model generates a supportive trim advisory (≤120 words). Interactive frontend sliders allow users to fine-tune trimming in real-time.

**Dashboard Intelligence:** The **Llama-3.1-8b-instant** model generates three contextual insights (saving, alert, goal) displayed as notification cards, and a 4-step progressive learning roadmap in the Knowledge Hub tailored to the user's portfolio. PDF reports are exportable via **html2canvas** and **jsPDF**.

**Tech Stack:**

Frontend: React 19, Vite 7, Tailwind CSS 4, Recharts 3, React Router DOM 7, Axios, html2canvas, jsPDF.
Backend: Flask 3.0, SQLAlchemy ORM, SQLite, Flask-CORS, Werkzeug, Pandas, openpyxl.
AI/ML: Groq API (Llama-4-Scout-17b, Llama-3.3-70b, Llama-3.1-8b), Pinecone (Serverless Vector DB), llama-text-embed-v2 (1024-dim embeddings).

---

## 4. Expected Results

Based on the objectives and the implemented methodology, the following results are anticipated:

1. **High-Accuracy Transaction Categorization:** The RAG-based classification pipeline is expected to achieve consistent and context-aware categorization of bank transaction descriptions into six predefined categories. By leveraging semantic similarity from the Pinecone vector database and few-shot examples fed to the Llama-4-Scout LLM, the system is expected to outperform traditional keyword-matching approaches, particularly for ambiguous or abbreviated transaction descriptions (e.g., "UPI-ZOMATO" → Luxury/Discretionary, "NEFT-SBI-MF" → Investment/Savings). Each classification includes a **confidence score** (0–1) enabling transparency and auditability.

2. **Actionable Risk Profiling:** The multi-factor scoring engine is expected to successfully segment users into three distinct risk categories (Conservative, Moderate, Aggressive) based on nine demographic and preference parameters. This segmentation allows for differentiated investment strategies with clearly defined allocation ratios and maximum drawdown expectations.

3. **Personalized Portfolio Generation:** Based on the computed risk category and the investable surplus from the trim pipeline, the system generates a balanced investment portfolio mapped to a curated catalog of 18 real-world Indian financial instruments (FDs, Debt Funds, Index Funds, Equity Mutual Funds, Smallcases, and Crypto). The LLM-selected `chosen_assets` provide specific instrument recommendations within each risk tier.

4. **Quantifiable Spending Reduction:** Through the factor-adjusted trim algorithm, users can identify and quantify potential monthly savings of **10–20%** by following AI-suggested reductions in luxury and non-mandatory spending categories. The interactive trim sliders allow users to customize their savings targets in real-time.

5. **Enhanced Visualization and Reporting:** Clear, intuitive dashboards display monthly spending vs. savings trends (line/bar charts), category-wise spending breakdowns (pie charts), portfolio allocation distributions, and twelve-month return projections. PDF export capability enables users to generate downloadable financial reports.

6. **Personalized Financial Education:** The AI-driven Knowledge Hub delivers a 4-step progressive learning roadmap tailored to each user's portfolio composition, enabling self-directed financial literacy improvement.

---

## 5. Outcomes and Future Scope

### 5.1 Outcomes

- **Apply** full-stack development skills (React + Flask) and RAG-based AI pipelines (Pinecone, Groq LLMs) to build a production-grade financial management system with secure authentication, RESTful APIs, and interactive data visualizations.
- **Implement** a multi-factor risk scoring engine and factor-adjusted trim algorithm to generate personalized investment portfolios and actionable spending reduction recommendations aligned with individual financial profiles.
- **Analyze** real-world bank transaction datasets using Pandas for preprocessing, semantic embeddings for intelligent categorization, and LLM-driven advisory for context-aware financial guidance.
- **Evaluate** the capabilities of multiple LLM models (Llama-4-Scout, Llama-3.3-70b, Llama-3.1-8b) across distinct financial-domain tasks — classification, advisory generation, and insight summarization — developing proficiency in prompt engineering and structured output parsing.

### 5.2 Future Scope

The primary future direction is to evolve Finmate from a batch-upload analytical tool into a **full-fledged expense orchestration platform** — functioning as a real-time expense tracker where users can record daily transactions directly within the app (via manual entry, quick-add widgets, or UPI/SMS-based auto-capture). The workflow would automatically categorize each expense using the existing RAG pipeline and store it **month-wise** in the database, building a continuous financial history without requiring periodic CSV/Excel uploads. This eliminates the friction of the current upload-based workflow and enables live dashboard updates, real-time trim recalculations, and dynamic portfolio rebalancing as spending patterns change throughout the month. Additional planned enhancements include integration with Open Banking APIs for automatic bank statement ingestion, multi-currency support, collaborative family budgeting, and a mobile-first Progressive Web App (PWA) for on-the-go expense logging.

---

## 6. References

- American Psychological Association. (2020). *Publication manual of the American Psychological Association* (7th ed.). American Psychological Association. https://doi.org/10.1037/0000165-000

- Bodie, Z., Kane, A., & Marcus, A. J. (2021). *Investments* (12th ed.). McGraw-Hill Education.

- Lewis, P., Perez, E., Piktus, A., Petroni, F., Karpukhin, V., Goyal, N., Küttler, H., Lewis, M., Yih, W., Rocktäschel, T., Riedel, S., & Kiela, D. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *Advances in Neural Information Processing Systems*, *33*, 9459–9474. https://arxiv.org/abs/2005.11401

- Grinold, R. C., & Kahn, R. N. (2000). *Active portfolio management: A quantitative approach for producing superior returns and controlling risk* (2nd ed.). McGraw-Hill.

- Markowitz, H. (1952). Portfolio selection. *The Journal of Finance*, *7*(1), 77–91. https://doi.org/10.2307/2975974

- Meta AI. (2024). *Llama 3 model card*. Meta. https://ai.meta.com/llama/

- Pinecone Systems, Inc. (2024). *Pinecone documentation: Vector database for machine learning*. Pinecone. https://docs.pinecone.io/

- Groq, Inc. (2024). *Groq API documentation*. Groq. https://console.groq.com/docs

- Pallets Projects. (2023). *Flask documentation* (Version 3.0). Pallets. https://flask.palletsprojects.com/en/3.0.x/

- Meta Platforms, Inc. (2024). *React documentation*. Meta. https://react.dev/

- Vanguard Group. (2024). *Principles of investing: Risk and diversification*. Vanguard. https://investor.vanguard.com/investing/how-to-invest/principles

- Association of Mutual Funds in India. (2024). *AMFI India: Mutual fund categorization and rationalization*. AMFI. https://www.amfiindia.com/
