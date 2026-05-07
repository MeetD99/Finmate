# Frontend Architecture Diagram

![Frontend Architecture](file:///c:/Users/Meet/Desktop/BNP/frontend_architecture.png)

This diagram illustrates the high-level architecture of the Finmate React frontend.

```mermaid
graph TD
    subgraph UI_Layer ["UI Layer (React 19 + Tailwind CSS 4)"]
        App[App.jsx]
        Router[React Router DOM]
        Layouts[Layout Components]
        Pages[Page Components]
        Components[Reusable UI Components / MoneyBuddy]
    end

    subgraph State_Management ["State Management"]
        AuthContext[Auth Context]
        ChatContext[Chat Context]
        ToastContext[Toast Context]
    end

    subgraph Data_Layer ["Data & Service Layer"]
        Axios[Axios HTTP Client]
        APIService[API Service Layer]
    end

    subgraph External ["External Services"]
        Recharts[Recharts Visualizations]
        BackendAPI[Flask Backend API]
    end

    App --> Router
    Router --> Pages
    Pages --> Layouts
    Pages --> Components
    Pages --> State_Management
    State_Management --> APIService
    APIService --> Axios
    Axios --> BackendAPI
    Pages --> Recharts
```

## Technologies Used
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **Visualization**: Recharts
- **Routing**: React Router DOM
- **HTTP Client**: Axios
