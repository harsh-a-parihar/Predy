#!/usr/bin/env bash
set -euo pipefail

VM_NAME="${VM_NAME:-synthesis-claw-vm}"
VM_ZONE="${VM_ZONE:-asia-south1-a}"
REMOTE_DIR="${REMOTE_DIR:-/home/thearchitect_harsh_gmail_com/predy}"

echo "Deploying Predy to ${VM_NAME} (${VM_ZONE})..."
gcloud compute ssh "${VM_NAME}" --zone="${VM_ZONE}" --command="mkdir -p ${REMOTE_DIR}"
tar --exclude='node_modules' --exclude='dashboard/node_modules' --exclude='.next' -czf /tmp/predy.tgz .
gcloud compute scp /tmp/predy.tgz "${VM_NAME}:${REMOTE_DIR}/predy.tgz" --zone="${VM_ZONE}"
gcloud compute ssh "${VM_NAME}" --zone="${VM_ZONE}" --command="cd ${REMOTE_DIR} && tar -xzf predy.tgz"
gcloud compute ssh "${VM_NAME}" --zone="${VM_ZONE}" --command="cd ${REMOTE_DIR} && npm install && nohup npm start > predy.log 2>&1 < /dev/null &"

echo "Deployed. Check logs with:"
echo "gcloud compute ssh ${VM_NAME} --zone=${VM_ZONE} --command='cd ${REMOTE_DIR} && tail -n 80 predy.log'"
