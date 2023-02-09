package kamerad_db

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
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
	rows, err := h.db.Query("SELECT * FROM users")
	if err != nil {
		log.Printf("Failed to get user data: %v", err)
	}
	for rows.Next() {
		rows.Scan(&user_row.UserId, &user_row.Username, &user_row.Bot, &user_row.Based, &user_row.IntroEnable, &user_row.IntroFile)
		all_users = append(all_users, user_row)
	}

	data, err := json.Marshal(all_users)
	if err != nil {
		log.Println("Failed to convert to json")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	w.Write(data)
}

func (h dbHandler) getUserData(w http.ResponseWriter, req *http.Request) {
	vars := mux.Vars(req)
	user_row := db_users{}
	log.Printf("Searching for id: %s", vars["id"])
	row := h.db.QueryRow("SELECT userid, username, bot, based, intro_enable, intro_file FROM users WHERE userid=?", vars["id"])
	row.Scan(&user_row.UserId, &user_row.Username, &user_row.Bot, &user_row.Based, &user_row.IntroEnable, &user_row.IntroFile)

	data, err := json.Marshal(user_row)
	if err != nil {
		log.Println("Failed to convert to json")
		w.WriteHeader(http.StatusInternalServerError)
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
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	var exists bool
	row := h.db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE userid=?)", user.UserId)
	if err := row.Scan(&exists); err != nil {
		log.Printf("Error scanning for user(%s): %v", user.UserId, err)
		w.WriteHeader(http.StatusInternalServerError)
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
		w.WriteHeader(http.StatusInternalServerError)
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

func Run() {
	var database, port string
	isProd := os.Getenv("NODE_ENV") == "production"
	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	log.Printf("Is prod? %v", isProd)
	if isProd {
		database = os.Getenv("DB_DATABASE")
		port = ":8080"
	} else {
		database = os.Getenv("DB_DATABASE_DEV")
		port = ":8047"
	}

	db, err := sql.Open("mysql", user+":"+pass+"@/"+database)
	if err != nil {
		log.Fatal("Failed to connect to database")
	}
	log.Println("Connected to database")
	defer db.Close()

	dbh := dbHandler{
		db: db,
	}

	r := mux.NewRouter()
	r.HandleFunc("/", dbh.version)
	r.HandleFunc("/version", dbh.version)
	r.HandleFunc("/hello", dbh.hello)
	r.HandleFunc("/users", dbh.getUsersData).Methods("GET")
	r.HandleFunc("/users", dbh.postUserData).Methods("POST")
	r.HandleFunc("/users/{id:[0-9]+}", dbh.getUserData)
	r.HandleFunc("/users/delete", dbh.deleteUser).Methods("POST")
	http.Handle("/", r)
	log.Printf("Listening and Serving http server on %s", port)
	http.ListenAndServe(port, nil)
}
