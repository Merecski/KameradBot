package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

type db_users struct {
	UserId      string `json:"userid"`
	Username    string `json:"username"`
	Bot         bool   `json:"bot"`
	Based       int    `json:"based"`
	IntroEnable bool   `json:"intro_enable"`
	IntroFile   string `json:"intro_file"`
}

type dbHandler struct {
	db *sql.DB
}

func (h dbHandler) version(w http.ResponseWriter, req *http.Request) {
	// Connect and check the server version
	var version string
	h.db.QueryRow("SELECT VERSION()").Scan(&version)
	test := struct {
		Version string `json:"version"`
	}{
		Version: version,
	}
	data, err := json.Marshal(test)
	if err != nil {
		log.Println("Failed to convert to json")
		return
	}
	w.Write(data)
}

func (h dbHandler) getUsersData(w http.ResponseWriter, req *http.Request) {
	user_row := db_users{}
	all_users := []db_users{}
	rows, _ := h.db.Query("SELECT * FROM users")
	for rows.Next() {
		rows.Scan(&user_row.UserId, &user_row.Username, &user_row.Bot, &user_row.Based, &user_row.IntroEnable, &user_row.IntroFile)
		all_users = append(all_users, user_row)
	}

	data, err := json.Marshal(all_users)
	if err != nil {
		log.Println("Failed to convert to json")
		return
	}
	w.Write(data)
}

func (h dbHandler) postUserData(w http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)
	var user db_users
	err := decoder.Decode(&user)
	if err != nil {
		log.Printf("Failed decoding db_users: %v", err)
	}

	var exists bool
	row := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE userid=?)", user.UserId)
	if err := row.Scan(&exists); err != nil {
		log.Printf("Error scanning for user(%s): %v", user.UserId, err)
		return
	} else if !exists {
		h.newUserSQL(user)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Added new user"))
	} else if exists {
		h.updateUser(user)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Updated user information"))
	}
}

func (h dbHandler) newUserSQL(user db_users) {
	statement := `INSERT INTO users (userid, username) VALUES (?,?)`
	if _, err := h.db.Exec(statement, user.UserId, user.Username); err != nil {
		log.Printf("Failed to create new user(%s): %v", user.UserId, err)
		return
	}
	log.Printf("Created new user: '%s: %s'", user.UserId, user.Username)
}

func (h dbHandler) updateUser(user db_users) {
	statement := `UPDATE users SET username=?, bot=?, based=?, intro_enable=?, intro_file=? WHERE userid=? ;`
	_, err := h.db.Exec(statement, user.Username, user.Bot, user.Based, user.IntroEnable, user.IntroFile, user.UserId)
	if err != nil {
		log.Printf("Failed to update user(%s): %v", user.UserId, err)
		return
	}
	log.Printf("Updated user: (%s, %s)", user.UserId, user.Username)
}

func (h dbHandler) deleteUser(w http.ResponseWriter, req *http.Request) {
	decoder := json.NewDecoder(req.Body)
	var user db_users
	err := decoder.Decode(&user)
	if err != nil {
		log.Printf("Failed decoding db_users: %v", err)
		return
	}

	//Avoid anything id's passed that aren't numbers
	_, err = strconv.ParseUint(user.UserId, 10, 0)
	if err != nil {
		log.Printf("Invalid userid: %v", user.UserId)
		return
	}

	statement := `DELETE FROM users WHERE userid=?`
	res, err := h.db.Exec(statement, user.UserId)
	if err != nil {
		log.Printf("Failed to update user(%s): %v", user.UserId, err)
		return
	}

	n, err := res.RowsAffected()
	if err != nil {
		log.Println(err)
		return
	} else if n == 0 {
		log.Printf("Failed to delete user (%s): Does not exist", user.UserId)
		return
	}
	log.Printf("Delete user: '%s: %s'", user.UserId, user.Username)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Successfully deleted user"))
}

func (h dbHandler) hello(w http.ResponseWriter, req *http.Request) {
	w.Write([]byte("Hi friend! :)"))
}

func main() {
	log.SetFlags(log.Lshortfile | log.Lmsgprefix)
	err := godotenv.Load("../.env")
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	database := os.Getenv("DB_DATABASE_DEV")

	db, err := sql.Open("mysql", user+":"+pass+"@/"+database)
	if err != nil {
		log.Fatal("Failed to connect to database")
	}
	defer db.Close()

	dbh := dbHandler{
		db: db,
	}

	user_row := db_users{}
	row := db.QueryRow("select * from users")
	row.Scan(&user_row.UserId, &user_row.Username, &user_row.Bot, &user_row.Based, &user_row.IntroEnable, &user_row.IntroFile)
	log.Printf("Data from query: '%+v'", user_row)

	r := mux.NewRouter()
	r.HandleFunc("/", dbh.version)
	r.HandleFunc("/version", dbh.version)
	r.HandleFunc("/hello", dbh.hello)
	r.HandleFunc("/users", dbh.getUsersData).Methods("GET")
	r.HandleFunc("/users", dbh.postUserData).Methods("POST")
	r.HandleFunc("/users/delete", dbh.deleteUser).Methods("POST")
	http.Handle("/", r)
	http.ListenAndServe(":8080", nil)
}
