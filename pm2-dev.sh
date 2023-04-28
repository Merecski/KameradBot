export NODE_ENV=dev
go build -o database && \
pm2 start "./database" --name kamerad_db_dev --time && \
sleep 1 && \
pm2 start "npm run start" --name kamerad_dev --time