import os

try:
    import requests
except ModuleNotFoundError:
    requests = None

from dotenv import load_dotenv

try:
    from google import genai
except ModuleNotFoundError:
    genai = None

try:
    from groq import Groq
except ModuleNotFoundError:
    Groq = None


load_dotenv()


# ============================================================
# API KEYS
# ============================================================

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)

OPENROUTER_API_KEY = os.getenv(
    "OPENROUTER_API_KEY"
)

# Disabled by default so a normal AI request uses at most
# Groq -> Gemini instead of Groq -> Gemini -> OpenRouter.
ENABLE_OPENROUTER_FALLBACK = (
    os.getenv(
        "AURA_ENABLE_OPENROUTER_FALLBACK",
        "false"
    ).lower() == "true"
)


# ============================================================
# CLIENTS
# ============================================================

gemini_client = None
groq_client = None


if (
    GEMINI_API_KEY
    and genai is not None
):

    try:

        gemini_client = genai.Client(
            api_key=GEMINI_API_KEY
        )

    except Exception as error:

        print(
            "Gemini initialization failed:",
            error
        )


if (
    GROQ_API_KEY
    and Groq is not None
):

    try:

        groq_client = Groq(
            api_key=GROQ_API_KEY,
            timeout=8.0
        )

    except Exception as error:

        print(
            "Groq initialization failed:",
            error
        )


# ============================================================
# AURA AI BRAIN
# ============================================================

class AIBrain:

    def __init__(self):

        self.history = []

        self.last_provider = None

        # Keep only recent turns to reduce prompt size and latency.
        self.max_history = 6

        self.system_instruction = """
You are AURA, a futuristic personal AI assistant.

The user's name is Ashok.

Personality:
- Intelligent
- Natural
- Friendly
- Calm
- Confident
- Helpful
- Concise

AURA is a B.Tech final-year AI assistant project.

Important behavior:

1. Answer the user's actual question directly.

2. Keep normal answers short because AURA
   is also a voice assistant.

3. Do not repeatedly introduce yourself.

4. Do not say that you performed an action
   unless the application actually performed it.

5. If the application handles an action locally,
   do not pretend that the AI performed it.

6. Do not unnecessarily explain technical details.

7. For simple questions, give simple answers.

8. Speak naturally when the answer is intended
   to be converted into speech.

9. Avoid excessive markdown, emojis and symbols.

10. Never respond with phrases such as:
   "I can't do that" when the application has
   an appropriate local action available.

11. If you genuinely cannot perform an action,
   clearly say what is unavailable.

12. Never invent information.

13. If the user asks the date or time,
   use the actual information supplied by the
   application when available.

14. Remember the conversation context supplied
   in the request.

Your responses should sound like a smooth,
modern personal AI assistant.
"""


    # ========================================================
    # ADD HISTORY
    # ========================================================

    def _add_history(
        self,
        role,
        content
    ):

        self.history.append(
            {
                "role": role,
                "content": content
            }
        )


        if len(self.history) > self.max_history:

            self.history = (
                self.history[
                    -self.max_history:
                ]
            )


    # ========================================================
    # BUILD CONVERSATION
    # ========================================================

    def build_conversation(
        self,
        current_message=None
    ):

        messages = []


        # Only recent history is sent to the provider.
        # This keeps voice responses fast without removing memory.
        recent_history = self.history[
            -self.max_history:
        ]

        for message in recent_history:

            messages.append(
                f"{message['role']}: "
                f"{message['content']}"
            )


        if current_message:

            messages.append(
                f"user: {current_message}"
            )


        return "\n".join(
            messages
        )


    # ========================================================
    # GROQ
    # ========================================================

    def ask_groq(
        self,
        conversation
    ):

        if not groq_client:

            raise RuntimeError(
                "Groq is not available."
            )


        response = (
            groq_client
            .chat
            .completions
            .create(

                model="openai/gpt-oss-20b",

                messages=[

                    {
                        "role":
                            "system",

                        "content":
                            self.system_instruction
                    },

                    {
                        "role":
                            "user",

                        "content":
                            conversation
                    }

                ],

                temperature=0.5,

                max_tokens=120
            )
        )


        if not response.choices:

            raise RuntimeError(
                "Groq returned no choices."
            )


        answer = (
            response
            .choices[0]
            .message
            .content
        )


        if not answer:

            raise RuntimeError(
                "Groq returned an empty response."
            )


        return answer.strip()


    # ========================================================
    # GEMINI
    # ========================================================

    def ask_gemini(
        self,
        conversation
    ):

        if not gemini_client:

            raise RuntimeError(
                "Gemini is not available."
            )


        response = (
            gemini_client
            .models
            .generate_content(

                model="gemini-3.6-flash",

                contents=conversation,

                config={
                    "system_instruction":
                        self.system_instruction,

                    "temperature":
                        0.5,

                    "max_output_tokens":
                        120
                }
            )
        )


        answer = getattr(
            response,
            "text",
            None
        )


        if not answer:

            raise RuntimeError(
                "Gemini returned an empty response."
            )


        return answer.strip()


    # ========================================================
    # OPENROUTER
    # ========================================================

    def ask_openrouter(
        self,
        conversation
    ):

        if not OPENROUTER_API_KEY:

            raise RuntimeError(
                "OpenRouter is not available."
            )


        if requests is None:

            raise RuntimeError(
                "requests package is missing."
            )


        headers = {

            "Authorization":
                f"Bearer {OPENROUTER_API_KEY}",

            "Content-Type":
                "application/json",

            "HTTP-Referer":
                "http://127.0.0.1:5050",

            "X-Title":
                "AURA AI Assistant"
        }


        data = {

            "model":
                "openai/gpt-oss-20b:free",

            "messages": [

                {
                    "role":
                        "system",

                    "content":
                        self.system_instruction
                },

                {
                    "role":
                        "user",

                    "content":
                        conversation
                }

            ],

            "temperature":
                0.5,

            "max_tokens":
                180
        }


        response = requests.post(

            "https://openrouter.ai/api/v1/chat/completions",

            headers=headers,

            json=data,

            timeout=15
        )


        response.raise_for_status()


        result = response.json()


        choices = result.get(
            "choices",
            []
        )


        if not choices:

            raise RuntimeError(
                "OpenRouter returned no choices."
            )


        answer = (
            choices[0]
            .get("message", {})
            .get("content")
        )


        if not answer:

            raise RuntimeError(
                "OpenRouter returned an empty response."
            )


        return answer.strip()


    # ========================================================
    # MAIN ASK
    # ========================================================

    def ask(
        self,
        user_message
    ):

        user_message = (
            user_message
            .strip()
        )


        if not user_message:

            return (
                "Please tell me what you need."
            )


        conversation = (
            self.build_conversation(
                user_message
            )
        )


        answer = None


        # ====================================================
        # PROVIDER 1 — GROQ
        # ====================================================

        if groq_client:

            try:

                print(
                    "AURA AI: Groq..."
                )


                answer = self.ask_groq(
                    conversation
                )


                if answer:

                    self.last_provider = (
                        "Groq"
                    )


            except Exception as error:

                print(
                    "Groq unavailable:",
                    error
                )


        # ====================================================
        # PROVIDER 2 — GEMINI
        # ====================================================

        if not answer and gemini_client:

            try:

                print(
                    "AURA AI: Gemini..."
                )


                answer = self.ask_gemini(
                    conversation
                )


                if answer:

                    self.last_provider = (
                        "Gemini"
                    )


            except Exception as error:

                print(
                    "Gemini unavailable:",
                    error
                )


        # ====================================================
        # PROVIDER 3 — OPENROUTER
        # ====================================================

        if (
            not answer
            and ENABLE_OPENROUTER_FALLBACK
            and OPENROUTER_API_KEY
        ):

            try:

                print(
                    "AURA AI: OpenRouter..."
                )


                answer = (
                    self.ask_openrouter(
                        conversation
                    )
                )


                if answer:

                    self.last_provider = (
                        "OpenRouter"
                    )


            except Exception as error:

                print(
                    "OpenRouter unavailable:",
                    error
                )


        # ====================================================
        # ALL PROVIDERS FAILED
        # ====================================================

        if not answer:

            self.last_provider = None

            answer = (
                "I'm having trouble connecting "
                "to my AI services right now."
            )


        # ====================================================
        # SAVE CONVERSATION
        # ====================================================

        self._add_history(
            "user",
            user_message
        )


        self._add_history(
            "assistant",
            answer
        )


        return answer


    # ========================================================
    # PROVIDER STATUS
    # ========================================================

    def get_provider(self):

        return self.last_provider


    # ========================================================
    # CLEAR MEMORY
    # ========================================================

    def clear_memory(self):

        self.history.clear()

        self.last_provider = None