from ai_brain import AIBrain


brain = AIBrain()

print("AURA AI TEST")
print("=" * 40)

question = input("You: ")

answer = brain.ask(question)

print()
print("AURA:", answer)