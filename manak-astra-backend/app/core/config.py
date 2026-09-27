from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_SERVICE_ROLE_KEY: str
    EMBEDDING_MODEL: str = "sentence-transformers/all-mpnet-base-v2"
    GROQ_API_KEY: str
    GROQ_MODEL: str
    
    # Adding the missing variables your .env file has
    TOP_K_VECTOR: int = 10
    TOP_K_FTS: int = 10
    TOP_K_FINAL: int = 5
    
    # Pydantic V2 config format - tells it to ignore any other random extra variables
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()