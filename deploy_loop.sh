while true; do
  STATUS=$(gh run list --limit 1 | grep "Build and Publish" | awk '{print $1}')
  if [ "$STATUS" == "completed" ]; then
    echo "Done! Pulling images on devops..."
    ssh devops "cd /home/mindulle/sonagi-draw && docker compose pull && docker compose up -d"
    break
  fi
  sleep 10
done
