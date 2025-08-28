#!/bin/bash
cd /home/kavia/workspace/code-generation/conversai-chatbot-13325-13337/frontend_app
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

