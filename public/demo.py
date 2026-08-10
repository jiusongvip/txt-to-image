# syntax_highlighting_demo.py
# Upload this file to test automatic syntax highlighting
# Keywords: blue | Strings: orange | Comments: green | Functions: yellow | Classes: cyan
"""Module demonstrating VS Code Dark+ syntax highlighting colors."""

import json
from dataclasses import dataclass
from typing import Optional, List

# ---- Constants ----
API_BASE_URL = "https://api.txttoimage.app/v1"
MAX_RETRIES = 3
TIMEOUT_SECONDS = 30

# ---- Data Model ----
@dataclass
class UserProfile:
    user_id: int
    name: str
    email: Optional[str] = None
    tags: List[str] = None

    def greet(self) -> str:
        """Return a friendly greeting."""
        if self.email:
            return f"Hello, {self.name}! Welcome back."
        return f"Hi {self.name}, please verify your email."

# ---- Helper Functions ----
def fibonacci(n: int) -> int:
    """Compute the nth Fibonacci number."""
    if n <= 1:
        return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

def safe_divide(a: float, b: float) -> Optional[float]:
    """Divide a by b, catching zero division."""
    try:
        result = a / b
    except ZeroDivisionError:
        print(f"Cannot divide {a} by zero!")
        return None
    return result

# ---- API Client ----
async def fetch_user(user_id: int) -> dict:
    """Fetch a user profile from the API."""
    url = f"{API_BASE_URL}/users/{user_id}"
    try:
        response = await request("GET", url, timeout=TIMEOUT_SECONDS)
        if response.status == 200:
            return response.json()
        elif response.status == 404:
            print(f"User {user_id} not found")
            return {"error": "not_found"}
    except Exception as err:
        print(f"Failed to fetch user: {err}")
        return {"error": str(err)}

# ---- Entry Point ----
if __name__ == "__main__":
    profile = UserProfile(user_id=42, name="dev_user", tags=["python", "testing"])
    print(profile.greet())
    print(f"fib(10) = {fibonacci(10)}")
    print(f"10 / 3 = {safe_divide(10, 3)}")
