from assistant import AuraAssistant

aura = AuraAssistant()

print("Registering Ashok...")

created = aura.register_user(
    "ashok001",
    "Ashok"
)

print("Created:", created)
print("Username:", aura.username)
print("Name:", aura.user_name)

print("\nLoading Ashok again...")

aura2 = AuraAssistant()

loaded = aura2.set_current_user(
    "ashok001"
)

print("Loaded:", loaded)
print("Username:", aura2.username)
print("Name:", aura2.user_name)