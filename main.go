package main

import (
	"log"
	kamerad_db "main/database"

	"github.com/joho/godotenv"
)

func main() {
	log.SetFlags(log.Lshortfile | log.Lmsgprefix)
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}
	kamerad_db.Run()
}
