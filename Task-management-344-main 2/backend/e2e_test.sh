#!/usr/bin/env bash
set -euo pipefail

ADMIN_TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@test.local","password":"Pass1234!"}' | jq -r .token)
MEMBER_ID=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"member@test.local","password":"Pass1234!"}' | jq -r .user.id)
OTHER_ID=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"other@test.local","password":"Pass1234!"}' | jq -r .user.id)

PROJECT_RESP=$(curl -s -X POST http://localhost:5001/api/projects -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d '{"name":"Test Project","description":"Project for E2E tests"}')
PROJECT_ID=$(echo "$PROJECT_RESP" | jq -r ._id)

echo "Created project: $PROJECT_ID"

TASK_RESP=$(curl -s -X POST http://localhost:5001/api/tasks -H "Authorization: Bearer $ADMIN_TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Test Task\",\"description\":\"E2E task\",\"project\":\"${PROJECT_ID}\",\"assignedUser\":\"${MEMBER_ID}\",\"priority\":\"High\",\"status\":\"Todo\"}")
TASK_ID=$(echo "$TASK_RESP" | jq -r ._id)

echo "Created task: $TASK_ID"
echo "TASK_RESP: $TASK_RESP"

# Attempt unauthorized status update by OTHER_ID
OTHER_TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"other@test.local","password":"Pass1234!"}' | jq -r .token)
UNAUTH_RESP=$(curl -s -o /dev/stderr -w "%{http_code}" -X PUT http://localhost:5001/api/tasks/${TASK_ID} -H "Authorization: Bearer ${OTHER_TOKEN}" -H "Content-Type: application/json" -d '{"status":"In Progress"}')

echo "\nUnauthorized update HTTP code: $UNAUTH_RESP (expected 403)"

# Attempt status update by assigned member
MEMBER_TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"email":"member@test.local","password":"Pass1234!"}' | jq -r .token)
ASSIG_RESP=$(curl -s -X PUT http://localhost:5001/api/tasks/${TASK_ID} -H "Authorization: Bearer ${MEMBER_TOKEN}" -H "Content-Type: application/json" -d '{"status":"In Progress"}')

echo "Assigned member update response: $ASSIG_RESP"

# Attempt status update by admin
ADMIN_UPDATE_RESP=$(curl -s -X PUT http://localhost:5001/api/tasks/${TASK_ID} -H "Authorization: Bearer ${ADMIN_TOKEN}" -H "Content-Type: application/json" -d '{"status":"Completed"}')

echo "Admin update response: $ADMIN_UPDATE_RESP"
