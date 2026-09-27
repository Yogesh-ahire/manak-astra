from fastapi import FastAPI
from app.api.analyze import router as analyze_router

app = FastAPI(title="Manak Astra API")

app.include_router(analyze_router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "active", "message": "Manak Astra Core is running."}