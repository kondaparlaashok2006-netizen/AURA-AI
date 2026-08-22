from database import (
    create_user,
    get_user,
    save_conversation,
    save_search
)


def ensure_user(username, name):
    user = get_user(username)

    if user:
        return user

    return create_user(username, name)


ashok = ensure_user("ashok_test001", "Ashok")
nani = ensure_user("nani_test001", "Nani")

print("ASHOK:", ashok)
print("NANI :", nani)

save_conversation(
    "ashok_test001",
    "hello from Ashok",
    "Hello Ashok"
)

save_conversation(
    "nani_test001",
    "hello from Nani",
    "Hello Nani"
)

save_search(
    "ashok_test001",
    "google",
    "cricket"
)

save_search(
    "nani_test001",
    "google",
    "python"
)

print("SEPARATION TEST COMPLETE")
