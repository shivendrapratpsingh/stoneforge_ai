from pydantic import BaseModel

class TypingRequest(BaseModel):
    text: str
    typed: str
    time_taken: float  # seconds

class TypingResponse(BaseModel):
    wpm: float
    accuracy: float