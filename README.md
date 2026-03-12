# Smart Farming Lab

---

## Local Development
**1.** Run Docker First
````
    docker compose -f compose.dev.yml up --build
````
or
````
    docker compose -f compose.dev.yml up
````
or running start.dev.sh for local dev
````
    sudo bash start.dev.sh
````

**2.** Run Local BackEnd
````
    cd ./hydroponic_be/
    uv run fastapi dev
````

**3.** Run Local FrontEnd
````
    cd ./hydroponic_fe/
    npm install
    npm run dev
````

*note*: Please make sure you already have uv, npm and docker

**4.** Stop Docker Local Dev
````
    sudo bash stop.dev.sh
````

---

## Production Development
*on the way*
