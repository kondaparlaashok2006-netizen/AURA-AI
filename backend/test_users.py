from backend.database import (
    create_user,
    get_user,
    update_user_name
)

username = "test001"

user = get_user(username)

if user:
    print("USER ALREADY EXISTS:")
    print(user)
else:
    user = create_user(username, "Test User")
    print("USER CREATED:")
    print(user)

updated = update_user_name(username, "Test Updated")

print("USER AFTER UPDATE:")
print(updated)
